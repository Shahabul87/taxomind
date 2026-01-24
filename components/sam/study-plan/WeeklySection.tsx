'use client';

/**
 * WeeklySection Component
 *
 * A collapsible section that groups daily tasks by week.
 * Shows week title, progress, and task list.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Clock,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DailyTaskList, type DailyTask } from './DailyTaskList';

// ============================================================================
// TYPES
// ============================================================================

export interface WeekData {
  weekNumber: number;
  title: string;
  tasks: DailyTask[];
}

interface WeeklySectionProps {
  week: WeekData;
  onToggleTask?: (taskId: string, completed: boolean) => Promise<void>;
  isUpdating?: string | null;
  defaultExpanded?: boolean;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WeeklySection({
  week,
  onToggleTask,
  isUpdating,
  defaultExpanded = false,
  className,
}: WeeklySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate progress
  const completedTasks = week.tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = week.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isComplete = completedTasks === totalTasks && totalTasks > 0;

  // Calculate total estimated time
  const totalMinutes = week.tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const remainingMinutes = week.tasks
    .filter((t) => t.status !== 'completed')
    .reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  // Get date range for the week
  const scheduledDates = week.tasks
    .map((t) => t.metadata?.scheduledDate)
    .filter(Boolean)
    .sort();
  const startDate = scheduledDates[0];
  const endDate = scheduledDates[scheduledDates.length - 1];

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden transition-all duration-200',
        isComplete
          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Expand Icon */}
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          )}

          {/* Week Badge */}
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
              isComplete
                ? 'bg-emerald-500 text-white'
                : progress > 0
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            )}
          >
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              week.weekNumber
            )}
          </div>

          {/* Week Title */}
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Week {week.weekNumber}: {week.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {startDate && endDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' - '}
                  {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.round(totalMinutes / 60)}h total
                {remainingMinutes > 0 && !isComplete && (
                  <span className="text-slate-400">
                    ({Math.round(remainingMinutes / 60)}h left)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Progress */}
        <div className="flex items-center gap-3">
          <Badge
            className={cn(
              'text-xs',
              isComplete
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            )}
          >
            {completedTasks}/{totalTasks} tasks
          </Badge>
          <div className="w-24 hidden sm:block">
            <Progress
              value={progress}
              className={cn('h-2', isComplete && '[&>div]:bg-emerald-500')}
            />
          </div>
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700">
              <DailyTaskList
                tasks={week.tasks}
                onToggleTask={onToggleTask}
                isUpdating={isUpdating}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WeeklySection;
