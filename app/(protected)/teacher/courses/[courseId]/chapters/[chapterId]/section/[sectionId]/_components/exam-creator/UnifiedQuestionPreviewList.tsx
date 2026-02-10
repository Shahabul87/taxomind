"use client";

import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import type { BloomsLevel } from "@prisma/client";
import {
  Brain,
  Lightbulb,
  Wrench,
  Search,
  Scale,
  Sparkles,
  GripVertical,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Award,
  HelpCircle,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UnifiedQuestion, AnswerVisibility } from "./types";

// ============================================================================
// PROPS
// ============================================================================

interface UnifiedQuestionPreviewListProps {
  questions: UnifiedQuestion[];
  answerVisibility: Record<string, AnswerVisibility>;
  onRemove: (id: string) => void;
  onRevealAnswer: (id: string) => void;
  onHideAnswer: (id: string) => void;
  onReorder: (reordered: UnifiedQuestion[]) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BLOOMS_ICONS: Record<BloomsLevel, React.ReactNode> = {
  REMEMBER: <Brain className="h-3 w-3" />,
  UNDERSTAND: <Lightbulb className="h-3 w-3" />,
  APPLY: <Wrench className="h-3 w-3" />,
  ANALYZE: <Search className="h-3 w-3" />,
  EVALUATE: <Scale className="h-3 w-3" />,
  CREATE: <Sparkles className="h-3 w-3" />,
};

const BLOOMS_COLORS: Record<BloomsLevel, string> = {
  REMEMBER: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800",
  UNDERSTAND: "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-800",
  APPLY: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-800",
  ANALYZE: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800",
  EVALUATE: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800",
  CREATE: "text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-800",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "border-green-300 text-green-600 dark:border-green-700 dark:text-green-400",
  MEDIUM: "border-yellow-300 text-yellow-600 dark:border-yellow-700 dark:text-yellow-400",
  HARD: "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function UnifiedQuestionPreviewList({
  questions,
  answerVisibility,
  onRemove,
  onRevealAnswer,
  onHideAnswer,
  onReorder,
}: UnifiedQuestionPreviewListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <MessageSquare className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="font-medium text-sm text-slate-700 dark:text-slate-300">
          No Questions Yet
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
          Add questions manually or generate with AI
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      <Reorder.Group
        axis="y"
        values={questions}
        onReorder={onReorder}
        className="space-y-2"
      >
        {questions.map((question, index) => {
          const isExpanded = expandedId === question.id;
          const isAnswerRevealed = answerVisibility[question.id] === "revealed";
          const hasEvaluation = !!question.evaluationData;
          const qualityScore = question.evaluationData?.qualityScore;

          return (
            <Reorder.Item
              key={question.id}
              value={question}
              className="cursor-grab active:cursor-grabbing"
            >
              <motion.div
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={cn(
                  "rounded-lg border overflow-hidden transition-all",
                  "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                  question.needsReview && "ring-1 ring-amber-400"
                )}
              >
                {/* Compact Header */}
                <div className="flex items-center p-2 gap-1.5">
                  <GripVertical className="h-3 w-3 text-slate-400 flex-shrink-0" />
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                    {index + 1}
                  </span>

                  {/* Bloom's badge */}
                  <div
                    className={cn(
                      "p-0.5 rounded flex-shrink-0",
                      BLOOMS_COLORS[question.bloomsLevel].split(" ").slice(0, 2).join(" ")
                    )}
                  >
                    {BLOOMS_ICONS[question.bloomsLevel]}
                  </div>

                  {/* Question text */}
                  <p className="flex-1 text-xs truncate text-slate-700 dark:text-slate-300 min-w-0">
                    {question.question}
                  </p>

                  {/* Quality indicator */}
                  {hasEvaluation && qualityScore !== undefined && (
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0",
                        qualityScore >= 80
                          ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                          : qualityScore >= 60
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                      )}
                    >
                      {qualityScore}
                    </div>
                  )}

                  {/* Expand button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => setExpandedId(isExpanded ? null : question.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 dark:border-slate-700"
                    >
                      <div className="p-2.5 space-y-2">
                        {/* Full question text */}
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {question.question}
                        </p>

                        {/* Metadata badges */}
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              BLOOMS_COLORS[question.bloomsLevel]
                            )}
                          >
                            {question.bloomsLevel}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              DIFFICULTY_COLORS[question.difficulty] ?? ""
                            )}
                          >
                            {question.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                            <Award className="h-2.5 w-2.5" />
                            {question.points}pts
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {question.estimatedTime}s
                          </Badge>
                        </div>

                        {/* Options for MCQ */}
                        {question.options && question.options.length > 0 && (
                          <div className="space-y-1">
                            {question.options.map((option, i) => (
                              <div
                                key={option.id}
                                className={cn(
                                  "flex items-center gap-1.5 p-1.5 rounded text-[11px]",
                                  isAnswerRevealed && option.isCorrect
                                    ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                                    : "bg-slate-50 dark:bg-slate-800/50"
                                )}
                              >
                                <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0">
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className="flex-1">{option.text}</span>
                                {isAnswerRevealed && option.isCorrect && (
                                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Answer Section */}
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-2">
                          {isAnswerRevealed ? (
                            <div className="space-y-1.5">
                              {/* Correct Answer */}
                              <div className="p-1.5 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800">
                                <span className="text-[10px] font-medium text-green-600 dark:text-green-400 block mb-0.5">
                                  Correct Answer
                                </span>
                                <p className="text-[11px] text-green-800 dark:text-green-300">
                                  {question.correctAnswer}
                                </p>
                              </div>

                              {/* Explanation */}
                              {question.explanation && (
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                                  <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 block mb-0.5">
                                    Explanation
                                  </span>
                                  <p className="text-[11px] text-blue-800 dark:text-blue-300">
                                    {question.explanation}
                                  </p>
                                </div>
                              )}

                              {/* Hint */}
                              {question.hint && (
                                <div className="flex items-start gap-1 p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                                  <HelpCircle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                    {question.hint}
                                  </p>
                                </div>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] text-slate-500"
                                onClick={() => onHideAnswer(question.id)}
                              >
                                <EyeOff className="h-3 w-3 mr-1" />
                                Hide Answer
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px] text-violet-600 hover:text-violet-700"
                              onClick={() => onRevealAnswer(question.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Reveal Answer
                            </Button>
                          )}
                        </div>

                        {/* Evaluation issues */}
                        {question.evaluationData && question.evaluationData.issues.length > 0 && (
                          <div className="border-t border-slate-100 dark:border-slate-700 pt-2 space-y-0.5">
                            {question.evaluationData.issues.slice(0, 2).map((issue, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-1 text-[10px] text-slate-600 dark:text-slate-400"
                              >
                                <AlertCircle
                                  className={cn(
                                    "h-2.5 w-2.5 mt-0.5 flex-shrink-0",
                                    issue.type === "error" && "text-red-500",
                                    issue.type === "warning" && "text-amber-500",
                                    issue.type === "info" && "text-blue-500"
                                  )}
                                />
                                <span>{issue.message}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onRemove(question.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
}
