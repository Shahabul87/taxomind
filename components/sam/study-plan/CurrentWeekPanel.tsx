'use client';

/**
 * CurrentWeekPanel Component
 *
 * An expandable panel showing the current week's tasks with
 * checkboxes for completion tracking.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { DailyTaskList, type DailyTask } from './DailyTaskList';
import type { WeekProgress } from '@/lib/sam/study-plan-metrics';

// ============================================================================
// TYPES
// ============================================================================

interface CurrentWeekPanelProps {
  week: WeekProgress | null;
  tasks: DailyTask[];
  onTaskToggle?: (taskId: string, completed: boolean) => Promise<void>;
  isUpdating?: string | null;
  defaultExpanded?: boolean;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CurrentWeekPanel({
  week,
  tasks,
  onTaskToggle,
  isUpdating,
  defaultExpanded = false,
  className,
}: CurrentWeekPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!week) {
    return null;
  }

  const {
    weekNumber,
    title,
    tasksCompleted,
    tasksTotal,
    completionRate,
    startDate,
    endDate,
    hoursCompleted,
    hoursTotal,
  } = week;

  const isComplete = completionRate === 100;

  // Format date range
  const dateRange =
    startDate && endDate
      ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : null;

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden transition-all duration-200',
        isComplete
          ? 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20'
          : 'border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors active:bg-white/30"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Pin icon */}
          <div
            className={cn(
              'flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0',
              isComplete
                ? 'bg-emerald-100 dark:bg-emerald-900/50'
                : 'bg-blue-100 dark:bg-blue-900/50'
            )}
          >
            <MapPin
              className={cn(
                'w-3.5 h-3.5 sm:w-4 sm:h-4',
                isComplete
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-blue-600 dark:text-blue-400'
              )}
            />
          </div>

          {/* Week info */}
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h4 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                Week {weekNumber}: {title}
              </h4>
              {isComplete && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px] sm:text-xs px-1.5 sm:px-2">
                  Complete
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {dateRange && (
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden xs:inline">{dateRange}</span>
                </span>
              )}
              <span className="flex items-center gap-0.5 sm:gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {hoursCompleted.toFixed(1)}h / {hoursTotal.toFixed(1)}h
              </span>
              {/* Mobile: show task count inline */}
              <span className="flex sm:hidden items-center">
                {tasksCompleted}/{tasksTotal}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: progress and toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                isComplete
                  ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300'
                  : 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300'
              )}
            >
              {tasksCompleted}/{tasksTotal} tasks
            </Badge>
            <div className="w-16">
              <Progress
                value={completionRate}
                className={cn('h-1.5', isComplete && '[&>div]:bg-emerald-500')}
              />
            </div>
          </div>

          <div
            className={cn(
              'flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-md transition-colors',
              isComplete
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-blue-600 dark:text-blue-400'
            )}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
              <DailyTaskList
                tasks={tasks}
                onToggleTask={onTaskToggle}
                isUpdating={isUpdating}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CurrentWeekPanel;
