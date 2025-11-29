"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SamErrorBoundary } from "@/sam/components/ui/sam-error-boundary";
import { ArrowRight, ArrowLeft, Sparkles, AlertTriangle, BookOpen, RefreshCw, Brain, Users, GraduationCap, Wand2, Zap, Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from '@/lib/logger';
import { AICreatorLayout } from "./_components/AICreatorLayout";

// Import modular components
import { useSamWizard } from "./hooks/use-sam-wizard";
import { useSamCompleteGeneration, useSamContextGathering } from "./hooks/use-sam-complete-generation";
// Note: samMemory imported dynamically to avoid SSR issues
import { CourseBasicsStep } from "./components/steps/course-basics-step";
import { TargetAudienceStep } from "./components/steps/target-audience-step";
import { CourseStructureStep } from "./components/steps/course-structure-step";
import { AdvancedSettingsStep } from "./components/steps/advanced-settings-step";
// Removed SamAssistantPanel - using global SAM instead
import { CourseScoringPanel } from "./components/course-scoring-panel";
import { SamLearningDesignAssistance } from "./components/sam-learning-design-assistance";
import { VerticalStepper } from "./components/navigation/VerticalStepper";
import { MobileStepNav } from "./components/navigation/MobileStepNav";
import { AnimatedBackground, GlassCard, AnimatedIcon, ProgressRing } from "./components/ui/AnimatedBackground";

const STEP_TITLES = [
  "Course Basics",
  "Target Audience",
  "Course Structure",
  "Final Review"
];

const STEP_DESCRIPTIONS = [
  "Define your course identity and foundation",
  "Identify who will benefit most from your course",
  "Design objectives and learning framework",
  "Review and generate your course with AI"
];

const STEP_ICONS = [BookOpen, Users, Brain, GraduationCap];

export default function AICreatorPage() {
  const router = useRouter();
  const [showCompleteGenerationModal, setShowCompleteGenerationModal] = React.useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = React.useState(false);

  const {
    // State
    step,
    totalSteps,
    formData,
    setFormData,
    isGenerating,
    samSuggestion,
    isLoadingSuggestion,
    validationErrors,
    lastAutoSave,
    showStreamingModal,
    setShowStreamingModal,

    // Actions
    handleNext,
    handleBack,
    handleGenerate,
    getSamSuggestion,
    validateForm,
    resetWizard,
    handleStreamingComplete,
    handleStreamingError,
    setSamSuggestion
  } = useSamWizard();

  // Complete generation system
  const {
    isGenerating: isCompleteGenerating,
    progress: generationProgress,
    error: generationError,
    generateCompleteStructure,
    resetGeneration
  } = useSamCompleteGeneration();

  const { gatherSamContext } = useSamContextGathering();

  // Get suggestion refresh handler
  const handleRefreshSuggestion = () => {
    getSamSuggestion('general_encouragement');
  };

  // Complete generation handlers
  const handleOpenCompleteGeneration = () => {
    setShowCompleteGenerationModal(true);
  };

  const handleCompleteGeneration = async () => {
    try {
      const samContext = gatherSamContext(formData, typeof samSuggestion === 'string' ? samSuggestion : JSON.stringify(samSuggestion) || '');

      await generateCompleteStructure({
        formData,
        samContext,
        onFormDataUpdate: setFormData,
        onGenerationComplete: (result) => {

          // Save generated structure to SAM memory (client-side only)
          if (typeof window !== 'undefined') {
            import('@/sam/utils/sam-memory-system').then(({ samMemory }) => {
              samMemory.saveGeneratedStructure({
                courseDescription: result.courseDescription,
                enhancedObjectives: result.learningObjectives,
                chapters: result.chapters,
                generationMethod: 'sam-complete'
              });

              // Track successful generation
              samMemory.incrementSuccessfulGenerations();
            });
          }

          // Optionally refresh SAM suggestion after generation
          getSamSuggestion('course_structure_complete');
        }
      });

      // Close modal on success
      setTimeout(() => {
        setShowCompleteGenerationModal(false);
      }, 2000);

    } catch (error: unknown) {
      logger.error('Complete generation failed:', error);
      // Modal stays open to show error
    }
  };

  const handleCloseCompleteGenerationModal = () => {
    if (!isCompleteGenerating) {
      setShowCompleteGenerationModal(false);
      resetGeneration();
    }
  };

  // New unified course generation handler
  const handleGenerateCompleteeCourse = React.useCallback(async () => {
    setIsCreatingCourse(true);

    try {
      // Debug: Log the form data to see what we're sending

      // Step 1: Create the course with final review data
      const courseData = {
        title: formData.courseTitle,
        description: formData.courseShortOverview,
        learningObjectives: formData.courseGoals || [], // API expects 'learningObjectives'
      };

      // Note: Category handling will be done on the course edit page
      // The /api/courses POST endpoint doesn't support categoryId during creation

      const courseResponse = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!courseResponse.ok) {
        const errorText = await courseResponse.text();
        logger.error(`Course creation failed: ${courseResponse.status} - ${errorText}`);
        throw new Error(`Failed to create course: ${courseResponse.status} - ${errorText}`);
      }

      const course = await courseResponse.json();

      // Step 2: Generate chapters using SAM AI
      let successfulChapters = []; // Declare variable at proper scope

      const chaptersResponse = await fetch('/api/sam/ai-tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Generate ${formData.chapterCount || 5} comprehensive chapter titles for the course: "${formData.courseTitle}"

Course Details:
- Description: ${formData.courseShortOverview}
- Category: ${formData.courseCategory}
- Target Audience: ${formData.targetAudience}
- Difficulty: ${formData.difficulty}
- Learning Objectives: ${formData.courseGoals?.join(', ') || 'Not specified'}
- Bloom's Focus: ${formData.bloomsFocus?.join(', ') || 'Not specified'}

Please generate exactly ${formData.chapterCount || 5} chapter titles that:
1. Follow a logical learning progression
2. Cover all aspects of the course description
3. Are appropriate for ${formData.difficulty} level learners
4. Support the learning objectives

Format as:
1. [Chapter Title]
2. [Chapter Title]
3. [Chapter Title]
etc.`,
          context: {
            pageData: {
              pageType: 'course_creation',
              title: 'Chapter Generation',
              forms: []
            },
            learningContext: {
              userRole: 'teacher',
              courseCreationMode: true,
              chapterGenerationMode: true
            },
            gamificationState: {},
            tutorPersonality: { tone: 'encouraging', teachingMethod: 'direct' },
            emotion: 'engaged'
          }
        }),
      });

      if (chaptersResponse.ok) {
        const chaptersResult = await chaptersResponse.json();

        // Parse chapter titles from SAM's response
        const chapterMatches = chaptersResult.response.match(/\d+\.\s*(.+)/g);

        if (chapterMatches && chapterMatches.length > 0) {

          // Create chapters for the course
          const chapterPromises = chapterMatches.slice(0, formData.chapterCount || 5).map(async (match: string, index: number) => {
            const title = match.replace(/^\d+\.\s*/, '').trim();

            try {
              const chapterResponse = await fetch(`/api/courses/${course.id}/chapters`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  title,
                  position: index + 1,
                }),
              });

              if (chapterResponse.ok) {
                const chapter = await chapterResponse.json();

                return chapter;
              } else {
                const errorText = await chapterResponse.text();
                logger.error(`Failed to create chapter "${title}": ${chapterResponse.status} - ${errorText}`);
              }
            } catch (error: unknown) {
              logger.error(`Error creating chapter: ${title}`, error);
            }
            return null;
          });

          const createdChapters = await Promise.all(chapterPromises);
          successfulChapters = createdChapters.filter(chapter => chapter !== null);

        } else {
          logger.warn('No chapter titles found in SAM response');
        }
      } else {
        logger.error('Failed to generate chapters:', chaptersResponse.status);
      }

      // Step 3: Save progress to SAM memory and redirect
      if (typeof window !== 'undefined') {
        import('@/sam/utils/sam-memory-system').then(({ samMemory }) => {
          samMemory.saveGeneratedStructure({
            courseDescription: formData.courseShortOverview,
            enhancedObjectives: formData.courseGoals || [],
            chapters: [], // Chapters are now created directly
            generationMethod: 'manual'
          });
          samMemory.incrementSuccessfulGenerations();
        });
      }

      // Success message and redirect
      toast.success(`Course "${course.title}" created successfully with ${successfulChapters.length} chapters!`);

      // Redirect to course editing page (skip blueprint stage)
      router.push(`/teacher/courses/${course.id}`);

    } catch (error: unknown) {
      logger.error('Error creating course:', error);
      toast.error('Failed to create course. Please try again.');
    } finally {
      setIsCreatingCourse(false);
    }
  }, [formData, router]);

  // SAM Memory Integration - Save wizard data as user progresses
  React.useEffect(() => {
    // Save form data to SAM memory whenever it changes (client-side only)
    if ((formData.courseTitle || formData.courseShortOverview) && typeof window !== 'undefined') {
      import('@/sam/utils/sam-memory-system').then(({ samMemory }) => {
        samMemory.saveWizardData({
          courseTitle: formData.courseTitle || '',
          courseShortOverview: formData.courseShortOverview || '',
          courseCategory: formData.courseCategory || '',
          courseSubcategory: formData.courseSubcategory,
          targetAudience: formData.targetAudience || '',
          difficulty: formData.difficulty || '',
          courseIntent: formData.courseIntent,
          courseGoals: formData.courseGoals || [],
          bloomsFocus: formData.bloomsFocus || [],
          preferredContentTypes: formData.preferredContentTypes || [],
          chapterCount: formData.chapterCount || 8,
          sectionsPerChapter: formData.sectionsPerChapter || 3,
          includeAssessments: formData.includeAssessments || false
        });
      });
    }
  }, [formData]);

  // Save SAM interactions to memory
  React.useEffect(() => {
    if (samSuggestion && typeof window !== 'undefined') {
      import('@/sam/utils/sam-memory-system').then(({ samMemory }) => {
        samMemory.addWizardInteraction({
          type: 'suggestion',
          content: typeof samSuggestion === 'string' ? samSuggestion : JSON.stringify(samSuggestion),
          step: step
        });
      });
    }
  }, [samSuggestion, step]);

  // Initialize SAM session
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/sam/utils/sam-memory-system').then(({ samMemory }) => {
        samMemory.startSession('ai-course-creator');
        samMemory.updateCurrentPage(`ai-creator-step-${step}`);
      });
    }
  }, [step]);

  // Update current step in SAM memory
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/sam/utils/sam-memory-system').then(({ samMemory }) => {
        samMemory.updateCurrentPage(`ai-creator-step-${step}`);
      });
    }
  }, [step]);

  // Step validation
  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.courseTitle?.trim()?.length >= 10 &&
          formData.courseShortOverview?.trim()?.length >= 50 &&
          formData.courseCategory?.trim()?.length > 0
        );
      case 2:
        return !!(
          formData.targetAudience?.trim()?.length > 0 &&
          formData.difficulty?.trim()?.length > 0
        );
      case 3:
        return !!(
          Array.isArray(formData.courseGoals) &&
          formData.courseGoals.length >= 2 &&
          Array.isArray(formData.bloomsFocus) &&
          formData.bloomsFocus.length >= 2
        );
      case 4:
        // Final review - check if all previous steps are valid
        return !!(
          formData.courseTitle?.trim()?.length >= 10 &&
          formData.courseShortOverview?.trim()?.length >= 50 &&
          formData.courseCategory?.trim()?.length > 0 &&
          formData.targetAudience?.trim()?.length > 0 &&
          formData.difficulty?.trim()?.length > 0 &&
          Array.isArray(formData.courseGoals) &&
          formData.courseGoals.length >= 2 &&
          Array.isArray(formData.bloomsFocus) &&
          formData.bloomsFocus.length >= 2
        );
      default:
        return true;
    }
  };

  // Render current step component
  const renderStepContent = () => {
    const stepProps = {
      formData,
      setFormData,
      validationErrors,
      onNext: handleNext,
      onBack: handleBack
    };

    switch (step) {
      case 1:
        return <CourseBasicsStep {...stepProps} />;
      case 2:
        return <TargetAudienceStep {...stepProps} />;
      case 3:
        return <CourseStructureStep {...stepProps} />;
      case 4:
        return <AdvancedSettingsStep {...stepProps} />;
      default:
        return <CourseBasicsStep {...stepProps} />;
    }
  };

  const canProceed = isStepValid();
  const isLastStep = step === totalSteps;

  // Keyboard shortcuts for navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Ctrl/Cmd+Enter even when in input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          if (canProceed && !isLastStep) {
            handleNext();
          } else if (canProceed && isLastStep && !isCreatingCourse) {
            handleGenerateCompleteeCourse();
          }
        }
        return;
      }

      // Ctrl/Cmd + Enter: Advance to next step or generate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (canProceed && !isLastStep) {
          handleNext();
        } else if (canProceed && isLastStep && !isCreatingCourse) {
          handleGenerateCompleteeCourse();
        }
      }

      // Escape: Go back
      if (e.key === 'Escape' && step > 1) {
        e.preventDefault();
        handleBack();
      }

      // Alt + Number: Jump to step (only backwards)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= totalSteps && num < step) {
          e.preventDefault();
          let currentStep = step;
          while (currentStep > num) {
            handleBack();
            currentStep--;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, canProceed, isLastStep, isCreatingCourse, totalSteps, handleNext, handleBack, handleGenerateCompleteeCourse]);

  const stepProgress = Math.min(100, Math.round((step / totalSteps) * 100));

  // Debug: Log validation state (remove in production)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Validation Debug:', {
        step,
        canProceed,
        formData: {
          courseTitle: formData.courseTitle?.trim()?.length,
          courseShortOverview: formData.courseShortOverview?.trim()?.length,
          courseCategory: formData.courseCategory?.trim()?.length,
          targetAudience: formData.targetAudience?.trim()?.length,
          difficulty: formData.difficulty?.trim()?.length,
          courseGoals: formData.courseGoals?.length,
          bloomsFocus: formData.bloomsFocus?.length,
        }
      });
    }
  }, [step, canProceed, formData]);

  // Stepper configuration
  const stepperSteps = [
    {
      id: 1,
      title: "Course Basics",
      description: "Title, category, and overview",
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      id: 2,
      title: "Target Audience",
      description: "Who will take this course",
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 3,
      title: "Course Structure",
      description: "Objectives and framework",
      icon: <Brain className="h-5 w-5" />
    },
    {
      id: 4,
      title: "Final Review",
      description: "Review and generate",
      icon: <GraduationCap className="h-5 w-5" />
    }
  ];

  const StepIcon = STEP_ICONS[step - 1];

  return (
    <AICreatorLayout>
      <SamErrorBoundary>
        {/* Animated Background */}
        <AnimatedBackground />

        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 pb-40 sm:pb-44 md:pb-8 max-w-[1600px] relative">
          {/* Premium Hero Header */}
          <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            {/* Top Badge Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl blur opacity-40 group-hover:opacity-60 transition duration-500" />
                  <Badge className="relative bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border-0 px-4 py-1.5 text-sm font-semibold shadow-lg">
                    <Wand2 className="h-4 w-4 mr-2 animate-sparkle" />
                    AI Course Creator
                  </Badge>
                </div>
                <span className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Powered by SAM
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {lastAutoSave && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/50 rounded-full px-3 py-1.5 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-medium">Saved {new Date(lastAutoSave).toLocaleTimeString()}</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetWizard}
                  className="h-9 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Main Hero Content */}
            <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1.3fr_0.7fr] items-start">
              {/* Left Content */}
              <div className="space-y-5">
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                    Create courses that
                    <span className="block gradient-text-animated">inspire learning</span>
                  </h1>
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                    Build professional, pedagogically-sound courses with AI assistance.
                    Our guided wizard ensures quality at every step.
                  </p>
                </div>

                {/* Feature Pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: Zap, label: "Smart Validation" },
                    { icon: Star, label: "Best Practices" },
                    { icon: Sparkles, label: "AI-Enhanced" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      <Icon className="h-3.5 w-3.5 text-indigo-500" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Progress Card */}
                <GlassCard variant="gradient" className="p-5 col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Progress
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums">
                          {step}
                        </span>
                        <span className="text-lg text-slate-500 dark:text-slate-400">
                          / {totalSteps}
                        </span>
                      </div>
                    </div>
                    <ProgressRing progress={stepProgress} size={80} strokeWidth={6} />
                  </div>

                  {/* Step Indicators */}
                  <div className="flex gap-1.5">
                    {Array.from({ length: totalSteps }, (_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-all duration-500",
                          i + 1 < step
                            ? "bg-emerald-500"
                            : i + 1 === step
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                            : "bg-slate-200 dark:bg-slate-700"
                        )}
                      />
                    ))}
                  </div>
                </GlassCard>

                {/* Current Step Card */}
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <AnimatedIcon color="indigo" className="p-2.5">
                      <StepIcon className="h-5 w-5" />
                    </AnimatedIcon>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {STEP_TITLES[step - 1]}
                      </p>
                    </div>
                  </div>
                </GlassCard>

                {/* Status Card */}
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl",
                      canProceed
                        ? "bg-emerald-100 dark:bg-emerald-900/50"
                        : "bg-amber-100 dark:bg-amber-900/50"
                    )}>
                      {canProceed ? (
                        <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status</p>
                      <p className={cn(
                        "text-sm font-semibold truncate",
                        canProceed
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      )}>
                        {canProceed ? "Ready" : "In Progress"}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>

          {/* Main Content Layout - 3 Column Grid for Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Sidebar - Vertical Stepper (Desktop Only) */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-8">
                <VerticalStepper
                  steps={stepperSteps}
                  currentStep={step}
                  formData={{
                    courseTitle: formData.courseTitle,
                    targetAudience: formData.targetAudience,
                    difficulty: formData.difficulty,
                    courseGoals: formData.courseGoals,
                    bloomsFocus: formData.bloomsFocus
                  }}
                  onStepClick={(newStep) => {
                    if (newStep < step) {
                      // Allow going back to previous steps
                      let currentStep = step;
                      while (currentStep > newStep) {
                        handleBack();
                        currentStep--;
                      }
                    }
                  }}
                />
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="lg:col-span-6 space-y-5">
              {/* Step Header Card */}
              <GlassCard variant="elevated" className="p-5 sm:p-6 md:p-7 step-card-hover overflow-hidden relative">
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <AnimatedIcon
                      color={step === 1 ? "indigo" : step === 2 ? "purple" : step === 3 ? "emerald" : "amber"}
                      className="hidden sm:flex"
                    >
                      <StepIcon className="h-6 w-6" />
                    </AnimatedIcon>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Step {step} of {totalSteps}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                        {STEP_TITLES[step - 1]}
                      </h2>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1.5">
                        {STEP_DESCRIPTIONS[step - 1]}
                      </p>
                    </div>
                  </div>

                  {/* Mobile: Step Indicator */}
                  <div className="lg:hidden text-right flex-shrink-0">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg">
                      {step}
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Step Content */}
              <GlassCard variant="default" className="p-5 sm:p-6 md:p-8 step-card-hover">
                <div key={step} className="animate-slide-up">
                  {renderStepContent()}
                </div>
              </GlassCard>

              {/* Desktop Navigation */}
              <GlassCard variant="subtle" className="hidden lg:block p-5">
                <div className="flex items-center justify-between gap-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1}
                    className={cn(
                      "group bg-white/80 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-700",
                      "hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
                      "hover:-translate-y-0.5 hover:shadow-lg",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                      "h-12 text-sm font-semibold rounded-xl shadow-sm transition-all duration-300 px-5"
                    )}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
                    Back
                    <kbd className="hidden xl:inline-flex ml-3 px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">Esc</kbd>
                  </Button>

                  {isLastStep ? (
                    <Button
                      onClick={handleGenerateCompleteeCourse}
                      disabled={!canProceed || isCreatingCourse}
                      className={cn(
                        "group relative overflow-hidden",
                        "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700",
                        "hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600",
                        "text-white font-semibold shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40",
                        "transition-all duration-300 hover:-translate-y-0.5",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                        isCreatingCourse && "animate-pulse",
                        "h-12 text-sm px-6 rounded-xl"
                      )}
                    >
                      {/* Animated shine effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                      {isCreatingCourse ? (
                        <>
                          <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating Your Course...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Course
                          <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed}
                      className={cn(
                        "group relative overflow-hidden",
                        "bg-gradient-to-r from-indigo-600 to-purple-600",
                        "hover:from-indigo-500 hover:to-purple-500",
                        "text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35",
                        "transition-all duration-300 hover:-translate-y-0.5",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                        "h-12 text-sm px-6 rounded-xl"
                      )}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                      <kbd className="hidden xl:inline-flex ml-3 px-2 py-0.5 text-[10px] bg-white/20 rounded-md text-white/80 font-mono">⌘↵</kbd>
                    </Button>
                  )}
                </div>

                {!canProceed && (
                  <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span>Complete all required fields to continue</span>
                    </div>
                  </div>
                )}
              </GlassCard>
            </main>

            {/* Right Sidebar - Context Panels (SAM Assistant now global) */}
            <aside className="lg:col-span-3 space-y-5">
              <div className="lg:sticky lg:top-8 space-y-5">
                {/* SamAssistantPanel removed - using global SAM instead */}
                {/* Global SAM (bottom-right floating button) provides AI assistance */}

                {step === 1 && (
                  <CourseScoringPanel
                    formData={formData}
                    onUpdateFormData={setFormData}
                  />
                )}

                {step === 3 && (
                  <SamLearningDesignAssistance
                    formData={formData}
                    onUpdateFormData={setFormData}
                  />
                )}

                {/* Tips Card */}
                <GlassCard className="p-5 border-indigo-200/30 dark:border-indigo-800/30">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                      <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        Pro Tips
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 text-indigo-500 flex-shrink-0" />
                          <span>Use <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">⌘/Ctrl + Enter</kbd> to proceed</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 text-indigo-500 flex-shrink-0" />
                          <span>Your progress is automatically saved</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 text-indigo-500 flex-shrink-0" />
                          <span>Click the SAM button for AI assistance</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </aside>
          </div>

          {/* Mobile Bottom Navigation */}
          <MobileStepNav
            currentStep={step}
            totalSteps={totalSteps}
            canProceed={canProceed}
            isLastStep={isLastStep}
            isGenerating={isCreatingCourse}
            onBack={handleBack}
            onNext={handleNext}
            onGenerate={handleGenerateCompleteeCourse}
            nextStepTitle={STEP_TITLES[step]}
          />
        </div>

        {/* Note: Removed old generation modals - now using unified course creation */}
      </SamErrorBoundary>
    </AICreatorLayout>
  );
}
