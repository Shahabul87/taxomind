"use client";

import { SearchX, Filter, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  showResetButton?: boolean;
}

export function EmptyState({
  title = "No courses found",
  description = "We couldn&apos;t find any courses matching your criteria",
  onReset,
  showResetButton = true
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-6">
        <SearchX className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {showResetButton && onReset && (
          <Button onClick={onReset} variant="default">
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
        <Button variant="outline">
          <BookOpen className="h-4 w-4 mr-2" />
          Browse All Courses
        </Button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">Suggestions:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Try using different keywords</li>
          <li>• Remove some filters to broaden your search</li>
          <li>• Check your spelling</li>
          <li>• Browse courses by category</li>
        </ul>
      </div>
    </div>
  );
}