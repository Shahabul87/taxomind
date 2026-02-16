"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SamErrorBoundary } from "@/components/sam/sam-error-boundary";
import {
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  RefreshCw,
  Brain,
  Users,
  GraduationCap,
  Bot,
  ChevronRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VerticalStepper } from "./components/navigation/VerticalStepper";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { AICreatorLayout } from "./_components/AICreatorLayout";

// Import modular components
import { useSamWizard } from "./hooks/use-sam-wizard";
import { CourseBasicsStep } from "./components/steps/course-basics-step";
import { TargetAudienceStep } from "./components/steps/target-audience-step";
import { CourseStructureStep } from "./components/steps/course-structure-step";
import { AdvancedSettingsStep } from "./components/steps/advanced-settings-step";
import { MobileStepNav } from "./components/navigation/MobileStepNav";
import { useSequentialCreation } from "@/hooks/use-sam-sequential-creation";

// Dynamic imports with SSR disabled to fix Radix UI hydration mismatch
// See: https://github.com/radix-ui/primitives/issues/3700
const SequentialCreationModal = dynamic(
  () => import("@/components/sam/sequential-creation-modal").then(mod => mod.SequentialCreationModal),
  { ssr: false }
);

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
  const searchParams = useSearchParams();

  const {
    step,
    totalSteps,
    formData,
    setFormData,
    validationErrors,
    lastAutoSave,
    handleNext,
    handleBack,
    resetWizard,
    goToStep,
  } = useSamWizard();

  // Pre-fill course title and overview from URL params
  // Supports: ?title=... (from Course Plan) and ?overview=... (from Skill Roadmap Journey)
  React.useEffect(() => {
    const titleParam = searchParams.get("title");
    const overviewParam = searchParams.get("overview");
    const updates: Partial<typeof formData> = {};

    if (titleParam && !formData.courseTitle) {
      updates.courseTitle = titleParam;
    }
    if (overviewParam && !formData.courseShortOverview) {
      updates.courseShortOverview = overviewParam;
    }

    if (Object.keys(updates).length > 0) {
      setFormData((prev) => ({ ...prev, ...updates }));
    }
  }, [searchParams, formData.courseTitle, formData.courseShortOverview, setFormData]);

  // Confirmation dialogs
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = React.useState(false);

  // Local validation errors (field-specific)
  const [localValidationErrors, setLocalValidationErrors] = React.useState<Record<string, string>>({});
  const mergedValidationErrors = { ...validationErrors, ...localValidationErrors };

  // Sequential Creation (3-Stage Process)
  const [isSequentialModalOpen, setIsSequentialModalOpen] = React.useState(false);
  const [createdCourseId, setCreatedCourseId] = React.useState<string | null>(null);
  const {
    progress: sequentialProgress,
    isCreating: isSequentialCreating,
    error: sequentialError,
    resumableCourseId,
    dbProgress,
    regeneratingChapterId,
    startCreation: startSequentialCreation,
    resumeCreation,
    regenerateChapter,
    cancel: cancelSequentialCreation,
    reset: resetSequentialCreation,
  } = useSequentialCreation();

  // Step validation
  const isStepValid = React.useCallback((): boolean => {
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
  }, [step, formData]);

  // Attempt to proceed with field-specific validation
  const attemptNext = React.useCallback(() => {
    if (isStepValid()) {
      setLocalValidationErrors({});
      handleNext();
      return;
    }
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.courseTitle || formData.courseTitle.length < 10)
        errors.courseTitle = "Title must be at least 10 characters";
      if (!formData.courseShortOverview || formData.courseShortOverview.length < 50)
        errors.courseShortOverview = "Overview must be at least 50 characters";
      if (!formData.courseCategory)
        errors.courseCategory = "Please select a category";
    }
    if (step === 2) {
      if (!formData.targetAudience) errors.targetAudience = "Please select a target audience";
      if (!formData.difficulty) errors.difficulty = "Please select a difficulty level";
    }
    if (step === 3) {
      if (!formData.courseGoals || formData.courseGoals.length < 2)
        errors.courseGoals = "Add at least 2 learning objectives";
      if (!formData.bloomsFocus || formData.bloomsFocus.length < 2)
        errors.bloomsFocus = "Select at least 2 cognitive levels";
    }
    setLocalValidationErrors(errors);
  }, [step, formData, handleNext, isStepValid]);

  // Clear local validation errors when form data changes
  const prevFormDataRef = React.useRef(formData);
  React.useEffect(() => {
    if (prevFormDataRef.current !== formData) {
      prevFormDataRef.current = formData;
      setLocalValidationErrors({});
    }
  }, [formData]);

  // Open sequential creation modal
  const handleOpenSequentialModal = React.useCallback(() => {
    resetSequentialCreation();
    setIsSequentialModalOpen(true);
  }, [resetSequentialCreation]);

  // Close sequential creation modal
  const handleCloseSequentialModal = React.useCallback(() => {
    if (!isSequentialCreating) {
      setIsSequentialModalOpen(false);
      resetSequentialCreation();
    }
  }, [isSequentialCreating, resetSequentialCreation]);

  // Start sequential creation process
  const handleStartSequentialCreation = React.useCallback(async () => {
    try {
      logger.info('[AI-CREATOR] Starting sequential course creation');

      const result = await startSequentialCreation({
        courseTitle: formData.courseTitle || '',
        courseDescription: formData.courseShortOverview || '',
        targetAudience: formData.targetAudience || '',
        difficulty: (formData.difficulty?.toLowerCase() || 'intermediate') as 'beginner' | 'intermediate' | 'advanced' | 'expert',
        totalChapters: formData.chapterCount,
        sectionsPerChapter: formData.sectionsPerChapter,
        learningObjectivesPerChapter: formData.learningObjectivesPerChapter,
        learningObjectivesPerSection: formData.learningObjectivesPerSection,
        courseGoals: formData.courseGoals,
        bloomsFocus: formData.bloomsFocus,
        preferredContentTypes: formData.preferredContentTypes,
        category: formData.courseCategory,
        subcategory: formData.courseSubcategory,
        courseIntent: formData.courseIntent,
        includeAssessments: formData.includeAssessments,
        duration: formData.duration,
      });

      if (result.success && result.courseId) {
        setCreatedCourseId(result.courseId);

        logger.info('[AI-CREATOR] Sequential creation completed successfully', {
          courseId: result.courseId,
          chaptersCreated: result.chaptersCreated,
          sectionsCreated: result.sectionsCreated,
        });

        toast.success('Course created successfully!', {
          description: `${result.chaptersCreated} chapters and ${result.sectionsCreated} sections created.`,
        });

        // Navigate to the created course
        setTimeout(() => {
          router.push(`/teacher/courses/${result.courseId}`);
        }, 1500);

        // Save to SAM memory
        if (typeof window !== 'undefined') {
          import('@/lib/sam/utils/sam-memory-system').then(({ samMemory }) => {
            samMemory.incrementSuccessfulGenerations();
          });
        }
      } else {
        const isCancelled = result.error?.toLowerCase().includes('cancel');
        if (isCancelled) {
          logger.info('[AI-CREATOR] Course creation was cancelled by user');
        } else {
          logger.error('[AI-CREATOR] Sequential creation failed:', result.error);
        }
        toast.error(isCancelled ? 'Course creation cancelled' : 'Course creation failed', {
          description: isCancelled ? 'You can restart generation anytime.' : (result.error || 'An unexpected error occurred'),
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isCancelled = errorMsg.toLowerCase().includes('cancel');
      if (isCancelled) {
        logger.info('[AI-CREATOR] Course creation was cancelled by user');
      } else {
        logger.error('[AI-CREATOR] Error in sequential creation:', error);
      }
      if (!isCancelled) {
        toast.error('Failed to create course');
      }
    }
  }, [formData, startSequentialCreation, router]);

  // Handle retry for sequential creation
  const handleRetrySequentialCreation = React.useCallback(() => {
    resetSequentialCreation();
    handleStartSequentialCreation();
  }, [resetSequentialCreation, handleStartSequentialCreation]);

  // Handle resume from failed creation
  const handleResumeCreation = React.useCallback(async () => {
    if (!resumableCourseId) return;

    try {
      logger.info('[AI-CREATOR] Resuming course creation', { courseId: resumableCourseId });

      const result = await resumeCreation(resumableCourseId, {
        courseTitle: formData.courseTitle || '',
        courseDescription: formData.courseShortOverview || '',
        targetAudience: formData.targetAudience || '',
        difficulty: (formData.difficulty?.toLowerCase() || 'intermediate') as 'beginner' | 'intermediate' | 'advanced' | 'expert',
        totalChapters: formData.chapterCount,
        sectionsPerChapter: formData.sectionsPerChapter,
        learningObjectivesPerChapter: formData.learningObjectivesPerChapter,
        learningObjectivesPerSection: formData.learningObjectivesPerSection,
        courseGoals: formData.courseGoals,
        bloomsFocus: formData.bloomsFocus,
        preferredContentTypes: formData.preferredContentTypes,
        category: formData.courseCategory,
        subcategory: formData.courseSubcategory,
        courseIntent: formData.courseIntent,
        includeAssessments: formData.includeAssessments,
        duration: formData.duration,
      });

      if (result.success && result.courseId) {
        toast.success('Course resumed and completed!', {
          description: `${result.chaptersCreated} chapters and ${result.sectionsCreated} sections created.`,
        });
        setTimeout(() => {
          router.push(`/teacher/courses/${result.courseId}`);
        }, 1500);
      } else {
        toast.error('Resume failed', { description: result.error || 'An unexpected error occurred' });
      }
    } catch (error) {
      logger.error('[AI-CREATOR] Error resuming creation:', error);
      toast.error('Failed to resume course creation');
    }
  }, [resumableCourseId, resumeCreation, formData, router]);

  // Handle chapter regeneration (post-creation, for low-quality chapters)
  const handleRegenerateChapter = React.useCallback((chapterId: string, position: number) => {
    if (!createdCourseId) return;
    regenerateChapter(createdCourseId, chapterId, position);
  }, [createdCourseId, regenerateChapter]);

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
          chapterCount: formData.chapterCount,
          sectionsPerChapter: formData.sectionsPerChapter,
          includeAssessments: formData.includeAssessments,
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
        if (!isLastStep) {
          attemptNext();
        } else if (canProceed && isLastStep && !isSequentialCreating) {
          setShowGenerateConfirm(true);
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
  }, [step, canProceed, isLastStep, isSequentialCreating, attemptNext, handleBack]);

  const renderStepContent = () => {
    const stepProps = {
      formData,
      setFormData,
      validationErrors: mergedValidationErrors,
      onNext: handleNext,
      onBack: handleBack,
      goToStep,
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

  return (
    <AICreatorLayout>
      <SamErrorBoundary>
        {/* Resume Banner */}
        {resumableCourseId && !isSequentialCreating && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 shadow-lg backdrop-blur-xl">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 truncate">
                  {dbProgress?.courseTitle
                    ? `Incomplete: ${dbProgress.courseTitle}`
                    : 'Incomplete course found'}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {dbProgress
                    ? `${dbProgress.completedChapters}/${dbProgress.totalChapters} chapters (${dbProgress.percentage}%)`
                    : 'Resume where you left off?'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-amber-700 dark:text-amber-300"
                  onClick={() => {
                    try { localStorage.removeItem('taxomind_partial_course'); } catch { /* */ }
                    resetSequentialCreation();
                  }}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => {
                    handleOpenSequentialModal();
                    handleResumeCreation();
                  }}
                >
                  Resume
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sequential Creation Modal (3-Stage Process) */}
        <SequentialCreationModal
          isOpen={isSequentialModalOpen}
          onClose={handleCloseSequentialModal}
          progress={sequentialProgress}
          isCreating={isSequentialCreating}
          error={sequentialError}
          onCancel={cancelSequentialCreation}
          onRetry={handleRetrySequentialCreation}
          onResume={handleResumeCreation}
          onRegenerate={handleRegenerateChapter}
          regeneratingChapterId={regeneratingChapterId}
          resumableCourseId={resumableCourseId}
          formData={{
            courseTitle: formData.courseTitle || '',
            targetAudience: formData.targetAudience,
            difficulty: formData.difficulty,
            chapterCount: formData.chapterCount,
            sectionsPerChapter: formData.sectionsPerChapter,
          }}
        />

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
                  onClick={() => setShowResetConfirm(true)}
                  className="h-9 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content - 2-column on desktop */}
          <div className="flex gap-6">
            {/* Desktop Stepper - sticky sidebar */}
            <aside className="hidden lg:block w-[280px] flex-shrink-0">
              <div className="sticky top-20">
                <VerticalStepper
                  steps={STEPS.map(s => ({ ...s, icon: <s.icon className="h-5 w-5" /> }))}
                  currentStep={step}
                  onStepClick={goToStep}
                  formData={formData}
                />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 max-w-4xl">
              <main className="space-y-5">
                {/* Step Header - visible on mobile/tablet, hidden on desktop where stepper exists */}
                <div className="lg:hidden p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
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

                {/* Navigation */}
                <div className="hidden sm:flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50">
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
                      <Button
                        onClick={() => setShowGenerateConfirm(true)}
                        disabled={!canProceed || isSequentialCreating}
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
                    ) : (
                      <Button
                        onClick={attemptNext}
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

                  {/* Keyboard shortcut hints */}
                  <div className="hidden sm:flex items-center justify-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono border border-slate-200 dark:border-slate-700">
                        {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "\u2318" : "Ctrl"}+Enter
                      </kbd>
                      Continue
                    </span>
                    <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono border border-slate-200 dark:border-slate-700">Esc</kbd>
                      Back
                    </span>
                  </div>
                </div>

                {!canProceed && Object.keys(localValidationErrors).length > 0 && (
                  <div className="space-y-1.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50">
                    {Object.values(localValidationErrors).map((msg, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                        {msg}
                      </div>
                    ))}
                  </div>
                )}
              </main>
            </div>
          </div>

          {/* Mobile Navigation */}
          <MobileStepNav
            currentStep={step}
            totalSteps={totalSteps}
            canProceed={canProceed}
            isLastStep={isLastStep}
            isGenerating={isSequentialCreating}
            onBack={handleBack}
            onNext={attemptNext}
            onGenerate={() => setShowGenerateConfirm(true)}
            nextStepTitle={STEPS[step]?.title}
          />
        </div>
        {/* Reset Confirmation Dialog */}
        <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all fields?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear your draft and all entered data. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  resetWizard();
                  setShowResetConfirm(false);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Generate Confirmation Dialog */}
        <AlertDialog open={showGenerateConfirm} onOpenChange={setShowGenerateConfirm}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Generate course?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>SAM will create your course with these settings:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <span className="text-slate-600 dark:text-slate-400">Chapters:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{formData.chapterCount}</span>
                    <span className="text-slate-600 dark:text-slate-400">Sections/chapter:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{formData.sectionsPerChapter}</span>
                    <span className="text-slate-600 dark:text-slate-400">Difficulty:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{formData.difficulty}</span>
                    <span className="text-slate-600 dark:text-slate-400">Objectives:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{formData.courseGoals.length}</span>
                    <span className="text-slate-600 dark:text-slate-400">Bloom&apos;s levels:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{formData.bloomsFocus.length}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    This process may take several minutes and uses AI credits.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowGenerateConfirm(false);
                  handleOpenSequentialModal();
                  handleStartSequentialCreation();
                }}
              >
                Start Generation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SamErrorBoundary>
    </AICreatorLayout>
  );
}
