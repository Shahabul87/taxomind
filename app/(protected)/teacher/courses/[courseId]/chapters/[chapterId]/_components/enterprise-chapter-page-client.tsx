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
import { Banner } from "@/components/banner";
import { ChapterTitleForm } from "./chapter-title-form";
import { ChapterDescriptionForm } from "./chapter-description-form";
import { ChapterAccessForm } from "./chapter-access-form";
import { ChapterActions } from "./chapter-actions";
import { ChapterLearningOutcomeForm } from "./chapter-learning-outcome-form";
import { ChaptersSectionForm } from "./chapter-section-form";
// SAM Integration removed - using global SAM assistant instead
import { useIntelligentSAMSync } from "@/hooks/use-sam-intelligent-sync";
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

  // SAM context sync for AI awareness of current editing context
  const chapterFormData = useMemo(() => ({
    title: chapter.title,
    description: chapter.description,
    sectionsCount: chapter.sections.length,
    isPublished: chapter.isPublished,
    courseTitle: chapter.course.title,
  }), [chapter.title, chapter.description, chapter.sections.length, chapter.isPublished, chapter.course.title]);

  useIntelligentSAMSync('chapter-editor', chapterFormData, {
    formName: 'Chapter Editor',
    metadata: { courseId: params.courseId, chapterId: params.chapterId },
    formType: 'chapter-editor',
  });

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
                          actionHint="Add sections to build your chapter content"
                        />
                        <MetricCard
                          icon={CheckCircle2}
                          label="Published"
                          value={contentStats.publishedSections}
                          color="green"
                          actionHint="Publish sections to make them visible to students"
                        />
                        <MetricCard
                          icon={Eye}
                          label="Free Preview"
                          value={contentStats.freeSections}
                          color="purple"
                          actionHint="Mark sections as free to attract new students"
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
                  "rounded-xl overflow-hidden",
                  "bg-white/70 dark:bg-gray-900/70",
                  "border border-gray-200/70 dark:border-gray-800/70",
                  "backdrop-blur-md",
                  "shadow-md hover:shadow-lg transition-shadow duration-300"
                )}>
                  {/* Card Header with unique color */}
                  <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Chapter Title
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Give your chapter a descriptive title</p>
                      </div>
                      {chapter.title && (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3 sm:p-4 md:p-6">
                    <ChapterTitleForm
                      initialData={{ title: chapter.title || "" }}
                      courseId={params.courseId}
                      chapterId={params.chapterId}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Description Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className={cn(
                  "rounded-xl overflow-hidden",
                  "bg-white/70 dark:bg-gray-900/70",
                  "border border-gray-200/70 dark:border-gray-800/70",
                  "backdrop-blur-md",
                  "shadow-md hover:shadow-lg transition-shadow duration-300"
                )}>
                  {/* Card Header with unique color */}
                  <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Chapter Description
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Provide a detailed overview of this chapter</p>
                      </div>
                      {chapter.description && (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3 sm:p-4 md:p-6">
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
                  "rounded-xl overflow-hidden",
                  "bg-white/70 dark:bg-gray-900/70",
                  "border border-gray-200/70 dark:border-gray-800/70",
                  "backdrop-blur-md",
                  "shadow-md hover:shadow-lg transition-shadow duration-300"
                )}>
                  {/* Card Header with unique color */}
                  <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-rose-50/50 to-pink-50/30 dark:from-rose-950/20 dark:to-pink-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Learning Outcomes
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Define what students will learn in this chapter</p>
                      </div>
                      {chapter.learningOutcomes && (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3 sm:p-4 md:p-6">
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
                </div>
              </motion.div>

              {/* Access Settings Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className={cn(
                  "rounded-xl overflow-hidden",
                  "bg-white/70 dark:bg-gray-900/70",
                  "border border-gray-200/70 dark:border-gray-800/70",
                  "backdrop-blur-md",
                  "shadow-md hover:shadow-lg transition-shadow duration-300"
                )}>
                  {/* Card Header with unique color */}
                  <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Access Settings
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Control who can access this chapter</p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3 sm:p-4 md:p-6">
                    <ChapterAccessForm
                      initialData={{
                        isFree: chapter.isFree,
                        isPublished: chapter.isPublished
                      }}
                      courseId={params.courseId}
                      chapterId={params.chapterId}
                    />
                  </div>
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
              "rounded-xl overflow-hidden",
              "bg-white/70 dark:bg-gray-900/70",
              "border border-gray-200/70 dark:border-gray-800/70",
              "backdrop-blur-md",
              "shadow-md hover:shadow-lg transition-shadow duration-300"
            )}>
              {/* Card Header with unique blue/cyan color */}
              <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                      <Video className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                        Chapter Sections
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Organize your chapter content into sections</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contentStats.totalSections > 0 && (
                      <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30">
                        <Video className="h-3 w-3" />
                        {contentStats.totalSections} {contentStats.totalSections === 1 ? 'Section' : 'Sections'}
                      </Badge>
                    )}
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-3 sm:p-4 md:p-6">
                {contentStats.totalSections === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-8 sm:py-10 md:py-12 px-3 sm:px-4 text-center"
                  >
                    {/* Animated empty state illustration */}
                    <div className="relative mb-4 sm:mb-5">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-cyan-100/30 dark:from-blue-900/20 dark:to-cyan-900/10 rounded-full blur-2xl" />
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="relative p-4 sm:p-5 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/30"
                      >
                        <Video className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 dark:text-blue-400" />
                      </motion.div>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
                      No sections yet
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mb-3 sm:mb-4">
                      Start by creating your first section. Add videos, articles, and learning materials to help your students.
                    </p>
                    {/* CTA hint */}
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Click &quot;Add Section&quot; below to get started</span>
                    </div>
                  </motion.div>
                ) : null}
                <ChaptersSectionForm
                  chapter={chapter}
                  course={{
                    title: chapter.course.title,
                    description: chapter.course.description,
                    whatYouWillLearn: chapter.course.whatYouWillLearn,
                    courseGoals: chapter.course.courseGoals,
                    difficulty: chapter.course.difficulty,
                    categoryId: chapter.course.category?.name ?? null,
                  }}
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
  actionHint?: string;
}

