"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import parse from "html-react-parser";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Play,
  ChevronRight,
  Target,
  Video,
  FileText,
  Code,
  Brain,
  Zap,
  Trophy,
  Lock,
  Sparkles,
  Calendar,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// SAM AI Components
import { GoalPlanner } from "@/components/sam/goal-planner";
import { ScaffoldingStrategyPanel } from "@/components/sam/ScaffoldingStrategyPanel";
import { DailyPlanWidget } from "@/components/sam/plans/DailyPlanWidget";
import { ConfidenceIndicator } from "@/components/sam/confidence/ConfidenceIndicator";
import { SAMQuickActions } from "@/components/sam/SAMQuickActions";
import { useSAMPageContext } from "@sam-ai/react";

interface Section {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  type?: string | null;
  duration?: number | null;
  isPublished?: boolean;
  isFree?: boolean;
  isPreview?: boolean;
  user_progress?: Array<{ isCompleted: boolean }>;
}

interface Chapter {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  isPublished?: boolean;
  sections: Section[];
}

interface Course {
  id: string;
  title: string;
  imageUrl?: string | null;
  chapters: Chapter[];
}

interface EnterpriseChapterViewProps {
  chapter: Chapter;
  course: Course;
  userId: string;
}

// Get icon for section type
const getSectionIcon = (type?: string | null) => {
  switch (type?.toLowerCase()) {
    case "video":
      return Video;
    case "article":
    case "blog":
      return FileText;
    case "code":
      return Code;
    case "quiz":
    case "exam":
      return Brain;
    default:
      return BookOpen;
  }
};

// Parse HTML content
const parseOptions = {
  replace: (domNode: any) => {
    if (domNode.type === "tag") {
      const getContent = (node: any): string => {
        if (!node.children) return "";
        return node.children
          .map((child: any) => {
            if (child.type === "text") return child.data;
            if (child.type === "tag") {
              const innerContent = getContent(child);
              switch (child.name) {
                case "strong":
                  return `<strong>${innerContent}</strong>`;
                case "em":
                  return `<em>${innerContent}</em>`;
                case "code":
                  return `<code>${innerContent}</code>`;
                case "a":
                  return `<a href="${child.attribs.href}">${innerContent}</a>`;
                default:
                  return innerContent;
              }
            }
            return "";
          })
          .join("");
      };

      const content = getContent(domNode);

      switch (domNode.name) {
        case "h1":
          return (
            <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              {parse(content)}
            </h1>
          );
        case "h2":
          return (
            <h2 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">
              {parse(content)}
            </h2>
          );
        case "p":
          return (
            <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {parse(content)}
            </p>
          );
        case "ul":
          return (
            <ul className="list-disc ml-6 mb-4 space-y-2 text-slate-600 dark:text-slate-300">
              {domNode.children
                .filter(
                  (child: any) => child.type === "tag" && child.name === "li"
                )
                .map((child: any, index: number) => (
                  <li key={index}>{parse(getContent(child))}</li>
                ))}
            </ul>
          );
        case "ol":
          return (
            <ol className="list-decimal ml-6 mb-4 space-y-2 text-slate-600 dark:text-slate-300">
              {domNode.children
                .filter(
                  (child: any) => child.type === "tag" && child.name === "li"
                )
                .map((child: any, index: number) => (
                  <li key={index}>{parse(getContent(child))}</li>
                ))}
            </ol>
          );
        case "strong":
          return (
            <strong className="font-bold text-slate-900 dark:text-slate-100">
              {parse(content)}
            </strong>
          );
        case "em":
          return (
            <em className="italic text-slate-700 dark:text-slate-300">
              {parse(content)}
            </em>
          );
        case "a":
          return (
            <a
              href={domNode.attribs.href}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {parse(content)}
            </a>
          );
        case "code":
          return (
            <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md font-mono text-sm text-indigo-600 dark:text-indigo-400">
              {parse(content)}
            </code>
          );
        case "blockquote":
          return (
            <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-slate-600 dark:text-slate-400 my-4">
              {parse(content)}
            </blockquote>
          );
        default:
          return parse(content);
      }
    }
  },
};

