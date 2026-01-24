'use client';

/**
 * WeeklyTimeline Component
 *
 * Horizontal timeline showing progress through weekly milestones.
 * Each week shows a circle with progress status and connecting lines.
 */

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeekProgress } from '@/lib/sam/study-plan-metrics';

// ============================================================================
// TYPES
// ============================================================================

interface WeeklyTimelineProps {
  weeks: WeekProgress[];
  currentWeek: number;
  onWeekClick?: (weekNumber: number) => void;
  className?: string;
}

// ============================================================================
// WEEK NODE COMPONENT
// ============================================================================

interface WeekNodeProps {
  week: WeekProgress;
  isCurrent: boolean;
  onClick?: () => void;
  index: number;
}

function WeekNode({ week, isCurrent, onClick, index }: WeekNodeProps) {
  const { weekNumber, completionRate, status, tasksCompleted, tasksTotal } = week;

  const isCompleted = status === 'completed';
  const isLocked = status === 'locked';
  const isUpcoming = status === 'upcoming';
  const hasProgress = completionRate > 0 && completionRate < 100;

  // Circle styles based on status
  const getCircleStyles = () => {
    if (isCompleted) {
      return 'bg-emerald-500 text-white border-emerald-500';
    }
    if (isCurrent) {
      return 'bg-blue-500 text-white border-blue-500 ring-4 ring-blue-200 dark:ring-blue-900/50';
    }
    if (hasProgress) {
      return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
    }
    if (isLocked) {
      return 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700';
    }
    return 'bg-white text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="flex flex-col items-center gap-2 min-w-[60px]"
    >
      {/* Circle */}
      <button
        onClick={!isLocked ? onClick : undefined}
        disabled={isLocked}
        className={cn(
          'relative w-10 h-10 rounded-full border-2 flex items-center justify-center',
          'font-bold text-sm transition-all duration-200',
          getCircleStyles(),
          !isLocked && onClick && 'cursor-pointer hover:scale-110',
          isLocked && 'cursor-not-allowed'
        )}
      >
        {isCompleted ? (
          <Check className="w-5 h-5" />
        ) : isLocked ? (
          <Lock className="w-4 h-4" />
        ) : (
          <span>W{weekNumber}</span>
        )}

        {/* Progress ring for partially complete weeks */}
        {hasProgress && !isCompleted && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 40 40"
          >
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${completionRate * 1.13} 113`}
              className="text-blue-500"
            />
          </svg>
        )}
      </button>

      {/* Task count */}
      <span
        className={cn(
          'text-xs font-medium',
          isCompleted
            ? 'text-emerald-600 dark:text-emerald-400'
            : isCurrent
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-500 dark:text-slate-400'
        )}
      >
        {tasksCompleted}/{tasksTotal}
      </span>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WeeklyTimeline({
  weeks,
  currentWeek,
  onWeekClick,
  className,
}: WeeklyTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentWeekRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current week on mount
  useEffect(() => {
    if (currentWeekRef.current && containerRef.current) {
      const container = containerRef.current;
      const currentElement = currentWeekRef.current;

      // Calculate scroll position to center current week
      const scrollLeft =
        currentElement.offsetLeft -
        container.clientWidth / 2 +
        currentElement.clientWidth / 2;

      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth',
      });
    }
  }, [currentWeek]);

  if (weeks.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      {/* Scroll container */}
      <div
        ref={containerRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent pb-2"
      >
        <div className="flex items-center gap-2 min-w-max px-4 py-2">
          {weeks.map((week, index) => {
            const isCurrent = week.weekNumber === currentWeek;

            return (
              <React.Fragment key={week.weekNumber}>
                {/* Week node */}
                <div ref={isCurrent ? currentWeekRef : undefined}>
                  <WeekNode
                    week={week}
                    isCurrent={isCurrent}
                    onClick={onWeekClick ? () => onWeekClick(week.weekNumber) : undefined}
                    index={index}
                  />
                </div>

                {/* Connector line */}
                {index < weeks.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-8 flex-shrink-0',
                      week.status === 'completed'
                        ? 'bg-emerald-500'
                        : week.status === 'current' || week.completionRate > 0
                        ? 'bg-gradient-to-r from-blue-500 to-slate-300 dark:to-slate-600'
                        : 'bg-slate-200 dark:bg-slate-700'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Fade edges for scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-800 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-800 to-transparent pointer-events-none" />
    </div>
  );
}

export default WeeklyTimeline;
