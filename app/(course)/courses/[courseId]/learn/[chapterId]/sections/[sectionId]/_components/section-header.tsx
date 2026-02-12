"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Home,
  BookOpen,
  ChevronRight,
  Settings,
  Pencil,
  LogOut,
  CheckCircle,
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
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleExitLearning = () => {
    router.push(`/courses/${course.id}`);
  };

  const handleSwitchToTeacher = () => {
    if (isPreviewMode) {
      router.push(`/teacher/courses/${course.id}/chapters/${chapter.id}/section/${section.id}`);
    }
  };

  const isCompleted = progress >= 100;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-200 border-b",
        isScrolled
          ? "bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800"
          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Main Header Row */}
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Left: Breadcrumb Navigation */}
          <nav className="flex items-center min-w-0 flex-1 text-sm">
            <Link
              href="/dashboard/user/my-courses"
              className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
            >
              <Home className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Courses</span>
            </Link>

            <ChevronRight className="h-3.5 w-3.5 mx-2 text-slate-300 dark:text-slate-600 flex-shrink-0" />

            <Link
              href={`/courses/${course.id}/learn`}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors truncate max-w-[120px] sm:max-w-[200px]"
            >
              {course.title}
            </Link>

            <ChevronRight className="h-3.5 w-3.5 mx-2 text-slate-300 dark:text-slate-600 flex-shrink-0 hidden sm:block" />

            <span className="hidden sm:block text-slate-900 dark:text-white font-medium truncate max-w-[200px]">
              {section.title}
            </span>
          </nav>

          {/* Center: Progress Indicator */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800">
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Instructor Badge - Subtle and professional */}
            {isPreviewMode && (
              <Badge
                variant="outline"
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <Pencil className="h-3 w-3" />
                Instructor View
              </Badge>
            )}

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  Navigation
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/courses/${course.id}/learn`} className="cursor-pointer">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Course Overview
                  </Link>
                </DropdownMenuItem>
                {isPreviewMode && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                      Instructor
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleSwitchToTeacher} className="cursor-pointer">
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit This Section
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleExitLearning}
                  className="text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Exit Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Exit Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExitLearning}
              className="hidden sm:flex items-center gap-1.5 h-8 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline text-sm">Exit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar - Minimal and elegant */}
      <div className="h-0.5 bg-slate-100 dark:bg-slate-800">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out",
            isCompleted
              ? "bg-emerald-500"
              : "bg-slate-900 dark:bg-white"
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </header>
  );
}