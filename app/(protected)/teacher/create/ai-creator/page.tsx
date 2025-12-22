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
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { AICreatorLayout } from "./_components/AICreatorLayout";

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
import { CourseScoringPanel } from "./components/course-scoring-panel";
import { SamLearningDesignAssistance } from "./components/sam-learning-design-assistance";
import { MobileStepNav } from "./components/navigation/MobileStepNav";

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

const STEP_TIPS: Record<number, { title: string; tips: string[] }> = {
  1: {
    title: "Foundation Tips",
    tips: [
      "Use specific, outcome-focused titles",
      "Highlight the transformation students will experience",
      "Choose categories where your ideal students search",
    ],
  },
  2: {
    title: "Audience Tips",
    tips: [
      "Be specific about who this course is for",
      "Consider prerequisite knowledge needed",
      "Match difficulty to your target learners",
    ],
  },
  3: {
    title: "Design Tips",
    tips: [
      "Set 3-5 clear, measurable learning objectives",
      "Use Bloom's taxonomy for cognitive progression",
      "Balance theory with practical application",
    ],
  },
  4: {
    title: "Final Check",
    tips: [
      "Review all sections for completeness",
      "Ensure objectives align with content",
      "SAM will generate chapters based on your inputs",
    ],
  },
};

export default function AICreatorPage() {
  const router = useRouter();
  const [isCreatingCourse, setIsCreatingCourse] = React.useState(false);

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

  const { generateCompleteStructure } = useSamCompleteGeneration();
  const { gatherSamContext } = useSamContextGathering();

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

  // Course generation handler
  const handleGenerateCourse = React.useCallback(async () => {
    setIsCreatingCourse(true);

    try {
      const courseData = {
        title: formData.courseTitle,
        description: formData.courseShortOverview,
        learningObjectives: formData.courseGoals || [],
      };

      const courseResponse = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      });

      if (!courseResponse.ok) {
        const errorText = await courseResponse.text();
        throw new Error(`Failed to create course: ${courseResponse.status}`);
      }

      const course = await courseResponse.json();

      // Generate chapters using SAM AI
      const chaptersResponse = await fetch("/api/sam/ai-tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate ${formData.chapterCount || 5} comprehensive chapter titles for: "${formData.courseTitle}"

Course Details:
- Description: ${formData.courseShortOverview}
- Category: ${formData.courseCategory}
- Target Audience: ${formData.targetAudience}
- Difficulty: ${formData.difficulty}
- Learning Objectives: ${formData.courseGoals?.join(", ") || "Not specified"}

Generate exactly ${formData.chapterCount || 5} chapter titles that follow a logical progression.

Format as:
1. [Chapter Title]
2. [Chapter Title]
etc.`,
          context: {
            pageData: { pageType: "course_creation", title: "Chapter Generation", forms: [] },
            learningContext: { userRole: "teacher", courseCreationMode: true },
            gamificationState: {},
            tutorPersonality: { tone: "encouraging", teachingMethod: "direct" },
            emotion: "engaged",
          },
        }),
      });

      let successfulChapters: unknown[] = [];

      if (chaptersResponse.ok) {
        const chaptersResult = await chaptersResponse.json();
        const chapterMatches = chaptersResult.response.match(/\d+\.\s*(.+)/g);

        if (chapterMatches && chapterMatches.length > 0) {
          const chapterPromises = chapterMatches
            .slice(0, formData.chapterCount || 5)
            .map(async (match: string, index: number) => {
              const title = match.replace(/^\d+\.\s*/, "").trim();
              try {
                const chapterResponse = await fetch(`/api/courses/${course.id}/chapters`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title, position: index + 1 }),
                });
                if (chapterResponse.ok) return await chapterResponse.json();
              } catch (error) {
                logger.error(`Error creating chapter: ${title}`, error);
              }
              return null;
            });

          const createdChapters = await Promise.all(chapterPromises);
          successfulChapters = createdChapters.filter((chapter) => chapter !== null);
        }
      }

      // Save to SAM memory
      if (typeof window !== "undefined") {
        import("@/lib/sam/utils/sam-memory-system").then(({ samMemory }) => {
          samMemory.saveGeneratedStructure({
            courseDescription: formData.courseShortOverview,
            enhancedObjectives: formData.courseGoals || [],
            chapters: [],
            generationMethod: "manual",
          });
          samMemory.incrementSuccessfulGenerations();
        });
      }

      toast.success(`Course "${course.title}" created with ${successfulChapters.length} chapters!`);
      router.push(`/teacher/courses/${course.id}`);
    } catch (error) {
      logger.error("Error creating course:", error);
      toast.error("Failed to create course. Please try again.");
    } finally {
      setIsCreatingCourse(false);
    }
  }, [formData, router]);

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
  const currentTips = STEP_TIPS[step];

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          if (canProceed && !isLastStep) handleNext();
          else if (canProceed && isLastStep && !isCreatingCourse) handleGenerateCourse();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (canProceed && !isLastStep) handleNext();
        else if (canProceed && isLastStep && !isCreatingCourse) handleGenerateCourse();
      }

      if (e.key === "Escape" && step > 1) {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, canProceed, isLastStep, isCreatingCourse, handleNext, handleBack, handleGenerateCourse]);

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

  return (
    <AICreatorLayout>
      <SamErrorBoundary>
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
            <main className="lg:col-span-6 space-y-5">
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
                  <Button
                    onClick={handleGenerateCourse}
                    disabled={!canProceed || isCreatingCourse}
                    className={cn(
                      "h-11 px-6 rounded-xl font-semibold",
                      "bg-gradient-to-r from-violet-600 to-purple-600",
                      "hover:from-violet-700 hover:to-purple-700",
                      "shadow-lg shadow-purple-500/25",
                      "disabled:opacity-50"
                    )}
                  >
                    {isCreatingCourse ? (
                      <>
                        <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create Course
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
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

            {/* Right: Contextual Help */}
            <aside className="lg:col-span-3 space-y-5">
              <div className="lg:sticky lg:top-8 space-y-5">
                {/* Scoring Panel for Step 1 */}
                {step === 1 && (
                  <CourseScoringPanel formData={formData} onUpdateFormData={setFormData} />
                )}

                {/* Learning Design for Step 3 */}
                {step === 3 && (
                  <SamLearningDesignAssistance formData={formData} onUpdateFormData={setFormData} />
                )}

                {/* Contextual Tips */}
                <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                      <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {currentTips.title}
                    </h4>
                  </div>
                  <ul className="space-y-2.5">
                    {currentTips.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                        <ChevronRight className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="hidden xl:block p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Keyboard shortcuts
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Next step</span>
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-[10px] font-mono border">
                        ⌘↵
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Go back</span>
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-[10px] font-mono border">
                        Esc
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Mobile Navigation */}
          <MobileStepNav
            currentStep={step}
            totalSteps={totalSteps}
            canProceed={canProceed}
            isLastStep={isLastStep}
            isGenerating={isCreatingCourse}
            onBack={handleBack}
            onNext={handleNext}
            onGenerate={handleGenerateCourse}
            nextStepTitle={STEPS[step]?.title}
          />
        </div>
      </SamErrorBoundary>
    </AICreatorLayout>
  );
}
