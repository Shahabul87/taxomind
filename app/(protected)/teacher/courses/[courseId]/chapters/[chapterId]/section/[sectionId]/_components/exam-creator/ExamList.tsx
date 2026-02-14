"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Edit2,
  Trash2,
  EyeOff,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { Exam, ExamQuestion } from "./types";
import { cn } from "@/lib/utils";

const BLOOMS_COLORS: Record<string, string> = {
  REMEMBER: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  UNDERSTAND: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  APPLY: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  ANALYZE: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  EVALUATE: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  CREATE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  HARD: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function QuestionItem({
  question,
  index,
  showAnswers,
}: {
  question: ExamQuestion;
  index: number;
  showAnswers: boolean;
}) {
  const bloomsKey = (question.bloomsLevel ?? "").toUpperCase();
  const difficultyKey = (question.difficulty ?? "").toUpperCase();
  const isMCQ =
    question.questionType === "MULTIPLE_CHOICE" ||
    question.questionType === "multiple-choice";
  const isTrueFalse =
    question.questionType === "TRUE_FALSE" ||
    question.questionType === "true-false";

  return (
    <div className="py-2.5 sm:py-3 first:pt-0 last:pb-0">
      {/* Question header */}
      <div className="flex items-start gap-2 sm:gap-3">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5 shrink-0">
          Q{index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed">
            {question.question}
          </p>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {bloomsKey && BLOOMS_COLORS[bloomsKey] && (
              <span
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium",
                  BLOOMS_COLORS[bloomsKey]
                )}
              >
                {bloomsKey}
              </span>
            )}
            {difficultyKey && DIFFICULTY_COLORS[difficultyKey] && (
              <span
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium",
                  DIFFICULTY_COLORS[difficultyKey]
                )}
              >
                {difficultyKey}
              </span>
            )}
            <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
              {question.points} pt{question.points !== 1 ? "s" : ""}
            </span>
            <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 capitalize">
              {question.questionType.replace(/_/g, " ").replace(/-/g, " ").toLowerCase()}
            </span>
          </div>

          {/* Options for MCQ / True-False */}
          {(isMCQ || isTrueFalse) &&
            question.options &&
            question.options.length > 0 && (
              <div className="mt-2 space-y-1">
                {question.options.map((option, optIdx) => {
                  const isCorrect =
                    showAnswers &&
                    (option === question.correctAnswer ||
                      OPTION_LETTERS[optIdx] === question.correctAnswer ||
                      String(optIdx) === question.correctAnswer);

                  return (
                    <div
                      key={optIdx}
                      className={cn(
                        "flex items-start gap-1.5 px-2 py-1 rounded text-xs sm:text-sm",
                        isCorrect
                          ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : "text-gray-600 dark:text-gray-400"
                      )}
                    >
                      <span className="font-medium shrink-0 text-[10px] sm:text-xs mt-px">
                        {OPTION_LETTERS[optIdx]}.
                      </span>
                      <span className="flex-1 min-w-0">{option}</span>
                      {isCorrect && (
                        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          {/* Short answer correct answer */}
          {!isMCQ && !isTrueFalse && showAnswers && question.correctAnswer && (
            <div className="mt-2 flex items-start gap-1.5 px-2 py-1 rounded bg-green-50 dark:bg-green-900/30 text-xs sm:text-sm text-green-800 dark:text-green-300">
              <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{question.correctAnswer}</span>
            </div>
          )}

          {/* Explanation */}
          {showAnswers && question.explanation && (
            <div className="mt-1.5 px-2 py-1.5 rounded bg-blue-50 dark:bg-blue-900/20 text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <span className="font-medium">Explanation:</span>{" "}
              {question.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ExamListProps {
  exams: Exam[];
  publishingExamId: string | null;
  onPreview: (exam: Exam) => void;
  onEdit: (exam: Exam) => void;
  onDelete: (examId: string) => void;
  onPublishToggle: (examId: string, isPublished: boolean) => void;
}

export function ExamList({
  exams,
  publishingExamId,
  onPreview,
  onEdit,
  onDelete,
  onPublishToggle,
}: ExamListProps) {
  const [expandedExamIds, setExpandedExamIds] = useState<Set<string>>(
    new Set()
  );
  const [showAnswersMap, setShowAnswersMap] = useState<Set<string>>(new Set());

  if (exams.length === 0) {
    return null;
  }

  const toggleExpand = (examId: string) => {
    setExpandedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(examId)) {
        next.delete(examId);
      } else {
        next.add(examId);
      }
      return next;
    });
  };

  const toggleAnswers = (examId: string) => {
    setShowAnswersMap((prev) => {
      const next = new Set(prev);
      if (next.has(examId)) {
        next.delete(examId);
      } else {
        next.add(examId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200">
        Existing Exams ({exams.length})
      </h3>
      <div className="grid gap-3 sm:gap-4">
        {exams.map((exam) => {
          const isExpanded = expandedExamIds.has(exam.id);
          const showAnswers = showAnswersMap.has(exam.id);

          return (
          <div
            key={exam.id}
            className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 mb-2 sm:mb-3">
              <h4 className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-200 break-words flex-1 min-w-0">
                {exam.title}
              </h4>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap flex-shrink-0">
                <Badge variant={exam.isPublished ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                  {exam.isPublished ? "Published" : "Draft"}
                </Badge>
                {exam.questions.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(exam.id)}
                    className="inline-flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      {exam.questions.length} questions
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                ) : (
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {exam.questions.length} questions
                  </Badge>
                )}
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[10px] sm:text-xs">
                  {exam.totalPoints} pts
                </Badge>
              </div>
            </div>

            {/* Exam Action Buttons */}
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 xs:gap-3 mb-2 sm:mb-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1">
                <Button
                  onClick={() => onPreview(exam)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-800 dark:hover:text-blue-200 hover:border-blue-300 dark:hover:border-blue-600 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm flex-1 xs:flex-none"
                >
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Preview</span>
                  <span className="xs:hidden">View</span>
                </Button>
                <Button
                  onClick={() => onEdit(exam)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-800 dark:hover:text-amber-200 hover:border-amber-300 dark:hover:border-amber-600 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm flex-1 xs:flex-none"
                >
                  <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Edit</span>
                  <span className="xs:hidden">Edit</span>
                </Button>
                <Button
                  onClick={() => onDelete(exam.id)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-800 dark:hover:text-red-200 hover:border-red-300 dark:hover:border-red-600 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm flex-1 xs:flex-none"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Delete</span>
                  <span className="xs:hidden">Del</span>
                </Button>
              </div>
              <Button
                onClick={() => onPublishToggle(exam.id, exam.isPublished)}
                disabled={publishingExamId === exam.id || exam.questions.length === 0}
                variant="outline"
                size="sm"
                className={cn(
                  "flex items-center gap-1 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm w-full xs:w-auto",
                  exam.isPublished
                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:text-orange-800 dark:hover:text-orange-200 hover:border-orange-300 dark:hover:border-orange-600"
                    : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-800 dark:hover:text-emerald-200 hover:border-emerald-300 dark:hover:border-emerald-600",
                  (publishingExamId === exam.id || exam.questions.length === 0) &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                {publishingExamId === exam.id ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : exam.isPublished ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Unpublish</span>
                    <span className="xs:hidden">Unpub</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Publish</span>
                    <span className="xs:hidden">Pub</span>
                  </>
                )}
              </Button>
            </div>
            {exam.description && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">
                {exam.description}
              </p>
            )}
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1.5 xs:gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                {exam.timeLimit && <span>Time: {exam.timeLimit} minutes</span>}
                <span className="hidden xs:inline">Created: {new Date(exam.createdAt).toLocaleDateString()}</span>
                <span className="xs:hidden">Created: {new Date(exam.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>Attempts: {exam._count.userAttempts}</span>
              </div>
              {!exam.isPublished && exam.questions.length === 0 && (
                <div className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">
                  Add questions to publish
                </div>
              )}
            </div>

            {/* Inline Question List */}
            {isExpanded && exam.questions.length > 0 && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Questions ({exam.questions.length})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAnswers(exam.id)}
                    className="h-7 px-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showAnswers ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hide Answers
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Show Answers
                      </>
                    )}
                  </Button>
                </div>
                <div
                  className={cn(
                    "divide-y divide-gray-100 dark:divide-gray-700/50",
                    exam.questions.length > 10 &&
                      "max-h-[600px] overflow-y-auto pr-1"
                  )}
                >
                  {exam.questions.map((q, idx) => (
                    <QuestionItem
                      key={q.id}
                      question={q}
                      index={idx}
                      showAnswers={showAnswers}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}