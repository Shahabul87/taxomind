"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StreamingGenerationModal } from "@/components/course-creation/streaming-generation-modal";
import { SamErrorBoundary } from "@/sam/components/ui/sam-error-boundary";
import { ArrowRight, ArrowLeft, Sparkles, Home, AlertTriangle, BookOpen, RefreshCw, Brain, Target, Users, GraduationCap } from "lucide-react";
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
import { SimpleProgressTracker } from "./components/sam-wizard/simple-progress-tracker";
import { CourseScoringPanel } from "./components/course-scoring-panel";
import { SamLearningDesignAssistance } from "./components/sam-learning-design-assistance";
import { SAMCompleteGenerationModal } from "./components/sam-complete-generation-modal";
import { VerticalStepper } from "./components/navigation/VerticalStepper";
import { MobileStepNav } from "./components/navigation/MobileStepNav";

const STEP_TITLES = [
  "Course Basics",
  "Target Audience", 
  "Course Structure",
  "Final Review"
];

const STEP_DESCRIPTIONS = [
  "Let's start with the foundation of your course",
  "Who are you creating this course for?",
  "Design the structure and learning path",
  "Review everything and generate your course"
];

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
      
    } catch (error: any) {
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
  const handleGenerateCompleteeCourse = async () => {
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
            } catch (error: any) {
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
      
    } catch (error: any) {
      logger.error('Error creating course:', error);
      toast.error('Failed to create course. Please try again.');
    } finally {
      setIsCreatingCourse(false);
    }
  };

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

  return (
    <AICreatorLayout>
      <SamErrorBoundary>
        <div className="container mx-auto px-2 sm:px-3 md:px-4 py-4 sm:py-6 md:py-8 pb-40 sm:pb-44 md:pb-8 max-w-[1600px]">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12">
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 md:gap-3 mb-2.5 sm:mb-3 md:mb-4">
              <div className="p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent break-words">
                AI Course Creator
              </h1>
            </div>
            <p className="text-xs sm:text-sm md:text-sm lg:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto px-2 break-words">
              Create professional courses with AI assistance. Sam will guide you through each step
              and help optimize your content for maximum learning impact.
            </p>

            {/* Top Actions Bar - Mobile and Desktop */}
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-center gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-5 md:mt-6 px-2">
              {lastAutoSave && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs text-emerald-600 dark:text-emerald-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm w-full xs:w-auto justify-center xs:justify-start">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <span className="truncate">Auto-saved {new Date(lastAutoSave).toLocaleTimeString()}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={resetWizard}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 h-9 sm:h-10 text-xs sm:text-sm w-full xs:w-auto"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Start Over
              </Button>
            </div>
          </div>

          {/* Main Content Layout - 3 Column Grid for Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {/* Left Sidebar - Vertical Stepper (Desktop Only) */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-8">
                <VerticalStepper
                  steps={stepperSteps}
                  currentStep={step}
                  onStepClick={(newStep) => {
                    if (newStep < step) {
                      // Allow going back to previous steps
                      while (step > newStep) {
                        handleBack();
                      }
                    }
                  }}
                />
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="lg:col-span-6 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
              {/* Step Header Card */}
              <Card className="p-4 sm:p-5 md:p-6 lg:p-7 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 break-words">
                      {STEP_TITLES[step - 1]}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 break-words">
                      {STEP_DESCRIPTIONS[step - 1]}
                    </p>
                  </div>

                  {/* Mobile: Step Indicator */}
                  <div className="lg:hidden text-right flex-shrink-0">
                    <div className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400">
                      {step}/{totalSteps}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Step Content */}
              <Card className="p-3 sm:p-4 md:p-5 lg:p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl hover:shadow-xl transition-all duration-300">
                <div key={step} className="animate-in fade-in-50 duration-300">
                  {renderStepContent()}
                </div>
              </Card>

              {/* Desktop Navigation */}
              <Card className="hidden lg:block p-4 md:p-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1}
                    className={cn(
                      "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-700",
                      "hover:bg-slate-50 dark:hover:bg-slate-700",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "h-9 sm:h-10 text-xs sm:text-sm"
                    )}
                  >
                    <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Back
                  </Button>

                  {isLastStep ? (
                    <Button
                      onClick={handleGenerateCompleteeCourse}
                      disabled={!canProceed || isCreatingCourse}
                      className={cn(
                        "bg-gradient-to-r from-blue-500 to-indigo-500",
                        "hover:from-indigo-700 hover:to-purple-700",
                        "text-white font-semibold shadow-lg hover:shadow-xl",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        isCreatingCourse && "animate-pulse",
                        "h-9 sm:h-10 text-xs sm:text-sm"
                      )}
                    >
                      {isCreatingCourse ? (
                        <>
                          <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating Course...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          Generate Course
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed}
                      className={cn(
                        "bg-gradient-to-r from-blue-500 to-indigo-500",
                        "hover:from-indigo-700 hover:to-purple-700",
                        "text-white font-semibold shadow-lg hover:shadow-xl",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "h-9 sm:h-10 text-xs sm:text-sm"
                      )}
                    >
                      Continue
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2" />
                    </Button>
                  )}
                </div>

                {!canProceed && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs text-amber-600 dark:text-amber-500">
                      <AlertTriangle className="h-3 w-3 xs:h-3.5 xs:w-3.5 flex-shrink-0" />
                      <span className="break-words">Complete all required fields to continue</span>
                    </div>
                  </div>
                )}
              </Card>
            </main>

            {/* Right Sidebar - Context Panels (SAM Assistant now global) */}
            <aside className="lg:col-span-3 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
              <div className="lg:sticky lg:top-8 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
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