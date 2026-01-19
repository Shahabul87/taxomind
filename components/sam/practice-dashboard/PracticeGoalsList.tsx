'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Flag,
  Clock,
  Zap,
  Flame,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { PracticeGoalsListProps, GoalType, PracticeGoal } from './types';

// Icon mapping for goal types
const GOAL_TYPE_ICONS: Record<GoalType, React.ElementType> = {
  QUALITY_HOURS: Zap,
  HOURS: Clock,
  SESSIONS: Target,
  STREAK: Flame,
  WEEKLY_HOURS: Calendar,
};

const GOAL_TYPE_COLORS: Record<GoalType, string> = {
  QUALITY_HOURS: 'text-emerald-500',
  HOURS: 'text-blue-500',
  SESSIONS: 'text-purple-500',
  STREAK: 'text-orange-500',
  WEEKLY_HOURS: 'text-teal-500',
};

// Format value based on goal type
function formatValue(value: number, goalType: GoalType): string {
  switch (goalType) {
    case 'QUALITY_HOURS':
    case 'HOURS':
    case 'WEEKLY_HOURS':
      return `${value.toFixed(1)}h`;
    case 'SESSIONS':
      return `${Math.round(value)} sessions`;
    case 'STREAK':
      return `${Math.round(value)} days`;
    default:
      return value.toString();
  }
}

interface GoalCardProps {
  goal: PracticeGoal;
  onEdit?: (goal: PracticeGoal) => void;
  onDelete?: (goalId: string) => Promise<void>;
}

function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const Icon = GOAL_TYPE_ICONS[goal.goalType] || Target;
  const iconColor = GOAL_TYPE_COLORS[goal.goalType] || 'text-slate-500';

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    await onDelete(goal.id);
    setIsDeleting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      <Card
        className={cn(
          'border-slate-200/50 bg-white/70 backdrop-blur-sm transition-all dark:border-slate-700/50 dark:bg-slate-800/70',
          goal.isCompleted && 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20',
          goal.isOverdue && !goal.isCompleted && 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Icon and Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                  goal.isCompleted
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : goal.isOverdue
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-slate-100 dark:bg-slate-800'
                )}
              >
                {goal.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Icon className={cn('h-5 w-5', iconColor)} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                    {goal.title}
                  </h4>
                  {goal.skillName && (
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      {goal.skillName}
                    </span>
                  )}
                </div>

                {goal.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {goal.description}
                  </p>
                )}

                {/* Progress */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">
                      {formatValue(goal.currentValue, goal.goalType)} of{' '}
                      {formatValue(goal.targetValue, goal.goalType)}
                    </span>
                    <span
                      className={cn(
                        'font-medium',
                        goal.isCompleted
                          ? 'text-emerald-600'
                          : goal.progressPercentage >= 75
                            ? 'text-amber-600'
                            : 'text-slate-600 dark:text-slate-400'
                      )}
                    >
                      {goal.progressPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(goal.progressPercentage, 100)}
                    className={cn(
                      'h-2',
                      goal.isCompleted && '[&>div]:bg-emerald-500',
                      goal.isOverdue && !goal.isCompleted && '[&>div]:bg-red-500'
                    )}
                  />
                </div>

                {/* Footer info */}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {goal.deadline && (
                    <div
                      className={cn(
                        'flex items-center gap-1',
                        goal.isOverdue && !goal.isCompleted && 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {goal.isOverdue && !goal.isCompleted ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : (
                        <Calendar className="h-3 w-3" />
                      )}
                      <span>
                        {goal.isOverdue && !goal.isCompleted
                          ? 'Overdue'
                          : goal.daysUntilDeadline !== null
                            ? goal.daysUntilDeadline === 0
                              ? 'Due today'
                              : goal.daysUntilDeadline === 1
                                ? 'Due tomorrow'
                                : `${goal.daysUntilDeadline} days left`
                            : new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {goal.isCompleted && goal.completedAt && (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>
                        Completed{' '}
                        {new Date(goal.completedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {!goal.isCompleted && goal.remaining > 0 && (
                    <span>{formatValue(goal.remaining, goal.goalType)} to go</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {(onEdit || onDelete) && !goal.isCompleted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(goal)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-red-600 focus:text-red-600"
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PracticeGoalsList({
  goals,
  onEdit,
  onDelete,
  isLoading,
  className,
}: PracticeGoalsListProps) {
  if (isLoading) {
    return (
      <Card className={cn('border-slate-200/50 dark:border-slate-700/50', className)}>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-slate-500 dark:text-slate-400">Loading goals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card className={cn('border-slate-200/50 dark:border-slate-700/50', className)}>
        <CardContent className="py-12 text-center">
          <Flag className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Goals Yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Set goals to stay motivated and track your progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Separate active and completed goals
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Active Goals ({activeGoals.length})
          </h3>
          <AnimatePresence>
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Completed ({completedGoals.length})
          </h3>
          <AnimatePresence>
            {completedGoals.slice(0, 5).map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </AnimatePresence>
          {completedGoals.length > 5 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              +{completedGoals.length - 5} more completed goals
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PracticeGoalsList;
