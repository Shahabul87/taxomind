"use client";

/**
 * ExamPreview
 *
 * Preview panel showing the generated exam with analytics overlay,
 * question ordering, and export options.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FileText,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Lightbulb,
  Wrench,
  Search,
  Scale,
  Sparkles,
  BarChart3,
  Target,
  Zap,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
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
import type { BloomsLevel, QuestionType, QuestionDifficulty } from "@prisma/client";

// Bloom's level metadata
const BLOOMS_META: Record<
  BloomsLevel,
  { icon: typeof Brain; color: string; bgColor: string; label: string }
> = {
  REMEMBER: { icon: Brain, color: "text-slate-400", bgColor: "bg-slate-500", label: "Remember" },
  UNDERSTAND: { icon: Lightbulb, color: "text-blue-400", bgColor: "bg-blue-500", label: "Understand" },
  APPLY: { icon: Wrench, color: "text-emerald-400", bgColor: "bg-emerald-500", label: "Apply" },
  ANALYZE: { icon: Search, color: "text-amber-400", bgColor: "bg-amber-500", label: "Analyze" },
  EVALUATE: { icon: Scale, color: "text-purple-400", bgColor: "bg-purple-500", label: "Evaluate" },
  CREATE: { icon: Sparkles, color: "text-rose-400", bgColor: "bg-rose-500", label: "Create" },
};

const QUESTION_TYPES: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "MCQ",
  TRUE_FALSE: "T/F",
  SHORT_ANSWER: "Short",
  ESSAY: "Essay",
  FILL_IN_BLANK: "Fill",
  MATCHING: "Match",
  ORDERING: "Order",
};

export interface PreviewQuestion {
  id: string;
  text: string;
  type: QuestionType;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctAnswer: string;
  explanation?: string;
  estimatedTime: number;
  points: number;
  tags?: string[];
}

export interface BloomsAnalysis {
  targetVsActual: {
    alignmentScore: number;
    deviations: Record<BloomsLevel, number>;
  };
  distribution: {
    REMEMBER: number;
    UNDERSTAND: number;
    APPLY: number;
    ANALYZE: number;
    EVALUATE: number;
    CREATE: number;
  };
  recommendations: string[];
}

export interface ExamData {
  examId: string;
  title?: string;
  questions: PreviewQuestion[];
  totalQuestions: number;
  totalPoints: number;
  estimatedDuration: number;
  bloomsAnalysis: BloomsAnalysis;
  metadata?: {
    generatedAt: string;
    engine: string;
    adaptiveMode: boolean;
  };
}

export interface ExamPreviewProps {
  exam: ExamData | null;
  onReorder?: (questions: PreviewQuestion[]) => void;
  onRemoveQuestion?: (questionId: string) => void;
  onExport?: (format: "pdf" | "docx" | "json") => void;
  className?: string;
}

export function ExamPreview({
  exam,
  onReorder,
  onRemoveQuestion,
  onExport,
  className,
}: ExamPreviewProps) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!exam) return null;

    const byDifficulty = {
      EASY: exam.questions.filter((q) => q.difficulty === "EASY").length,
      MEDIUM: exam.questions.filter((q) => q.difficulty === "MEDIUM").length,
      HARD: exam.questions.filter((q) => q.difficulty === "HARD").length,
    };

    const byType: Record<string, number> = {};
    exam.questions.forEach((q) => {
      byType[q.type] = (byType[q.type] || 0) + 1;
    });

    return { byDifficulty, byType };
  }, [exam]);

  // Toggle question expansion
  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  if (!exam) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full", className)}>
        <div className="text-center p-8">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-10 w-10 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-300">No Exam Generated</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">
            Configure your exam settings and click &quot;Generate Exam&quot; to create
            an AI-powered assessment.
          </p>
        </div>
      </div>
    );
  }

  const alignmentScore = exam.bloomsAnalysis.targetVsActual.alignmentScore;
  const isGoodAlignment = alignmentScore >= 80;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex-none space-y-4 pb-4 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-400" />
              {exam.title || "Generated Exam"}
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              {exam.totalQuestions} questions &bull; {exam.totalPoints} points &bull;{" "}
              {Math.round(exam.estimatedDuration)} min
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Show Answers Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 mr-4">
                    <Switch
                      checked={showAnswers}
                      onCheckedChange={setShowAnswers}
                      className="data-[state=checked]:bg-purple-500"
                    />
                    <label className="text-sm text-slate-400">
                      {showAnswers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </label>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700">
                  {showAnswers ? "Hide answers" : "Show answers"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Export Buttons */}
            {onExport && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport("pdf")}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <Download className="mr-1 h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport("docx")}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <FileText className="mr-1 h-4 w-4" />
                  Word
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Target className="h-3 w-3" />
              Alignment
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xl font-bold",
                  isGoodAlignment ? "text-green-400" : "text-amber-400"
                )}
              >
                {alignmentScore}%
              </span>
              {isGoodAlignment ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Clock className="h-3 w-3" />
              Duration
            </div>
            <span className="text-xl font-bold text-slate-200">
              {Math.round(exam.estimatedDuration)}m
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Award className="h-3 w-3" />
              Points
            </div>
            <span className="text-xl font-bold text-slate-200">{exam.totalPoints}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Zap className="h-3 w-3" />
              Adaptive
            </div>
            <span className="text-xl font-bold text-slate-200">
              {exam.metadata?.adaptiveMode ? "On" : "Off"}
            </span>
          </div>
        </div>

        {/* Bloom's Distribution Mini Chart */}
        <div className="flex items-center gap-2">
          {(Object.entries(exam.bloomsAnalysis.distribution) as [BloomsLevel, number][]).map(
            ([level, percentage]) => {
              const meta = BLOOMS_META[level];
              const deviation = exam.bloomsAnalysis.targetVsActual.deviations[level];
              const hasDeviation = Math.abs(deviation) > 5;

              return (
                <TooltipProvider key={level}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex-1 h-3 rounded-full relative overflow-hidden",
                          "bg-slate-700/50"
                        )}
                      >
                        <motion.div
                          className={cn("h-full rounded-full", meta.bgColor)}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        />
                        {hasDeviation && (
                          <div
                            className={cn(
                              "absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                              deviation > 0 ? "bg-green-400" : "bg-red-400"
                            )}
                          />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-slate-700">
                      <p className="font-medium">{meta.label}: {percentage}%</p>
                      {hasDeviation && (
                        <p className={cn("text-xs", deviation > 0 ? "text-green-400" : "text-red-400")}>
                          {deviation > 0 ? "+" : ""}{deviation}% from target
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }
          )}
        </div>

        {/* Recommendations */}
        {exam.bloomsAnalysis.recommendations.length > 0 && (
          <Accordion type="single" collapsible className="border-none">
            <AccordionItem value="recommendations" className="border-slate-700">
              <AccordionTrigger className="text-sm text-amber-400 hover:text-amber-300 py-2">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {exam.bloomsAnalysis.recommendations.length} Recommendations
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1 text-sm text-slate-400">
                  {exam.bloomsAnalysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>

      {/* Questions List */}
      <ScrollArea className="flex-1 mt-4">
        <Reorder.Group
          axis="y"
          values={exam.questions}
          onReorder={(newOrder) => onReorder?.(newOrder)}
          className="space-y-3 pr-4"
        >
          {exam.questions.map((question, index) => {
            const meta = BLOOMS_META[question.bloomsLevel];
            const BloomsIcon = meta.icon;
            const isExpanded = expandedQuestions.includes(question.id);

            return (
              <Reorder.Item
                key={question.id}
                value={question}
                className={cn(
                  "rounded-xl border transition-all",
                  "border-slate-800 bg-slate-900/50",
                  onReorder && "cursor-grab active:cursor-grabbing"
                )}
              >
                <div className="p-4">
                  {/* Question Header */}
                  <div className="flex items-start gap-3">
                    {onReorder && (
                      <div className="flex-none text-slate-600 hover:text-slate-400 transition-colors">
                        <GripVertical className="h-5 w-5" />
                      </div>
                    )}

                    <div className="flex-none">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                          "bg-slate-800 text-slate-300"
                        )}
                      >
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className="flex items-start justify-between gap-3 cursor-pointer"
                        onClick={() => toggleQuestion(question.id)}
                      >
                        <p className="text-sm text-slate-200">{question.text}</p>
                        <button className="flex-none text-slate-500">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Metadata Row */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-transparent text-xs",
                            meta.bgColor + "/20",
                            meta.color
                          )}
                        >
                          <BloomsIcon className="mr-1 h-3 w-3" />
                          {meta.label}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={cn(
                            "border-transparent text-xs",
                            question.difficulty === "EASY"
                              ? "bg-green-500/20 text-green-400"
                              : question.difficulty === "MEDIUM"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {question.difficulty}
                        </Badge>

                        <span className="text-xs text-slate-500">
                          {QUESTION_TYPES[question.type]}
                        </span>

                        <span className="text-xs text-slate-500 ml-auto">
                          {question.points} pts &bull; ~{question.estimatedTime}s
                        </span>

                        {onRemoveQuestion && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-500 hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveQuestion(question.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                          {/* Options */}
                          {question.options && question.options.length > 0 && (
                            <div className="space-y-2">
                              {question.options.map((option, i) => (
                                <div
                                  key={option.id}
                                  className={cn(
                                    "flex items-center gap-3 p-2.5 rounded-lg border text-sm",
                                    showAnswers && option.isCorrect
                                      ? "border-green-500/30 bg-green-500/10"
                                      : "border-slate-700/50 bg-slate-800/30"
                                  )}
                                >
                                  <span className="text-slate-500 w-5">
                                    {String.fromCharCode(65 + i)}.
                                  </span>
                                  <span className="text-slate-300 flex-1">{option.text}</span>
                                  {showAnswers && option.isCorrect && (
                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Correct Answer (for non-MCQ) */}
                          {showAnswers && !question.options && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                              <span className="text-xs font-medium text-green-400">
                                Correct Answer:
                              </span>
                              <p className="text-sm text-slate-300 mt-1">
                                {question.correctAnswer}
                              </p>
                            </div>
                          )}

                          {/* Explanation */}
                          {showAnswers && question.explanation && (
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                              <span className="text-xs font-medium text-blue-400">
                                Explanation:
                              </span>
                              <p className="text-sm text-slate-300 mt-1">
                                {question.explanation}
                              </p>
                            </div>
                          )}

                          {/* Tags */}
                          {question.tags && question.tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {question.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </ScrollArea>

      {/* Footer */}
      <div className="flex-none pt-4 mt-4 border-t border-slate-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Generated {exam.metadata?.generatedAt
              ? new Date(exam.metadata.generatedAt).toLocaleString()
              : "just now"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-200"
            >
              <Copy className="mr-1 h-4 w-4" />
              Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-200"
            >
              <Share2 className="mr-1 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamPreview;
