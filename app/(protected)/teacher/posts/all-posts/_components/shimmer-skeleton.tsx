"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ShimmerSkeletonProps {
  className?: string;
  variant?: "default" | "card" | "stats" | "chart" | "list";
}

// Base shimmer animation component
const ShimmerBase = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={cn("relative overflow-hidden bg-slate-200/60 dark:bg-slate-700/60 rounded-lg", className)} style={style}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
  </div>
);

// Stats card skeleton
export const StatsCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
  >
    <div className="flex justify-between items-start mb-3">
      <ShimmerBase className="h-4 w-20" />
      <ShimmerBase className="h-10 w-10 rounded-xl" />
    </div>
    <ShimmerBase className="h-8 w-16 mb-3" />
    <div className="flex items-center gap-2">
      <ShimmerBase className="h-3 w-12" />
      <ShimmerBase className="h-6 w-20" />
    </div>
  </motion.div>
);

// Post card skeleton for grid view
export const PostCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
  >
    {/* Image placeholder */}
    <ShimmerBase className="h-44 w-full rounded-none" />

    {/* Content */}
    <div className="p-4 space-y-3">
      {/* Date */}
      <div className="flex items-center gap-2">
        <ShimmerBase className="h-3 w-20" />
        <ShimmerBase className="h-3 w-16" />
      </div>

      {/* Title */}
      <ShimmerBase className="h-5 w-full" />
      <ShimmerBase className="h-5 w-3/4" />

      {/* Description */}
      <ShimmerBase className="h-3 w-full" />
      <ShimmerBase className="h-3 w-2/3" />

      {/* Footer */}
      <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex gap-2">
        <ShimmerBase className="h-8 flex-1" />
        <ShimmerBase className="h-8 w-8" />
      </div>
    </div>
  </motion.div>
);

// Post card skeleton for list view
export const PostListSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-4"
  >
    <div className="flex gap-4">
      {/* Thumbnail */}
      <ShimmerBase className="h-28 w-28 flex-shrink-0 rounded-lg" />

      {/* Content */}
      <div className="flex-1 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <ShimmerBase className="h-6 w-3/4" />
          <div className="flex gap-2">
            <ShimmerBase className="h-6 w-20 rounded-full" />
            <ShimmerBase className="h-6 w-16 rounded-full" />
          </div>
        </div>

        {/* Date */}
        <div className="flex gap-3">
          <ShimmerBase className="h-4 w-24" />
          <ShimmerBase className="h-4 w-20" />
        </div>

        {/* Description */}
        <ShimmerBase className="h-4 w-full" />
        <ShimmerBase className="h-4 w-2/3" />

        {/* Stats */}
        <div className="flex gap-3">
          <ShimmerBase className="h-7 w-16 rounded-md" />
          <ShimmerBase className="h-7 w-14 rounded-md" />
          <ShimmerBase className="h-7 w-14 rounded-md" />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex gap-2">
          <ShimmerBase className="h-8 w-20" />
          <ShimmerBase className="h-8 w-24" />
          <ShimmerBase className="h-8 w-20" />
        </div>
      </div>
    </div>
  </motion.div>
);

// Analytics chart skeleton
export const ChartSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-6"
  >
    <div className="flex justify-between items-center mb-6">
      <div className="space-y-2">
        <ShimmerBase className="h-5 w-40" />
        <ShimmerBase className="h-3 w-56" />
      </div>
      <ShimmerBase className="h-9 w-32 rounded-lg" />
    </div>

    {/* Chart area */}
    <div className="h-64 flex items-end gap-2 pt-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <ShimmerBase
          key={i}
          className="flex-1 rounded-t-md"
          style={{ height: `${Math.random() * 60 + 20}%` }}
        />
      ))}
    </div>

    {/* X-axis labels */}
    <div className="flex justify-between mt-4 px-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <ShimmerBase key={i} className="h-3 w-12" />
      ))}
    </div>
  </motion.div>
);

// Analytics metric card skeleton
export const MetricCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-5"
  >
    <div className="flex justify-between items-start mb-2">
      <ShimmerBase className="h-4 w-24" />
      <ShimmerBase className="h-8 w-8 rounded-lg" />
    </div>
    <ShimmerBase className="h-3 w-32 mb-3" />
    <ShimmerBase className="h-8 w-20 mb-4" />
    <ShimmerBase className="h-2 w-full rounded-full" />
  </motion.div>
);

// Full dashboard skeleton
export const DashboardSkeleton = ({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    {/* Stats row */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>

    {/* Filters skeleton */}
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <ShimmerBase className="h-10 flex-1 rounded-lg" />
        <ShimmerBase className="h-10 w-40 rounded-lg" />
        <ShimmerBase className="h-10 w-32 rounded-lg" />
      </div>

      {/* Posts grid/list */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <PostListSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  </div>
);

// Analytics tab skeleton
export const AnalyticsSkeleton = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    {/* Metric cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>

    {/* Chart */}
    <ChartSkeleton />

    {/* Top posts */}
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
      <div className="space-y-2 mb-6">
        <ShimmerBase className="h-5 w-44" />
        <ShimmerBase className="h-3 w-64" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/30">
            <ShimmerBase className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <ShimmerBase className="h-4 w-3/4" />
              <div className="flex gap-4">
                <ShimmerBase className="h-3 w-12" />
                <ShimmerBase className="h-3 w-10" />
                <ShimmerBase className="h-3 w-10" />
              </div>
            </div>
            <ShimmerBase className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ShimmerSkeleton = ({
  className,
  variant = "default",
}: ShimmerSkeletonProps) => {
  switch (variant) {
    case "card":
      return <PostCardSkeleton />;
    case "stats":
      return <StatsCardSkeleton />;
    case "chart":
      return <ChartSkeleton />;
    case "list":
      return <PostListSkeleton />;
    default:
      return <ShimmerBase className={className} />;
  }
};
