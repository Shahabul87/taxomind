'use client';

import { useCallback, useRef } from 'react';
import { useEventTracker } from '@/lib/analytics/analytics-provider';
import { usePathname } from 'next/navigation';

interface FormTrackingOptions {
  formId: string;
  formName?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  trackFieldInteractions?: boolean;
  trackValidationErrors?: boolean;
  trackAbandonments?: boolean;
}

interface FieldInteraction {
  fieldName: string;
  fieldType: string;
  interactionType: 'focus' | 'blur' | 'change' | 'error';
  timestamp: number;
  value?: any;
  error?: string;
}

export function useFormTracking(options: FormTrackingOptions) {
  const {
    formId,
    formName,
    trackFieldInteractions = true,
    trackValidationErrors = true,
    trackAbandonments = true
  } = options;

  const tracker = useEventTracker();
  const pathname = usePathname();
  
  const formStartTime = useRef<number>();
  const fieldInteractions = useRef<FieldInteraction[]>([]);
  const formData = useRef<Record<string, any>>({});
  const hasSubmitted = useRef(false);

  // Track form start
  const trackFormStart = useCallback(() => {
    formStartTime.current = Date.now();
    hasSubmitted.current = false;
    fieldInteractions.current = [];
    formData.current = {};

    tracker.track({
      eventType: 'interaction',
      eventName: 'form_start',
      properties: {
        formId,
        formName,
        pathname
      },
      courseId: options.courseId,
      chapterId: options.chapterId,
      sectionId: options.sectionId
    });
  }, [tracker, formId, formName, pathname, options]);

  // Track field interaction
  const trackFieldInteraction = useCallback((
    fieldName: string,
    fieldType: string,
    interactionType: 'focus' | 'blur' | 'change',
    value?: any
  ) => {
    if (!trackFieldInteractions) return;

    const interaction: FieldInteraction = {
      fieldName,
      fieldType,
      interactionType,
      timestamp: Date.now(),
      value
    };

    fieldInteractions.current.push(interaction);

    // Update form data
    if (interactionType === 'change' && value !== undefined) {
      formData.current[fieldName] = value;
    }

    // Track specific events
    if (interactionType === 'focus' && fieldInteractions.current.filter(i => i.fieldName === fieldName && i.interactionType === 'focus').length === 1) {
      // First time focusing on this field
      tracker.track({
        eventType: 'interaction',
        eventName: 'form_field_focus',
        properties: {
          formId,
          fieldName,
          fieldType,
          timeToReach: formStartTime.current ? Date.now() - formStartTime.current : 0,
          pathname
        },
        courseId: options.courseId,
        chapterId: options.chapterId,
        sectionId: options.sectionId
      });
    }
  }, [tracker, trackFieldInteractions, formId, pathname, options]);

  // Track validation error
  const trackValidationError = useCallback((
    fieldName: string,
    errorMessage: string,
    errorType?: string
  ) => {
    if (!trackValidationErrors) return;

    const interaction: FieldInteraction = {
      fieldName,
      fieldType: 'unknown',
      interactionType: 'error',
      timestamp: Date.now(),
      error: errorMessage
    };

    fieldInteractions.current.push(interaction);

    tracker.track({
      eventType: 'interaction',
      eventName: 'form_validation_error',
      properties: {
        formId,
        formName,
        fieldName,
        errorMessage,
        errorType,
        attemptNumber: fieldInteractions.current.filter(i => i.fieldName === fieldName && i.interactionType === 'error').length,
        pathname
      },
      courseId: options.courseId,
      chapterId: options.chapterId,
      sectionId: options.sectionId
    });
  }, [tracker, trackValidationErrors, formId, formName, pathname, options]);

  // Track form submission
  const trackFormSubmit = useCallback((
    success: boolean,
    data?: Record<string, any>,
    error?: string
  ) => {
    hasSubmitted.current = true;
    const submissionTime = Date.now();
    const timeSpent = formStartTime.current ? submissionTime - formStartTime.current : 0;

    // Calculate field statistics
    const fieldStats = calculateFieldStats(fieldInteractions.current);

    tracker.track({
      eventType: 'interaction',
      eventName: success ? 'form_submit_success' : 'form_submit_error',
      properties: {
        formId,
        formName,
        success,
        error,
        timeSpent,
        fieldCount: Object.keys(formData.current).length,
        interactionCount: fieldInteractions.current.length,
        errorCount: fieldInteractions.current.filter(i => i.interactionType === 'error').length,
        fieldStats,
        pathname
      },
      courseId: options.courseId,
      chapterId: options.chapterId,
      sectionId: options.sectionId
    });

    // Reset tracking
    formStartTime.current = undefined;
    fieldInteractions.current = [];
    formData.current = {};
  }, [tracker, formId, formName, pathname, options]);

  // Track form abandonment
  const trackFormAbandon = useCallback(() => {
    if (!trackAbandonments || hasSubmitted.current || !formStartTime.current) return;

    const timeSpent = Date.now() - formStartTime.current;
    const filledFields = Object.keys(formData.current).length;
    const lastInteraction = fieldInteractions.current[fieldInteractions.current.length - 1];

    tracker.track({
      eventType: 'interaction',
      eventName: 'form_abandon',
      properties: {
        formId,
        formName,
        timeSpent,
        filledFields,
        totalFields: getUniqueFieldCount(fieldInteractions.current),
        lastInteractionField: lastInteraction?.fieldName,
        lastInteractionType: lastInteraction?.interactionType,
        errorCount: fieldInteractions.current.filter(i => i.interactionType === 'error').length,
        pathname
      },
      courseId: options.courseId,
      chapterId: options.chapterId,
      sectionId: options.sectionId
    });
  }, [tracker, trackAbandonments, formId, formName, pathname, options]);

  // Track field helpers
  const createFieldTrackers = useCallback((fieldName: string, fieldType: string = 'text') => ({
    onFocus: () => trackFieldInteraction(fieldName, fieldType, 'focus'),
    onBlur: () => trackFieldInteraction(fieldName, fieldType, 'blur'),
    onChange: (value: any) => trackFieldInteraction(fieldName, fieldType, 'change', value),
    onError: (error: string) => trackValidationError(fieldName, error)
  }), [trackFieldInteraction, trackValidationError]);

  return {
    trackFormStart,
    trackFieldInteraction,
    trackValidationError,
    trackFormSubmit,
    trackFormAbandon,
    createFieldTrackers
  };
}

