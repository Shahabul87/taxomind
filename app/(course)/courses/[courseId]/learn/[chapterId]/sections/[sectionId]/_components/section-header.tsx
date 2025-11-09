"use client";

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
  const handleExitLearning = () => {
    window.location.href = `/courses/${course.id}`;
  };

  const handleSwitchToTeacher = () => {
    if (isPreviewMode) {
      window.location.href = `/teacher/courses/${course.id}/chapters/${chapter.id}/section/${section.id}`;
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
      {/* Main Header */}
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center min-w-0 flex-1">
            <Link
              href="/my-courses"
              className="flex items-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
            >
              <Home className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">My Courses</span>
            </Link>

            <ChevronRight className="h-4 w-4 mx-1 sm:mx-2 text-slate-500 dark:text-slate-400 flex-shrink-0" />

            <Link
              href={`/courses/${course.id}`}
              className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors truncate max-w-[100px] sm:max-w-[150px] lg:max-w-none"
            >
              {course.title}
            </Link>

            <ChevronRight className="h-4 w-4 mx-1 sm:mx-2 text-slate-500 dark:text-slate-400 flex-shrink-0" />

            <Link
              href={`/courses/${course.id}/learn/${chapter.id}`}
              className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors truncate max-w-[80px] sm:max-w-[120px] lg:max-w-none"
            >
              {chapter.title}
            </Link>

            <ChevronRight className="h-4 w-4 mx-1 sm:mx-2 text-slate-500 dark:text-slate-400 flex-shrink-0" />

            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-[150px] lg:max-w-none">
              {section.title}
            </span>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isPreviewMode && (
              <>
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 hidden sm:flex items-center gap-1 border-0"
                >
                  <Monitor className="h-3 w-3" />
                  Preview Mode
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSwitchToTeacher}
                  className="hidden sm:flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden lg:inline">Edit Section</span>
                </Button>
              </>
            )}

            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Learning Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Course Overview
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
                  className="text-red-600"
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
              className="hidden sm:flex text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar - Animated Shimmer like login page */}
      <div className="h-1 bg-slate-200/70 dark:bg-slate-700/70 relative overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out relative overflow-hidden",
            "bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500",
            "animate-shimmer"
          )}
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundSize: "200%"
          }}
        />
      </div>
    </div>
  );
}