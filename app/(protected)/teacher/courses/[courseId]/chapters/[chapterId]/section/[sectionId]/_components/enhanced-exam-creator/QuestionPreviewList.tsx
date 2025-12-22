"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { BloomsLevel, QuestionType, QuestionDifficulty } from "@prisma/client";
import {
  Brain,
  Lightbulb,
  Wrench,
  Search,
  Scale,
  Sparkles,
  GripVertical,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  HelpCircle,
  MessageSquare,
  Copy,
  MoreVertical,
  Maximize2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  GeneratedQuestion,
  BLOOMS_GUIDANCE,
  QUESTION_TYPE_INFO,
} from "./types";

interface QuestionPreviewListProps {
  questions: GeneratedQuestion[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (questions: GeneratedQuestion[]) => void;
  onEdit?: (question: GeneratedQuestion) => void;
  onDuplicate?: (question: GeneratedQuestion) => void;
}

const BLOOMS_ICONS: Record<BloomsLevel, React.ReactNode> = {
  REMEMBER: <Brain className="h-4 w-4" />,
  UNDERSTAND: <Lightbulb className="h-4 w-4" />,
  APPLY: <Wrench className="h-4 w-4" />,
  ANALYZE: <Search className="h-4 w-4" />,
  EVALUATE: <Scale className="h-4 w-4" />,
  CREATE: <Sparkles className="h-4 w-4" />,
};

const QUESTION_TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  MULTIPLE_CHOICE: <MessageSquare className="h-3 w-3" />,
  TRUE_FALSE: <CheckCircle className="h-3 w-3" />,
  SHORT_ANSWER: <Edit2 className="h-3 w-3" />,
  ESSAY: <MessageSquare className="h-3 w-3" />,
  FILL_IN_BLANK: <MessageSquare className="h-3 w-3" />,
  MATCHING: <MessageSquare className="h-3 w-3" />,
  ORDERING: <MessageSquare className="h-3 w-3" />,
};

