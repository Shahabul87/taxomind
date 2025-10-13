"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, LayoutDashboard, Video, Brain, Sparkles, Target, Lightbulb, Code2, FileQuestion, TrendingUp, HelpCircle, BookOpen, FileText } from "lucide-react";
import { IconBadge } from "@/components/icon-badge";
import { Banner } from "@/components/banner";
import { SectionTitleForm } from "./section-title-form";
import { SectionAccessForm } from "./section-access-form";
import { SectionYoutubeVideoForm } from "./section-video-form";
import { SectionActions } from "./sections-actions";
import { TabsContainer } from "./TabsContainer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SectionPageClientProps } from "./enterprise-section-types";

export const SectionPageClient = ({ section, chapter, params }: SectionPageClientProps) => {
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Calculate completion status
  const hasTitle = Boolean(section.title);
  const hasVideo = Boolean(section.videoUrl);
  const hasCodeExplanations = section.codeExplanations && section.codeExplanations.length > 0;
  const hasMathExplanations = section.mathExplanations && section.mathExplanations.length > 0;
  const hasResources = (section.videos && section.videos.length > 0) ||
                       (section.blogs && section.blogs.length > 0) ||
                       (section.articles && section.articles.length > 0);

  const requiredFields = [hasTitle, hasVideo];
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
      {/* Warning Banner */}
      {!section.isPublished && (
        <div className="px-4 sm:px-6">
          <Banner
            variant="warning"
            label="This section is unpublished. It will not be visible in the course"
          />
        </div>
      )}

      <div className="p-4 sm:p-6">
        <div className="px-2">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="w-full">
              <Link
                href={`/teacher/courses/${params.courseId}/chapters/${params.chapterId}`}
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
                Back to chapter
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
                  <h1 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                    Section Creation
                  </h1>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Complete all fields{" "}
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      {completionText}
                    </span>
                  </span>
                </div>
                <SectionActions
                  disabled={!isComplete}
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                  sectionId={params.sectionId}
                  isPublished={section.isPublished}
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
                    Customize your section
                  </h2>
                </div>
                <div className="space-y-6">
                  <SectionTitleForm
                    initialData={section}
                    courseId={params.courseId}
                    chapterId={params.chapterId}
                    sectionId={params.sectionId}
                  />
                  <SectionAccessForm
                    initialData={section}
                    courseId={params.courseId}
                    chapterId={params.chapterId}
                    sectionId={params.sectionId}
                  />
                </div>
              </div>

              {/* Smart AI Section Assistant */}
              <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-[1px] rounded-xl">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                        AI Section Assistant
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Smart suggestions based on your section progress
                      </p>
                    </div>
                  </div>

                  {/* Context-Aware Suggestions */}
                  <div className="space-y-4">
                    {/* Basic Info Completion Suggestions */}
                    {!section.title || !section.videoUrl ? (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-700">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                              Complete Your Section Basics
                            </h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                              {!section.title ? "Add a clear section title. " : ""}
                              {!section.videoUrl ? "Add a video to explain this section." : ""}
                            </p>
                            <Button
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              <Sparkles className="w-4 h-4 mr-1" />
                              Get AI Help
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : !hasCodeExplanations && !hasMathExplanations ? (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                        <div className="flex items-start gap-3">
                          <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                              Add Interactive Content
                            </h4>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                              Great start! Now add code explanations, math equations, or practice exercises to enhance learning.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <Code2 className="w-4 h-4 mr-1" />
                                Add Code
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                              >
                                <FileQuestion className="w-4 h-4 mr-1" />
                                Add Math
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : !hasResources ? (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                              Add Learning Resources
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                              Enhance learning by adding supplementary videos, articles, or blog posts.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/30"
                              >
                                <Video className="w-4 h-4 mr-1" />
                                Add Video
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/30"
                              >
                                <BookOpen className="w-4 h-4 mr-1" />
                                Add Article
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="flex items-start gap-3">
                          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                              Section Looking Great!
                            </h4>
                            <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                              Excellent progress! Your section has comprehensive content. Consider adding assessments to test understanding.
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/30"
                            >
                              <FileQuestion className="w-4 h-4 mr-1" />
                              Add Assessment
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Section content overview:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-xs text-gray-600 dark:text-gray-400">Code Blocks</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {section.codeExplanations?.length || 0}
                          </div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-xs text-gray-600 dark:text-gray-400">Math Equations</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {section.mathExplanations?.length || 0}
                          </div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-xs text-gray-600 dark:text-gray-400">Videos</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {section.videos?.length || 0}
                          </div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-xs text-gray-600 dark:text-gray-400">Resources</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {(section.blogs?.length || 0) + (section.articles?.length || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video and Interactive Content */}
            <div className="space-y-4 sm:space-y-6">
              {/* Section Video */}
              <div className={cn(
                "p-4 sm:p-6 rounded-xl",
                "bg-white/40 dark:bg-gray-800/40",
                "border border-gray-200 dark:border-gray-700/50",
                "backdrop-blur-sm"
              )}>
                <div className="flex items-center gap-x-3 mb-6">
                  <IconBadge icon={Video} />
                  <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    Section Video
                  </h2>
                </div>
                <SectionYoutubeVideoForm
                  initialData={{ videoUrl: section.videoUrl ?? null }}
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                  sectionId={params.sectionId}
                />
              </div>

              {/* Interactive Learning Content */}
              <div className={cn(
                "p-4 sm:p-6 rounded-xl",
                "bg-white/40 dark:bg-gray-800/40",
                "border border-gray-200 dark:border-gray-700/50",
                "backdrop-blur-sm"
              )}>
                <div className="flex items-center gap-x-3 mb-6">
                  <IconBadge icon={Brain} />
                  <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    Interactive Content
                  </h2>
                </div>
                <TabsContainer
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                  sectionId={params.sectionId}
                  initialData={{
                    chapter: {
                      id: chapter.id,
                      title: chapter.title,
                      sections: []
                    },
                    codeExplanations: section.codeExplanations || [],
                    mathExplanations: section.mathExplanations || [],
                    videos: (section.videos || []).map(v => ({ ...v })),
                    blogs: (section.blogs || []).map(b => ({ ...b })),
                    articles: (section.articles || []).map(a => ({ ...a })),
                    notes: (section.notes || []).map(n => ({ ...n }))
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
