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
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {previewingExam
                ? `Preview: ${previewingExam.title}`
                : questions.length > 0
                ? "Exam Preview"
                : "Question Builder"}
            </h4>
            {previewingExam && (
              <Badge variant="outline" className="text-xs">
                {previewingExam.isPublished ? "Published" : "Draft"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {questions.length} question{questions.length !== 1 ? "s" : ""}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Points: {questions.reduce((sum, q) => sum + q.points, 0)}
            </div>
            {(questions.length > 0 || previewingExam) && (
              <Button
                onClick={onHidePreview}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Hide</span>
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {questions.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {questions.filter((q) => q.difficulty === "easy").length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Easy</div>
            </div>
            <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
              <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                {questions.filter((q) => q.difficulty === "medium").length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Medium</div>
            </div>
            <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                {questions.filter((q) => q.difficulty === "hard").length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Hard</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No questions added yet. Use the AI Assistant or create questions manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}