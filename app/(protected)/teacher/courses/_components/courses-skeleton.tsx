"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const CoursesSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header Skeleton (glassy) */}
      <div className="rounded-xl border bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-gray-200/70 dark:border-gray-800/70 shadow-sm p-4">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "bg-white/70 dark:bg-gray-900/70",
              "border border-gray-200/70 dark:border-gray-800/70",
              "rounded-xl shadow-md backdrop-blur-md",
              "p-6",
              "flex items-center space-x-4"
            )}
          >
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Create Button Skeleton */}
      <div className="hidden md:flex justify-end">
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl overflow-hidden bg-white/70 dark:bg-gray-900/70 border border-gray-200/70 dark:border-gray-800/70 backdrop-blur-md shadow-md">
        {/* Search and Filter Skeleton */}
        <div className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-white/70 dark:bg-gray-900/70 border border-gray-200/70 dark:border-gray-800/70 backdrop-blur-md">
            <Skeleton className="h-10 flex-1 w-full" />
            <Skeleton className="h-10 w-full sm:w-[180px]" />
            <div className="w-full sm:hidden">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Table Header Skeleton */}
        <div className="border-b border-gray-200/70 dark:border-gray-800/70 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md">
          <div className="flex items-center h-12 px-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1 px-2">
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center h-16 px-4">
              <div className="flex-1 px-2">
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex-1 px-2 flex justify-center">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex-1 px-2">
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex-1 px-2">
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex-1 px-2">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex-1 px-2 flex justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
          <Skeleton className="h-4 w-48 order-2 sm:order-1" />
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
};
