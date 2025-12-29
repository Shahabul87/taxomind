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
  Star,
  BookOpen,
  Video,
  FileText,
  Code,
  Brain,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
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
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Learning Analytics
                  </h2>
                  <p className="text-white/70 text-sm">
                    Track your progress and performance
                  </p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                {Math.round(progressPercentage)}% Complete
              </Badge>
            </div>
          </div>

          <CardContent className="p-6 space-y-8">
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Completed */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="text-emerald-100 font-medium">
                      Completed
                    </span>
                  </div>
                  <p className="text-4xl font-bold">{completedSections}</p>
                  <p className="text-emerald-100 text-sm mt-1">
                    sections finished
                  </p>
                </div>
              </motion.div>

              {/* Remaining */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5" />
                    </div>
                    <span className="text-blue-100 font-medium">Remaining</span>
                  </div>
                  <p className="text-4xl font-bold">
                    {totalSections - completedSections}
                  </p>
                  <p className="text-blue-100 text-sm mt-1">sections to go</p>
                </div>
              </motion.div>

              {/* Time */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 text-white"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="text-purple-100 font-medium">
                      Time Left
                    </span>
                  </div>
                  <p className="text-4xl font-bold">
                    {formatTime(timeStats.remainingMinutes)}
                  </p>
                  <p className="text-purple-100 text-sm mt-1">to complete</p>
                </div>
              </motion.div>
            </div>

            {/* Content Types */}
            {contentTypeItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Content Breakdown
                  </h3>
                  <span className="text-sm text-slate-500">
                    {contentTypeItems.reduce((acc, item) => acc + item.count, 0)}{" "}
                    total items
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                      >
                        <item.icon className={cn("h-5 w-5", item.color)} />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                          {item.count}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.type}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Chapter Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Chapter Progress
                </h3>
              </div>

              <div className="space-y-3">
                {chapterProgress.map((chapter, index) => (
                  <motion.div
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
                      >
                        {chapter.isComplete ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          chapter.position
                        )}
                      </div>

                      {/* Title and Progress */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900 dark:text-white truncate pr-4">
                            {chapter.title}
                          </h4>
                          <span className="text-sm text-slate-500 whitespace-nowrap">
                            {chapter.completed}/{chapter.total}
                          </span>
                        </div>
                        <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
                      <div className="text-right">
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
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Weekly Activity (Placeholder) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                This Week&apos;s Activity
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, index) => {
                    const activity = Math.random() > 0.3;
                    return (
                      <motion.div
                        key={day}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * index }}
                        className="text-center"
                      >
                        <div
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center text-sm font-medium mb-1 transition-colors",
                            activity
                              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          )}
                        >
                          {activity ? (
                            <Zap className="h-4 w-4" />
                          ) : (
                            <span className="text-xs">{day[0]}</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{day}</span>
                      </motion.div>
                    );
                  }
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
