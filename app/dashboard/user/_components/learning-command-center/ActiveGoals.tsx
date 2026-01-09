'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  GraduationCap,
  BookOpen,
  Award,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { LearningGoal } from './types';

interface ActiveGoalsProps {
  goals: LearningGoal[];
  onGoalClick?: (goal: LearningGoal) => void;
  onViewAll?: () => void;
}

const goalTypeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  COURSE: { icon: BookOpen, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  SKILL: { icon: Target, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  CERTIFICATION: { icon: GraduationCap, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  CUSTOM: { icon: Award, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
};

const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: React.ElementType }> = {
  ON_TRACK: { color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'On Track', icon: TrendingUp },
  AHEAD: { color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'Ahead', icon: TrendingUp },
  BEHIND: { color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', label: 'Behind', icon: TrendingDown },
  AT_RISK: { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'At Risk', icon: AlertCircle },
  COMPLETED: { color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Completed', icon: CheckCircle2 },
  PAUSED: { color: 'text-slate-500', bgColor: 'bg-slate-100 dark:bg-slate-900/30', label: 'Paused', icon: Clock },
};

function GoalCard({
  goal,
  index,
  onClick,
}: {
  goal: LearningGoal;
  index: number;
  onClick?: () => void;
}) {
  const typeConfig = (goal.type && goalTypeConfig[goal.type]) || goalTypeConfig.CUSTOM;
  const status = statusConfig[goal.status];
  const TypeIcon = typeConfig.icon;
  const StatusIcon = status.icon;

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `${diffDays} days left`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks left`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getProgressColor = (progress: number, status: string): string => {
    if (status === 'COMPLETED') return 'bg-emerald-500';
    if (status === 'BEHIND') return 'bg-amber-500';
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  const completedMilestones = goal.milestones.filter((m) => m.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.01 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="rounded-xl border border-slate-200/50 bg-white/50 p-4 transition-all hover:border-slate-300/50 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-600/50">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${typeConfig.bgColor}`}>
              <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">
                {goal.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                {formatDate(goal.targetDate)}
              </div>
            </div>
          </div>

          <Badge
            variant="secondary"
            className={`${status.bgColor} ${status.color} text-xs`}
          >
            <StatusIcon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Progress</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {goal.progress}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 }}
              className={`h-full rounded-full ${getProgressColor(goal.progress, goal.status)}`}
            />
          </div>
        </div>

        {/* Milestones */}
        {goal.milestones.length > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {completedMilestones}/{goal.milestones.length} milestones
            </span>
            <div className="flex gap-1">
              {goal.milestones.slice(0, 5).map((milestone) => (
                <div
                  key={milestone.id}
                  className={`h-2 w-2 rounded-full ${
                    milestone.completed
                      ? 'bg-emerald-500'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
              {goal.milestones.length > 5 && (
                <span className="text-slate-400">
                  +{goal.milestones.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Warning for behind schedule */}
        {goal.status === 'BEHIND' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
          >
            <AlertCircle className="h-4 w-4" />
            <span>You&apos;re falling behind. Consider adjusting your schedule.</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function ActiveGoals({ goals, onGoalClick, onViewAll }: ActiveGoalsProps) {
  // Sort goals: At risk/Behind first, then by progress
  const sortedGoals = [...goals].sort((a, b) => {
    const statusOrder: Record<string, number> = { AT_RISK: 0, BEHIND: 1, ON_TRACK: 2, AHEAD: 3, PAUSED: 4, COMPLETED: 5 };
    const aOrder = statusOrder[a.status] ?? 2;
    const bOrder = statusOrder[b.status] ?? 2;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    return b.progress - a.progress;
  });

  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  const behindCount = goals.filter((g) => g.status === 'BEHIND').length;

  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-amber-500" />
            Active Goals
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {/* Summary stats */}
        <div className="mt-2 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">{goals.length} active</span>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {avgProgress}%
            </span>
            <span className="text-slate-500">avg. progress</span>
          </div>
          {behindCount > 0 && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {behindCount} behind
              </Badge>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {sortedGoals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Target className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-sm text-slate-500">
              No active goals. Set one to track your progress!
            </p>
            <Button variant="outline" className="mt-4" size="sm">
              Create a goal
            </Button>
          </motion.div>
        ) : (
          sortedGoals.map((goal, index) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={index}
              onClick={() => onGoalClick?.(goal)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
