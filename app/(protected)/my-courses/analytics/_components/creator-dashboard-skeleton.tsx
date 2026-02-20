"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function CreatorDashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 sm:h-7 md:h-8 w-48 sm:w-56 md:w-64" />
          <Skeleton className="h-3 sm:h-4 w-36 sm:w-40 md:w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 sm:h-10 w-full sm:w-32" />
          <Skeleton className="h-9 sm:h-10 w-9 sm:w-10" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 dark:border-slate-700 border-l-4 border-l-slate-300 dark:border-l-slate-600 p-4 sm:p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-end gap-1">
                {[14, 10, 18, 12, 16, 9, 15].map((h, j) => (
                  <Skeleton key={j} className="w-1" style={{ height: h }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <Skeleton className="h-10 sm:h-11 w-full rounded-lg" />

      {/* Chart Placeholder */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-3 w-64 mb-6" />
        <Skeleton className="h-48 sm:h-56 md:h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
