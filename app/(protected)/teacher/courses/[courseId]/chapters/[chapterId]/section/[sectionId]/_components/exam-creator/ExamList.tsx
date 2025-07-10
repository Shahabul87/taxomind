"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit2, Trash2, EyeOff, Loader2 } from "lucide-react";
import { Exam } from "./types";
import { cn } from "@/lib/utils";

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
  if (exams.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        Existing Exams ({exams.length})
      </h3>
      <div className="grid gap-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">
                {exam.title}
              </h4>
              <div className="flex items-center gap-2">
                <Badge variant={exam.isPublished ? "default" : "secondary"}>
                  {exam.isPublished ? "Published" : "Draft"}
                </Badge>
                <Badge variant="outline">
                  {exam.questions.length} questions
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {exam.totalPoints} pts
                </Badge>
              </div>
            </div>

            {/* Exam Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onPreview(exam)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-800 dark:hover:text-blue-200 hover:border-blue-300 dark:hover:border-blue-600"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
                <Button
                  onClick={() => onEdit(exam)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-800 dark:hover:text-amber-200 hover:border-amber-300 dark:hover:border-amber-600"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button
                  onClick={() => onDelete(exam.id)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-800 dark:hover:text-red-200 hover:border-red-300 dark:hover:border-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
              <Button
                onClick={() => onPublishToggle(exam.id, exam.isPublished)}
                disabled={publishingExamId === exam.id || exam.questions.length === 0}
                variant="outline"
                size="sm"
                className={cn(
                  "flex items-center gap-1",
                  exam.isPublished
                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:text-orange-800 dark:hover:text-orange-200 hover:border-orange-300 dark:hover:border-orange-600"
                    : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-800 dark:hover:text-emerald-200 hover:border-emerald-300 dark:hover:border-emerald-600",
                  (publishingExamId === exam.id || exam.questions.length === 0) &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                {publishingExamId === exam.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : exam.isPublished ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span className="hidden sm:inline">Unpublish</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Publish</span>
                  </>
                )}
              </Button>
            </div>
            {exam.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {exam.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                {exam.timeLimit && <span>Time: {exam.timeLimit} minutes</span>}
                <span>Created: {new Date(exam.createdAt).toLocaleDateString()}</span>
                <span>Attempts: {exam._count.userAttempts}</span>
              </div>
              {!exam.isPublished && exam.questions.length === 0 && (
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  Add questions to publish
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}