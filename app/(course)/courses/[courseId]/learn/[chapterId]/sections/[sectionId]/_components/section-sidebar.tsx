"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLearningMode } from "../../../../_components/learning-mode-context";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lock,
  PlayCircle,
  BookOpen,
  Download,
  Clock,
  Target,
  Award,
  TrendingUp,
  PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SectionSidebarProps {
  course: any;
  currentChapter: any;
  currentSection: any;
  courseId: string;
  chapterId: string;
  sectionId: string;
  userProgress?: any;
  totalSections: number;
  completedSections: number;
  onToggle: () => void;
}

export function SectionSidebar({
  course,
  currentChapter,
  currentSection,
  courseId,
  chapterId,
  sectionId,
  userProgress,
  totalSections,
  completedSections,
  onToggle,
}: SectionSidebarProps) {
  const { canTrackProgress, isEnrolled } = useLearningMode();

  const courseProgress = (completedSections / totalSections) * 100;
  const sectionProgress = userProgress?.progressPercent || 0;

  return (
    <div className="space-y-4">
      

      {/* Progress Overview Card */}
      <Card className="bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">Your Progress</CardTitle>
            <Button
              size="sm"
              onClick={onToggle}
              className="group bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 dark:from-slate-600 dark:to-slate-700 dark:hover:from-slate-700 dark:hover:to-slate-800 text-white shadow-md hover:shadow-lg transition-all duration-200 border-0 h-8"
              title="Collapse sidebar (Ctrl+B)"
            >
              <PanelRightClose className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-xs">Collapse</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Course Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Course Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(courseProgress)}%
              </span>
            </div>
            <Progress value={courseProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {completedSections} of {totalSections} sections completed
            </p>
          </div>

          {/* Section Progress */}
          {canTrackProgress && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Section Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(sectionProgress)}%
                </span>
              </div>
              <Progress value={sectionProgress} className="h-2" />
            </div>
          )}

          <Separator />

          {/* Stats - Matching login page gradient stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="group relative overflow-hidden text-center p-3 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-blue-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-white" />
                <p className="text-lg font-bold text-white">{completedSections}</p>
                <p className="text-xs text-white/80">Completed</p>
              </div>
            </div>
            <div className="group relative overflow-hidden text-center p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <Target className="h-4 w-4 mx-auto mb-1 text-white" />
                <p className="text-lg font-bold text-white">{totalSections - completedSections}</p>
                <p className="text-xs text-white/80">Remaining</p>
              </div>
            </div>
          </div>

          {/* Achievement Badge */}
          {courseProgress >= 80 && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border border-yellow-200/60 dark:border-yellow-800/50">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Almost There!</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Complete {totalSections - completedSections} more sections
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chapter Navigation - Sticky */}
      <div className="sticky top-4 z-20">
      <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900 dark:text-white">Chapter Content</CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
              {currentChapter.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-4 space-y-1">
              {currentChapter.sections.map((section: any) => {
                const isCurrentSection = section.id === sectionId;
                const isCompleted = section.user_progress?.some(
                  (p: any) => p.isCompleted
                );
                const isLocked = !section.isFree && !isEnrolled;

                return (
                  <Link
                    key={section.id}
                    href={`/courses/${courseId}/learn/${chapterId}/sections/${section.id}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      isCurrentSection
                        ? "bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/60 dark:border-blue-800/50"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      isLocked && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-[#22c55e] dark:text-[#4ade80]" />
                      ) : isLocked ? (
                        <Lock className="h-5 w-5 text-slate-400" />
                      ) : isCurrentSection ? (
                        <PlayCircle className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        isCurrentSection && "font-semibold"
                      )}>
                        {section.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {section.duration && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.floor(section.duration / 60)}m
                          </span>
                        )}
                        {section.type && (
                          <Badge variant="secondary" className="h-4 text-[10px] px-1">
                            {section.type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      </div>

      {/* Resources Card */}
      {currentSection.resourceUrls && (
        <Card className="bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900 dark:text-white">Downloads & Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={currentSection.resourceUrls} target="_blank">
                  <Download className="h-4 w-4 mr-2" />
                  Course Materials
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card className="bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900 dark:text-white">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            asChild
          >
            <Link href={`/courses/${courseId}`}>
              <BookOpen className="h-4 w-4 mr-2" />
              Course Overview
            </Link>
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
