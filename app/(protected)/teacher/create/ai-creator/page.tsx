"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SamErrorBoundary } from "@/components/sam/sam-error-boundary";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  BookOpen,
  RefreshCw,
  Brain,
  Users,
  GraduationCap,
  Bot,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { AICreatorLayout } from "./_components/AICreatorLayout";
import { createSamContext } from "@/lib/sam/utils/form-data-to-sam-context";

// Import modular components
import { useSamWizard } from "./hooks/use-sam-wizard";
import {
  useSamCompleteGeneration,
  useSamContextGathering,
} from "./hooks/use-sam-complete-generation";
import { CourseBasicsStep } from "./components/steps/course-basics-step";
import { TargetAudienceStep } from "./components/steps/target-audience-step";
import { CourseStructureStep } from "./components/steps/course-structure-step";
import { AdvancedSettingsStep } from "./components/steps/advanced-settings-step";
import { MobileStepNav } from "./components/navigation/MobileStepNav";
import { SAMCompleteGenerationModal } from "./components/sam-complete-generation-modal";
import { useSAMCourseCreationOrchestrator } from "@/hooks/use-sam-course-creation-orchestrator";
import { CourseCreationProgress } from "@/components/sam/course-creation-progress";
import { SequentialCreationModal } from "@/components/sam/sequential-creation-modal";
import { useSequentialCreation } from "@/hooks/use-sam-sequential-creation";

const STEPS = [
  {
    id: 1,
    title: "Course Basics",
    description: "Title, category & overview",
    icon: BookOpen,
    color: "blue",
  },
  {
    id: 2,
    title: "Target Audience",
    description: "Who will take this course",
    icon: Users,
    color: "purple",
  },
  {
    id: 3,
    title: "Learning Design",
    description: "Objectives & framework",
    icon: Brain,
    color: "emerald",
  },
  {
    id: 4,
    title: "Review & Create",
    description: "Final review",
    icon: GraduationCap,
    color: "amber",
  },
];


