"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  LayoutDashboard,
  Video,
  Target,
  BookOpen,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Info,
  Activity,
  FileText,
  ListChecks
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Chapter, Section } from "@prisma/client";
import { IconBadge } from "@/components/icon-badge";
import { Banner } from "@/components/banner";
import { ChapterTitleForm } from "./chapter-title-form";
import { ChapterDescriptionForm } from "./chapter-description-form";
import { ChapterAccessForm } from "./chapter-access-form";
import { ChapterActions } from "./chapter-actions";
import { ChapterLearningOutcomeForm } from "./chapter-learning-outcome-form";
import { ChaptersSectionForm } from "./chapter-section-form";
// SAM Integration removed - using global SAM assistant instead
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface ChapterPageClientProps {
  chapter: Chapter & {
    sections: Section[];
    course: {
      title: string;
      description: string | null;
      whatYouWillLearn: string[];
      courseGoals: string | null;
      difficulty: string | null;
      category: {
        name: string;
      } | null;
    };
  };
  params: { courseId: string; chapterId: string };
}

interface ContentStatistics {
  totalSections: number;
  publishedSections: number;
  freeSections: number;
  completionPercentage: number;
  requiredFieldsCompleted: number;
  totalRequiredFields: number;
}

export const EnterpriseChapterPageClient = ({ chapter, params }: ChapterPageClientProps) => {
  const [activeMetricView, setActiveMetricView] = useState<'overview' | 'detailed'>('overview');

  // Create course context for AI generation
  const courseContext = useMemo(() => ({
    title: chapter.course.title,
    description: chapter.course.description,
    whatYouWillLearn: chapter.course.whatYouWillLearn,
    courseGoals: chapter.course.courseGoals,
    difficulty: chapter.course.difficulty,
    category: chapter.course.category?.name ?? null,
  }), [chapter.course]);

  // Calculate comprehensive content statistics
  const contentStats: ContentStatistics = useMemo(() => {
    const hasTitle = Boolean(chapter.title);
    const hasDescription = Boolean(chapter.description);
    const hasLearningOutcomes = Boolean(chapter.learningOutcomes);
    const publishedSections = chapter.sections.filter((s: Section) => s.isPublished);
    const freeSections = chapter.sections.filter((s: Section) => s.isFree);

    const requiredFields = [hasTitle, hasDescription, hasLearningOutcomes];
    const totalFields = requiredFields.length;
    const completedFields = requiredFields.filter(Boolean).length;

    return {
      totalSections: chapter.sections.length,
      publishedSections: publishedSections.length,
      freeSections: freeSections.length,
      completionPercentage: Math.round((completedFields / totalFields) * 100),
      requiredFieldsCompleted: completedFields,
      totalRequiredFields: totalFields
    };
  }, [chapter]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Global SAM Assistant is available via the floating button */}

        {/* Enterprise Header with Status Bar */}
        <div className="sticky top-0 z-40 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
          <div className="w-full px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-2.5 sm:py-3">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm overflow-x-auto w-full sm:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-3 sm:mx-0 px-3 sm:px-0">
                <Link href="/teacher/courses" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors whitespace-nowrap flex-shrink-0">
                  Courses
                </Link>
                <span className="text-gray-400 dark:text-gray-600 flex-shrink-0">/</span>
                <Link href={`/teacher/courses/${params.courseId}`} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors truncate max-w-[120px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-none flex-shrink-0">
                  {chapter.course.title}
                </Link>
                <span className="text-gray-400 dark:text-gray-600 flex-shrink-0">/</span>
                <span className="text-gray-900 dark:text-gray-200 font-medium truncate max-w-[120px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-none flex-shrink-0">{chapter.title || 'New Chapter'}</span>
              </nav>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/courses/${params.courseId}/learn/${params.chapterId}`} className="flex-shrink-0">
                      <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm">
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline sm:inline">Preview</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Preview Chapter as Student</TooltipContent>
                </Tooltip>

                <Badge variant={chapter.isPublished ? "default" : "secondary"} className="gap-1 text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 flex-shrink-0">
                  <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="whitespace-nowrap">{chapter.isPublished ? 'Published' : 'Draft'}</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-0.5 sm:h-1 bg-gray-200 dark:bg-gray-800">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${contentStats.completionPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Warning Banner for Unpublished Content */}
        <AnimatePresence>
          {!chapter.isPublished && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 pt-2 sm:pt-4"
            >
              <Banner
                variant="warning"
                label="This chapter is unpublished and not visible to students. Complete all required fields and publish when ready."
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="w-full px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-4 sm:py-6">
          {/* Page Header with Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 md:mb-8"
          >
            <Card className="shadow-xl border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-800/60 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-5 md:p-6 pb-4 sm:pb-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5 md:gap-6">
                  <div className="space-y-3 sm:space-y-3.5 flex-1 min-w-0">
                    <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2.5 sm:gap-3">
                      <Link
                        href={`/teacher/courses/${params.courseId}`}
                        className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-1.5" />
                        <span className="hidden xs:inline sm:inline">Back to Course</span>
                        <span className="xs:hidden">Back</span>
                      </Link>
                      {chapter.isFree && (
                        <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1 flex-shrink-0">
                          <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="whitespace-nowrap">Free Preview</span>
                        </Badge>
                      )}
                    </div>

                    <div className="min-w-0">
                      <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 dark:from-purple-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent break-words">
                        Chapter Configuration
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm md:text-base mt-1.5 sm:mt-2 hidden sm:block">
                        Build comprehensive chapter content with sections and learning materials
                      </CardDescription>
                      <CardDescription className="text-xs mt-1.5 sm:hidden">
                        Build chapter content
                      </CardDescription>
                    </div>
                  </div>

                  {/* Completion Metrics */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2.5 md:gap-3 lg:gap-4 flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                        {contentStats.completionPercentage}%
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {contentStats.requiredFieldsCompleted}/{contentStats.totalRequiredFields} Required Fields
                      </div>
                    </div>

                    <div className="w-full sm:w-auto">
                      <ChapterActions
                        disabled={contentStats.completionPercentage < 100}
                        courseId={params.courseId}
                        chapterId={params.chapterId}
                        isPublished={chapter.isPublished}
                      />
                    </div>
                  </div>
                </div>

                {/* Content Metrics Dashboard */}
                <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 md:pt-6 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
                    <h4 className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Content Analytics
                    </h4>
                    <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                      <Button
                        variant={activeMetricView === 'overview' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveMetricView('overview')}
                        className="flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                      >
                        Overview
                      </Button>
                      <Button
                        variant={activeMetricView === 'detailed' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveMetricView('detailed')}
                        className="flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                      >
                        Detailed
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeMetricView === 'overview' ? (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4"
                      >
                        <MetricCard
                          icon={Video}
                          label="Total Sections"
                          value={contentStats.totalSections}
                          color="blue"
                        />
                        <MetricCard
                          icon={CheckCircle2}
                          label="Published"
                          value={contentStats.publishedSections}
                          color="green"
                        />
                        <MetricCard
                          icon={Eye}
                          label="Free Preview"
                          value={contentStats.freeSections}
                          color="purple"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="detailed"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-3"
                      >
                        <DetailedMetric
                          label="Section Content"
                          current={contentStats.totalSections}
                          recommended={5}
                          icon={Video}
                        />
                        <DetailedMetric
                          label="Published Content"
                          current={contentStats.publishedSections}
                          recommended={contentStats.totalSections}
                          icon={CheckCircle2}
                        />
                        <DetailedMetric
                          label="Required Fields"
                          current={contentStats.requiredFieldsCompleted}
                          recommended={contentStats.totalRequiredFields}
                          icon={ListChecks}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Two-Column Layout for Title, Description, Learning Outcomes, and Access Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8">
            {/* Left Column */}
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Chapter Title Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className={cn(
                  "p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl",
                  "bg-white/40 dark:bg-gray-800/40",
                  "border border-gray-200 dark:border-gray-700/50",
                  "backdrop-blur-sm",
                  "shadow-lg"
                )}>
                  <div className="flex items-center gap-x-2 sm:gap-x-3 mb-3 sm:mb-4">
                    <IconBadge icon={LayoutDashboard} />
                    <h2 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-white flex-1 truncate tracking-tight">
                      Chapter Title
                    </h2>
                    {chapter.title && (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>

                  {/* Horizontal line separator */}
                  <div className="mb-4 border-b border-slate-200/70 dark:border-slate-700/70" />

                  <ChapterTitleForm
                    initialData={{ title: chapter.title || "" }}
                    courseId={params.courseId}
                    chapterId={params.chapterId}
                  />
                </div>
              </motion.div>

              {/* Description Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className={cn(
                  "p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl",
                  "bg-white/40 dark:bg-gray-800/40",
                  "border border-gray-200 dark:border-gray-700/50",
                  "backdrop-blur-sm",
                  "shadow-lg"
                )}>
                  <div className="flex items-center gap-x-2 sm:gap-x-3 mb-3 sm:mb-4">
                    <IconBadge icon={BookOpen} />
                    <h2 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-white flex-1 truncate tracking-tight">
                      Chapter Description
                    </h2>
                    {chapter.description && (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>

                  {/* Horizontal line separator */}
                  <div className="mb-4 border-b border-slate-200/70 dark:border-slate-700/70" />

                  <ChapterDescriptionForm
                    initialData={{
                      title: chapter.title || "",
                      description: chapter.description || "",
                      learningOutcomes: chapter.learningOutcomes,
                      position: chapter.position,
                    }}
                    courseId={params.courseId}
                    chapterId={params.chapterId}
                    courseContext={courseContext}
                  />
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Learning Outcomes Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className={cn(
                  "p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl",
                  "bg-white/40 dark:bg-gray-800/40",
                  "border border-gray-200 dark:border-gray-700/50",
                  "backdrop-blur-sm",
                  "shadow-lg"
                )}>
                  <div className="flex items-center gap-x-2 sm:gap-x-3 mb-3 sm:mb-4">
                    <IconBadge icon={Target} />
                    <h2 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-white flex-1 truncate tracking-tight">
                      Learning Outcomes
                    </h2>
                    {chapter.learningOutcomes && (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>

                  {/* Horizontal line separator */}
                  <div className="mb-4 border-b border-slate-200/70 dark:border-slate-700/70" />

                  <ChapterLearningOutcomeForm
                    initialData={{
                      title: chapter.title || "",
                      learningOutcomes: chapter.learningOutcomes || "",
                      description: chapter.description,
                      position: chapter.position,
                    }}
                    courseId={params.courseId}
                    chapterId={params.chapterId}
                    courseContext={courseContext}
                  />
                </div>
              </motion.div>

              {/* Access Settings Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className={cn(
                  "p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl",
                  "bg-white/40 dark:bg-gray-800/40",
                  "border border-gray-200 dark:border-gray-700/50",
                  "backdrop-blur-sm",
                  "shadow-lg"
                )}>
                  <div className="flex items-center gap-x-2 sm:gap-x-3 mb-3 sm:mb-4">
                    <IconBadge icon={Eye} />
                    <h2 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-white flex-1 truncate tracking-tight">
                      Access Settings
                    </h2>
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                  </div>

                  {/* Horizontal line separator */}
                  <div className="mb-4 border-b border-slate-200/70 dark:border-slate-700/70" />

                  <ChapterAccessForm
                    initialData={{
                      isFree: chapter.isFree,
                      isPublished: chapter.isPublished
                    }}
                    courseId={params.courseId}
                    chapterId={params.chapterId}
                  />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Chapter Sections - Single Column Below Two-Column Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-4 sm:mb-6 md:mb-8"
          >
            <div className={cn(
              "p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl",
              "bg-white/40 dark:bg-gray-800/40",
              "border border-gray-200 dark:border-gray-700/50",
              "backdrop-blur-sm",
              "shadow-lg"
            )}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-5 md:mb-6">
                <div className="flex items-center gap-x-2 sm:gap-x-3">
                  <IconBadge icon={Video} />
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    Chapter Sections
                  </h2>
                </div>
                {contentStats.totalSections > 0 && (
                  <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                    {contentStats.totalSections} {contentStats.totalSections === 1 ? 'Section' : 'Sections'}
                  </Badge>
                )}
              </div>
              <div>
                {contentStats.totalSections === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-10 md:py-12 px-3 sm:px-4 text-center">
                    <div className="p-3 sm:p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-3 sm:mb-4">
                      <Video className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
                      No sections yet
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mb-3 sm:mb-4">
                      Start by creating your first section. Add videos, articles, and learning materials to help your students.
                    </p>
                  </div>
                ) : null}
                <ChaptersSectionForm
                  chapter={chapter}
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Helper Components

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan';
}

const MetricCard = ({ icon: Icon, label, value, color }: MetricCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400',
    pink: 'bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400',
    cyan: 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
  };

  return (
    <div className={cn(
      "p-2.5 sm:p-3 md:p-3.5 rounded-lg backdrop-blur-sm",
      colorClasses[color],
      "transition-all duration-200 hover:scale-105 hover:shadow-lg",
      "min-h-[60px] sm:min-h-[70px] md:min-h-[80px] flex flex-col justify-between"
    )}>
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 mb-1 sm:mb-1.5 flex-shrink-0" />
      <div className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">{value}</div>
      <div className="text-[10px] sm:text-xs md:text-sm opacity-70 leading-tight line-clamp-2">{label}</div>
    </div>
  );
};

interface DetailedMetricProps {
  label: string;
  current: number;
  recommended: number;
  icon: React.ComponentType<{ className?: string }>;
}

const DetailedMetric = ({ label, current, recommended, icon: Icon }: DetailedMetricProps) => {
  const percentage = Math.min((current / recommended) * 100, 100);
  const isOptimal = current >= recommended;

  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
      <Icon className={cn(
        "h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 flex-shrink-0",
        isOptimal ? "text-green-500" : "text-gray-400 dark:text-gray-600"
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5 sm:mb-1">
          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{label}</span>
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex-shrink-0 ml-2">
            {current}/{recommended}
          </span>
        </div>
        <Progress value={percentage} className="h-1.5 sm:h-2" />
      </div>
      {isOptimal && <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-green-500 flex-shrink-0" />}
    </div>
  );
};
