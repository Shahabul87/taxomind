import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CourseCreationRequest, SamSuggestion, SamWizardState, SamWizardActions } from '../types/sam-creator.types';
import { useSamDebounce } from '@/lib/sam/hooks/use-sam-debounce';
import { useSamCache } from '@/lib/sam/hooks/use-sam-cache';
import { useProgressiveCourseCreation } from '@/hooks/use-progressive-course-creation';
import { trackAIFeatureUsage, trackFormProgress } from '@/lib/analytics-tracker';
import { logger } from '@/lib/logger';
import { useIntelligentSAMSync } from '@/hooks/use-sam-intelligent-sync';
import { getCourseWizardFieldMeta } from '@/lib/sam/utils/form-data-to-sam-context';
import { useSamActionHandler } from './use-sam-action-handler';

const TOTAL_STEPS = 4;

const initialFormData: CourseCreationRequest = {
  courseTitle: '',
  courseShortOverview: '',
  courseCategory: '',
  courseSubcategory: '',
  courseIntent: '',
  targetAudience: '',
  difficulty: 'BEGINNER',
  duration: '4-6 weeks',
  chapterCount: 5,
  sectionsPerChapter: 3,
  // Learning objectives configuration - Bloom's taxonomy aligned
  learningObjectivesPerChapter: 5,  // 5 objectives per chapter (minimum for proper coverage)
  learningObjectivesPerSection: 3,  // 3 objectives per section (focused learning)
  courseGoals: [],
  includeAssessments: true,
  bloomsFocus: ['UNDERSTAND', 'APPLY'],
  preferredContentTypes: ['video', 'reading', 'assessments'],
};

