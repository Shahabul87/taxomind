'use client';

import React from 'react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import {
  Calendar,
  ChevronRight,
  Clock,
  Flag,
  BookOpen,
  CheckCircle2,
  Circle,
  Pause,
  FileEdit,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Goal } from '@/app/dashboard/user/goals/_components/GoalsClient';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
  variant?: 'grid' | 'list';
}

const statusConfig = {
  draft: {
    icon: FileEdit,
    label: 'Draft',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    dotColor: 'bg-slate-400',
  },
  active: {
    icon: Circle,
    label: 'Active',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  paused: {
    icon: Pause,
    label: 'Paused',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    dotColor: 'bg-amber-500',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    dotColor: 'bg-blue-500',
  },
  abandoned: {
    icon: XCircle,
    label: 'Abandoned',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    dotColor: 'bg-red-500',
  },
};

const priorityConfig = {
  low: {
    label: 'Low',
    color: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  high: {
    label: 'High',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
  critical: {
    label: 'Critical',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
};

const masteryLabels: Record<string, string> = {
  novice: 'Novice',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export function GoalCard({ goal, onClick, variant = 'grid' }: GoalCardProps) {
  const status = statusConfig[goal.status];
  const priority = priorityConfig[goal.priority];
  const StatusIcon = status.icon;

  const isOverdue = goal.targetDate && isPast(new Date(goal.targetDate)) && goal.status !== 'completed';
  const completedSubGoals = goal.subGoals.filter((sg) => sg.status === 'completed').length;

  if (variant === 'list') {
    return (
      <button
        onClick={onClick}
        className="w-full text-left group relative overflow-hidden rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 p-4 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          {/* Progress Ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                strokeWidth="4"
                className="fill-none stroke-slate-200 dark:stroke-slate-700"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                strokeWidth="4"
                strokeLinecap="round"
                className={cn(
                  'fill-none transition-all duration-500',
                  goal.status === 'completed'
                    ? 'stroke-emerald-500'
                    : 'stroke-violet-500'
                )}
                strokeDasharray={`${(goal.progress / 100) * 125.6} 125.6`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200">
              {goal.progress}%
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {goal.title}
              </h3>
              <Badge variant="secondary" className={cn('text-xs', status.color)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              {goal.course && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {goal.course.title}
                </span>
              )}
              {goal.targetDate && (
                <span className={cn('flex items-center gap-1', isOverdue && 'text-red-500')}>
                  <Calendar className="w-3 h-3" />
                  {format(new Date(goal.targetDate), 'MMM d')}
                </span>
              )}
              {goal.subGoals.length > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {completedSubGoals}/{goal.subGoals.length} tasks
                </span>
              )}
            </div>
          </div>

          {/* Priority & Arrow */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn('text-xs', priority.color, priority.bgColor)}>
              <Flag className="w-3 h-3 mr-1" />
              {priority.label}
            </Badge>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </button>
    );
  }

  // Grid variant
  return (
    <button
      onClick={onClick}
      className="w-full text-left group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300"
    >
      {/* Top gradient bar based on priority */}
      <div
        className={cn(
          'h-1.5 w-full',
          goal.priority === 'critical' && 'bg-gradient-to-r from-red-500 to-rose-500',
          goal.priority === 'high' && 'bg-gradient-to-r from-orange-500 to-amber-500',
          goal.priority === 'medium' && 'bg-gradient-to-r from-blue-500 to-cyan-500',
          goal.priority === 'low' && 'bg-gradient-to-r from-slate-400 to-slate-500'
        )}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={cn('text-xs', status.color)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {goal.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        {goal.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
            {goal.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Progress
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {goal.progress}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                goal.status === 'completed'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                  : 'bg-gradient-to-r from-violet-500 to-indigo-500'
              )}
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>

        {/* Mastery Levels */}
        {(goal.currentMastery || goal.targetMastery) && (
          <div className="flex items-center gap-2 mb-4 text-xs">
            {goal.currentMastery && (
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {masteryLabels[goal.currentMastery] || goal.currentMastery}
              </span>
            )}
            {goal.currentMastery && goal.targetMastery && (
              <ChevronRight className="w-3 h-3 text-slate-400" />
            )}
            {goal.targetMastery && (
              <span className="px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                {masteryLabels[goal.targetMastery] || goal.targetMastery}
              </span>
            )}
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
          {goal.course && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{goal.course.title}</span>
            </div>
          )}
          {goal.targetDate && (
            <div className={cn(
              'flex items-center gap-1.5 text-xs',
              isOverdue ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
            )}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(goal.targetDate), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        {/* Sub-goals indicator */}
        {goal.subGoals.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Sub-goals</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {completedSubGoals} / {goal.subGoals.length} completed
              </span>
            </div>
            <div className="flex gap-1 mt-2">
              {goal.subGoals.slice(0, 8).map((sg) => (
                <div
                  key={sg.id}
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    sg.status === 'completed'
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              ))}
              {goal.subGoals.length > 8 && (
                <span className="text-xs text-slate-400">+{goal.subGoals.length - 8}</span>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {goal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {goal.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
            {goal.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                +{goal.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover arrow indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-5 h-5 text-violet-500" />
      </div>
    </button>
  );
}
