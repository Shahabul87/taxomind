'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function GoalsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden"
        >
          {/* Top gradient bar */}
          <Skeleton className="h-1.5 w-full" />

          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