export function useSamWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CourseCreationRequest>(initialFormData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [samSuggestion, setSamSuggestion] = useState<SamSuggestion | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  // Enhanced hooks
  const { debouncedCall, cancelAllCalls } = useSamDebounce();
  const samCache = useSamCache({ ttl: 5 * 60 * 1000, maxSize: 100 });
  const { disclosureState, completeStep } = useProgressiveCourseCreation();

  // SAM Action Handler - processes actions from API responses and auto-fills form
  const { processApiResponse, processAction } = useSamActionHandler(setFormData, {
    onActionProcessed: (result) => {
      logger.info('[SAMWizard] Action processed:', result);
      if (result.success && result.fieldsUpdated && result.fieldsUpdated.length > 0) {
        // Track form auto-fill usage
        trackAIFeatureUsage('sam_form_autofill', {
          fieldsUpdated: result.fieldsUpdated,
          actionType: result.actionType,
        });
      }
    },
    onNavigate: (url) => {
      // Handle navigation suggestions from SAM
      router.push(url);
    },
    onCourseCreationAction: (action, details) => {
      // Handle course creation actions (generate titles, create structure, etc.)
      logger.info('[SAMWizard] Course creation action:', { action, details });
      trackAIFeatureUsage('sam_course_action', { action, ...details });
    },
  });

  const fieldMeta = useMemo(() => getCourseWizardFieldMeta(), []);

  // Only sync fields SAM needs for context — excludes array fields (courseGoals,
  // bloomsFocus, preferredContentTypes) that generate noisy recursive expansions
  const relevantFields = useMemo(() => new Set([
    'courseTitle', 'courseShortOverview', 'courseCategory', 'courseSubcategory',
    'courseIntent', 'targetAudience', 'difficulty', 'duration',
    'chapterCount', 'sectionsPerChapter',
    'learningObjectivesPerChapter', 'learningObjectivesPerSection',
    'includeAssessments',
  ]), []);

  // Intelligent SAM sync - automatically detects ALL form changes without hardcoding
  useIntelligentSAMSync('ai-course-creator-wizard', formData, {
    formName: 'AI Course Creator Wizard',
    metadata: {
      currentStep: step,
      totalSteps: TOTAL_STEPS,
      pageUrl: '/teacher/create/ai-creator',
      wizardMode: true,
    },
    fieldMeta,
    formType: 'course-creator-wizard',
    relevantFields,
  });

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (formData.courseTitle || formData.courseShortOverview) {
        localStorage.setItem('course-creator-draft', JSON.stringify({
          formData,
          step,
          timestamp: new Date().toISOString()
        }));
        setLastAutoSave(new Date());
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [formData, step]);

  // Load saved draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('course-creator-draft');
      if (savedDraft) {
        const { formData: savedFormData, step: savedStep, timestamp } = JSON.parse(savedDraft);
        const saveTime = new Date(timestamp);
        const hoursSinceSave = (Date.now() - saveTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceSave < 24) { // Only restore if less than 24 hours old
          // Merge with defaults to ensure no missing fields from older drafts
          setFormData({ ...initialFormData, ...savedFormData });
          setStep(savedStep);
          setLastAutoSave(saveTime);
          toast.success("Draft restored from auto-save");
        }
      }
    } catch (error: any) {
      logger.error('Error loading saved draft:', error);
    }
  }, []);

  const applySamSuggestion = (suggestion: SamSuggestion) => {
    // Apply smart defaults or other actions
    setSamSuggestion({
      ...suggestion,
      type: 'validation',
      message: "I've applied some improvements based on best practices!"
    });
  };

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      // Track step completion
      completeStep(step, formData);
      trackFormProgress(`step_${step}`, TOTAL_STEPS, step);
      
      setStep(step + 1);
      // Clear previous suggestion when moving to next step
      setSamSuggestion(null);
      setValidationErrors({});
      
      // Note: Auto-suggestions and validation removed to prevent costly API calls
      // Users can manually request SAM suggestions when needed
    }
  }, [step, completeStep, formData, setSamSuggestion, setValidationErrors]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  const goToStep = useCallback((targetStep: number) => {
    if (targetStep >= 1 && targetStep <= TOTAL_STEPS && targetStep <= step) {
      setStep(targetStep);
      setSamSuggestion(null);
      setValidationErrors({});
    }
  }, [step]);

  const resetWizard = useCallback(() => {
    setFormData(initialFormData);
    setStep(1);
    setSamSuggestion(null);
    setValidationErrors({});
    setIsLoadingSuggestion(false);
    setIsGenerating(false);
    setLastAutoSave(null);
    localStorage.removeItem('course-creator-draft');
    cancelAllCalls();
  }, [cancelAllCalls]);

  // Hook-specific keyboard shortcuts (Ctrl+S save, Escape cancel SAM).
  // Navigation shortcuts (Ctrl+Enter, Escape-back) are handled in page.tsx
  // to avoid duplicate handlers and reduce listener churn.
  const isLoadingSuggestionRef = React.useRef(isLoadingSuggestion);
  isLoadingSuggestionRef.current = isLoadingSuggestion;
  const formDataRef = React.useRef(formData);
  formDataRef.current = formData;
  const stepRef = React.useRef(step);
  stepRef.current = step;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl+S: Manual save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        localStorage.setItem('course-creator-draft', JSON.stringify({
          formData: formDataRef.current,
          step: stepRef.current,
          timestamp: new Date().toISOString()
        }));
        toast.success('Progress saved manually');
      }

      // Escape: Cancel SAM operations
      if (e.key === 'Escape' && isLoadingSuggestionRef.current) {
        cancelAllCalls();
        setIsLoadingSuggestion(false);
        toast.info('Sam operation cancelled');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      cancelAllCalls();
    };
  }, [cancelAllCalls]);

  const state: SamWizardState = {
    step,
    totalSteps: TOTAL_STEPS,
    isGenerating,
    samSuggestion,
    isLoadingSuggestion,
    validationErrors,
    lastAutoSave
  };

  const actions: SamWizardActions = {
    handleNext,
    handleBack,
    resetWizard
  };

  return {
    // State
    ...state,
    formData,
    setFormData,

    // Actions
    ...actions,
    goToStep,

    // Utilities
    samCache,
    setSamSuggestion,

    // SAM Action Handler - for manual action processing
    processAction,
    processApiResponse,
  };
}
