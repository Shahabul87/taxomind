'use client';

/**
 * MilestonesTracker Component
 *
 * Shows achievement-based progress markers and upcoming milestones.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  Flag,
  Star,
  Sparkles,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isComplete: boolean;
  progress?: number; // 0-100 for partial progress
  tasksRemaining?: number;
}

interface MilestonesTrackerProps {
  completionRate: number;
  tasksCompleted: number;
  tasksTotal: number;
  weeksCompleted: number;
  totalWeeks: number;
  currentStreak: number;
  className?: string;
}

export function MilestonesTracker({
  completionRate,
  tasksCompleted,
  tasksTotal,
  weeksCompleted,
  totalWeeks,
  currentStreak,
  className,
}: MilestonesTrackerProps) {
  const milestones = useMemo((): Milestone[] => {
    const quarterTasks = Math.ceil(tasksTotal * 0.25);
    const halfTasks = Math.ceil(tasksTotal * 0.5);
    const threeQuarterTasks = Math.ceil(tasksTotal * 0.75);

    return [
      {
        id: 'first-week',
        title: 'First Week Complete',
        description: 'Finished Week 1',
        icon: <Flag className="w-4 h-4" />,
        isComplete: weeksCompleted >= 1,
        progress: weeksCompleted >= 1 ? 100 : 0,
      },
      {
        id: 'quarter',
        title: 'First Quarter',
        description: `${quarterTasks} tasks completed`,
        icon: <Target className="w-4 h-4" />,
        isComplete: tasksCompleted >= quarterTasks,
        progress: Math.min(100, (tasksCompleted / quarterTasks) * 100),
        tasksRemaining: Math.max(0, quarterTasks - tasksCompleted),
      },
      {
        id: 'halfway',
        title: 'Halfway Point',
        description: `${halfTasks} tasks completed`,
        icon: <Star className="w-4 h-4" />,
        isComplete: tasksCompleted >= halfTasks,
        progress: Math.min(100, (tasksCompleted / halfTasks) * 100),
        tasksRemaining: Math.max(0, halfTasks - tasksCompleted),
      },
      {
        id: 'three-quarter',
        title: 'Almost There!',
        description: `${threeQuarterTasks} tasks completed`,
        icon: <Sparkles className="w-4 h-4" />,
        isComplete: tasksCompleted >= threeQuarterTasks,
        progress: Math.min(100, (tasksCompleted / threeQuarterTasks) * 100),
        tasksRemaining: Math.max(0, threeQuarterTasks - tasksCompleted),
      },
      {
        id: 'complete',
        title: 'Course Complete! 🎉',
        description: 'All tasks finished',
        icon: <Trophy className="w-4 h-4" />,
        isComplete: completionRate === 100,
        progress: completionRate,
        tasksRemaining: tasksTotal - tasksCompleted,
      },
    ];
  }, [completionRate, tasksCompleted, tasksTotal, weeksCompleted]);

  // Find the next milestone
  const nextMilestone = milestones.find((m) => !m.isComplete);

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Milestones
        </span>
      </div>

      {/* Milestones list */}
      <div className="space-y-2">
        {milestones.map((milestone, index) => (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg transition-colors',
              milestone.isComplete
                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                : nextMilestone?.id === milestone.id
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-slate-50 dark:bg-slate-800/50'
            )}
          >
            {/* Status icon */}
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-full',
                milestone.isComplete
                  ? 'bg-emerald-500 text-white'
                  : nextMilestone?.id === milestone.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              )}
            >
              {milestone.isComplete ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                milestone.icon
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'text-sm font-medium truncate',
                  milestone.isComplete
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300'
                )}
              >
                {milestone.title}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {milestone.isComplete ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✓ Complete
                  </span>
                ) : milestone.tasksRemaining !== undefined ? (
                  `${milestone.tasksRemaining} more to go`
                ) : (
                  milestone.description
                )}
              </div>
            </div>

            {/* Progress indicator for next milestone */}
            {!milestone.isComplete && nextMilestone?.id === milestone.id && (
              <div className="w-10 h-10 relative">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(milestone.progress || 0) * 0.88} 88`}
                    className="text-blue-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(milestone.progress || 0)}%
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Streak bonus */}
      {currentStreak >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-2 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <div>
              <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                {currentStreak} Day Streak!
              </div>
              <div className="text-[10px] text-orange-600 dark:text-orange-400">
                Keep it going!
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default MilestonesTracker;
