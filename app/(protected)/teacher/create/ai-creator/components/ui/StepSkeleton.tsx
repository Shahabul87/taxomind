"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface StepSkeletonProps {
  className?: string;
}

export function StepSkeleton({ className }: StepSkeletonProps) {
  return (
    <div className={cn("animate-in fade-in-50 duration-300", className)}>
      {/* Header Skeleton */}
      <div className="space-y-3 mb-6">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-11 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-32 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-11 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-11 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "p-5 rounded-2xl border border-slate-200 dark:border-slate-800",
      "bg-slate-50 dark:bg-slate-900/50 animate-pulse",
      className
    )}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export function StepperSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
