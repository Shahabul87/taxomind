"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
  Calendar,
  Zap,
  BookOpen,
  Video,
  FileText,
  Code,
  Brain,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWeeklyActivity } from "../../_hooks/use-progress-analytics";

interface Chapter {
  id: string;
  title: string;
  position: number;
  sections: Array<{
    id: string;
    title: string;
    type?: string | null;
    duration?: number | null;
    user_progress: Array<{ isCompleted: boolean }>;
    videos: Array<{ id: string }>;
    blogs: Array<{ id: string }>;
    articles: Array<{ id: string }>;
    notes: Array<{ id: string }>;
    codeExplanations: Array<{ id: string }>;
  }>;
}

interface ProgressAnalyticsProps {
  course: {
    id: string;
    chapters: Chapter[];
  };
  progressPercentage: number;
  totalSections: number;
  completedSections: number;
}

export function ProgressAnalytics({
  course,
  progressPercentage,
  totalSections,
  completedSections,
}: ProgressAnalyticsProps) {
  // Fetch real weekly activity data
  const { weeklyActivity, isLoading: isLoadingActivity } = useWeeklyActivity(
    course.id
  );
  // Calculate chapter-wise progress
  const chapterProgress = useMemo(() => {
    return course.chapters.map((chapter, index) => {
      const total = chapter.sections.length;
      const completed = chapter.sections.filter((s) =>
        s.user_progress?.some((p) => p.isCompleted)
      ).length;
      return {
        id: chapter.id,
        title: chapter.title,
        position: chapter.position,
        total,
        completed,
        percentage: total > 0 ? (completed / total) * 100 : 0,
        isComplete: total === completed,
      };
    });
  }, [course.chapters]);

  // Calculate content type statistics
  const contentStats = useMemo(() => {
    const stats = {
      videos: 0,
      blogs: 0,
      articles: 0,
      notes: 0,
      codeExplanations: 0,
    };

    course.chapters.forEach((chapter) => {
      chapter.sections.forEach((section) => {
        stats.videos += section.videos?.length || 0;
        stats.blogs += section.blogs?.length || 0;
        stats.articles += section.articles?.length || 0;
        stats.notes += section.notes?.length || 0;
        stats.codeExplanations += section.codeExplanations?.length || 0;
      });
    });

    return stats;
  }, [course.chapters]);

  // Calculate time statistics
  const timeStats = useMemo(() => {
    let totalMinutes = 0;
    let remainingMinutes = 0;
    let completedMinutes = 0;

    course.chapters.forEach((chapter) => {
      chapter.sections.forEach((section) => {
        const duration = section.duration || 10;
        totalMinutes += duration;
        if (section.user_progress?.some((p) => p.isCompleted)) {
          completedMinutes += duration;
        } else {
          remainingMinutes += duration;
        }
      });
    });

    return { totalMinutes, remainingMinutes, completedMinutes };
  }, [course.chapters]);

  const contentTypeItems = [
    {
      type: "Videos",
      count: contentStats.videos,
      icon: Video,
      color: "text-red-500",
      bgColor: "bg-red-100 dark:bg-red-500/20",
    },
    {
      type: "Articles",
      count: contentStats.articles,
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-500/20",
    },
    {
      type: "Blogs",
      count: contentStats.blogs,
      icon: BookOpen,
      color: "text-green-500",
      bgColor: "bg-green-100 dark:bg-green-500/20",
    },
    {
      type: "Code",
      count: contentStats.codeExplanations,
      icon: Code,
      color: "text-purple-500",
      bgColor: "bg-purple-100 dark:bg-purple-500/20",
    },
    {
      type: "Notes",
      count: contentStats.notes,
      icon: Brain,
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-500/20",
    },
  ].filter((item) => item.count > 0);

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <section className="space-y-6" aria-labelledby="analytics-title">
      {/* Main Analytics Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center" aria-hidden="true">
                  <BarChart3 className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="analytics-title" className="text-xl font-bold text-white">
                    Learning Analytics
                  </h2>
                  <p className="text-white/70 text-sm">
                    Track your progress and performance
                  </p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm" role="status">
                <span className="sr-only">Progress: </span>
                {Math.round(progressPercentage)}% Complete
              </Badge>
            </div>
          </div>

          <CardContent className="p-6 space-y-8">
            {/* Progress Overview */}
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Progress overview">
              {/* Completed */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center" aria-hidden="true">
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <dt className="text-emerald-100 font-medium">
                      Completed
                    </dt>
                  </div>
                  <dd>
                    <span className="text-4xl font-bold">{completedSections}</span>
                    <span className="text-emerald-100 text-sm mt-1 block">
                      sections finished
                    </span>
                  </dd>
                </div>
              </motion.div>

              {/* Remaining */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center" aria-hidden="true">
                      <Target className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <dt className="text-blue-100 font-medium">Remaining</dt>
                  </div>
                  <dd>
                    <span className="text-4xl font-bold">
                      {totalSections - completedSections}
                    </span>
                    <span className="text-blue-100 text-sm mt-1 block">sections to go</span>
                  </dd>
                </div>
              </motion.div>

              {/* Time */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 text-white"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center" aria-hidden="true">
                      <Clock className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <dt className="text-purple-100 font-medium">
                      Time Left
                    </dt>
                  </div>
                  <dd>
                    <span className="text-4xl font-bold">
                      {formatTime(timeStats.remainingMinutes)}
                    </span>
                    <span className="text-purple-100 text-sm mt-1 block">to complete</span>
                  </dd>
                </div>
              </motion.div>
            </dl>

            {/* Content Types */}
            {contentTypeItems.length > 0 && (
              <section className="space-y-4" aria-labelledby="content-breakdown-title">
                <div className="flex items-center justify-between">
                  <h3 id="content-breakdown-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                    Content Breakdown
                  </h3>
                  <span className="text-sm text-slate-500" aria-live="polite">
                    {contentTypeItems.reduce((acc, item) => acc + item.count, 0)}{" "}
                    total items
                  </span>
                </div>
                <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {contentTypeItems.map((item, index) => (
                    <motion.div
                      key={item.type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          item.bgColor
                        )}
                        aria-hidden="true"
                      >
                        <item.icon className={cn("h-5 w-5", item.color)} aria-hidden="true" />
                      </div>
                      <div>
                        <dd className="text-xl font-bold text-slate-900 dark:text-white">
                          {item.count}
                        </dd>
                        <dt className="text-xs text-slate-500 dark:text-slate-400">
                          {item.type}
                        </dt>
                      </div>
                    </motion.div>
                  ))}
                </dl>
              </section>
            )}

            {/* Chapter Progress */}
            <section className="space-y-4" aria-labelledby="chapter-progress-title">
              <div className="flex items-center justify-between">
                <h3 id="chapter-progress-title" className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                  Chapter Progress
                </h3>
              </div>

              <ol className="space-y-3" aria-label="Chapter progress list">
                {chapterProgress.map((chapter, index) => (
                  <motion.li
                    key={chapter.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="group"
                  >
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                      {/* Chapter Number */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                          chapter.isComplete
                            ? "bg-emerald-500 text-white"
                            : chapter.percentage > 0
                              ? "bg-blue-500 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                        )}
                        aria-hidden="true"
                      >
                        {chapter.isComplete ? (
                          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          chapter.position
                        )}
                      </div>

                      {/* Title and Progress */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900 dark:text-white truncate pr-4">
                            {chapter.title}
                            {chapter.isComplete && (
                              <span className="sr-only"> (Completed)</span>
                            )}
                          </h4>
                          <span className="text-sm text-slate-500 whitespace-nowrap" aria-label={`${chapter.completed} of ${chapter.total} sections completed`}>
                            {chapter.completed}/{chapter.total}
                          </span>
                        </div>
                        <div
                          className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuenow={Math.round(chapter.percentage)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${chapter.title} progress: ${Math.round(chapter.percentage)}%`}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${chapter.percentage}%` }}
                            transition={{
                              duration: 0.8,
                              delay: 0.1 * index,
                              ease: "easeOut",
                            }}
                            className={cn(
                              "absolute top-0 left-0 h-full rounded-full",
                              chapter.isComplete
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                : "bg-gradient-to-r from-blue-500 to-indigo-500"
                            )}
                          />
                        </div>
                      </div>

                      {/* Percentage */}
                      <div className="text-right" aria-hidden="true">
                        <span
                          className={cn(
                            "text-lg font-bold",
                            chapter.isComplete
                              ? "text-emerald-500"
                              : "text-slate-700 dark:text-slate-300"
                          )}
                        >
                          {Math.round(chapter.percentage)}%
                        </span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </section>

            {/* Weekly Activity */}
            <section className="space-y-4" aria-labelledby="weekly-activity-title">
              <h3 id="weekly-activity-title" className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" aria-hidden="true" />
                This Week&apos;s Activity
              </h3>
              {isLoadingActivity ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2" role="list" aria-label="Weekly activity calendar">
                  {(weeklyActivity.length > 0
                    ? weeklyActivity
                    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (day) => ({
                          day,
                          date: "",
                          minutesStudied: 0,
                          sectionsCompleted: 0,
                          isActive: false,
                        })
                      )
                  ).map((dayData, index) => {
                    return (
                      <motion.div
                        key={dayData.day}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * index }}
                        className="text-center"
                        role="listitem"
                        aria-label={`${dayData.day}: ${dayData.isActive ? `Active - ${dayData.minutesStudied} minutes studied` : "No activity"}`}
                      >
                        <div
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center text-sm font-medium mb-1 transition-colors",
                            dayData.isActive
                              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          )}
                          aria-hidden="true"
                        >
                          {dayData.isActive ? (
                            <Zap className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <span className="text-xs">{dayData.day[0]}</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{dayData.day}</span>
                        {dayData.isActive && dayData.minutesStudied > 0 && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 block">
                            {dayData.minutesStudied}m
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
