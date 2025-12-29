"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  BookOpen,
  Timer,
  Bookmark,
  Target,
  Brain,
  Flame,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Focus,
} from "lucide-react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  chapters: Array<{
    id: string;
    title: string;
    position: number;
    sections: Array<{
      id: string;
      title: string;
      position: number;
      user_progress?: Array<{ isCompleted: boolean }>;
    }>;
  }>;
}

interface MobileNavigationDrawerProps {
  course: Course;
  userId: string;
  currentSectionId?: string;
  progressPercentage: number;
  completedSections: number;
  totalSections: number;
}

type DrawerTab = "navigation" | "tools" | "bookmarks";

/**
 * Mobile navigation drawer for the learning dashboard
 * Provides sidebar functionality on mobile devices
 */
export function MobileNavigationDrawer({
  course,
  userId,
  currentSectionId,
  progressPercentage,
  completedSections,
  totalSections,
}: MobileNavigationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>("navigation");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [bookmarkedSections, setBookmarkedSections] = useState<Set<string>>(new Set());

  // Study timer state
  const [studyTime, setStudyTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setStudyTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Format time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleChapter = useCallback((chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((sectionId: string) => {
    setBookmarkedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Find next incomplete section
  const findNextSection = () => {
    for (const chapter of course.chapters) {
      for (const section of chapter.sections) {
        if (!section.user_progress?.some((p) => p.isCompleted)) {
          return { chapter, section };
        }
      }
    }
    return null;
  };

  const nextSection = findNextSection();

  const tabs: { id: DrawerTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "navigation", label: "Navigation", icon: BookOpen },
    { id: "tools", label: "Tools", icon: Timer },
    { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 z-50 xl:hidden h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 text-white"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 bg-slate-50 dark:bg-slate-900"
      >
        <SheetHeader className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Learning Tools
            </SheetTitle>
          </div>

          {/* Progress Summary */}
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Course Progress
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {completedSections} of {totalSections} sections completed
            </p>
          </div>
        </SheetHeader>

        {/* Tab Navigation */}
        <div
          role="tablist"
          aria-label="Drawer sections"
          className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`drawer-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500",
                activeTab === tab.id
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <tab.icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <ScrollArea className="h-[calc(100vh-220px)]">
          <AnimatePresence mode="wait">
            {/* Navigation Tab */}
            {activeTab === "navigation" && (
              <motion.div
                key="navigation"
                id="drawer-panel-navigation"
                role="tabpanel"
                aria-labelledby="tab-navigation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                {/* Continue Learning */}
                {nextSection && (
                  <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 border-0 shadow-lg">
                    <CardContent className="p-4">
                      <SheetClose asChild>
                        <Link
                          href={`/courses/${course.id}/learn/${nextSection.chapter.id}/sections/${nextSection.section.id}`}
                          className="block focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
                        >
                          <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                              <Play className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">Continue Learning</p>
                              <p className="text-xs text-emerald-100 truncate">
                                {nextSection.section.title}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-emerald-200" aria-hidden="true" />
                          </div>
                        </Link>
                      </SheetClose>
                    </CardContent>
                  </Card>
                )}

                {/* Chapter List */}
                <div className="space-y-2" role="tree" aria-label="Course chapters">
                  {course.chapters.map((chapter) => {
                    const isExpanded = expandedChapters.has(chapter.id);
                    const chapterProgress = chapter.sections.filter((s) =>
                      s.user_progress?.some((p) => p.isCompleted)
                    ).length;
                    const chapterPercentage =
                      chapter.sections.length > 0
                        ? (chapterProgress / chapter.sections.length) * 100
                        : 0;

                    return (
                      <div
                        key={chapter.id}
                        className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                        role="treeitem"
                        aria-expanded={isExpanded}
                        aria-selected={isExpanded}
                      >
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                          )}
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {chapter.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={chapterPercentage} className="h-1 flex-1" />
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {chapterProgress}/{chapter.sections.length}
                              </span>
                            </div>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-slate-100 dark:border-slate-700"
                              role="group"
                            >
                              {chapter.sections.map((section) => {
                                const isCompleted = section.user_progress?.some(
                                  (p) => p.isCompleted
                                );
                                const isCurrent = section.id === currentSectionId;

                                return (
                                  <li
                                    key={section.id}
                                    role="treeitem"
                                    aria-selected={isCurrent}
                                  >
                                    <SheetClose asChild>
                                      <Link
                                        href={`/courses/${course.id}/learn/${chapter.id}/sections/${section.id}`}
                                        className={cn(
                                          "flex items-center gap-2 p-3 pl-10 text-sm transition-colors",
                                          "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500",
                                          isCurrent
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"
                                        )}
                                        aria-current={isCurrent ? "page" : undefined}
                                      >
                                        {isCompleted ? (
                                          <CheckCircle2
                                            className="h-4 w-4 text-emerald-500 flex-shrink-0"
                                            aria-hidden="true"
                                          />
                                        ) : (
                                          <div
                                            className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0"
                                            aria-hidden="true"
                                          />
                                        )}
                                        <span className="truncate">{section.title}</span>
                                      </Link>
                                    </SheetClose>
                                  </li>
                                );
                              })}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Tools Tab */}
            {activeTab === "tools" && (
              <motion.div
                key="tools"
                id="drawer-panel-tools"
                role="tabpanel"
                aria-labelledby="tab-tools"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                {/* Study Timer */}
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Timer className="h-5 w-5 text-blue-500" aria-hidden="true" />
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          Study Timer
                        </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFocusMode(!isFocusMode)}
                        aria-pressed={isFocusMode}
                        aria-label={isFocusMode ? "Disable focus mode" : "Enable focus mode"}
                        className={cn(
                          "h-8 px-3",
                          isFocusMode && "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                        )}
                      >
                        <Focus className="h-4 w-4 mr-1" aria-hidden="true" />
                        Focus
                      </Button>
                    </div>

                    <div
                      className="text-4xl font-mono font-bold text-center py-4 bg-slate-100 dark:bg-slate-700 rounded-lg mb-4"
                      role="timer"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {formatTime(studyTime)}
                    </div>

                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        aria-label={isTimerRunning ? "Pause timer" : "Start timer"}
                        className="h-10 w-10"
                      >
                        {isTimerRunning ? (
                          <Pause className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Play className="h-5 w-5" aria-hidden="true" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setStudyTime(0);
                          setIsTimerRunning(false);
                        }}
                        aria-label="Reset timer"
                        className="h-10 w-10"
                      >
                        <RotateCcw className="h-5 w-5" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                      Quick Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {completedSections}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Completed
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {totalSections - completedSections}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Remaining
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {course.chapters.length}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Chapters
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {Math.round(progressPercentage)}%
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Progress
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 border-0 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-5 w-5" aria-hidden="true" />
                      <h3 className="font-semibold">AI Tip</h3>
                    </div>
                    <p className="text-sm text-purple-100">
                      {progressPercentage < 25
                        ? "Great start! Try to complete at least one section today to build momentum."
                        : progressPercentage < 50
                          ? "You&apos;re making progress! Consider reviewing your notes from earlier sections."
                          : progressPercentage < 75
                            ? "More than halfway! Take breaks to help retain information better."
                            : "Almost there! Push through to complete the course and earn your certificate!"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Bookmarks Tab */}
            {activeTab === "bookmarks" && (
              <motion.div
                key="bookmarks"
                id="drawer-panel-bookmarks"
                role="tabpanel"
                aria-labelledby="tab-bookmarks"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4"
              >
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Bookmark className="h-5 w-5 text-amber-500" aria-hidden="true" />
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Bookmarked Sections
                      </h3>
                    </div>

                    {bookmarkedSections.size === 0 ? (
                      <div className="text-center py-8">
                        <Bookmark className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" aria-hidden="true" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          No bookmarks yet
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Bookmark sections to quickly access them later
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2" role="list" aria-label="Bookmarked sections">
                        {course.chapters.flatMap((chapter) =>
                          chapter.sections
                            .filter((section) => bookmarkedSections.has(section.id))
                            .map((section) => (
                              <li key={section.id}>
                                <SheetClose asChild>
                                  <Link
                                    href={`/courses/${course.id}/learn/${chapter.id}/sections/${section.id}`}
                                    className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <Bookmark className="h-4 w-4 text-amber-500 flex-shrink-0" aria-hidden="true" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                        {section.title}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {chapter.title}
                                      </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                                  </Link>
                                </SheetClose>
                              </li>
                            ))
                        )}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Floating action button trigger for mobile navigation
 * Can be used separately if needed
 */
export function MobileNavTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 xl:hidden h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 text-white"
      aria-label="Open navigation menu"
    >
      <Menu className="h-6 w-6" aria-hidden="true" />
    </Button>
  );
}
