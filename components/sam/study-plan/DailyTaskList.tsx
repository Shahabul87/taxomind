'use client';

/**
 * DailyTaskList Component
 *
 * Displays a list of daily study tasks with checkboxes for completion tracking.
 * Each task shows title, description, estimated time, and task type badge.
 */

import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Code,
  FileQuestion,
  RotateCcw,
  Wrench,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface DailyTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  estimatedMinutes?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  metadata?: {
    weekNumber?: number;
    dayNumber?: number;
    scheduledDate?: string;
    taskType?: string;
    contentLinks?: Array<{ url?: string; title?: string }>;
  };
}

interface DailyTaskListProps {
  tasks: DailyTask[];
  onToggleTask?: (taskId: string, completed: boolean) => Promise<void>;
  isUpdating?: string | null;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TaskTypeBadge({ type }: { type?: string }) {
  const typeConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    learn: {
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      icon: <BookOpen className="w-3 h-3" />,
      label: 'Learn',
    },
    practice: {
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      icon: <Code className="w-3 h-3" />,
      label: 'Practice',
    },
    assess: {
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      icon: <FileQuestion className="w-3 h-3" />,
      label: 'Quiz',
    },
    review: {
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      icon: <RotateCcw className="w-3 h-3" />,
      label: 'Review',
    },
    project: {
      color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      icon: <Wrench className="w-3 h-3" />,
      label: 'Project',
    },
  };

  const config = typeConfig[type?.toLowerCase() ?? 'learn'] || typeConfig.learn;

  return (
    <Badge className={cn('text-xs flex items-center gap-1', config.color)}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  const colors: Record<string, string> = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  if (!difficulty) return null;

  return (
    <Badge className={cn('text-xs capitalize', colors[difficulty] || colors.medium)}>
      {difficulty}
    </Badge>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DailyTaskList({
  tasks,
  onToggleTask,
  isUpdating,
  className,
  compact = false,
}: DailyTaskListProps) {
  const handleToggle = async (task: DailyTask) => {
    if (!onToggleTask || isUpdating) return;
    const isCurrentlyCompleted = task.status === 'completed';
    await onToggleTask(task.id, !isCurrentlyCompleted);
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 dark:text-slate-400">
        No tasks scheduled for this period.
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {tasks.map((task) => {
        const isCompleted = task.status === 'completed';
        const isCurrentlyUpdating = isUpdating === task.id;

        return (
          <div
            key={task.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-all duration-200',
              isCompleted
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
              compact ? 'p-2' : 'p-3'
            )}
          >
            {/* Checkbox */}
            <button
              onClick={() => handleToggle(task)}
              disabled={isCurrentlyUpdating || !onToggleTask}
              className={cn(
                'mt-0.5 flex-shrink-0 transition-colors',
                onToggleTask ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              {isCurrentlyUpdating ? (
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
              )}
            </button>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium text-sm',
                      isCompleted
                        ? 'line-through text-slate-500 dark:text-slate-400'
                        : 'text-slate-900 dark:text-white'
                    )}
                  >
                    {task.title}
                  </p>
                  {!compact && task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <TaskTypeBadge type={task.metadata?.taskType} />
                  {!compact && <DifficultyBadge difficulty={task.difficulty} />}
                </div>
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                {task.estimatedMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.estimatedMinutes} min
                  </span>
                )}
                {task.metadata?.scheduledDate && (
                  <span>
                    {new Date(task.metadata.scheduledDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {task.metadata?.dayNumber && (
                  <span className="text-slate-400">Day {task.metadata.dayNumber}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DailyTaskList;
