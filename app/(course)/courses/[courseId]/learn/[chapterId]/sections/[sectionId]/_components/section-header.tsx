"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Home,
  BookOpen,
  ChevronRight,
  Monitor,
  Settings,
  Eye,
  LogOut,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

interface SectionHeaderProps {
  course: {
    id: string;
    title: string;
  };
  chapter: {
    id: string;
    title: string;
  };
  section: {
    id: string;
    title: string;
  };
  progress: number;
  isPreviewMode: boolean;
}

export function SectionHeader({
  course,
  chapter,
  section,
  progress,
  isPreviewMode,
}: SectionHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleExitLearning = () => {
    window.location.href = `/courses/${course.id}`;
  };

  const handleSwitchToTeacher = () => {
    if (isPreviewMode) {
      window.location.href = `/teacher/courses/${course.id}/chapters/${chapter.id}/section/${section.id}`;
    }
  };

  const isCompleted = progress >= 100;

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        isScrolled
          ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg"
          : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />

      {/* Main Header */}
      <div className="relative border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Breadcrumb Navigation */}
            <nav className="flex items-center min-w-0 flex-1">
              <Link
                href="/my-courses"
                className="group flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                  <Home className="h-4 w-4" />
                </div>
                <span className="ml-2 hidden sm:inline font-medium">My Courses</span>
              </Link>

              <ChevronRight className="h-4 w-4 mx-2 sm:mx-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />

              <Link
                href={`/courses/${course.id}/learn`}
                className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[100px] sm:max-w-[180px] lg:max-w-none font-medium"
              >
                {course.title}
              </Link>

              <ChevronRight className="h-4 w-4 mx-2 sm:mx-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />

              <Link
                href={`/courses/${course.id}/learn/${chapter.id}`}
                className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[80px] sm:max-w-[150px] lg:max-w-none font-medium"
              >
                {chapter.title}
              </Link>

              <ChevronRight className="h-4 w-4 mx-2 sm:mx-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />

              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-[180px] lg:max-w-none">
                {section.title}
              </span>
            </nav>

            {/* Center: Progress indicator */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-full">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isCompleted
                  ? "bg-emerald-500 text-white"
                  : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              )}>
                {isCompleted ? (
                  <Trophy className="h-4 w-4" />
                ) : (
                  <Target className="h-4 w-4" />
                )}
              </div>
              <div className="text-sm">
                <span className="font-bold text-slate-900 dark:text-white">
                  {Math.round(progress)}%
                </span>
                <span className="text-slate-500 dark:text-slate-400 ml-1">
                  complete
                </span>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isPreviewMode && (
                <>
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 hidden sm:flex items-center gap-1.5 px-3 py-1 shadow-lg shadow-amber-500/20">
                    <Monitor className="h-3.5 w-3.5" />
                    Preview Mode
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwitchToTeacher}
                    className="hidden md:flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden lg:inline">Edit Section</span>
                  </Button>
                </>
              )}

              {/* Settings Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-9 h-9 p-0 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Learning Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/courses/${course.id}/learn`}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Course Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {isPreviewMode && (
                    <DropdownMenuItem onClick={handleSwitchToTeacher}>
                      <Eye className="h-4 w-4 mr-2" />
                      Switch to Teacher View
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleExitLearning}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Exit Learning Mode
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Exit Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExitLearning}
                className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "h-full relative",
            isCompleted
              ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500"
              : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
          )}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </motion.div>

        {/* Progress milestone markers */}
        <div className="absolute inset-0 flex items-center justify-between px-[10%]">
          {[25, 50, 75, 100].map((milestone) => (
            <div
              key={milestone}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                progress >= milestone
                  ? "bg-white shadow-lg"
                  : "bg-slate-300 dark:bg-slate-600"
              )}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}