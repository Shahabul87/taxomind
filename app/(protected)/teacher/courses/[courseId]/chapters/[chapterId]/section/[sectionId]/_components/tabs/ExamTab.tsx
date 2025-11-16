"use client";

import { FileQuestion } from "lucide-react";
import { ExamCreationForm } from "../ExamCreationForm";

interface ExamTabProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData?: {
    section?: {
      title: string;
    };
    chapter?: {
      title: string;
    };
    course?: {
      title: string;
    };
  };
}

export const ExamTab = ({
  courseId,
  chapterId,
  sectionId,
  initialData
}: ExamTabProps) => {
  return (
    <div className="animate-fadeIn">
      <div className="space-y-4">
        <div className="relative bg-card/50 backdrop-blur-sm p-5 rounded-lg border border-border shadow-md">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-lg">
              <FileQuestion className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-sm font-medium text-foreground">
              Exam Creator
            </h2>
          </div>

          <div className="mt-3">
            <ExamCreationForm
              courseId={courseId}
              chapterId={chapterId}
              sectionId={sectionId}
              initialData={initialData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 