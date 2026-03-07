"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLearningMode } from "../../../../_components/learning-mode-context";
import {
  CheckCircle2,
  Circle,
  Lock,
  PlayCircle,
  BookOpen,
  Download,
  Clock,
  PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type {
  LearningPageData,
  LearningPageChapter,
  LearningPageSection,
} from "@/lib/queries/learning-queries";
import type { user_progress } from "@prisma/client";

interface SectionSidebarProps {
  course: LearningPageData;
  currentChapter: LearningPageChapter;
  currentSection: LearningPageSection;
  courseId: string;
  chapterId: string;
  sectionId: string;
  userProgress?: user_progress | null;
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
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Progress</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              className="h-7 px-2.5 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              title="Collapse sidebar (Ctrl+B)"
            >
              <PanelRightClose className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs font-medium">Hide</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Course Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-600 dark:text-slate-400">Course</span>
              <span className="text-xs font-medium text-slate-900 dark:text-white">
                {Math.round(courseProgress)}%
              </span>
            </div>
            <Progress value={courseProgress} className="h-1.5" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {completedSections} of {totalSections} sections
            </p>
          </div>

          {/* Section Progress */}
          {canTrackProgress && sectionProgress > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">This Section</span>
                <span className="text-xs font-medium text-slate-900 dark:text-white">
                  {Math.round(sectionProgress)}%
                </span>
              </div>
              <Progress value={sectionProgress} className="h-1.5" />
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-3 pt-2">
            <div className="flex-1 text-center p-2.5 rounded-md bg-slate-50 dark:bg-slate-800">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{completedSections}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Done</p>
            </div>
            <div className="flex-1 text-center p-2.5 rounded-md bg-slate-50 dark:bg-slate-800">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{totalSections - completedSections}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Left</p>
            </div>
          </div>

          {/* Motivational micro-copy */}
          {completedSections === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Ready to start? Complete your first section!
            </p>
          )}
          {completedSections > 0 && completedSections < totalSections && (
            <p className="text-xs text-[hsl(var(--learning-accent))] text-center font-medium">
              {completedSections === 1 ? "Great start!" : `${Math.round(courseProgress)}% done — keep going!`}
            </p>
          )}
          {completedSections === totalSections && totalSections > 0 && (
            <p className="text-xs text-[hsl(var(--learning-accent))] text-center font-medium">
              Course complete — congratulations!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Chapter Navigation */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Chapter</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-full">
            {currentChapter.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="p-3 space-y-0.5">
              {currentChapter.sections.map((section) => {
                const isCurrentSection = section.id === sectionId;
                const isCompleted = section.user_progress?.some(
                  (p) => p.isCompleted
                );
                const isLocked = !section.isFree && !isEnrolled;

                return (
                  <Link
                    key={section.id}
                    href={`/courses/${courseId}/learn/${chapterId}/sections/${section.id}`}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-md transition-colors overflow-hidden",
                      isCurrentSection
                        ? "bg-slate-100 dark:bg-slate-800"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      isLocked && "opacity-50 pointer-events-none"
                    )}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-[hsl(var(--learning-accent))]" />
                      ) : isLocked ? (
                        <Lock className="h-4 w-4 text-slate-400" />
                      ) : isCurrentSection ? (
                        <PlayCircle className="h-4 w-4 text-slate-900 dark:text-white" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className={cn(
                        "text-sm leading-snug text-slate-700 dark:text-slate-300",
                        isCurrentSection && "font-medium text-slate-900 dark:text-white"
                      )}>
                        {section.title}
                      </p>
                      {section.duration && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {Math.floor(section.duration / 60)}m
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Resources Card */}
      {currentSection.resourceUrls && (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Resources</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              asChild
            >
              <Link href={currentSection.resourceUrls} target="_blank">
                <Download className="h-4 w-4 mr-2" />
                Course Materials
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
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
