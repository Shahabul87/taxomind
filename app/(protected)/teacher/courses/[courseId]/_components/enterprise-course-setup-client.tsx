"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  Target,
  FileQuestion,
  Sparkles,
  BarChart3,
  Microscope,
  ChevronRight,
  CircleDollarSign,
  File,
  BookOpen,
  Video,
  GraduationCap,
  Users,
  Clock,
  Layers,
  Brain
} from "lucide-react";
import { motion } from "framer-motion";
import { Chapter, Course, Attachment, Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

// Form imports
import { TitleForm } from "./title-form";
import { DescriptionForm } from "./description-form";
import { CategoryForm } from "./category-form";
import { PriceForm } from "./price-form";
import { AttachmentForm } from "./attachment-form";
import { ChaptersForm } from "./chapters-form";
import { Actions } from "./actions";
import { FeaturedForm } from "./featured-form";
import { CourseImageUpload } from "./course-image-upload";
import { CourseLearningOutcomeForm } from "./course-learning-outcome-form";
import { ContextAwareFeatureRevealer } from "@/components/ui/context-aware-feature-revealer";
import { BlueprintIntegration } from "./blueprint-integration";
import { SimpleCourseContext } from "@/app/(protected)/teacher/_components/simple-course-context";
import { CognitiveRecommendationsPanel } from "@/components/teacher/cognitive-recommendations-panel";
import { CourseBenchmarkCard } from "@/components/teacher/course-benchmark-card";

interface Section {
  id: string;
  title: string;
  isPublished: boolean;
}

interface ChapterWithSections extends Chapter {
  sections: Section[];
}

interface CourseWithRelations extends Course {
  chapters: ChapterWithSections[];
  attachments: Attachment[];
  category?: Category | null;
}

interface CategoryOption {
  label: string;
  value: string;
  subcategories?: { label: string; value: string }[];
}

interface EnterpriseCourseSetupClientProps {
  course: CourseWithRelations;
  categories: CategoryOption[];
  userId: string;
  completionStatus: {
    titleDesc: boolean;
    learningObj: boolean;
    image: boolean;
    price: boolean;
    category: boolean;
    chapters: boolean;
    attachments: boolean;
  };
}

// MetricCard Component
interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan' | 'amber' | 'indigo';
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
    amber: {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20',
      border: 'border-amber-200/60 dark:border-amber-700/40',
      text: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/10',
      hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-600',
      hoverShadow: 'hover:shadow-amber-500/10',
    },
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/20',
      border: 'border-indigo-200/60 dark:border-indigo-700/40',
      text: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-500/10',
      hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-600',
      hoverShadow: 'hover:shadow-indigo-500/10',
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

          {/* Content */}
          <div className="relative z-10 flex-1 flex flex-col justify-end">
            <p className={cn(
              "text-lg sm:text-xl md:text-2xl font-bold tracking-tight",
              config.text
            )}>
              {value}
              {/* Pulse indicator for empty state */}
              {isEmpty && (
                <span className="ml-1.5 inline-flex">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    color === 'blue' && "bg-blue-400",
                    color === 'green' && "bg-emerald-400",
                    color === 'purple' && "bg-purple-400",
                    color === 'orange' && "bg-orange-400",
                    color === 'pink' && "bg-pink-400",
                    color === 'cyan' && "bg-cyan-400",
                    color === 'amber' && "bg-amber-400",
                    color === 'indigo' && "bg-indigo-400"
                  )} />
                </span>
              )}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              {label}
            </p>
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <p className="text-xs">
          {isEmpty
            ? actionHint || `Add ${label.toLowerCase()} to complete this section`
            : `${value} ${label.toLowerCase()} configured`
          }
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export const EnterpriseCourseSetupClient = ({
  course,
  categories,
  userId,
  completionStatus,
}: EnterpriseCourseSetupClientProps) => {
  // Calculate course statistics
  const courseStats = useMemo(() => {
    const totalChapters = course.chapters.length;
    const publishedChapters = course.chapters.filter(c => c.isPublished).length;
    const totalSections = course.chapters.reduce((acc, ch) => acc + (ch.sections?.length || 0), 0);
    const totalLearningObjectives = course.whatYouWillLearn?.length || 0;
    const totalAttachments = course.attachments.length;

    return {
      totalChapters,
      publishedChapters,
      totalSections,
      totalLearningObjectives,
      totalAttachments,
    };
  }, [course]);

  // Calculate completion
  const sectionValues = Object.values(completionStatus);
  const completedSections = sectionValues.filter(Boolean).length;
  const totalSections = sectionValues.length;
  const minSectionsRequired = 2;
  const isPublishable = completedSections >= minSectionsRequired;
  const completionText = `(${completedSections}/${totalSections})`;
  const completionPercentage = Math.round((completedSections / totalSections) * 100);

  return (
    <TooltipProvider>
      {/* Enhanced SAM Context Injection */}
      <SimpleCourseContext
        course={{
          id: course.id,
          title: course.title,
          description: course.description,
          whatYouWillLearn: course.whatYouWillLearn || [],
          isPublished: course.isPublished,
          categoryId: course.categoryId,
          price: course.price,
          imageUrl: course.imageUrl,
          chapters: course.chapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            description: chapter.description,
            isPublished: chapter.isPublished,
            isFree: chapter.isFree,
            position: chapter.position,
            sections: chapter.sections?.map(section => ({
              id: section.id,
              title: section.title,
              isPublished: section.isPublished
            }))
          }))
        }}
        completionStatus={completionStatus}
      />

      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-6">
        {/* Unpublished Banner */}
        {!course.isPublished && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-3 sm:mb-4 md:mb-6 px-2 sm:px-4 md:px-6"
          >
            <div className="w-full bg-gradient-to-r from-amber-50/90 to-orange-50/90 dark:from-amber-950/50 dark:to-orange-950/50 backdrop-blur-md rounded-xl sm:rounded-2xl border-2 border-amber-200/60 dark:border-amber-700/40 shadow-xl shadow-amber-500/10 dark:shadow-amber-900/20 p-3 sm:p-4 md:p-6 hover:shadow-2xl hover:shadow-amber-500/20 dark:hover:shadow-amber-900/30 transition-all duration-500 group">
              <div className="flex items-start xs:items-center gap-2.5 sm:gap-3 md:gap-4">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-100 break-words">
                    This course is unpublished. It will not be visible to students.
                  </p>
                  <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-300 mt-1 hidden sm:block">
                    Complete at least {minSectionsRequired} sections and click publish to make it available.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Course Setup Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full px-2 sm:px-4 md:px-6 mb-4 sm:mb-6 md:mb-8"
        >
          <div className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 md:p-6 lg:p-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-5 md:mb-6">
              {/* Left: Icon and Title */}
              <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 lg:gap-6 flex-1 min-w-0 w-full lg:w-auto">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="p-2 sm:p-2.5 md:p-3 lg:p-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 ring-2 ring-white/50 dark:ring-white/20 flex-shrink-0"
                >
                  <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-white" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Course Setup
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 sm:mt-1.5 text-xs sm:text-sm md:text-base font-medium hidden sm:block">
                    Configure your course settings and content
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full lg:w-auto flex-shrink-0">
                <Actions
                  disabled={!isPublishable}
                  courseId={course.id}
                  isPublished={course.isPublished}
                />
              </div>
            </div>

            {/* Progress Section */}
            <div className="w-full bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md p-3 sm:p-4 md:p-5">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                {/* Progress Info */}
                <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 flex-shrink-0">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                    <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                      Progress {completionText}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {completionPercentage}% complete
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 w-full sm:w-auto min-w-0 sm:max-w-md order-3 sm:order-2">
                  <div className="w-full h-2 sm:h-2.5 md:h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        completionPercentage < 30 ? "bg-gradient-to-r from-amber-500 to-orange-600" :
                        completionPercentage < 70 ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                        "bg-gradient-to-r from-emerald-500 to-teal-500"
                      )}
                    />
                  </div>
                </div>

                {/* Publication Status */}
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto order-2 sm:order-3">
                  {isPublishable ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/20 dark:bg-emerald-400/20 border border-emerald-500/40 dark:border-emerald-400/40 w-full sm:w-auto justify-center sm:justify-start"
                    >
                      <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">Ready to publish</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-500/20 dark:bg-amber-400/20 border border-amber-500/40 dark:border-amber-400/40 w-full sm:w-auto justify-center sm:justify-start">
                      <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 truncate">Needs more content</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MetricCards Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 sm:mt-5 md:mt-6"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                <MetricCard
                  icon={BookOpen}
                  label="Chapters"
                  value={courseStats.totalChapters}
                  color="blue"
                  actionHint="Add chapters to organize your course content"
                />
                <MetricCard
                  icon={Layers}
                  label="Sections"
                  value={courseStats.totalSections}
                  color="purple"
                  actionHint="Create sections within your chapters"
                />
                <MetricCard
                  icon={Target}
                  label="Learning Goals"
                  value={courseStats.totalLearningObjectives}
                  color="green"
                  actionHint="Define what students will learn"
                />
                <MetricCard
                  icon={CheckCircle2}
                  label="Published"
                  value={courseStats.publishedChapters}
                  color="cyan"
                  actionHint="Publish chapters to make them visible"
                />
                <MetricCard
                  icon={File}
                  label="Resources"
                  value={courseStats.totalAttachments}
                  color="orange"
                  actionHint="Upload supporting materials"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Progressive Feature Discovery */}
        <div className="px-2 sm:px-4 md:px-6 mb-3 sm:mb-4">
          <ContextAwareFeatureRevealer
            userId={userId}
            currentPage="course-creation"
            contextualData={{
              coursesCreated: 1,
              chaptersCreated: course.chapters.length,
              studentsEnrolled: 0,
              examAttempts: 0,
              bloomsLevels: 3
            }}
          />
        </div>

        {/* Blueprint Integration */}
        <div className="px-2 sm:px-4 md:px-6 mb-3 sm:mb-4">
          <BlueprintIntegration
            courseId={course.id}
            currentCourse={{
              title: course.title,
              description: course.description || undefined,
              chapters: course.chapters
            }}
          />
        </div>

        {/* Course Information - Two Column Layout */}
        <div className="px-2 sm:px-4 md:px-6 mb-4 sm:mb-6 md:mb-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Left Column */}
            <div className="space-y-3 sm:space-y-4">
              {/* Course Title Card */}
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
                  {/* Card Header - Purple/Pink */}
                  <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Course Title
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Give your course a compelling name</p>
                      </div>
                      {course.title && (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-6">
                    <TitleForm
                      initialData={{
                        title: course.title ?? "",
                        description: course.description ?? undefined
                      }}
                      courseId={course.id}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Course Description Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className={cn(
                  "rounded-xl overflow-hidden",
                  "bg-white/70 dark:bg-gray-900/70",
                  "border border-gray-200/70 dark:border-gray-800/70",
                  "backdrop-blur-md",
                  "shadow-md hover:shadow-lg transition-shadow duration-300"
                )}>
                  {/* Card Header - Indigo/Purple */}
                  <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <FileQuestion className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Course Description
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Tell students what they&apos;ll learn</p>
                      </div>
                      {course.description && (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-6">
                    <DescriptionForm initialData={course} courseId={course.id} />
                  </div>
                </div>
              </motion.div>

              {/* Learning Objectives Card */}
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
                  {/* Card Header - Blue/Indigo */}
                  <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Learning Objectives
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Define measurable learning outcomes</p>
                      </div>
                      {completionStatus.learningObj && (
                        <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30">
                          <Target className="h-3 w-3" />
                          {courseStats.totalLearningObjectives}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-6">
                    <CourseLearningOutcomeForm
                      initialData={{
                        whatYouWillLearn: course.whatYouWillLearn || [],
                        title: course.title ?? undefined,
                        description: course.description ?? undefined
                      }}
                      courseId={course.id}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-3 sm:space-y-4">
              {/* Course Category Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
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
                  {/* Card Header - Violet/Purple */}
                  <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <ListChecks className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Course Category
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Help students find your course</p>
                      </div>
                      {completionStatus.category && (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-6">
                    <CategoryForm
                      initialData={course}
                      courseId={course.id}
                      options={categories}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Course Price Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className={cn(
                  "rounded-xl overflow-hidden",
                  "bg-white/70 dark:bg-gray-900/70",
                  "border border-gray-200/70 dark:border-gray-800/70",
                  "backdrop-blur-md",
                  "shadow-md hover:shadow-lg transition-shadow duration-300"
                )}>
                  {/* Card Header - Emerald/Teal */}
                  <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Course Price
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Set your course pricing</p>
                      </div>
                      {completionStatus.price && (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-6">
                    <PriceForm initialData={course} courseId={course.id} />
                  </div>
                </div>
              </motion.div>

              {/* Featured Status Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
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
                  {/* Card Header - Amber/Yellow */}
                  <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-amber-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Featured Status
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Highlight on homepage</p>
                      </div>
                      {course.isFeatured && (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-6">
                    <FeaturedForm
                      initialData={{ isFeatured: course.isFeatured }}
                      courseId={course.id}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Course Image Card */}
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
                  {/* Card Header - Orange/Amber */}
                  <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-orange-50/50 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                        <File className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                          Course Image
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Add a visual thumbnail</p>
                      </div>
                      {completionStatus.image && (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-6">
                    <CourseImageUpload
                      courseId={course.id}
                      initialImage={course.imageUrl}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Course Chapters - Single Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-2 sm:px-4 md:px-6 mb-4 sm:mb-6 md:mb-8"
        >
          <div className={cn(
            "rounded-xl overflow-hidden",
            "bg-white/70 dark:bg-gray-900/70",
            "border border-gray-200/70 dark:border-gray-800/70",
            "backdrop-blur-md",
            "shadow-md hover:shadow-lg transition-shadow duration-300"
          )}>
            {/* Card Header - Blue/Cyan */}
            <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                  <ListChecks className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                    Course Chapters
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Organize your course content</p>
                </div>
                <div className="flex items-center gap-2">
                  {courseStats.totalChapters > 0 && (
                    <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30">
                      <BookOpen className="h-3 w-3" />
                      {courseStats.totalChapters}
                    </Badge>
                  )}
                  {completionStatus.chapters && (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <ChaptersForm initialData={course} courseId={course.id} />
            </div>
          </div>
        </motion.div>

        {/* Resources - Single Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="px-2 sm:px-4 md:px-6 mb-4 sm:mb-6 md:mb-8"
        >
          <div className={cn(
            "rounded-xl overflow-hidden",
            "bg-white/70 dark:bg-gray-900/70",
            "border border-gray-200/70 dark:border-gray-800/70",
            "backdrop-blur-md",
            "shadow-md hover:shadow-lg transition-shadow duration-300"
          )}>
            {/* Card Header - Rose/Pink */}
            <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-rose-50/50 to-pink-50/30 dark:from-rose-950/20 dark:to-pink-950/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                  <File className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                    Course Resources
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Upload supporting materials</p>
                </div>
                <div className="flex items-center gap-2">
                  {courseStats.totalAttachments > 0 && (
                    <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 border-rose-200 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/30">
                      <File className="h-3 w-3" />
                      {courseStats.totalAttachments}
                    </Badge>
                  )}
                  {completionStatus.attachments && (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <AttachmentForm initialData={course} courseId={course.id} />
            </div>
          </div>
        </motion.div>

        {/* Cognitive Quality Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-2 sm:px-4 md:px-6 mb-4 sm:mb-6 md:mb-8"
        >
          <div className={cn(
            "rounded-xl overflow-hidden",
            "bg-white/70 dark:bg-gray-900/70",
            "border border-gray-200/70 dark:border-gray-800/70",
            "backdrop-blur-md",
            "shadow-md hover:shadow-lg transition-shadow duration-300"
          )}>
            {/* Card Header - Brain/Cognitive */}
            <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-r from-violet-50/50 to-indigo-50/30 dark:from-violet-950/20 dark:to-indigo-950/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25 flex-shrink-0 ring-2 ring-white/50 dark:ring-white/20">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                    Cognitive Quality
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">
                    Bloom&apos;s Taxonomy analysis and improvement recommendations
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* AI Recommendations Panel */}
                <CognitiveRecommendationsPanel courseId={course.id} />

                {/* Category Benchmark Card */}
                {course.categoryId && (
                  <CourseBenchmarkCard
                    courseId={course.id}
                    onViewRecommendations={() => {
                      // Scroll to recommendations or open modal
                      const el = document.querySelector('[data-recommendations-panel]');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Link to Depth Analyzer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="px-2 sm:px-4 md:px-6 mb-4 sm:mb-6 md:mb-8"
        >
          <Link href={`/teacher/depth-analyzer?courseId=${course.id}`}>
            <motion.div
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-blue-500/5 dark:from-purple-500/10 dark:via-indigo-500/10 dark:to-blue-500/10 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 cursor-pointer group hover:border-purple-300 dark:hover:border-purple-600"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25 ring-2 ring-white/50 dark:ring-white/20 group-hover:shadow-xl transition-all group-hover:scale-105">
                  <Microscope className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                    Analyze Course Depth
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Run Bloom&apos;s Taxonomy analysis on this course, chapters, or sections
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 dark:text-slate-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors group-hover:translate-x-1 transform" />
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </TooltipProvider>
  );
};
