"use client";

import { motion } from "framer-motion";

export const FormSkeleton = () => {
  return (
    <div className="w-full relative">
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side Skeleton */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Logo Skeleton */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="w-32 h-10 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>

              {/* Heading Skeleton */}
              <div className="space-y-3">
                <div className="w-3/4 h-10 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="w-2/3 h-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>

              {/* Feature Cards Skeleton */}
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="w-2/3 h-4 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="w-full h-3 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Metrics Skeleton */}
              <div className="p-5 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse">
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center space-y-2">
                      <div className="w-16 h-8 rounded bg-slate-200 dark:bg-slate-700 mx-auto" />
                      <div className="w-12 h-3 rounded bg-slate-200 dark:bg-slate-700 mx-auto" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Badge Skeleton */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse">
                <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </motion.div>

            {/* Right Side Form Skeleton */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden"
            >
              {/* Gradient Header */}
              <div className="h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 animate-pulse" />

              <div className="p-8 space-y-6">
                {/* Title Skeleton */}
                <div className="text-center space-y-2">
                  <div className="w-48 h-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mx-auto" />
                  <div className="w-64 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mx-auto" />
                </div>

                {/* Form Fields Skeleton */}
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="w-full h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </div>
                  ))}
                </div>

                {/* Button Skeleton */}
                <div className="w-full h-13 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />

                {/* Links Skeleton */}
                <div className="flex justify-center">
                  <div className="w-32 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CompactFormSkeleton = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 space-y-6"
      >
        <div className="space-y-4">
          <div className="w-32 h-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mx-auto" />
          <div className="w-48 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mx-auto" />
        </div>

        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="w-full h-14 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>

        <div className="w-full h-12 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </motion.div>
    </div>
  );
};

// Dashboard Tab Skeleton - for tabbed content
export const DashboardTabSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      ))}
    </div>
    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
  </div>
);

// Analytics Card Skeleton
export const AnalyticsCardSkeleton = () => (
  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="w-16 h-4 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
    <div className="space-y-2">
      <div className="w-24 h-8 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="w-32 h-4 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
);

// Course Card Skeleton
export const CourseCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-pulse">
    <div className="h-48 bg-slate-200 dark:bg-slate-700" />
    <div className="p-4 space-y-3">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      <div className="flex items-center justify-between pt-2">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-20" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24" />
      </div>
    </div>
  </div>
);

// Grid of Course Cards
export const CourseGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <CourseCardSkeleton key={i} />
    ))}
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-b border-slate-200 dark:border-slate-700 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
    </div>
    <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded" />
  </div>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRowSkeleton key={i} />
    ))}
  </div>
);

// Profile Card Skeleton
export const ProfileCardSkeleton = () => (
  <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-2">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
    </div>
  </div>
);

// Chart Skeleton
export const ChartSkeleton = () => (
  <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse">
    <div className="flex items-center justify-between mb-6">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32" />
      <div className="flex gap-2">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-20" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-20" />
      </div>
    </div>
    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
  </div>
);

// Stats Grid Skeleton
export const StatsGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <AnalyticsCardSkeleton key={i} />
    ))}
  </div>
);
