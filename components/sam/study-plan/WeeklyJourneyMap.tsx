'use client';

/**
 * WeeklyJourneyMap Component
 *
 * A visual road map showing week-by-week progress without
 * displaying individual tasks.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeekProgress } from '@/lib/sam/study-plan-metrics';

interface WeeklyJourneyMapProps {
  weeks: WeekProgress[];
  currentWeek: number;
  className?: string;
}

export function WeeklyJourneyMap({
  weeks,
  currentWeek,
  className,
}: WeeklyJourneyMapProps) {
  if (weeks.length === 0) return null;

  // Split into rows of 5 for better layout
  const maxPerRow = 5;
  const rows: WeekProgress[][] = [];
  for (let i = 0; i < weeks.length; i += maxPerRow) {
    rows.push(weeks.slice(i, i + maxPerRow));
  }

  return (
    <div className={cn('space-y-4', className)}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex items-center justify-start gap-2">
          {row.map((week, index) => {
            const globalIndex = rowIndex * maxPerRow + index;
            const isComplete = week.completionRate === 100;
            const isCurrent = week.weekNumber === currentWeek;
            const isLocked = week.weekNumber > currentWeek + 1;
            const isAccessible = week.weekNumber <= currentWeek + 1;

            return (
              <React.Fragment key={week.weekNumber}>
                {/* Week node */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: globalIndex * 0.05 }}
                  className="flex flex-col items-center"
                >
                  {/* Circle */}
                  <div
                    className={cn(
                      'relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                      isComplete && 'bg-emerald-500 border-emerald-500 text-white',
                      isCurrent && !isComplete && 'bg-blue-500 border-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-900',
                      !isComplete && !isCurrent && isAccessible && 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600',
                      isLocked && 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    )}
                  >
                    {isComplete ? (
                      <Check className="w-5 h-5" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : isCurrent ? (
                      <span className="text-sm font-bold">W{week.weekNumber}</span>
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400" />
                    )}

                    {/* Progress ring for current week */}
                    {isCurrent && !isComplete && week.completionRate > 0 && (
                      <svg
                        className="absolute inset-0 w-full h-full -rotate-90"
                        viewBox="0 0 40 40"
                      >
                        <circle
                          cx="20"
                          cy="20"
                          r="18"
                          fill="none"
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth="3"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="18"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${(week.completionRate / 100) * 113} 113`}
                        />
                      </svg>
                    )}
                  </div>

                  {/* Week label */}
                  <span
                    className={cn(
                      'text-[10px] font-medium mt-1',
                      isComplete && 'text-emerald-600 dark:text-emerald-400',
                      isCurrent && 'text-blue-600 dark:text-blue-400',
                      !isComplete && !isCurrent && 'text-slate-500 dark:text-slate-400'
                    )}
                  >
                    W{week.weekNumber}
                  </span>

                  {/* Task count */}
                  <span
                    className={cn(
                      'text-[10px]',
                      isComplete && 'text-emerald-500',
                      isCurrent && 'text-blue-500',
                      !isComplete && !isCurrent && 'text-slate-400'
                    )}
                  >
                    {week.tasksCompleted}/{week.tasksTotal}
                  </span>
                </motion.div>

                {/* Connector line */}
                {index < row.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 min-w-[20px] max-w-[40px]',
                      weeks[globalIndex + 1]?.completionRate === 100 || isComplete
                        ? 'bg-emerald-400'
                        : globalIndex + 1 === currentWeek - 1 || isCurrent
                          ? 'bg-blue-400'
                          : 'bg-slate-200 dark:bg-slate-700'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default WeeklyJourneyMap;
