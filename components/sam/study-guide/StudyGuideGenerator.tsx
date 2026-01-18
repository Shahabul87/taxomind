"use client";

/**
 * StudyGuideGenerator
 *
 * AI-powered personalized study guide generator that analyzes student
 * performance and creates a structured learning plan.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Brain,
  Target,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Calendar,
  Lightbulb,
  FileText,
  Video,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  RefreshCw,
  Download,
  Share2,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { BloomsLevel } from "@prisma/client";

export interface StudyGuideGeneratorProps {
  courseId: string;
  courseTitle: string;
  sectionId?: string;
  examId?: string;
  userId?: string;
  className?: string;
  variant?: "button" | "compact" | "icon";
  onGuideGenerated?: (guide: StudyGuide) => void;
}

export interface StudyGuide {
  overview: string;
  priorityTopics: PriorityTopic[];
  learningActivities: Record<BloomsLevel, string[]>;
  practiceQuestions: string[];
  resources: Resource[];
  studySchedule: Record<string, string[]>;
  improvementTips: string[];
  estimatedTime: number;
}

interface PriorityTopic {
  topic: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

interface Resource {
  type: string;
  title: string;
  description: string;
}

const BLOOMS_COLORS: Record<BloomsLevel, { bg: string; text: string; border: string }> = {
  REMEMBER: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
  UNDERSTAND: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
  APPLY: { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-800" },
  ANALYZE: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
  EVALUATE: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  CREATE: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
};

const PRIORITY_STYLES = {
  high: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300" },
  medium: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  low: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
};

export function StudyGuideGenerator({
  courseId,
  courseTitle,
  sectionId,
  examId,
  userId,
  className,
  variant = "button",
  onGuideGenerated,
}: StudyGuideGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateStudyGuide = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sam/exam-engine/study-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          examId,
          focusAreas: null,
          includeWeakAreas: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate study guide");
      }

      const result = await response.json();

      if (result.success && result.data) {
        setStudyGuide(result.data);
        onGuideGenerated?.(result.data);
        toast.success("Study guide generated successfully!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate study guide";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, examId, onGuideGenerated]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderTriggerButton = () => {
    switch (variant) {
      case "icon":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-lg border-slate-200 dark:border-slate-700",
                    "hover:bg-violet-50 dark:hover:bg-violet-950/30",
                    "hover:border-violet-300 dark:hover:border-violet-700",
                    "transition-colors",
                    className
                  )}
                >
                  <BookOpen className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate Study Guide</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case "compact":
        return (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 border-slate-200 dark:border-slate-700",
              "hover:bg-violet-50 dark:hover:bg-violet-950/30",
              "hover:border-violet-300 dark:hover:border-violet-700",
              className
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Study Guide
          </Button>
        );
      default:
        return (
          <Button
            className={cn(
              "gap-2 bg-gradient-to-r from-violet-600 to-purple-600",
              "hover:from-violet-500 hover:to-purple-500",
              "text-white shadow-sm",
              className
            )}
          >
            <Sparkles className="h-4 w-4" />
            Generate Study Guide
          </Button>
        );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {renderTriggerButton()}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                AI Study Guide
              </SheetTitle>
              <SheetDescription className="text-sm text-slate-500 dark:text-slate-400">
                Personalized learning plan for {courseTitle}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
          <div className="p-6">
            {/* Generate Button - Show when no guide */}
            {!studyGuide && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                  <Brain className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Generate Your Study Guide
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                  SAM will analyze your learning progress and create a personalized study plan based on Bloom&apos;s Taxonomy.
                </p>
                <Button
                  onClick={generateStudyGuide}
                  disabled={isLoading}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Now
                </Button>
              </motion.div>
            )}

            {/* Loading State */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="mx-auto h-16 w-16 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 text-violet-600 dark:text-violet-400 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Analyzing Your Progress...
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  SAM is creating your personalized study guide
                </p>
                <div className="max-w-xs mx-auto mt-6">
                  <Progress value={undefined} className="h-1" />
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Generation Failed
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                  {error}
                </p>
                <Button
                  onClick={generateStudyGuide}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </motion.div>
            )}

            {/* Study Guide Content */}
            {studyGuide && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                    <Clock className="h-4 w-4 mx-auto text-slate-400 mb-1" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatTime(studyGuide.estimatedTime)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Est. Time</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                    <Target className="h-4 w-4 mx-auto text-slate-400 mb-1" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {studyGuide.priorityTopics.length}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Focus Areas</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                    <FileText className="h-4 w-4 mx-auto text-slate-400 mb-1" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {studyGuide.practiceQuestions.length}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Practice Qs</p>
                  </div>
                </div>

                {/* Overview */}
                {studyGuide.overview && (
                  <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                        AI Overview
                      </span>
                    </div>
                    <p className="text-sm text-violet-900 dark:text-violet-200 leading-relaxed">
                      {studyGuide.overview}
                    </p>
                  </div>
                )}

                {/* Accordion Sections */}
                <Accordion type="multiple" defaultValue={["priorities", "activities"]} className="space-y-3">
                  {/* Priority Topics */}
                  {studyGuide.priorityTopics.length > 0 && (
                    <AccordionItem value="priorities" className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-rose-500" />
                          <span className="font-medium text-slate-900 dark:text-white">
                            Priority Topics
                          </span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {studyGuide.priorityTopics.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-2">
                          {studyGuide.priorityTopics.map((topic, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  {typeof topic === "string" ? topic : topic.topic}
                                </span>
                                {typeof topic !== "string" && topic.priority && (
                                  <Badge
                                    className={cn(
                                      "text-xs",
                                      PRIORITY_STYLES[topic.priority]?.bg,
                                      PRIORITY_STYLES[topic.priority]?.text
                                    )}
                                  >
                                    {topic.priority}
                                  </Badge>
                                )}
                              </div>
                              {typeof topic !== "string" && topic.reason && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {topic.reason}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Learning Activities by Bloom's Level */}
                  {Object.keys(studyGuide.learningActivities).length > 0 && (
                    <AccordionItem value="activities" className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-violet-500" />
                          <span className="font-medium text-slate-900 dark:text-white">
                            Learning Activities
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {(Object.entries(studyGuide.learningActivities) as [BloomsLevel, string[]][]).map(
                            ([level, activities]) => {
                              if (!activities || activities.length === 0) return null;
                              const colors = BLOOMS_COLORS[level];
                              return (
                                <div
                                  key={level}
                                  className={cn(
                                    "p-3 rounded-lg border",
                                    colors?.bg,
                                    colors?.border
                                  )}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                      variant="outline"
                                      className={cn("text-xs", colors?.text, colors?.border)}
                                    >
                                      {level}
                                    </Badge>
                                  </div>
                                  <ul className="space-y-1.5">
                                    {activities.map((activity, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                                        {activity}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Practice Questions */}
                  {studyGuide.practiceQuestions.length > 0 && (
                    <AccordionItem value="practice" className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-500" />
                          <span className="font-medium text-slate-900 dark:text-white">
                            Practice Questions
                          </span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {studyGuide.practiceQuestions.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <ul className="space-y-2">
                          {studyGuide.practiceQuestions.map((question, idx) => (
                            <li
                              key={idx}
                              className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                            >
                              <span className="text-sm text-emerald-900 dark:text-emerald-200">
                                {idx + 1}. {question}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Resources */}
                  {studyGuide.resources.length > 0 && (
                    <AccordionItem value="resources" className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-slate-900 dark:text-white">
                            Recommended Resources
                          </span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {studyGuide.resources.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-2">
                          {studyGuide.resources.map((resource, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {resource.type?.toLowerCase().includes("video") ? (
                                  <Video className="h-3.5 w-3.5 text-blue-500" />
                                ) : (
                                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                                )}
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">
                                  {resource.type}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                {resource.title}
                              </p>
                              {resource.description && (
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  {resource.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Study Schedule */}
                  {Object.keys(studyGuide.studySchedule).length > 0 && (
                    <AccordionItem value="schedule" className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-amber-500" />
                          <span className="font-medium text-slate-900 dark:text-white">
                            Study Schedule
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {Object.entries(studyGuide.studySchedule).map(([day, tasks]) => (
                            <div
                              key={day}
                              className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                            >
                              <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
                                {day}
                              </p>
                              <ul className="space-y-1">
                                {tasks.map((task, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300"
                                  >
                                    <span className="text-amber-500">•</span>
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Improvement Tips */}
                  {studyGuide.improvementTips.length > 0 && (
                    <AccordionItem value="tips" className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-slate-900 dark:text-white">
                            Improvement Tips
                          </span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {studyGuide.improvementTips.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <ul className="space-y-2">
                          {studyGuide.improvementTips.map((tip, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                            >
                              <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-500" />
                              <span className="text-sm text-yellow-900 dark:text-yellow-200">
                                {tip}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={generateStudyGuide}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Bookmark className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save Guide</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download PDF</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Share2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Share</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