export function EnterpriseChapterView({
  chapter,
  course,
  userId,
}: EnterpriseChapterViewProps) {
  const currentIndex = course.chapters.findIndex((c) => c.id === chapter.id);
  const nextChapter = course.chapters[currentIndex + 1];
  const previousChapter = course.chapters[currentIndex - 1];

  // Calculate chapter progress
  const { completedSections, totalSections, progressPercentage } =
    useMemo(() => {
      const total = chapter.sections.length;
      const completed = chapter.sections.filter((s) =>
        s.user_progress?.some((p) => p.isCompleted)
      ).length;
      return {
        completedSections: completed,
        totalSections: total,
        progressPercentage: total > 0 ? (completed / total) * 100 : 0,
      };
    }, [chapter.sections]);

  // Calculate total duration
  const totalDuration = useMemo(() => {
    return chapter.sections.reduce(
      (acc, section) => acc + (section.duration || 10),
      0
    );
  }, [chapter.sections]);

  // SAM Page Context - Track chapter learning context
  const { updatePage } = useSAMPageContext();

  useEffect(() => {
    updatePage({
      type: "chapter-learning",
      path: `/courses/${course.id}/learn/${chapter.id}`,
      entityId: chapter.id,
      parentEntityId: course.id,
      metadata: {
        entityType: 'chapter',
        entityData: {
          title: chapter.title,
          description: chapter.description ?? null,
          position: chapter.position,
          courseId: course.id,
          courseTitle: course.title,
          sectionCount: chapter.sections.length,
          sections: chapter.sections.map((section) => ({
            id: section.id,
            title: section.title,
            isPublished: section.isPublished,
          })),
        },
        courseId: course.id,
        courseTitle: course.title,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        chapterPosition: chapter.position,
        totalSections,
        completedSections,
        progressPercentage,
      },
    });
  }, [
    updatePage,
    course.id,
    course.title,
    chapter.id,
    chapter.title,
    chapter.description,
    chapter.position,
    chapter.sections,
    totalSections,
    completedSections,
    progressPercentage,
  ]);

  // Find next incomplete section
  const nextSection = useMemo(() => {
    return chapter.sections.find(
      (s) => !s.user_progress?.some((p) => p.isCompleted)
    );
  }, [chapter.sections]);

  const isChapterComplete = progressPercentage === 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Chapter Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-white/70 text-sm mb-6"
          >
            <Link
              href={`/courses/${course.id}/learn`}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              {course.title}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white font-medium">Chapter {chapter.position}</span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              {/* Chapter Badge */}
              <Badge className="mb-4 bg-white/10 text-white border-white/20 backdrop-blur-sm">
                Chapter {chapter.position} of {course.chapters.length}
              </Badge>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                {chapter.title}
              </h1>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{chapter.sections.length} sections</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {totalDuration > 60
                      ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`
                      : `${totalDuration}m`}
                  </span>
                </div>
                {isChapterComplete && (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Trophy className="h-4 w-4" />
                    <span>Completed</span>
                  </div>
                )}
              </div>

              {/* Continue Button */}
              {nextSection && (
                <Link
                  href={`/courses/${course.id}/learn/${chapter.id}/sections/${nextSection.id}`}
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/30 group"
                  >
                    <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    {completedSections > 0 ? "Continue Learning" : "Start Chapter"}
                    <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
            </motion.div>

            {/* Right - Progress Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <div className="text-center mb-4">
                  <div className="relative inline-flex">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-white/10"
                      />
                      <motion.circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="url(#chapterProgress)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "0 302" }}
                        animate={{
                          strokeDasharray: `${(progressPercentage / 100) * 302} 302`,
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient
                          id="chapterProgress"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-white/80 text-sm">
                  <p>
                    {completedSections} of {totalSections} sections completed
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 30L60 25C120 20 240 10 360 15C480 20 600 40 720 45C840 50 960 40 1080 35C1200 30 1320 30 1380 30L1440 30V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0V30Z"
              className="fill-slate-50 dark:fill-slate-900"
            />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Chapter Description */}
        {chapter.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-indigo-500" />
                  About This Chapter
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {parse(chapter.description, parseOptions)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* SAM AI Learning Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-12"
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                SAM AI Learning Assistant
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Personalized learning support for this chapter
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Top Row: Confidence & Daily Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mastery/Readiness Indicator */}
                <div className="p-4 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-blue-200/50 dark:border-blue-800/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-blue-500" />
                      Chapter Readiness
                    </h3>
                    <ConfidenceIndicator
                      confidence={progressPercentage / 100}
                      mode="badge"
                      size="sm"
                      showPercentage
                      category="knowledge"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <ConfidenceIndicator
                      confidence={progressPercentage / 100}
                      mode="meter"
                      size="md"
                      animated
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {progressPercentage === 0
                          ? "Start learning to build mastery"
                          : progressPercentage < 50
                            ? "Building foundational knowledge"
                            : progressPercentage < 100
                              ? "Good progress! Keep going"
                              : "Chapter mastered!"}
                      </p>
                      <div className="text-xs text-slate-500">
                        {completedSections} of {totalSections} sections complete
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Plan Widget - Compact */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    Today&apos;s Focus
                  </h3>
                  <DailyPlanWidget
                    compact
                    dailyGoalMinutes={30}
                    todayStudyMinutes={Math.round((progressPercentage / 100) * 30)}
                    className="border border-amber-200/50 dark:border-amber-800/30"
                  />
                </div>
              </div>

              {/* Bottom Row: Scaffolding & Goal Planner */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Readiness Check - ScaffoldingStrategyPanel Compact */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    Learning Readiness
                  </h3>
                  <ScaffoldingStrategyPanel
                    userId={userId}
                    courseId={course.id}
                    compact
                    className="border border-purple-200/50 dark:border-purple-800/30"
                  />
                </div>

                {/* Goal Planner for Chapter */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    Chapter Goals
                  </h3>
                  <GoalPlanner
                    courseId={course.id}
                    chapterId={chapter.id}
                    compact
                    maxGoals={3}
                    className="border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg p-3 bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
              </div>

              {/* SAM Quick Actions - AI-powered learning assistance */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Quick Actions
                </h3>
                <SAMQuickActions
                  variant="compact"
                  context={{
                    courseId: course.id,
                    chapterId: chapter.id,
                    topicName: chapter.title,
                  }}
                  categories={['learning', 'help', 'practice']}
                  maxActions={5}
                  className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-2 border border-amber-200/50 dark:border-amber-800/30"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sections List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="h-6 w-6 text-indigo-500" />
              Chapter Sections
            </h2>
            <span className="text-sm text-slate-500">
              {completedSections}/{totalSections} completed
            </span>
          </div>

          <div className="space-y-4">
            {chapter.sections.map((section, index) => {
              const isCompleted = section.user_progress?.some(
                (p) => p.isCompleted
              );
              const SectionIcon = getSectionIcon(section.type);
              const isNext = nextSection?.id === section.id;

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Link
                    href={`/courses/${course.id}/learn/${chapter.id}/sections/${section.id}`}
                    className="block group"
                  >
                    <Card
                      className={cn(
                        "border-2 transition-all duration-300 hover:shadow-xl",
                        isCompleted
                          ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10"
                          : isNext
                            ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/10 ring-2 ring-indigo-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                      )}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          {/* Section Number/Status */}
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                              isCompleted
                                ? "bg-emerald-500 text-white"
                                : isNext
                                  ? "bg-indigo-500 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-6 w-6" />
                            ) : (
                              <span className="text-lg font-bold">{index + 1}</span>
                            )}
                          </div>

                          {/* Section Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={cn(
                                  "font-semibold text-lg transition-colors truncate",
                                  isCompleted
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                                )}
                              >
                                {section.title}
                              </h3>
                              {isNext && (
                                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-0">
                                  Up Next
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1">
                                <SectionIcon className="h-4 w-4" />
                                <span className="capitalize">
                                  {section.type || "Lesson"}
                                </span>
                              </div>
                              {section.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{section.duration} min</span>
                                </div>
                              )}
                              {section.isFree && (
                                <Badge
                                  variant="secondary"
                                  className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                >
                                  Free Preview
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Action */}
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-600 dark:text-emerald-400"
                              >
                                Review
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className={cn(
                                  isNext
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                )}
                              >
                                {isNext ? (
                                  <>
                                    <Play className="h-4 w-4 mr-1" />
                                    Start
                                  </>
                                ) : (
                                  <>
                                    View
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Chapter Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between">
            {previousChapter ? (
              <Link href={`/courses/${course.id}/learn/${previousChapter.id}`}>
                <Button variant="outline" className="group">
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  <div className="text-left">
                    <p className="text-xs text-slate-500">Previous Chapter</p>
                    <p className="font-medium truncate max-w-[200px]">
                      {previousChapter.title}
                    </p>
                  </div>
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {nextChapter ? (
              <Link href={`/courses/${course.id}/learn/${nextChapter.id}`}>
                <Button variant="outline" className="group">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Next Chapter</p>
                    <p className="font-medium truncate max-w-[200px]">
                      {nextChapter.title}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <Link href={`/courses/${course.id}/learn`}>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white group">
                  <Trophy className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
