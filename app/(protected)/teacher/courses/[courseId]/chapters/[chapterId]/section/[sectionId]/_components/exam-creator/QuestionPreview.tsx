"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileQuestion, X, GripVertical } from "lucide-react";
import { Question, Exam } from "./types";

interface QuestionPreviewProps {
  questions: Question[];
  previewingExam: Exam | null;
  isPreviewVisible: boolean;
  onHidePreview: () => void;
}

export function QuestionPreview({
  questions,
  previewingExam,
  isPreviewVisible,
  onHidePreview,
}: QuestionPreviewProps) {
  if (!isPreviewVisible) return null;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 break-words">
              {previewingExam
                ? `Preview: ${previewingExam.title}`
                : questions.length > 0
                ? "Exam Preview"
                : "Question Builder"}
            </h4>
            {previewingExam && (
              <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0">
                {previewingExam.isPublished ? "Published" : "Draft"}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full xs:w-auto">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {questions.length} question{questions.length !== 1 ? "s" : ""}
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Points: {questions.reduce((sum, q) => sum + q.points, 0)}
            </div>
            {(questions.length > 0 || previewingExam) && (
              <Button
                onClick={onHidePreview}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm ml-auto xs:ml-0"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Hide</span>
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {questions.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 text-center">
            <div className="bg-white dark:bg-gray-700 p-2 sm:p-3 rounded border border-gray-200 dark:border-gray-600">
              <div className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400">
                {questions.filter((q) => q.difficulty === "easy").length}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Easy</div>
            </div>
            <div className="bg-white dark:bg-gray-700 p-2 sm:p-3 rounded border border-gray-200 dark:border-gray-600">
              <div className="text-base sm:text-lg font-semibold text-amber-600 dark:text-amber-400">
                {questions.filter((q) => q.difficulty === "medium").length}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Medium</div>
            </div>
            <div className="bg-white dark:bg-gray-700 p-2 sm:p-3 rounded border border-gray-200 dark:border-gray-600">
              <div className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400">
                {questions.filter((q) => q.difficulty === "hard").length}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Hard</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <FileQuestion className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2">
              No questions added yet. Use the AI Assistant or create questions manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}