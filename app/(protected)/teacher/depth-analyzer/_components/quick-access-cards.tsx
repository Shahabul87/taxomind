"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  ChevronRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// Types
interface Section {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  position: number;
}

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  position: number;
  sections: Section[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  updatedAt: Date;
  whatYouWillLearn: string[];
  chapters: Chapter[];
}

interface RecentAnalysis {
  id: string;
  courseId: string;
  cognitiveDepth: number | null;
  analyzedAt: Date;
  course: {
    title: string;
  };
}

interface QuickAccessCardsProps {
  recentAnalyses: RecentAnalysis[];
  courses: Course[];
  onItemClick: (type: string, id: string) => void;
}

export function QuickAccessCards({
  recentAnalyses,
  courses,
  onItemClick,
}: QuickAccessCardsProps) {
  // Calculate courses without analysis
  const coursesWithAnalysis = useMemo(() => {
    return new Set(recentAnalyses.map((a) => a.courseId));
  }, [recentAnalyses]);

  const coursesWithoutAnalysis = useMemo(() => {
    return courses.filter((c) => !coursesWithAnalysis.has(c.id));
  }, [courses, coursesWithAnalysis]);

  // Calculate low score courses
  const lowScoreCourses = useMemo(() => {
    return recentAnalyses.filter(
      (a) => a.cognitiveDepth !== null && a.cognitiveDepth < 60
    );
  }, [recentAnalyses]);

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-slate-500";
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return "bg-slate-100 dark:bg-slate-800";
    if (score >= 80) return "bg-emerald-100 dark:bg-emerald-900/30";
    if (score >= 60) return "bg-amber-100 dark:bg-amber-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  return (
    <div className="space-y-4">
      {/* Recent Analyses */}
      <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 shadow-lg">
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Recent Analyses
            </h3>
            {recentAnalyses.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-auto bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              >
                {recentAnalyses.length}
              </Badge>
            )}
          </div>
        </div>
        <ScrollArea className="h-48">
          <div className="p-3 space-y-2">
            {recentAnalyses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No recent analyses
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Start by analyzing a course
                </p>
              </div>
            ) : (
              recentAnalyses.map((analysis) => (
                <motion.button
                  key={analysis.id}
                  whileHover={{ x: 4 }}
                  onClick={() => onItemClick("course", analysis.courseId)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left group"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold",
                      getScoreBg(analysis.cognitiveDepth),
                      getScoreColor(analysis.cognitiveDepth)
                    )}
                  >
                    {analysis.cognitiveDepth ?? "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {analysis.course.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(analysis.analyzedAt, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </motion.button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Needs Improvement */}
      <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 shadow-lg">
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Needs Improvement
            </h3>
            {lowScoreCourses.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              >
                {lowScoreCourses.length}
              </Badge>
            )}
          </div>
        </div>
        <ScrollArea className="h-36">
          <div className="p-3 space-y-2">
            {lowScoreCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <TrendingUp className="h-6 w-6 text-emerald-400 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  All courses are performing well!
                </p>
              </div>
            ) : (
              lowScoreCourses.map((analysis) => (
                <motion.button
                  key={analysis.id}
                  whileHover={{ x: 4 }}
                  onClick={() => onItemClick("course", analysis.courseId)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left group"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold",
                      "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    )}
                  >
                    {analysis.cognitiveDepth}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {analysis.course.title}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </motion.button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Not Analyzed */}
      <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 shadow-lg">
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-500/5 to-slate-400/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-500/20">
              <HelpCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Not Analyzed
            </h3>
            {coursesWithoutAnalysis.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-auto bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                {coursesWithoutAnalysis.length}
              </Badge>
            )}
          </div>
        </div>
        <ScrollArea className="h-36">
          <div className="p-3 space-y-2">
            {coursesWithoutAnalysis.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <BookOpen className="h-6 w-6 text-emerald-400 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  All courses analyzed!
                </p>
              </div>
            ) : (
              coursesWithoutAnalysis.slice(0, 5).map((course) => (
                <motion.button
                  key={course.id}
                  whileHover={{ x: 4 }}
                  onClick={() => onItemClick("course", course.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left group"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700">
                    <HelpCircle className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {course.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {course.chapters.length} chapters
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </motion.button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
