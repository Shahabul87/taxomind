'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PracticeStreakWidgetProps } from './types';

export function PracticeStreakWidget({
  currentStreak,
  longestStreak,
  lastActive,
  className,
}: PracticeStreakWidgetProps) {
  // Calculate if streak is at risk (no activity today)
  const isAtRisk = React.useMemo(() => {
    if (!lastActive) return currentStreak > 0;
    const lastActiveDate = new Date(lastActive);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastActiveDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 1 && currentStreak > 0;
  }, [lastActive, currentStreak]);

  // Format last active date
  const lastActiveText = React.useMemo(() => {
    if (!lastActive) return 'Never';
    const date = new Date(lastActive);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }, [lastActive]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'rounded-xl border p-4',
        isAtRisk
          ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 dark:border-orange-800 dark:from-orange-950/30 dark:to-red-950/30'
          : currentStreak > 0
            ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/30'
            : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50',
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Current Streak */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={currentStreak > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              currentStreak > 0 ? 'bg-orange-500/20' : 'bg-slate-200 dark:bg-slate-700'
            )}
          >
            <Flame
              className={cn(
                'h-6 w-6',
                currentStreak > 0 ? 'text-orange-500' : 'text-slate-400'
              )}
            />
          </motion.div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {currentStreak}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">day streak</span>
            </div>
            {isAtRisk && (
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                Practice today to maintain your streak!
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {longestStreak}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Best</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {lastActiveText}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Streak milestones hint */}
      {currentStreak > 0 && currentStreak < 7 && (
        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {7 - currentStreak} more days to reach a 7-day streak milestone!
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default PracticeStreakWidget;