export default function AICreatorPage() {
  const router = useRouter();
  const [isGenerationModalOpen, setIsGenerationModalOpen] = React.useState(false);
  const [showCreationProgress, setShowCreationProgress] = React.useState(false);

  const {
    step,
    totalSteps,
    formData,
    setFormData,
    samSuggestion,
    validationErrors,
    lastAutoSave,
    handleNext,
    handleBack,
    getSamSuggestion,
    resetWizard,
  } = useSamWizard();

  const {
    isGenerating,
    progress,
    error,
    generateCompleteStructure,
    resetGeneration,
  } = useSamCompleteGeneration();
  const { gatherSamContext } = useSamContextGathering();

  // SAM Course Creation Orchestrator (legacy)
  const {
    progress: creationProgress,
    quality: creationQuality,
    isCreating: isCreatingCourse,
    error: creationError,
    createCourse: orchestrateCreation,
    reset: resetOrchestrator,
    cancel: cancelCreation,
  } = useSAMCourseCreationOrchestrator();

  // NEW: Sequential Creation (3-Stage Process)
  const [isSequentialModalOpen, setIsSequentialModalOpen] = React.useState(false);
  const {
    progress: sequentialProgress,
    isCreating: isSequentialCreating,
    error: sequentialError,
    startCreation: startSequentialCreation,
    cancel: cancelSequentialCreation,
    reset: resetSequentialCreation,
  } = useSequentialCreation();

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

  // Open the generation modal
  const handleOpenGenerationModal = React.useCallback(() => {
    resetGeneration();
    setIsGenerationModalOpen(true);
  }, [resetGeneration]);

  // Close the generation modal
  const handleCloseGenerationModal = React.useCallback(() => {
    if (!isGenerating) {
      setIsGenerationModalOpen(false);
      resetGeneration();
    }
  }, [isGenerating, resetGeneration]);

  // NEW: Open sequential creation modal
  const handleOpenSequentialModal = React.useCallback(() => {
    resetSequentialCreation();
    setIsSequentialModalOpen(true);
  }, [resetSequentialCreation]);

  // NEW: Close sequential creation modal
  const handleCloseSequentialModal = React.useCallback(() => {
    if (!isSequentialCreating) {
      setIsSequentialModalOpen(false);
      resetSequentialCreation();
    }
  }, [isSequentialCreating, resetSequentialCreation]);

  // NEW: Start sequential creation process
  const handleStartSequentialCreation = React.useCallback(async () => {
    try {
      logger.info('[AI-CREATOR] Starting sequential course creation');

      const result = await startSequentialCreation({
        courseTitle: formData.courseTitle || '',
        courseDescription: formData.courseShortOverview || '',
        targetAudience: formData.targetAudience || '',
        difficulty: (formData.difficulty?.toLowerCase() || 'intermediate') as 'beginner' | 'intermediate' | 'advanced' | 'expert',
        totalChapters: formData.chapterCount || 8,
        sectionsPerChapter: formData.sectionsPerChapter || 3,
        learningObjectivesPerChapter: formData.learningObjectivesPerChapter || 5,
        learningObjectivesPerSection: formData.learningObjectivesPerSection || 3,
        courseGoals: formData.courseGoals || [],
        bloomsFocus: formData.bloomsFocus || ['UNDERSTAND', 'APPLY', 'ANALYZE'],
        preferredContentTypes: formData.preferredContentTypes || ['video', 'reading', 'quiz'],
        category: formData.courseCategory,
        subcategory: formData.courseSubcategory,
      });

      if (result.success && result.courseId) {
        logger.info('[AI-CREATOR] Sequential creation completed successfully', {
          courseId: result.courseId,
          chaptersCreated: result.chaptersCreated,
          sectionsCreated: result.sectionsCreated,
        });

        toast.success('Course created successfully!', {
          description: `${result.chaptersCreated} chapters and ${result.sectionsCreated} sections created.`,
        });

        // Save to SAM memory
        if (typeof window !== 'undefined') {
          import('@/lib/sam/utils/sam-memory-system').then(({ samMemory }) => {
            samMemory.incrementSuccessfulGenerations();
          });
        }
      } else {
        logger.error('[AI-CREATOR] Sequential creation failed:', result.error);
        toast.error('Course creation failed', {
          description: result.error || 'An unexpected error occurred',
        });
      }
    } catch (error) {
      logger.error('[AI-CREATOR] Error in sequential creation:', error);
      toast.error('Failed to create course');
    }
  }, [formData, startSequentialCreation]);

  // NEW: Handle retry for sequential creation
  const handleRetrySequentialCreation = React.useCallback(() => {
    resetSequentialCreation();
    handleStartSequentialCreation();
  }, [resetSequentialCreation, handleStartSequentialCreation]);

  // Gather SAM context for the modal
  const samContext = React.useMemo(() => {
    return gatherSamContext(formData, samSuggestion?.message ?? '');
  }, [formData, samSuggestion, gatherSamContext]);

  // Handle complete generation from modal - using orchestrator for quality-assured creation
  const handleCompleteGeneration = React.useCallback(async () => {
    try {
      await generateCompleteStructure({
        formData,
        samContext,
        onFormDataUpdate: setFormData,
        onGenerationComplete: async (result) => {
          // After structure is generated, use orchestrator for quality-controlled creation
          setIsGenerationModalOpen(false);
          setShowCreationProgress(true);

          try {
            // Prepare form data for orchestrator
            // Note: result.chapters may not have learningOutcomes/isFree - use optional access
            const orchestratorFormData = {
              courseTitle: formData.courseTitle || '',
              courseDescription: result.courseDescription || formData.courseShortOverview || '',
              courseShortOverview: formData.courseShortOverview || '',
              courseCategory: formData.courseCategory,
              courseSubcategory: formData.courseSubcategory,
              targetAudience: formData.targetAudience || '',
              difficulty: (formData.difficulty?.toLowerCase() || 'intermediate') as 'beginner' | 'intermediate' | 'advanced' | 'expert',
              courseIntent: formData.courseIntent,
              courseGoals: formData.courseGoals || [],
              whatYouWillLearn: result.learningObjectives,
              bloomsFocus: formData.bloomsFocus || ['UNDERSTAND', 'APPLY', 'ANALYZE'],
              preferredContentTypes: formData.preferredContentTypes || ['video', 'reading', 'quiz'],
              chapterCount: formData.chapterCount || 8,
              sectionsPerChapter: formData.sectionsPerChapter || 3,
              learningObjectivesPerChapter: formData.learningObjectivesPerChapter || 5,
              learningObjectivesPerSection: formData.learningObjectivesPerSection || 3,
              includeAssessments: formData.includeAssessments || true,
              chapters: result.chapters?.map((ch: Record<string, unknown>, idx: number) => ({
                title: ch.title as string,
                description: ch.description as string,
                learningOutcomes: (ch.learningOutcomes as string) || (ch.description as string),
                bloomsLevel: (ch.bloomsLevel as string) || formData.bloomsFocus?.[idx % (formData.bloomsFocus?.length || 1)] || 'UNDERSTAND',
                position: ch.position as number,
                isFree: (ch.isFree as boolean) ?? idx === 0,
                sections: (ch.sections as Array<Record<string, unknown>>)?.map((s: Record<string, unknown>, sIdx: number) => ({
                  title: s.title as string,
                  description: s.description as string,
                  learningObjectives: (s.learningObjectives as string) || (s.description as string),
                  contentType: (s.contentType as string) || 'reading',
                  estimatedDuration: (s.estimatedDuration as string) || '20 minutes',
                  position: s.position as number,
                  isFree: (s.isFree as boolean) ?? (idx === 0 && sIdx === 0),
                })) || [],
              })) || [],
            };

            // Prepare generated structure for orchestrator
            const generatedStructure = {
              courseDescription: result.courseDescription || formData.courseShortOverview || '',
              learningObjectives: result.learningObjectives || formData.courseGoals || [],
              chapters: result.chapters?.map((ch: Record<string, unknown>, idx: number) => ({
                title: ch.title as string,
                description: ch.description as string,
                learningOutcomes: (ch.learningOutcomes as string) || (ch.description as string),
                bloomsLevel: (ch.bloomsLevel as string) || 'UNDERSTAND',
                position: (ch.position as number) || idx + 1,
                isFree: ch.isFree as boolean | undefined,
                sections: (ch.sections as Array<Record<string, unknown>>)?.map((s: Record<string, unknown>, sIdx: number) => ({
                  title: s.title as string,
                  description: s.description as string,
                  learningObjectives: (s.learningObjectives as string) || (s.description as string),
                  contentType: (s.contentType as string) || 'reading',
                  estimatedDuration: (s.estimatedDuration as string) || '20 minutes',
                  position: (s.position as number) || sIdx + 1,
                  isFree: s.isFree as boolean | undefined,
                })) || [],
              })) || [],
            };

            // Use orchestrator for quality-assured creation
            const creationResult = await orchestrateCreation(orchestratorFormData, generatedStructure);

            if (creationResult.success) {
              // Save to SAM memory with full structure
              if (typeof window !== 'undefined') {
                import('@/lib/sam/utils/sam-memory-system').then(({ samMemory }) => {
                  samMemory.saveGeneratedStructure({
                    courseDescription: result.courseDescription,
                    enhancedObjectives: result.learningObjectives,
                    chapters: result.chapters,
                    generationMethod: 'sam_orchestrated',
                  });
                  samMemory.incrementSuccessfulGenerations();
                });
              }
            } else {
              logger.error('Orchestrated course creation failed:', creationResult.error);
            }
          } catch (dbError) {
            logger.error('Error in orchestrated course creation:', dbError);
            toast.error('Failed to create course. Please try again.');
          }
        },
      });
    } catch (genError) {
      logger.error('Error in complete generation:', genError);
    }
  }, [formData, samContext, generateCompleteStructure, setFormData, orchestrateCreation]);

  // Legacy handler for direct creation (fallback)
  const handleGenerateCourse = React.useCallback(async () => {
    // Open the SAM Complete Generation Modal for enhanced generation
    handleOpenGenerationModal();
  }, [handleOpenGenerationModal]);

  // SAM Memory Integration
  React.useEffect(() => {
    if ((formData.courseTitle || formData.courseShortOverview) && typeof window !== "undefined") {
      import("@/lib/sam/utils/sam-memory-system").then(({ samMemory }) => {
        samMemory.saveWizardData({
          courseTitle: formData.courseTitle || "",
          courseShortOverview: formData.courseShortOverview || "",
          courseCategory: formData.courseCategory || "",
          courseSubcategory: formData.courseSubcategory,
          targetAudience: formData.targetAudience || "",
          difficulty: formData.difficulty || "",
          courseIntent: formData.courseIntent,
          courseGoals: formData.courseGoals || [],
          bloomsFocus: formData.bloomsFocus || [],
          preferredContentTypes: formData.preferredContentTypes || [],
          chapterCount: formData.chapterCount || 8,
          sectionsPerChapter: formData.sectionsPerChapter || 3,
          includeAssessments: formData.includeAssessments || false,
        });
      });
    }
  }, [formData]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      import("@/lib/sam/utils/sam-memory-system").then(({ samMemory }) => {
        samMemory.startSession("ai-course-creator");
        samMemory.updateCurrentPage(`ai-creator-step-${step}`);
      });
    }
  }, [step]);

  const canProceed = isStepValid();
  const isLastStep = step === totalSteps;
  const currentStep = STEPS[step - 1];
  const StepIcon = currentStep.icon;

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (canProceed && !isLastStep) {
          handleNext();
        } else if (canProceed && isLastStep && !isSequentialCreating && !isCreatingCourse) {
          handleOpenSequentialModal();
          handleStartSequentialCreation();
        }
        return;
      }

      if (!isInputFocused && e.key === "Escape" && step > 1) {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, canProceed, isLastStep, isSequentialCreating, isCreatingCourse, handleNext, handleBack, handleOpenSequentialModal, handleStartSequentialCreation]);

  const renderStepContent = () => {
    const stepProps = {
      formData,
      setFormData,
      validationErrors,
      onNext: handleNext,
      onBack: handleBack,
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

  // Handle retry from progress component
  const handleRetryCreation = React.useCallback(() => {
    resetOrchestrator();
    setShowCreationProgress(false);
    handleOpenGenerationModal();
  }, [resetOrchestrator, handleOpenGenerationModal]);

  // Handle cancel from progress component
  const handleCancelCreation = React.useCallback(() => {
    cancelCreation();
  }, [cancelCreation]);

  return (
    <AICreatorLayout>
      <SamErrorBoundary>
        {/* SAM Complete Generation Modal (Legacy) */}
        <SAMCompleteGenerationModal
          isOpen={isGenerationModalOpen}
          onClose={handleCloseGenerationModal}
          isGenerating={isGenerating}
          progress={progress}
          error={error}
          onGenerate={handleCompleteGeneration}
          formData={formData}
          samContext={samContext}
        />

        {/* NEW: Sequential Creation Modal (3-Stage Process) */}
        <SequentialCreationModal
          isOpen={isSequentialModalOpen}
          onClose={handleCloseSequentialModal}
          progress={sequentialProgress}
          isCreating={isSequentialCreating}
          error={sequentialError}
          onCancel={cancelSequentialCreation}
          onRetry={handleRetrySequentialCreation}
          formData={{
            courseTitle: formData.courseTitle || '',
            targetAudience: formData.targetAudience,
            difficulty: formData.difficulty,
            chapterCount: formData.chapterCount,
            sectionsPerChapter: formData.sectionsPerChapter,
          }}
        />

        {/* Course Creation Progress Overlay */}
        {showCreationProgress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl mx-4 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
              <CourseCreationProgress
                progress={creationProgress}
                quality={creationQuality}
                isCreating={isCreatingCourse}
                error={creationError}
                onCancel={handleCancelCreation}
                onRetry={handleRetryCreation}
              />
            </div>
          </div>
        )}

        {/* Simplified Background */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800" />

        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 pb-40 sm:pb-44 lg:pb-8 max-w-7xl relative">
          {/* Compact Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left: Title & Badge */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/25">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      AI Course Creator
                    </h1>
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-0 text-xs">
                      SAM
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Build pedagogically-sound courses with AI assistance
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                {lastAutoSave && (
                  <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded-full px-3 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Saved
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetWizard}
                  className="h-9 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Progress Steps (Desktop) */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-8 p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <div className="mb-5 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Progress
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Step {step} of {totalSteps}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Steps list */}
                <div className="space-y-2">
                  {STEPS.map((s, index) => {
                    const Icon = s.icon;
                    const isCompleted = index + 1 < step;
                    const isCurrent = index + 1 === step;
                    const isClickable = isCompleted;

                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          if (isClickable) {
                            let currentStep = step;
                            while (currentStep > index + 1) {
                              handleBack();
                              currentStep--;
                            }
                          }
                        }}
                        disabled={!isClickable && !isCurrent}
                        className={cn(
                          "w-full p-3 rounded-xl text-left transition-all duration-200",
                          isCurrent && "bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 border border-violet-200 dark:border-violet-800",
                          isCompleted && "hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer",
                          !isCompleted && !isCurrent && "opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                              isCurrent && "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg",
                              isCompleted && "bg-emerald-500 text-white",
                              !isCompleted && !isCurrent && "bg-slate-200 dark:bg-slate-700 text-slate-400"
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-medium truncate",
                                isCurrent && "text-violet-900 dark:text-violet-100",
                                isCompleted && "text-slate-700 dark:text-slate-300",
                                !isCompleted && !isCurrent && "text-slate-400 dark:text-slate-500"
                              )}
                            >
                              {s.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {s.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Center: Main Content */}
            <main className="lg:col-span-9 space-y-5">
              {/* Step Header */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-xl shadow-lg",
                      step === 1 && "bg-gradient-to-br from-blue-500 to-indigo-600",
                      step === 2 && "bg-gradient-to-br from-purple-500 to-violet-600",
                      step === 3 && "bg-gradient-to-br from-emerald-500 to-teal-600",
                      step === 4 && "bg-gradient-to-br from-amber-500 to-orange-600"
                    )}
                  >
                    <StepIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Step {step} of {totalSteps}
                      </span>
                      {canProceed && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 text-xs">
                          Ready
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {currentStep.title}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <div key={step} className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                  {renderStepContent()}
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center justify-between gap-4 p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1}
                  className="h-11 px-5 rounded-xl border-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {isLastStep ? (
                  <div className="flex items-center gap-2">
                    {/* Primary: Sequential Creation */}
                    <Button
                      onClick={() => {
                        handleOpenSequentialModal();
                        handleStartSequentialCreation();
                      }}
                      disabled={!canProceed || isSequentialCreating || isCreatingCourse}
                      className={cn(
                        "h-11 px-6 rounded-xl font-semibold",
                        "bg-gradient-to-r from-violet-600 to-purple-600",
                        "hover:from-violet-700 hover:to-purple-700",
                        "shadow-lg shadow-purple-500/25",
                        "disabled:opacity-50"
                      )}
                    >
                      {isSequentialCreating ? (
                        <>
                          <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Create with SAM
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                    {/* Secondary: Legacy Quick Generation */}
                    <Button
                      variant="outline"
                      onClick={handleGenerateCourse}
                      disabled={!canProceed || isCreatingCourse || isSequentialCreating}
                      className="h-11 px-4 rounded-xl"
                      title="Quick generation (legacy)"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={cn(
                      "h-11 px-6 rounded-xl font-semibold",
                      "bg-gradient-to-r from-violet-600 to-purple-600",
                      "hover:from-violet-700 hover:to-purple-700",
                      "shadow-lg shadow-purple-500/25",
                      "disabled:opacity-50"
                    )}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>

              {!canProceed && (
                <div className="hidden lg:flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 text-sm text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  Complete all required fields to continue
                </div>
              )}
            </main>
          </div>

          {/* Mobile Navigation */}
          <MobileStepNav
            currentStep={step}
            totalSteps={totalSteps}
            canProceed={canProceed}
            isLastStep={isLastStep}
            isGenerating={isSequentialCreating || isCreatingCourse}
            onBack={handleBack}
            onNext={handleNext}
            onGenerate={() => {
              handleOpenSequentialModal();
              handleStartSequentialCreation();
            }}
            nextStepTitle={STEPS[step]?.title}
          />
        </div>
      </SamErrorBoundary>
    </AICreatorLayout>
  );
}
