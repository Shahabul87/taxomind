"use client";

import { motion } from 'framer-motion';

interface SkeletonCardProps {
  variant?: 'featured' | 'standard' | 'compact' | 'hero';
  index?: number;
}

export function SkeletonCard({ variant = 'standard', index = 0 }: SkeletonCardProps) {
  const shimmerAnimation = {
    initial: { backgroundPosition: '-200% 0' },
    animate: {
      backgroundPosition: '200% 0',
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear' as const
      }
    }
  };

  const shimmerClass = "bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%]";

  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 }}
        className="relative overflow-hidden rounded-3xl bg-gray-200 dark:bg-gray-800 shadow-xl"
      >
        <div className="aspect-[16/9]">
          <motion.div
            {...shimmerAnimation}
            className={`w-full h-full ${shimmerClass}`}
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-8 space-y-4">
          <div className="w-24 h-8 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
            <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
          </div>

          <div className="space-y-3">
            <div className="w-3/4 h-10 rounded-lg bg-gray-300 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
            <div className="w-full h-6 rounded-lg bg-gray-300 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
            <div className="w-2/3 h-6 rounded-lg bg-gray-300 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
                <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
              </div>
              <div className="w-32 h-5 rounded bg-gray-300 dark:bg-gray-700 overflow-hidden">
                <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
              </div>
            </div>
            <div className="w-28 h-10 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 }}
        className="overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="aspect-[16/10] bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-20 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
            <div className="w-16 h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="w-full h-6 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
            <div className="w-3/4 h-6 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
          </div>

          <div className="w-full h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
              </div>
              <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-12 h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
              </div>
              <div className="w-12 h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 }}
        className="flex gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="w-24 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
          <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-16 h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
            <div className="w-20 h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
          </div>

          <div className="w-full h-5 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
          </div>

          <div className="w-3/4 h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-16 h-3 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
            <div className="w-16 h-3 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Standard variant
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className="overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700"
    >
      <div className="aspect-[16/10] bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
          </div>
          <div className="w-20 h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full h-5 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
          </div>
          <div className="w-3/4 h-5 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
          </div>
        </div>

        <div className="w-full h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
            <div className="w-20 h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-12 h-3 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
            <div className="w-12 h-3 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div {...shimmerAnimation} className={`w-full h-full ${shimmerClass}`} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}