// Helper functions
function calculateFieldStats(interactions: FieldInteraction[]) {
  const fieldMap = new Map<string, {
    focusCount: number;
    changeCount: number;
    errorCount: number;
    timeSpent: number;
    firstFocus?: number;
    lastBlur?: number;
  }>();

  interactions.forEach(interaction => {
    const field = fieldMap.get(interaction.fieldName) || {
      focusCount: 0,
      changeCount: 0,
      errorCount: 0,
      timeSpent: 0
    };

    switch (interaction.interactionType) {
      case 'focus':
        field.focusCount++;
        if (!field.firstFocus) {
          field.firstFocus = interaction.timestamp;
        }
        break;
      case 'blur':
        field.lastBlur = interaction.timestamp;
        if (field.firstFocus && field.lastBlur) {
          field.timeSpent += field.lastBlur - field.firstFocus;
        }
        break;
      case 'change':
        field.changeCount++;
        break;
      case 'error':
        field.errorCount++;
        break;
    }

    fieldMap.set(interaction.fieldName, field);
  });

  return Array.from(fieldMap.entries()).map(([fieldName, stats]) => ({
    fieldName,
    ...stats
  }));
}

function getUniqueFieldCount(interactions: FieldInteraction[]): number {
  return new Set(interactions.map(i => i.fieldName)).size;
}

// Quiz-specific form tracking
export function useQuizTracking(quizId: string, courseId?: string) {
  const tracker = useEventTracker();
  const pathname = usePathname();
  
  const quizStartTime = useRef<number>();
  const questionTimes = useRef<Map<string, number>>(new Map());
  const answers = useRef<Map<string, any>>(new Map());

  const trackQuizStart = useCallback(() => {
    quizStartTime.current = Date.now();
    questionTimes.current.clear();
    answers.current.clear();

    tracker.track({
      eventType: 'quiz',
      eventName: 'quiz_start',
      properties: {
        quizId,
        pathname
      },
      courseId
    });
  }, [tracker, quizId, courseId, pathname]);

  const trackQuestionView = useCallback((questionId: string, questionNumber: number) => {
    questionTimes.current.set(questionId, Date.now());

    tracker.track({
      eventType: 'quiz',
      eventName: 'question_view',
      properties: {
        quizId,
        questionId,
        questionNumber,
        timeElapsed: quizStartTime.current ? Date.now() - quizStartTime.current : 0,
        pathname
      },
      courseId
    });
  }, [tracker, quizId, courseId, pathname]);

  const trackAnswer = useCallback((
    questionId: string,
    answer: any,
    isCorrect?: boolean
  ) => {
    const timeOnQuestion = questionTimes.current.get(questionId) 
      ? Date.now() - questionTimes.current.get(questionId)! 
      : 0;

    answers.current.set(questionId, { answer, isCorrect, timeSpent: timeOnQuestion });

    tracker.track({
      eventType: 'quiz',
      eventName: 'question_answer',
      properties: {
        quizId,
        questionId,
        isCorrect,
        timeOnQuestion,
        pathname
      },
      courseId
    });
  }, [tracker, quizId, courseId, pathname]);

  const trackQuizComplete = useCallback((score: number, passed: boolean) => {
    const totalTime = quizStartTime.current ? Date.now() - quizStartTime.current : 0;
    const answerStats = Array.from(answers.current.values());
    const correctCount = answerStats.filter(a => a.isCorrect).length;

    tracker.track({
      eventType: 'quiz',
      eventName: 'quiz_complete',
      properties: {
        quizId,
        score,
        passed,
        totalTime,
        questionCount: answers.current.size,
        correctCount,
        averageTimePerQuestion: totalTime / answers.current.size,
        pathname
      },
      courseId
    });
  }, [tracker, quizId, courseId, pathname]);

  return {
    trackQuizStart,
    trackQuestionView,
    trackAnswer,
    trackQuizComplete
  };
}