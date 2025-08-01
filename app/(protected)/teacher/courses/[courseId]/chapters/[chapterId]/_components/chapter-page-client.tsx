"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, LayoutDashboard, Video, Brain, Sparkles, Target, Lightbulb, FileQuestion, TrendingUp, HelpCircle } from "lucide-react";
import { IconBadge } from "@/components/icon-badge";
import { Banner } from "@/components/banner";
import { ChapterTitleForm } from "./chapter-title-form";
import { ChapterDescriptionForm } from "./chapter-description-form";
import { ChapterAccessForm } from "./chapter-access-form";
import { ChapterActions } from "./chapter-actions";
import { ChapterLearningOutcomeForm } from "./chapter-learning-outcome-form";
import { ChaptersSectionForm } from "./chapter-section-form";
import { AIChapterContentGeneratorEnhanced } from "./ai-chapter-content-generator-enhanced";
import { ChapterSamIntegration } from "./chapter-sam-integration";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GuidedTour, TourStyles } from "@/components/ui/guided-tour";
import { aiChapterCreationTour } from "@/lib/tours/ai-course-creation-tour";

interface ChapterPageClientProps {
  chapter: any;
  params: { courseId: string; chapterId: string };
}

export const ChapterPageClient = ({ chapter, params }: ChapterPageClientProps) => {
  const [showTour, setShowTour] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const handleStartTour = () => {
    setShowTour(true);
  };

  const handleAIContentGenerated = (content: any) => {
    console.log('AI content generated:', content);
    // The component will refresh the page, so we don't need to do anything here
  };

  // Calculate completion status
  const hasTitle = Boolean(chapter.title);
  const hasDescription = Boolean(chapter.description);
  const hasLearningOutcomes = Boolean(chapter.learningOutcomes);
  const publishedSections = chapter.sections.filter((s: any) => s.isPublished);
  const hasPublishedSection = publishedSections.length > 0;

  const requiredFields = [hasTitle, hasDescription, hasLearningOutcomes];
  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <div className={cn(
      "min-h-screen p-6",
      "bg-gray-50 dark:bg-gray-900",
      "transition-colors duration-300"
    )}>
      <TourStyles />
      {showTour && <GuidedTour config={aiChapterCreationTour} />}
      
      {/* SAM Integration for Chapter Context */}
      <ChapterSamIntegration 
        chapter={chapter} 
        courseId={params.courseId} 
        chapterId={params.chapterId} 
      />
      
      {/* Warning Banner */}
      {!chapter.isPublished && (
        <div className="px-4 sm:px-6">
          <Banner
            variant="warning"
            label="This chapter is unpublished. It will not be visible in the course"
          />
        </div>
      )}

      <div className="p-4 sm:p-6">
        <div className="px-2">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="w-full">
              <Link
                href={`/teacher/courses/${params.courseId}`}
                className={cn(
                  "inline-flex items-center mb-6",
                  "px-4 py-2 text-sm sm:text-base font-medium",
                  "bg-white/40 dark:bg-gray-800/40",
                  "hover:bg-purple-50 dark:hover:bg-purple-500/20",
                  "text-gray-900 dark:text-gray-200",
                  "rounded-lg",
                  "border border-gray-200 dark:border-gray-700/50",
                  "transition-all duration-200",
                  "backdrop-blur-sm",
                  "shadow-lg hover:shadow-purple-500/20"
                )}
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                Back to course setup
              </Link>

              {/* Status Card */}
              <div className={cn(
                "flex flex-col sm:flex-row items-start sm:items-center justify-between",
                "w-full p-4 sm:p-6",
                "bg-white/40 dark:bg-gray-800/60",
                "border border-gray-200 dark:border-gray-700/50",
                "rounded-xl backdrop-blur-sm"
              )}>
                <div className="space-y-2 mb-5 max-w-[300px]">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                      Chapter Creation
                    </h1>
                    <Button 
                      onClick={handleStartTour}
                      variant="ghost" 
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                    >
                      <HelpCircle className="w-4 h-4 mr-1" />
                      AI Tour
                    </Button>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Complete all fields{" "}
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      {completionText}
                    </span>
                  </span>
                </div>
                <ChapterActions
                  disabled={!isComplete}
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                  isPublished={chapter.isPublished}
                />
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-8 mt-8">
            <div className="space-y-4 sm:space-y-6">
              {/* Customize Section */}
              <div className={cn(
                "p-4 sm:p-6 rounded-xl",
                "bg-white/40 dark:bg-gray-800/40",
                "border border-gray-200 dark:border-gray-700/50",
                "backdrop-blur-sm"
              )}>
                <div className="flex items-center gap-x-3 mb-6">
                  <IconBadge icon={LayoutDashboard} />
                  <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    Customize your chapter
                  </h2>
                </div>
                <div className="space-y-6">
                  <ChapterTitleForm
                    initialData={chapter}
                    courseId={params.courseId}
                    chapterId={params.chapterId}
                  />
                  <ChapterLearningOutcomeForm
                    initialData={chapter}
                    courseId={params.courseId}
                    chapterId={params.chapterId}
                  />
                  <ChapterDescriptionForm
                    initialData={chapter}
                    courseId={params.courseId}
                    chapterId={params.chapterId}
                  />
                </div>
              </div>

              {/* Smart AI Chapter Assistant - Contextual Suggestions */}
              <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-[1px] rounded-xl" data-tour="ai-chapter-assistant">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                        AI Chapter Assistant
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Smart suggestions based on your chapter progress
                      </p>
                    </div>
                  </div>

                  {/* Context-Aware Suggestions */}
                  <div className="space-y-4" data-tour="progressive-suggestions">
                    {/* Basic Info Completion Suggestions */}
                    {!chapter.title || !chapter.description ? (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-700">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                              Complete Your Chapter Basics
                            </h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                              {!chapter.title ? "Add a compelling chapter title. " : ""}
                              {!chapter.description ? "Write a clear description of what students will learn." : ""}
                            </p>
                            <Button 
                              size="sm" 
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                              data-tour="ai-writing-help"
                              onClick={() => setShowAIGenerator(true)}
                            >
                              <Sparkles className="w-4 h-4 mr-1" />
                              Get AI Writing Help
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : chapter.sections.length === 0 ? (
                      // Chapter basics are complete, suggest section creation
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                        <div className="flex items-start gap-3">
                          <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                              Ready to Add Learning Content?
                            </h4>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                              Great start! Now let&apos;s create sections with videos, articles, and assessments. AI can help generate a complete content structure.
                            </p>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                data-tour="ai-section-builder"
                                onClick={() => setShowAIGenerator(true)}
                              >
                                <Brain className="w-4 h-4 mr-1" />
                                AI Section Builder
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                              >
                                Manual Creation
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : chapter.sections.length > 0 && chapter.sections.length < 3 ? (
                      // Has some sections but could use more
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                              Expand Your Chapter Content
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                              You have {chapter.sections.length} section{chapter.sections.length !== 1 ? 's' : ''}. Consider adding more diverse content types and assessments for better learning outcomes.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/30"
                              >
                                <FileQuestion className="w-4 h-4 mr-1" />
                                Add Assessment
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/30"
                                onClick={() => setShowAIGenerator(true)}
                              >
                                <Sparkles className="w-4 h-4 mr-1" />
                                AI Content Ideas
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Chapter is well-developed, suggest optimization
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="flex items-start gap-3">
                          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                              Optimize with Advanced AI Features
                            </h4>
                            <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                              Excellent progress! Your chapter has {chapter.sections.length} sections. Use AI to enhance learning outcomes with analytics and personalization.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/30"
                              >
                                <Target className="w-4 h-4 mr-1" />
                                Analytics Setup
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/30"
                              >
                                <Lightbulb className="w-4 h-4 mr-1" />
                                AI Optimization
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick AI Actions */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Quick AI-powered actions for this chapter:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2" data-tour="quick-ai-tools">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-xs hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          onClick={() => setShowAIGenerator(true)}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Content Ideas
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          onClick={() => setShowAIGenerator(true)}
                        >
                          <FileQuestion className="w-3 h-3 mr-1" />
                          Quiz Generator
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-xs hover:bg-purple-50 dark:hover:bg-purple-950/20"
                          onClick={() => setShowAIGenerator(true)}
                        >
                          <Target className="w-3 h-3 mr-1" />
                          Learning Goals
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-xs hover:bg-orange-50 dark:hover:bg-orange-950/20"
                          onClick={() => setShowAIGenerator(true)}
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Progress Check
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Access Settings */}
              <div className={cn(
                "p-4 sm:p-6 rounded-xl",
                "bg-white/40 dark:bg-gray-800/40",
                "border border-gray-200 dark:border-gray-700/50",
                "backdrop-blur-sm"
              )}>
                <div className="flex items-center gap-x-3 mb-6">
                  <IconBadge icon={Eye} />
                  <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    Access Settings
                  </h2>
                </div>
                <ChapterAccessForm
                  initialData={chapter}
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                />
              </div>
            </div>

            {/* Sections */}
            <div className={cn(
              "p-4 sm:p-6 rounded-xl",
              "bg-white/40 dark:bg-gray-800/40",
              "border border-gray-200 dark:border-gray-700/50",
              "backdrop-blur-sm"
            )}>
              <div className="flex items-center gap-x-3 mb-6">
                <IconBadge icon={Video} />
                <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Chapter Sections
                </h2>
              </div>
              <ChaptersSectionForm
                chapter={chapter}
                courseId={params.courseId}
                chapterId={params.chapterId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Chapter Content Generator Modal - Enhanced with SAM */}
      <AIChapterContentGeneratorEnhanced
        open={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        chapter={chapter}
        onContentGenerated={handleAIContentGenerated}
      />
    </div>
  );
};