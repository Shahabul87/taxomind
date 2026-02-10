"use client";

import { FileQuestion } from "lucide-react";
import { UnifiedExamBuilder } from "../exam-creator/UnifiedExamBuilder";

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
  sectionContent?: string;
  learningObjectives?: string[];
}

export const ExamTab = ({
  courseId,
  chapterId,
  sectionId,
  initialData,
  sectionContent,
  learningObjectives,
}: ExamTabProps) => {
  return (
    <div className="animate-fadeIn">
      <div className="space-y-3 sm:space-y-4">
        <div className="relative bg-card/50 backdrop-blur-sm p-3 sm:p-4 md:p-5 rounded-lg border border-border shadow-md">
          <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-md sm:rounded-lg flex-shrink-0">
              <FileQuestion className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-medium text-foreground">
              Exam Creator
            </h2>
          </div>

          <div className="mt-2 sm:mt-3">
            <UnifiedExamBuilder
              courseId={courseId}
              chapterId={chapterId}
              sectionId={sectionId}
              initialData={initialData}
              sectionContent={sectionContent}
              learningObjectives={learningObjectives}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
