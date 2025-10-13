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
import { ChapterSamIntegration } from "./chapter-sam-integration";
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
        {/* SAM Integration for Chapter Context */}
        <ChapterSamIntegration
          chapter={chapter}
          courseId={params.courseId}
          chapterId={params.chapterId}
        />

        {/* Enterprise Header with Status Bar */}
        <div className="sticky top-0 z-40 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center space-x-2 text-sm">
                <Link href="/teacher/courses" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  Courses
                </Link>
                <span className="text-gray-400 dark:text-gray-600">/</span>
                <Link href={`/teacher/courses/${params.courseId}`} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  {chapter.course.title}
                </Link>
                <span className="text-gray-400 dark:text-gray-600">/</span>
                <span className="text-gray-900 dark:text-gray-200 font-medium">{chapter.title || 'New Chapter'}</span>
              </nav>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Preview</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Preview as Student</TooltipContent>
                </Tooltip>

                <Badge variant={chapter.isPublished ? "default" : "secondary"} className="gap-1">
                  <Shield className="h-3 w-3" />
                  {chapter.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-gray-200 dark:bg-gray-800">
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
              className="container mx-auto px-4 pt-4"
            >
              <Banner
                variant="warning"
                label="This chapter is unpublished and not visible to students. Complete all required fields and publish when ready."
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="container mx-auto px-4 py-8">
          {/* Page Header with Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="shadow-xl border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-800/60 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/teacher/courses/${params.courseId}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Back to Course
                      </Link>
                      {chapter.isFree && (
                        <Badge variant="outline" className="gap-1">
                          <Info className="h-3 w-3" />
                          Free Preview
                        </Badge>
                      )}
                    </div>

                    <div>
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 dark:from-purple-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        Chapter Configuration
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        Build comprehensive chapter content with sections and learning materials
                      </CardDescription>
                    </div>
                  </div>

                  {/* Completion Metrics */}
                  <div className="flex flex-col items-end gap-4">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {contentStats.completionPercentage}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {contentStats.requiredFieldsCompleted}/{contentStats.totalRequiredFields} Required Fields
                      </div>
                    </div>

                    <ChapterActions
                      disabled={contentStats.completionPercentage < 100}
                      courseId={params.courseId}
                      chapterId={params.chapterId}
                      isPublished={chapter.isPublished}
                    />
                  </div>
                </div>

                {/* Content Metrics Dashboard */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Content Analytics
                    </h4>
                    <div className="flex gap-1">
                      <Button
                        variant={activeMetricView === 'overview' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveMetricView('overview')}
                      >
                        Overview
                      </Button>
                      <Button
                        variant={activeMetricView === 'detailed' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveMetricView('detailed')}
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
                        className="grid grid-cols-2 md:grid-cols-3 gap-4"
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

          {/* Two-Column Chapter Configuration */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Chapter Details */}
            <div className="space-y-6">
              {/* Chapter Title & Learning Outcomes Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className={cn(
                  "p-4 sm:p-6 rounded-xl",
                  "bg-white/40 dark:bg-gray-800/40",
                  "border border-gray-200 dark:border-gray-700/50",
                  "backdrop-blur-sm",
                  "shadow-lg"
                )}>
                  <div className="flex items-center gap-x-3 mb-6">
                    <IconBadge icon={LayoutDashboard} />
                    <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      Customize your chapter
                    </h2>
                  </div>
                  <div className="space-y-6">
                    <ChapterTitleForm
                      initialData={{ title: chapter.title || "" }}
                      courseId={params.courseId}
                      chapterId={params.chapterId}
                    />
                    <Separator />
                    <ChapterLearningOutcomeForm
                      initialData={{
                        title: chapter.title || "",
                        learningOutcomes: chapter.learningOutcomes || ""
                      }}
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
                  "p-4 sm:p-6 rounded-xl",
                  "bg-white/40 dark:bg-gray-800/40",
                  "border border-gray-200 dark:border-gray-700/50",
                  "backdrop-blur-sm",
                  "shadow-lg"
                )}>
                  <div className="flex items-center gap-x-3 mb-6">
                    <IconBadge icon={BookOpen} />
                    <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      Chapter Description
                    </h2>
                  </div>
                  <div>
                    <ChapterDescriptionForm
                      initialData={{
                        title: chapter.title || "",
                        description: chapter.description || ""
                      }}
                      courseId={params.courseId}
                      chapterId={params.chapterId}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Access Settings Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className={cn(
                  "p-4 sm:p-6 rounded-xl",
                  "bg-white/40 dark:bg-gray-800/40",
                  "border border-gray-200 dark:border-gray-700/50",
                  "backdrop-blur-sm",
                  "shadow-lg"
                )}>
                  <div className="flex items-center gap-x-3 mb-6">
                    <IconBadge icon={Eye} />
                    <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      Access Settings
                    </h2>
                  </div>
                  <div>
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

            {/* Right Column - Sections */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className={cn(
                  "p-4 sm:p-6 rounded-xl",
                  "bg-white/40 dark:bg-gray-800/40",
                  "border border-gray-200 dark:border-gray-700/50",
                  "backdrop-blur-sm",
                  "shadow-lg"
                )}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-x-3">
                      <IconBadge icon={Video} />
                      <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        Chapter Sections
                      </h2>
                    </div>
                    {contentStats.totalSections > 0 && (
                      <Badge variant="outline" className="gap-1">
                        {contentStats.totalSections} {contentStats.totalSections === 1 ? 'Section' : 'Sections'}
                      </Badge>
                    )}
                  </div>
                  <div>
                    {contentStats.totalSections === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                          <Video className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          No sections yet
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
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
      "p-3 rounded-lg backdrop-blur-sm",
      colorClasses[color],
      "transition-all duration-200 hover:scale-105 hover:shadow-lg"
    )}>
      <Icon className="h-4 w-4 mb-1" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
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
    <div className="flex items-center gap-4">
      <Icon className={cn(
        "h-5 w-5",
        isOptimal ? "text-green-500" : "text-gray-400 dark:text-gray-600"
      )} />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {current}/{recommended}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
      {isOptimal && <CheckCircle2 className="h-4 w-4 text-green-500" />}
    </div>
  );
};