const MetricCard = ({ icon: Icon, label, value, color, actionHint }: MetricCardProps) => {
  const colorConfig = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20',
      border: 'border-blue-200/60 dark:border-blue-700/40',
      text: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500/10',
      hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-600',
      hoverShadow: 'hover:shadow-blue-500/10',
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20',
      border: 'border-emerald-200/60 dark:border-emerald-700/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-600',
      hoverShadow: 'hover:shadow-emerald-500/10',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20',
      border: 'border-purple-200/60 dark:border-purple-700/40',
      text: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-500/10',
      hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-600',
      hoverShadow: 'hover:shadow-purple-500/10',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20',
      border: 'border-orange-200/60 dark:border-orange-700/40',
      text: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-500/10',
      hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-600',
      hoverShadow: 'hover:shadow-orange-500/10',
    },
    pink: {
      bg: 'bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/40 dark:to-pink-900/20',
      border: 'border-pink-200/60 dark:border-pink-700/40',
      text: 'text-pink-600 dark:text-pink-400',
      iconBg: 'bg-pink-500/10',
      hoverBorder: 'hover:border-pink-300 dark:hover:border-pink-600',
      hoverShadow: 'hover:shadow-pink-500/10',
    },
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/40 dark:to-cyan-900/20',
      border: 'border-cyan-200/60 dark:border-cyan-700/40',
      text: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      hoverBorder: 'hover:border-cyan-300 dark:hover:border-cyan-600',
      hoverShadow: 'hover:shadow-cyan-500/10',
    },
  };

  const config = colorConfig[color];
  const isEmpty = value === 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative p-3 sm:p-3.5 md:p-4 rounded-xl backdrop-blur-sm cursor-pointer",
            "border",
            config.bg,
            config.border,
            config.hoverBorder,
            "transition-all duration-300",
            "hover:shadow-lg",
            config.hoverShadow,
            "min-h-[72px] sm:min-h-[80px] md:min-h-[90px]",
            "flex flex-col justify-between",
            "group overflow-hidden"
          )}
        >
          {/* Decorative gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/40 dark:from-white/0 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Icon with background */}
          <div className={cn(
            "relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-2",
            config.iconBg,
            "transition-transform duration-300 group-hover:scale-110"
          )}>
            <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", config.text)} />
          </div>

          {/* Value with empty state styling */}
          <div className="relative z-10">
            <div className={cn(
              "text-xl sm:text-2xl md:text-3xl font-bold leading-tight",
              config.text,
              isEmpty && "opacity-40"
            )}>
              {value}
            </div>
            <div className={cn(
              "text-[10px] sm:text-xs font-medium mt-0.5",
              isEmpty ? "text-muted-foreground" : config.text,
              "opacity-80"
            )}>
              {label}
            </div>
          </div>

          {/* Empty state indicator */}
          {isEmpty && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 animate-pulse" />
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <p className="text-xs">
          {isEmpty
            ? actionHint || `Add ${label.toLowerCase()} to enhance your chapter`
            : `${value} ${label.toLowerCase()}`
          }
        </p>
      </TooltipContent>
    </Tooltip>
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