export function QuestionPreviewList({
  questions,
  selectedIds,
  onToggleSelect,
  onRemove,
  onReorder,
  onEdit,
  onDuplicate,
}: QuestionPreviewListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<GeneratedQuestion | null>(null);

  const handleDragEnd = (newOrder: GeneratedQuestion[]) => {
    onReorder(newOrder);
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-300">
          No Questions Yet
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">
          Add questions manually, generate with AI, or import from the question bank
        </p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[calc(100vh-400px)] pr-4">
        <Reorder.Group
          axis="y"
          values={questions}
          onReorder={handleDragEnd}
          className="space-y-3"
        >
          {questions.map((question, index) => {
            const guidance = BLOOMS_GUIDANCE[question.bloomsLevel];
            const typeInfo = QUESTION_TYPE_INFO[question.questionType];
            const isExpanded = expandedId === question.id;
            const isSelected = selectedIds.includes(question.id);

            return (
              <Reorder.Item
                key={question.id}
                value={question}
                className="cursor-grab active:cursor-grabbing"
              >
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "rounded-xl border-2 overflow-hidden transition-all",
                    isSelected
                      ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800",
                    question.needsReview && "ring-2 ring-amber-400"
                  )}
                >
                  {/* Question Header */}
                  <div className="flex items-center p-3 gap-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-slate-400" />
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn("p-1 rounded", guidance.bgColor, guidance.color)}>
                                {BLOOMS_ICONS[question.bloomsLevel]}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>{guidance.name}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Badge variant="outline" className="text-xs gap-1">
                          {QUESTION_TYPE_ICONS[question.questionType]}
                          {typeInfo.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            question.difficulty === "EASY" && "border-green-300 text-green-600",
                            question.difficulty === "MEDIUM" && "border-yellow-300 text-yellow-600",
                            question.difficulty === "HARD" && "border-red-300 text-red-600"
                          )}
                        >
                          {question.difficulty}
                        </Badge>
                        {question.needsReview && (
                          <Badge className="bg-amber-500 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Review
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm line-clamp-1">{question.question}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs">
                              <Award className="h-3 w-3" />
                              {question.points}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{question.points} points</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs">
                              <Clock className="h-3 w-3" />
                              {question.estimatedTime}s
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{question.estimatedTime} seconds</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setExpandedId(isExpanded ? null : question.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewQuestion(question)}>
                            <Maximize2 className="h-4 w-4 mr-2" />
                            Full Preview
                          </DropdownMenuItem>
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(question)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDuplicate && (
                            <DropdownMenuItem onClick={() => onDuplicate(question)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onRemove(question.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 dark:border-slate-700"
                      >
                        <div className="p-4 space-y-4">
                          {/* Full Question */}
                          <div>
                            <Label className="text-xs text-slate-500 mb-1 block">Question</Label>
                            <p className="text-sm">{question.question}</p>
                          </div>

                          {/* Options for MCQ */}
                          {question.options && question.options.length > 0 && (
                            <div>
                              <Label className="text-xs text-slate-500 mb-2 block">Options</Label>
                              <div className="space-y-2">
                                {question.options.map((option, i) => (
                                  <div
                                    key={option.id}
                                    className={cn(
                                      "flex items-center gap-2 p-2 rounded-lg text-sm",
                                      option.isCorrect
                                        ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                                        : "bg-slate-50 dark:bg-slate-800/50"
                                    )}
                                  >
                                    <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">
                                      {String.fromCharCode(65 + i)}
                                    </span>
                                    <span className="flex-1">{option.text}</span>
                                    {option.isCorrect && (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Correct Answer */}
                          {question.correctAnswer && (
                            <div>
                              <Label className="text-xs text-slate-500 mb-1 block">
                                Correct Answer
                              </Label>
                              <p className="text-sm p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                                {question.correctAnswer}
                              </p>
                            </div>
                          )}

                          {/* Explanation */}
                          {question.explanation && (
                            <div>
                              <Label className="text-xs text-slate-500 mb-1 block">
                                Explanation
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {question.explanation}
                              </p>
                            </div>
                          )}

                          {/* Hint */}
                          {question.hint && (
                            <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                              <HelpCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                              <div>
                                <Label className="text-xs text-amber-600 dark:text-amber-400">
                                  Hint
                                </Label>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                  {question.hint}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            {question.cognitiveSkills?.map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill.replace(/_/g, " ")}
                              </Badge>
                            ))}
                            {question.relatedConcepts?.map((concept) => (
                              <Badge key={concept} variant="secondary" className="text-xs">
                                {concept}
                              </Badge>
                            ))}
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
      </ScrollArea>

      {/* Full Preview Dialog */}
      <Dialog open={!!previewQuestion} onOpenChange={() => setPreviewQuestion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {previewQuestion && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded",
                    BLOOMS_GUIDANCE[previewQuestion.bloomsLevel].bgColor,
                    BLOOMS_GUIDANCE[previewQuestion.bloomsLevel].color
                  )}>
                    {BLOOMS_ICONS[previewQuestion.bloomsLevel]}
                  </div>
                  Question Preview
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Question */}
                <div>
                  <Label className="text-sm text-slate-500 mb-2 block">Question</Label>
                  <p className="text-lg">{previewQuestion.question}</p>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(
                    BLOOMS_GUIDANCE[previewQuestion.bloomsLevel].bgColor,
                    BLOOMS_GUIDANCE[previewQuestion.bloomsLevel].color
                  )}>
                    {BLOOMS_GUIDANCE[previewQuestion.bloomsLevel].name}
                  </Badge>
                  <Badge variant="outline">
                    {QUESTION_TYPE_INFO[previewQuestion.questionType].label}
                  </Badge>
                  <Badge variant="outline" className={cn(
                    previewQuestion.difficulty === "EASY" && "border-green-300 text-green-600",
                    previewQuestion.difficulty === "MEDIUM" && "border-yellow-300 text-yellow-600",
                    previewQuestion.difficulty === "HARD" && "border-red-300 text-red-600"
                  )}>
                    {previewQuestion.difficulty}
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-700">
                    <Award className="h-3 w-3 mr-1" />
                    {previewQuestion.points} points
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700">
                    <Clock className="h-3 w-3 mr-1" />
                    {previewQuestion.estimatedTime}s
                  </Badge>
                </div>

                {/* Options */}
                {previewQuestion.options && previewQuestion.options.length > 0 && (
                  <div>
                    <Label className="text-sm text-slate-500 mb-2 block">Answer Options</Label>
                    <div className="space-y-2">
                      {previewQuestion.options.map((option, i) => (
                        <div
                          key={option.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg",
                            option.isCorrect
                              ? "bg-green-50 dark:bg-green-950/30 border-2 border-green-300 dark:border-green-700"
                              : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          )}
                        >
                          <span className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center font-medium",
                            option.isCorrect
                              ? "bg-green-500 text-white"
                              : "bg-slate-200 dark:bg-slate-700"
                          )}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{option.text}</span>
                          {option.isCorrect && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Correct Answer */}
                {previewQuestion.correctAnswer && !previewQuestion.options?.length && (
                  <div>
                    <Label className="text-sm text-slate-500 mb-2 block">Correct Answer</Label>
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      {previewQuestion.correctAnswer}
                    </div>
                  </div>
                )}

                {/* Hint */}
                {previewQuestion.hint && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="h-4 w-4 text-amber-500" />
                      <Label className="text-amber-700 dark:text-amber-400">Hint</Label>
                    </div>
                    <p className="text-amber-800 dark:text-amber-300">{previewQuestion.hint}</p>
                  </div>
                )}

                {/* Explanation */}
                {previewQuestion.explanation && (
                  <div>
                    <Label className="text-sm text-slate-500 mb-2 block">Explanation</Label>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      {previewQuestion.explanation}
                    </div>
                  </div>
                )}

                {/* Cognitive Skills & Concepts */}
                {(previewQuestion.cognitiveSkills?.length || previewQuestion.relatedConcepts?.length) && (
                  <div className="pt-4 border-t">
                    {previewQuestion.cognitiveSkills && previewQuestion.cognitiveSkills.length > 0 && (
                      <div className="mb-3">
                        <Label className="text-xs text-slate-500 mb-2 block">Cognitive Skills</Label>
                        <div className="flex flex-wrap gap-2">
                          {previewQuestion.cognitiveSkills.map((skill) => (
                            <Badge key={skill} variant="outline">
                              {skill.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {previewQuestion.relatedConcepts && previewQuestion.relatedConcepts.length > 0 && (
                      <div>
                        <Label className="text-xs text-slate-500 mb-2 block">Related Concepts</Label>
                        <div className="flex flex-wrap gap-2">
                          {previewQuestion.relatedConcepts.map((concept) => (
                            <Badge key={concept} variant="secondary">
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper Label component for consistency
function Label({ className, children, ...props }: React.HTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium text-slate-700 dark:text-slate-300", className)}
      {...props}
    >
      {children}
    </label>
  );
}
