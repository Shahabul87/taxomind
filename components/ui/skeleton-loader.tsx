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
