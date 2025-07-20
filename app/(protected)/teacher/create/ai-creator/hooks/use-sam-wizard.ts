import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CourseCreationRequest, SamSuggestion, SamWizardState, SamWizardActions } from '../types/sam-creator.types';
import { useSamDebounce } from '@/hooks/use-sam-debounce';
import { useSamCache } from '@/hooks/use-sam-cache';
import { useProgressiveCourseCreation } from '@/hooks/use-progressive-course-creation';
import { trackAIFeatureUsage, trackFormProgress, trackGenerationStart, trackGenerationEnd } from '@/lib/analytics-tracker';

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
  courseGoals: [],
  includeAssessments: true,
  bloomsFocus: ['UNDERSTAND', 'APPLY'],
  preferredContentTypes: ['video', 'reading', 'assessments']
};

export function useSamWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CourseCreationRequest>(initialFormData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [samSuggestion, setSamSuggestion] = useState<SamSuggestion | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [showStreamingModal, setShowStreamingModal] = useState(false);
  
  // Enhanced hooks
  const { debouncedCall, cancelAllCalls } = useSamDebounce();
  const samCache = useSamCache({ ttl: 5 * 60 * 1000, maxSize: 100 });
  const { disclosureState, completeStep } = useProgressiveCourseCreation();

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
          setFormData(savedFormData);
          setStep(savedStep);
          setLastAutoSave(saveTime);
          toast.success("Draft restored from auto-save");
        }
      }
    } catch (error) {
      console.error('Error loading saved draft:', error);
    }
  }, []);

  const getSamSuggestion = useCallback(async (context: string) => {
    if (isLoadingSuggestion) return;
    
    debouncedCall({
      key: `sam-suggestion-${context}-${step}`,
      fn: async () => {
        setIsLoadingSuggestion(true);
        
        try {
          trackAIFeatureUsage('sam_suggestions', { context, step });
          
          const response = await fetch('/api/sam/ai-tutor/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Provide contextual suggestions for course creation step ${step}. Context: ${context}. Current course data: ${JSON.stringify(formData)}. Give helpful advice and suggestions.`,
              context: {
                pageData: { 
                  pageType: 'course_creation',
                  title: 'AI Course Creator - Suggestions',
                  forms: []
                },
                learningContext: { 
                  userRole: 'teacher',
                  courseCreationMode: true,
                  currentStep: step
                },
                gamificationState: {},
                tutorPersonality: { tone: 'encouraging', teachingMethod: 'direct' },
                emotion: 'engaged'
              }
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setSamSuggestion({
              message: data.response,
              type: 'suggestion',
              actionable: true,
              confidence: 0.85,
              action: undefined
            });
          } else {
            throw new Error(`Sam suggestion failed: ${response.status}`);
          }
        } catch (error) {
          console.error('Error getting Sam suggestion:', error);
          setSamSuggestion({
            message: "I'm having trouble right now. Please try again in a moment.",
            type: 'warning',
            actionable: false,
            confidence: 0.5
          });
        } finally {
          setIsLoadingSuggestion(false);
        }
      },
      delay: 1500
    });
  }, [formData, step, isLoadingSuggestion, disclosureState.userExperience, debouncedCall]);

  const validateForm = useCallback(async () => {
    if (isValidating) return;
    
    debouncedCall({
      key: `sam-validation-${step}`,
      fn: async () => {
        setIsValidating(true);
        try {
          const response = await fetch('/api/sam/ai-tutor/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Validate course creation form data for step ${step}. Check for completeness, quality, and provide improvement suggestions. Form data: ${JSON.stringify(formData)}`,
              context: {
                pageData: { 
                  pageType: 'course_creation',
                  title: 'AI Course Creator - Validation',
                  forms: []
                },
                learningContext: { 
                  userRole: 'teacher',
                  courseCreationMode: true,
                  currentStep: step
                },
                gamificationState: {},
                tutorPersonality: { tone: 'encouraging', teachingMethod: 'direct' },
                emotion: 'engaged'
              }
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Clear previous errors and show SAM's validation feedback
            setValidationErrors({});
            setSamSuggestion({
              message: data.response,
              type: 'validation',
              actionable: true,
              confidence: 0.9,
              action: undefined
            });
          } else {
            throw new Error(`Sam validation failed: ${response.status}`);
          }
        } catch (error) {
          console.error('Error validating form:', error);
        } finally {
          setIsValidating(false);
        }
      },
      delay: 2000
    });
  }, [formData, step, disclosureState.userExperience, isValidating, debouncedCall]);

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
  }, [step, completeStep, formData, getSamSuggestion, validateForm]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  const handleGenerate = useCallback(async () => {
    const genId = trackGenerationStart('blueprint', {
      inputComplexity: 'high',
      inputData: formData
    });
    setGenerationId(genId);
    
    // Track all enhanced features usage
    trackAIFeatureUsage('course_generation', { 
      formData, 
      step, 
      totalSteps: TOTAL_STEPS,
      aiSuggestionsUsed: samSuggestion ? 1 : 0
    });
    
    // Show streaming modal
    setShowStreamingModal(true);
    trackAIFeatureUsage('streaming_generation');
  }, [formData, step, samSuggestion]);

  const handleStreamingComplete = useCallback(async (blueprint: any) => {
    setShowStreamingModal(false);
    
    if (generationId) {
      trackGenerationEnd(generationId, {
        success: true,
        duration: Date.now(),
        outputQuality: 85,
        outputSize: JSON.stringify(blueprint).length
      });
    }
    
    toast.success("Course blueprint generated successfully!");
    
    // Create course directly
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: blueprint.course.title,
          description: blueprint.course.description,
          learningObjectives: blueprint.course.goals?.join('\n') || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Course creation failed:', response.status, errorText);
        throw new Error(`Failed to create course: ${response.status} - ${errorText}`);
      }

      const course = await response.json();
      console.log('Course created:', course);

      // Store blueprint for course editing page
      sessionStorage.setItem(`course_blueprint_${course.id}`, JSON.stringify(blueprint));
      
      // Navigate to course editing page
      router.push(`/teacher/courses/${course.id}`);
    } catch (error) {
      console.error('Error creating course from blueprint:', error);
      toast.error('Failed to create course. Please try again.');
    }
  }, [generationId, router]);

  const handleStreamingError = useCallback(() => {
    setShowStreamingModal(false);
    
    if (generationId) {
      trackGenerationEnd(generationId, {
        success: false,
        duration: Date.now(),
        errorType: 'generation_failed'
      });
    }
    toast.error("Course generation failed. Please try again.");
  }, [generationId]);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (step < TOTAL_STEPS) {
              handleNext();
            } else {
              handleGenerate();
            }
            break;
          case 'ArrowLeft':
            e.preventDefault();
            if (step > 1) handleBack();
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (step < TOTAL_STEPS) handleNext();
            break;
          case 's':
            e.preventDefault();
            // Manual save trigger
            localStorage.setItem('course-creator-draft', JSON.stringify({
              formData,
              step,
              timestamp: new Date().toISOString()
            }));
            toast.success('Progress saved manually');
            break;
        }
      }
      
      // Escape to cancel Sam operations
      if (e.key === 'Escape') {
        if (isLoadingSuggestion) {
          cancelAllCalls();
          setIsLoadingSuggestion(false);
          toast.info('Sam operation cancelled');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      cancelAllCalls(); // Cleanup on unmount
    };
  }, [step, formData, handleNext, handleBack, handleGenerate, isLoadingSuggestion, cancelAllCalls]);

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
    handleGenerate,
    getSamSuggestion,
    validateForm,
    resetWizard
  };

  return {
    // State
    ...state,
    formData,
    setFormData,
    showStreamingModal,
    setShowStreamingModal,
    
    // Actions
    ...actions,
    handleStreamingComplete,
    handleStreamingError,
    
    // Utilities
    samCache,
    setSamSuggestion
  };
}