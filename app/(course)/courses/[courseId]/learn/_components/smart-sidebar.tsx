"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  Brain,
  ChevronRight,
  ChevronDown,
  Timer,
  Coffee,
  BookMarked,
  Sparkles,
  Star,
  Award
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  chapters: Array<{
    id: string;
    title: string;
    position: number;
    sections: Array<{
      id: string;
      title: string;
      position: number;
      duration?: number | null;
      user_progress: Array<{
        isCompleted: boolean;
      }>;
    }>;
  }>;
}

interface SmartSidebarProps {
  course: Course;
  userId: string;
  currentSectionId?: string;
  className?: string;
}

export const SmartSidebar = ({
  course,
  userId,
  currentSectionId,
  className
}: SmartSidebarProps) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [bookmarkedSections, setBookmarkedSections] = useState<Set<string>>(new Set());
  const [studyTime, setStudyTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`bookmarks_${course.id}_${userId}`);
    if (saved) {
      setBookmarkedSections(new Set(JSON.parse(saved)));
    }
  }, [course.id, userId]);

  // Study timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setStudyTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleBookmark = (sectionId: string) => {
    const newBookmarks = new Set(bookmarkedSections);
    if (newBookmarks.has(sectionId)) {
      newBookmarks.delete(sectionId);
    } else {
      newBookmarks.add(sectionId);
    }
    setBookmarkedSections(newBookmarks);
    localStorage.setItem(`bookmarks_${course.id}_${userId}`, JSON.stringify([...newBookmarks]));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate statistics
  const totalSections = course.chapters.reduce((acc, ch) => acc + ch.sections.length, 0);
  const completedSections = course.chapters.reduce((acc, ch) =>
    acc + ch.sections.filter(s => s.user_progress?.some(p => p.isCompleted)).length, 0
  );
  const progressPercentage = (completedSections / totalSections) * 100;

  // Find next incomplete section
  const findNextSection = () => {
    for (const chapter of course.chapters) {
      for (const section of chapter.sections) {
        if (!section.user_progress?.some(p => p.isCompleted)) {
          return { chapter, section };
        }
      }
    }
    return null;
  };

  const nextSection = findNextSection();

  // AI-powered recommendations
  const getRecommendations = () => {
    const bookmarked = course.chapters.flatMap(ch =>
      ch.sections.filter(s => bookmarkedSections.has(s.id))
    );
    const incomplete = course.chapters.flatMap(ch =>
      ch.sections.filter(s => !s.user_progress?.some(p => p.isCompleted))
    );

    return {
      bookmarked: bookmarked.slice(0, 3),
      incomplete: incomplete.slice(0, 3)
    };
  };

  const recommendations = getRecommendations();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Study Timer */}
      <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              <h3 className="font-semibold">Study Timer</h3>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setFocusMode(!focusMode)}
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-center mb-4">
            <motion.p
              key={studyTime}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-4xl font-bold font-mono tracking-wider"
            >
              {formatTime(studyTime)}
            </motion.p>
            <p className="text-purple-100 text-sm mt-1">Total study time today</p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-white/20 hover:bg-white/30 text-white"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setStudyTime(0)}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {focusMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 pt-4 border-t border-white/20"
            >
              <p className="text-sm text-purple-100 flex items-center gap-2">
                <Coffee className="w-4 h-4" />
                Focus mode: Take a 5-min break every 25 minutes
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Next Up */}
      {nextSection && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span>Next Up</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/courses/${course.id}/learn/${nextSection.chapter.id}/sections/${nextSection.section.id}`}
              className="block group"
            >
              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {nextSection.chapter.title}
                </p>
                <h4 className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors line-clamp-2">
                  {nextSection.section.title}
                </h4>
                {nextSection.section.duration && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{nextSection.section.duration} min</span>
                  </div>
                )}
                <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white group-hover:shadow-lg transition-shadow">
                  <Play className="w-4 h-4 mr-2" />
                  Continue Learning
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span>AI Suggestions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.bookmarked.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-yellow-500" />
                Bookmarked Sections
              </h4>
              <div className="space-y-2">
                {recommendations.bookmarked.map((section) => {
                  const chapter = course.chapters.find(ch =>
                    ch.sections.some(s => s.id === section.id)
                  );
                  return (
                    <Link
                      key={section.id}
                      href={`/courses/${course.id}/learn/${chapter?.id}/sections/${section.id}`}
                      className="block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors line-clamp-1">
                        {section.title}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {progressPercentage < 100 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-orange-500" />
                Recommended Next
              </h4>
              <div className="space-y-2">
                {recommendations.incomplete.slice(0, 2).map((section) => {
                  const chapter = course.chapters.find(ch =>
                    ch.sections.some(s => s.id === section.id)
                  );
                  return (
                    <Link
                      key={section.id}
                      href={`/courses/${course.id}/learn/${chapter?.id}/sections/${section.id}`}
                      className="block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors line-clamp-1">
                        {section.title}
                      </p>
                      {section.duration && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {section.duration} min
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Progress Overview */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span>Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Overall</span>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Completed</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {completedSections}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Remaining</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {totalSections - completedSections}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span>Quick Access</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {course.chapters.map((chapter) => {
              const isExpanded = expandedChapters.has(chapter.id);
              const chapterProgress = chapter.sections.filter(s =>
                s.user_progress?.some(p => p.isCompleted)
              ).length;
              const chapterPercentage = (chapterProgress / chapter.sections.length) * 100;

              return (
                <div key={chapter.id} className="space-y-1">
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {chapter.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {chapterProgress}/{chapter.sections.length} sections
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Progress value={chapterPercentage} className="h-1 w-16" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-10 text-right">
                        {Math.round(chapterPercentage)}%
                      </span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pl-7 space-y-1"
                      >
                        {chapter.sections.map((section) => {
                          const isCompleted = section.user_progress?.some(p => p.isCompleted);
                          const isCurrent = section.id === currentSectionId;
                          const isBookmarked = bookmarkedSections.has(section.id);

                          return (
                            <div
                              key={section.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg transition-colors group",
                                isCurrent
                                  ? "bg-blue-100 dark:bg-blue-900/30"
                                  : "hover:bg-slate-100 dark:hover:bg-slate-700"
                              )}
                            >
                              <Link
                                href={`/courses/${course.id}/learn/${chapter.id}/sections/${section.id}`}
                                className="flex items-center gap-2 flex-1 min-w-0"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                )}
                                <span className={cn(
                                  "text-sm truncate",
                                  isCompleted
                                    ? "text-slate-600 dark:text-slate-400 line-through"
                                    : "text-slate-900 dark:text-slate-100"
                                )}>
                                  {section.title}
                                </span>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => toggleBookmark(section.id)}
                              >
                                {isBookmarked ? (
                                  <BookmarkCheck className="w-3 h-3 text-yellow-500" />
                                ) : (
                                  <Bookmark className="w-3 h-3 text-slate-400" />
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
