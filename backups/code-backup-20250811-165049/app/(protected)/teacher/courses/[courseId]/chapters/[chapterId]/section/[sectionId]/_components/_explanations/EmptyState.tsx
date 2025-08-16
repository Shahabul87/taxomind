"use client";

import { Button } from "@/components/ui/button";
import { Code2, BookOpen } from "lucide-react";

interface EmptyStateProps {
  type: "math" | "code";
  onCreateClick?: () => void;
}

export const EmptyState = ({ type, onCreateClick }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 rounded-2xl border border-gray-200 dark:border-gray-700">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
        {type === "math" ? (
          <BookOpen className="h-10 w-10 text-white" />
        ) : (
          <Code2 className="h-10 w-10 text-white" />
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        No {type === "math" ? "math" : "code"} explanations yet
      </h3>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md">
        Create your first {type === "math" ? "math" : "code"} explanation to help students understand concepts better.
      </p>
      {onCreateClick && (
        <Button
          onClick={onCreateClick}
          size="lg"
          className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          Create {type === "math" ? "Math" : "Code"} Explanation
        </Button>
      )}
    </div>
  );
}; 