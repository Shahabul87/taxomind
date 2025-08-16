"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StreamingGenerationModal } from "@/components/course-creation/streaming-generation-modal";
import { SamErrorBoundary } from "@/components/ui/sam-error-boundary";
import { ArrowRight, ArrowLeft, Sparkles, Home, AlertTriangle, BookOpen, RefreshCw, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from '@/lib/logger';

// Import modular components
import { useSamWizard } from "./hooks/use-sam-wizard";
import { useSamCompleteGeneration, useSamContextGathering } from "./hooks/use-sam-complete-generation";
// Note: samMemory imported dynamically to avoid SSR issues
import { CourseBasicsStep } from "./components/steps/course-basics-step";
import { TargetAudienceStep } from "./components/steps/target-audience-step";
import { CourseStructureStep } from "./components/steps/course-structure-step";
import { AdvancedSettingsStep } from "./components/steps/advanced-settings-step";
import { SamAssistantPanel } from "./components/sam-wizard/sam-assistant-panel";
import { SimpleProgressTracker } from "./components/sam-wizard/simple-progress-tracker";
import { CourseScoringPanel } from "./components/course-scoring-panel";
import { SamLearningDesignAssistance } from "./components/sam-learning-design-assistance";
import { SAMCompleteGenerationModal } from "./components/sam-complete-generation-modal";

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
            import('@/lib/sam-memory-system').then(({ samMemory }) => {
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
      
    } catch (error) {
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
            } catch (error) {
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
        import('@/lib/sam-memory-system').then(({ samMemory }) => {
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
      
    } catch (error) {
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
      import('@/lib/sam-memory-system').then(({ samMemory }) => {
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
      import('@/lib/sam-memory-system').then(({ samMemory }) => {
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
      import('@/lib/sam-memory-system').then(({ samMemory }) => {
        samMemory.startSession('ai-course-creator');
        samMemory.updateCurrentPage(`ai-creator-step-${step}`);
      });
    }
  }, [step]);

  // Update current step in SAM memory
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/lib/sam-memory-system').then(({ samMemory }) => {
        samMemory.updateCurrentPage(`ai-creator-step-${step}`);
      });
    }
  }, [step]);

  // Step validation
  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.courseTitle?.length >= 10 && 
               formData.courseShortOverview?.length >= 50 && 
               formData.courseCategory;
      case 2:
        return formData.targetAudience && formData.difficulty;
      case 3:
        return formData.courseGoals?.length >= 2 && 
               formData.bloomsFocus?.length >= 2;
      case 4:
        // Final review - check if all previous steps are valid
        return formData.courseTitle?.length >= 10 && 
               formData.courseShortOverview?.length >= 50 && 
               formData.courseCategory &&
               formData.targetAudience && 
               formData.difficulty &&
               formData.courseGoals?.length >= 2 && 
               formData.bloomsFocus?.length >= 2;
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

  return (
    <SamErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4 relative">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Sam AI Course Creator
              </h1>
              
              {/* Controls - Top Right */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {/* Auto-save Status */}
                {lastAutoSave && (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded border border-white/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Saved {new Date(lastAutoSave).toLocaleTimeString()}</span>
                  </div>
                )}
                
                {/* Start Over Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetWizard}
                  className="bg-white/70 dark:bg-slate-800/70 border-white/40 dark:border-slate-700/40 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Create professional courses with AI assistance. Sam will guide you through each step 
              and help optimize your content for maximum learning impact.
            </p>
          </div>

          {/* Main Content Layout - Conditional Layout Based on Step */}
          <div className={cn(
            "gap-6 xl:gap-8 w-full max-w-none px-4 sm:px-6 lg:px-8",
            step === 4 
              ? "grid grid-cols-1 lg:grid-cols-4" // 3/4 + 1/4 layout for Final Review
              : "grid grid-cols-1 lg:grid-cols-2" // Normal 1/2 + 1/2 layout for other steps
          )}>
            {/* Course Basics - Left Column - Takes 3/4 width on step 4, 1/2 width on other steps */}
            <div className={cn(
              "space-y-6",
              step === 4 ? "lg:col-span-3" : ""
            )}>
              {/* Course Basics Header */}
              <Card className="p-6 backdrop-blur-md bg-gradient-to-r from-white/70 to-blue-50/70 dark:from-slate-900/70 dark:to-blue-950/70 border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {STEP_TITLES[step - 1]}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      {STEP_DESCRIPTIONS[step - 1]}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      Step {step} of {totalSteps}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {Math.round(((step - 1) / (totalSteps - 1)) * 100)}% Complete
                    </div>
                  </div>
                </div>
                
                {/* Step Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span>Current Step Progress</span>
                    <span>{Math.round(((step - 1) / (totalSteps - 1)) * 100)}%</span>
                  </div>
                  <Progress 
                    value={((step - 1) / (totalSteps - 1)) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Quick Step Navigation */}
                <div className="flex gap-2">
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 h-2 rounded-full transition-all duration-300",
                        i + 1 === step
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                          : i + 1 < step
                          ? 'bg-green-400'
                          : 'bg-slate-300 dark:bg-slate-600'
                      )}
                    />
                  ))}
                </div>
              </Card>

              {/* Enhanced Step Content with animations */}
              <Card className="p-6 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-white/20 shadow-xl transition-all duration-500 ease-out">
                <div 
                  key={step} 
                  className="animate-in fade-in-50 slide-in-from-left-5 duration-500"
                >
                  {renderStepContent()}
                </div>
              </Card>

              {/* Enhanced Navigation */}
              <Card className="p-5 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-white/20 shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1}
                    className={cn(
                      "bg-white/70 dark:bg-slate-800/70 border-white/40 dark:border-slate-700/40 shadow-md transition-all duration-200",
                      "hover:bg-white/90 dark:hover:bg-slate-800/90 hover:scale-105 hover:shadow-lg",
                      step === 1 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Step {step} of {totalSteps}
                      </span>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {Math.round(((step - 1) / (totalSteps - 1)) * 100)}% Complete
                      </div>
                    </div>
                  </div>

                  {isLastStep ? (
                    <Button
                      onClick={handleGenerateCompleteeCourse}
                      disabled={!canProceed || isCreatingCourse}
                      className={cn(
                        "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600",
                        "shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                        isCreatingCourse && "animate-pulse"
                      )}
                    >
                      {isCreatingCourse ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                          Creating Course...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Course
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed}
                      className={cn(
                        "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600",
                        "shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      )}
                    >
                      Continue to {STEP_TITLES[step] || 'Next Step'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
                
                {/* Progress hint */}
                {!canProceed && (
                  <div className="mt-3 pt-3 border-t border-white/20 dark:border-slate-700/30">
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Please complete all required fields to continue</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Course Scoring & AI Assistant - Right Column - Takes 1/4 width on step 4, 1/2 width on other steps */}
            <div className={cn(
              "space-y-4 transition-all duration-500 ease-out",
              step === 4 ? "lg:col-span-1" : ""
            )}>
              <SamAssistantPanel
                suggestion={samSuggestion}
                isLoading={isLoadingSuggestion}
                onRefresh={handleRefreshSuggestion}
                className="transition-all duration-300 ease-out"
              />
              
              {/* Course Scoring Panel - Only show on step 1 */}
              {step === 1 && (
                <CourseScoringPanel
                  formData={formData}
                  onUpdateFormData={setFormData}
                  className="transition-all duration-300 ease-out"
                />
              )}
              
              {/* SAM Learning Design Assistance - Only show on step 3 */}
              {step === 3 && (
                <SamLearningDesignAssistance
                  formData={formData}
                  onUpdateFormData={setFormData}
                  className="transition-all duration-300 ease-out"
                />
              )}
            </div>
          </div>
        </div>

        {/* Note: Removed old generation modals - now using unified course creation */}
      </div>
    </SamErrorBoundary>
  );
}