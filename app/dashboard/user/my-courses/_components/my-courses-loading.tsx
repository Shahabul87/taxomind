'use client';

import { motion } from 'framer-motion';
import { BookOpen, Award, Zap, CheckCircle2 } from 'lucide-react';

export function MyCoursesLoading() {
  return (
    <div className="w-full py-8">
      {/* Header Skeleton */}
      <div className="relative py-16 mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-blue-600/90 dark:from-indigo-900/90 dark:via-purple-900/90 dark:to-indigo-900/90">
        <div className="relative z-10 max-w-5xl mx-auto text-center px-4">
          <div className="h-12 bg-white/20 dark:bg-gray-700/50 rounded-lg mx-auto mb-4 w-96 max-w-full animate-pulse"></div>
          <div className="h-6 bg-white/10 dark:bg-gray-700/30 rounded-lg mx-auto w-2/3 animate-pulse"></div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
        {[
          { icon: BookOpen, color: 'blue' },
          { icon: CheckCircle2, color: 'emerald' },
          { icon: Award, color: 'purple' },
          { icon: Zap, color: 'amber' },
          { icon: BookOpen, color: 'orange' },
          { icon: CheckCircle2, color: 'indigo' },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4"
          >
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700">
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 dark:text-slate-500" />
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-14 animate-pulse"></div>
            </div>
            <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded mb-2 w-12 animate-pulse"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-20 animate-pulse"></div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Tab Navigation Skeleton */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
          <div className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 h-[42px] sm:h-[46px]">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm animate-pulse"></div>
            <div className="animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 h-9 sm:h-10 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse"></div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse"></div>
          </div>
        </div>

        {/* Course Cards Skeleton */}
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="h-36 sm:h-40 md:h-44 bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                <div className="p-2.5 sm:p-3 space-y-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 pb-1.5 sm:pb-2 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded w-14 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded w-24 animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded w-12 animate-pulse"></div>
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded w-6 animate-pulse"></div>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
