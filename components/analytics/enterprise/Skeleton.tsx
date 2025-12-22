"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Base skeleton component with pulse animation
 */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200 dark:bg-slate-700",
        className
      )}
      style={style}
    />
  );
}

/**
 * Metric card skeleton for loading states
 */
export function MetricCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/**
 * Chart skeleton for data visualizations
 */
export function ChartSkeleton({ height = "h-48" }: { height?: string }) {
  return (
    <div className={cn("bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6", height)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex items-end justify-between gap-2 h-32">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-slate-100 dark:border-slate-800">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  );
}

/**
 * Full analytics dashboard skeleton
 */
export function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-lg flex-shrink-0" />
        ))}
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Activity section skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartSkeleton height="h-64" />
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Sparkline skeleton for inline charts
 */
export function SparklineSkeleton() {
  return (
    <div className="flex items-end gap-0.5 h-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          className="w-1.5 rounded-t animate-pulse"
          style={{
            height: `${Math.random() * 50 + 25}%`,
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  );
}
