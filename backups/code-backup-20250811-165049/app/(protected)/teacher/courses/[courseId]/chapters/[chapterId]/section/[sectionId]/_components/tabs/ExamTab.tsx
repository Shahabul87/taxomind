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
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition duration-300"></div>
        <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <FileQuestion className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent">
              Exam Creator
            </h2>
          </div>
          
          <div className="mt-4">
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