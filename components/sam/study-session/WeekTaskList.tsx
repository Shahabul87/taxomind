'use client';

/**
 * WeekTaskList Component
 *
 * Displays tasks for a selected week with schedule buttons.
 */

import React from 'react';
import {
  Clock,
  CalendarPlus,
  CheckCircle2,
  Circle,
  BookOpen,
  Target,
  Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SubGoal } from './StudySessionScheduler';

interface WeekTaskListProps {
  tasks: SubGoal[];
  weekNumber: number;
  planTitle?: string;
  onScheduleTask: (task: SubGoal) => void;
}

// Get icon based on task type
const getTaskIcon = (taskType?: string) => {
  switch (taskType?.toLowerCase()) {
    case 'study':
    case 'lesson':
      return <BookOpen className="w-4 h-4" />;
    case 'practice':
    case 'exercise':
      return <Target className="w-4 h-4" />;
    case 'quiz':
    case 'assessment':
      return <Brain className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
};

// Get difficulty color
const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'medium':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'hard':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  }
};

// Format minutes to hours and minutes
const formatDuration = (minutes?: number): string => {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export function WeekTaskList({
  tasks,
  weekNumber,
  planTitle,
  onScheduleTask,
}: WeekTaskListProps) {
  // Sort tasks by day number
  const sortedTasks = [...tasks].sort((a, b) => {
    const dayA = a.metadata?.dayNumber || a.order || 0;
    const dayB = b.metadata?.dayNumber || b.order || 0;
    return dayA - dayB;
  });

  // Calculate totals
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const completedMinutes = tasks
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  if (tasks.length === 0) {
    return (
      <Card className="border-dashed border-2 border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/10">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            No Tasks for Week {weekNumber}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This week doesn&apos;t have any scheduled tasks yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Week {weekNumber} Tasks</span>
              <Badge
                variant="secondary"
                className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
              >
                {completedCount}/{tasks.length} done
              </Badge>
            </CardTitle>
            {planTitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {planTitle}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {formatDuration(totalMinutes)} total
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {formatDuration(completedMinutes)} completed
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {sortedTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const dayNumber = task.metadata?.dayNumber;
            const taskType = task.metadata?.taskType || task.type;

            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
                  isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700'
                )}
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  )}
                </div>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {dayNumber && (
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Day {dayNumber}:
                      </span>
                    )}
                    <span
                      className={cn(
                        'font-medium truncate',
                        isCompleted
                          ? 'text-slate-500 dark:text-slate-400 line-through'
                          : 'text-slate-900 dark:text-white'
                      )}
                    >
                      {task.title}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Task metadata */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Task type badge */}
                  <Badge
                    variant="outline"
                    className="hidden sm:flex items-center gap-1 text-xs"
                  >
                    {getTaskIcon(taskType)}
                    <span className="capitalize">{taskType || 'Study'}</span>
                  </Badge>

                  {/* Difficulty badge */}
                  {task.difficulty && (
                    <Badge
                      className={cn(
                        'hidden sm:flex text-xs capitalize',
                        getDifficultyColor(task.difficulty)
                      )}
                    >
                      {task.difficulty}
                    </Badge>
                  )}

                  {/* Duration */}
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(task.estimatedMinutes)}</span>
                  </div>

                  {/* Schedule button */}
                  {!isCompleted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onScheduleTask(task)}
                      className="text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30"
                    >
                      <CalendarPlus className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Schedule</span>
                    </Button>
                  )}

                  {isCompleted && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default WeekTaskList;
