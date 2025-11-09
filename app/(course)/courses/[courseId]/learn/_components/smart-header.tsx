"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  Target,
  Zap,
  Bell,
  BookmarkPlus,
  Share2,
  Download,
  MoreVertical,
  CheckCircle2,
  Clock,
  Users,
  Star,
  TrendingUp,
  Sparkles,
  Play,
  ChevronRight
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: {
    name: string;
  } | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    Enrollment: number;
  };
  chapters: Array<{
    id: string;
    title: string;
    sections: Array<{
      id: string;
      duration?: number | null;
      user_progress: Array<{
        isCompleted: boolean;
      }>;
    }>;
  }>;
}

interface SmartHeaderProps {
  course: Course;
  progressPercentage: number;
  completedSections: number;
  totalSections: number;
  nextSection?: {
    chapter: { id: string; title: string };
    section: { id: string; title: string };
  } | null;
}

export const SmartHeader = ({
  course,
  progressPercentage,
  completedSections,
  totalSections,
  nextSection
}: SmartHeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [hasNewAchievement, setHasNewAchievement] = useState(false);

  const isCompleted = progressPercentage === 100;
  const estimatedTime = course.chapters.reduce((acc, chapter) => {
    return acc + chapter.sections.reduce((sectionAcc, section) => {
      return sectionAcc + (section.duration || 10);
    }, 0);
  }, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check for achievements
  useEffect(() => {
    const milestones = [10, 25, 50, 75, 100];
    const nearestMilestone = milestones.find(m => m > progressPercentage);
    if (nearestMilestone && progressPercentage >= nearestMilestone - 1) {
      setHasNewAchievement(true);
    }
  }, [progressPercentage]);

  const getProgressColor = () => {
    if (progressPercentage >= 80) return "from-green-500 to-emerald-500";
    if (progressPercentage >= 50) return "from-blue-500 to-indigo-500";
    if (progressPercentage >= 25) return "from-yellow-500 to-orange-500";
    return "from-slate-500 to-slate-600";
  };

  return (
    <motion.div
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl"
          : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-gradient-x"></div>

      {/* Glass morphism effect */}
      <div className="absolute inset-0 backdrop-blur-3xl"></div>

      <div className="relative border-b border-white/20 dark:border-slate-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Header Content */}
          <div className={cn(
            "flex items-center gap-4 transition-all duration-300",
            isScrolled ? "py-3" : "py-6"
          )}>
            {/* Left: Course Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href={`/courses/${course.id}`}
                  className="group flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                  <span className={cn(isScrolled && "hidden sm:inline")}>Back to Course</span>
                </Link>

                {course.category && !isScrolled && (
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-lg"
                  >
                    {course.category.name}
                  </Badge>
                )}

                {hasNewAchievement && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-white text-xs font-bold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>New Achievement!</span>
                  </motion.div>
                )}
              </div>

              <h1
                className={cn(
                  "font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent transition-all duration-300 truncate",
                  isScrolled ? "text-xl" : "text-3xl lg:text-4xl"
                )}
              >
                {course.title}
              </h1>

              {!isScrolled && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-400"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 rounded-full backdrop-blur-sm">
                    <Image
                      src={course.user.image || "/placeholder-avatar.png"}
                      alt={course.user.name || "Instructor"}
                      width={24}
                      height={24}
                      className="rounded-full ring-2 ring-blue-500/20"
                    />
                    <span className="font-medium">by {course.user.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 rounded-full backdrop-blur-sm">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{course._count.Enrollment} students</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 rounded-full backdrop-blur-sm">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">{Math.ceil(estimatedTime / 60)}h total</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Center: Quick Actions (visible when scrolled) */}
            {isScrolled && nextSection && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden lg:block"
              >
                <Link href={`/courses/${course.id}/learn/${nextSection.chapter.id}/sections/${nextSection.section.id}`}>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Continue
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            )}

            {/* Right: Progress Card & Actions */}
            <div className="flex items-center gap-3">
              {/* Compact Progress (when scrolled) */}
              {isScrolled ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-white shadow-lg"
                >
                  <div className="text-right">
                    <p className="text-xs text-blue-100">Progress</p>
                    <p className="text-lg font-bold">{Math.round(progressPercentage)}%</p>
                  </div>
                  {isCompleted ? (
                    <Trophy className="w-6 h-6 text-yellow-300" />
                  ) : (
                    <Target className="w-6 h-6" />
                  )}
                </motion.div>
              ) : (
                /* Full Progress Card (when not scrolled) */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="w-full lg:w-80 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Your Progress</p>
                          <motion.p
                            key={progressPercentage}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-3xl font-bold"
                          >
                            {Math.round(progressPercentage)}%
                          </motion.p>
                        </div>
                        <motion.div
                          animate={{ rotate: isCompleted ? 360 : 0 }}
                          transition={{ duration: 1 }}
                          className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                        >
                          {isCompleted ? (
                            <Trophy className="w-7 h-7 text-yellow-300" />
                          ) : (
                            <Target className="w-7 h-7" />
                          )}
                        </motion.div>
                      </div>

                      <div className="relative mb-4">
                        <Progress
                          value={progressPercentage}
                          className="h-3 bg-blue-600/50 backdrop-blur-sm"
                        />
                        <motion.div
                          className={cn(
                            "absolute top-0 left-0 h-3 bg-gradient-to-r rounded-full",
                            getProgressColor()
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm text-blue-100">
                        <span className="font-medium">{completedSections} of {totalSections} sections</span>
                        {isCompleted && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="text-yellow-300 font-bold flex items-center gap-1"
                          >
                            <Trophy className="w-4 h-4" />
                            Complete!
                          </motion.span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-white/10 dark:hover:bg-slate-800/50"
                  onClick={() => setShowNotification(!showNotification)}
                >
                  <Bell className="w-5 h-5" />
                  {hasNewAchievement && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-white/10 dark:hover:bg-slate-800/50"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>
                      <BookmarkPlus className="w-4 h-4 mr-2" />
                      Bookmark
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Download Certificate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Star className="w-4 h-4 mr-2" />
                      Rate Course
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Mini Progress Bar at Bottom (when scrolled) */}
          {isScrolled && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              style={{ width: `${progressPercentage}%` }}
            />
          )}
        </div>
      </div>

      {/* Notification Panel */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-4 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
          >
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {hasNewAchievement && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Achievement Unlocked!</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      You&apos;re almost at {Math.ceil(progressPercentage / 25) * 25}% completion
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Great Progress!</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    You&apos;ve completed {completedSections} sections
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
