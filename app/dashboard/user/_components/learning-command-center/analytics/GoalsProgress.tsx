'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Loader2,
  Flag,
  ListChecks,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useSAMGoals, type SAMGoal, type SAMSubGoal } from '@/hooks/use-sam-agentic-analytics';
import Link from 'next/link';

export interface GoalsProgressProps {
  compact?: boolean;
  maxGoals?: number;
  onViewAllGoals?: () => void;
  onGoalClick?: (goal: SAMGoal) => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const priorityConfig = {
  low: {
    label: 'Low',
    color: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-200 dark:border-slate-700',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  high: {
    label: 'High',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  critical: {
    label: 'Critical',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
};

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700' },
  abandoned: { label: 'Abandoned', color: 'bg-red-100 text-red-700' },
};

function QuickStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', color)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function SubGoalItem({ subGoal }: { subGoal: SAMSubGoal }) {
  const isCompleted = subGoal.status === 'completed';

  return (
    <div className="flex items-center gap-2 py-1.5">
      {isCompleted ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
      )}
      <span
        className={cn(
          'text-sm flex-1',
          isCompleted
            ? 'text-slate-500 line-through dark:text-slate-400'
            : 'text-slate-700 dark:text-slate-300'
        )}
      >
        {subGoal.title}
      </span>
      {subGoal.type && (
        <Badge variant="outline" className="text-xs capitalize">
          {subGoal.type}
        </Badge>
      )}
    </div>
  );
}

function GoalProgressCard({
  goal,
  onClick,
  showSubGoals = true,
}: {
  goal: SAMGoal;
  onClick?: (goal: SAMGoal) => void;
  showSubGoals?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const priority = priorityConfig[goal.priority];
  const status = statusConfig[goal.status];
  const completedSubGoals = goal.subGoals.filter((sg) => sg.status === 'completed').length;
  const totalSubGoals = goal.subGoals.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-4 transition-shadow hover:shadow-md',
        priority.borderColor,
        'bg-white/50 dark:bg-slate-800/50'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Priority indicator */}
        <div className={cn('mt-1 h-2 w-2 rounded-full flex-shrink-0', priority.bgColor.replace('bg-', 'bg-').replace('/20', '').replace('/30', ''))} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 dark:text-white truncate">
                {goal.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={cn('text-xs', status.color)}>
                  {status.label}
                </Badge>
                <Badge variant="outline" className={cn('text-xs', priority.color)}>
                  <Flag className="h-3 w-3 mr-1" />
                  {priority.label}
                </Badge>
              </div>
            </div>
            {onClick && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => onClick(goal)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Progress</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {goal.progress}%
              </span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>

          {/* Sub-goals summary */}
          {totalSubGoals > 0 && (
            <div className="mt-3">
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    <ListChecks className="h-3.5 w-3.5 mr-1" />
                    {completedSubGoals}/{totalSubGoals} sub-goals
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 ml-1" />
                    ) : (
                      <ChevronRight className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                {showSubGoals && (
                  <CollapsibleContent className="mt-2 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-3 ml-1">
                    {goal.subGoals.slice(0, 5).map((subGoal) => (
                      <SubGoalItem key={subGoal.id} subGoal={subGoal} />
                    ))}
                    {goal.subGoals.length > 5 && (
                      <p className="text-xs text-slate-500 py-1">
                        +{goal.subGoals.length - 5} more sub-goals
                      </p>
                    )}
                  </CollapsibleContent>
                )}
              </Collapsible>
            </div>
          )}

          {/* Target date */}
          {goal.targetDate && (
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="h-3 w-3" />
              <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LoadingState({ compact }: { compact?: boolean }) {
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardContent className={cn('flex items-center justify-center', compact ? 'p-6' : 'p-12')}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-slate-500">Loading goals...</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ compact }: { compact?: boolean }) {
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardContent className={cn('flex flex-col items-center justify-center text-center', compact ? 'p-6' : 'p-12')}>
        <Target className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-semibold text-slate-900 dark:text-white">No Active Goals</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Create a learning goal to track your progress and stay motivated.
        </p>
        <Link href="/dashboard/user/goals" className="mt-4">
          <Button size="sm">
            <Target className="h-4 w-4 mr-2" />
            Create a Goal
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GoalsProgress({
  compact = false,
  maxGoals = 3,
  onViewAllGoals,
  onGoalClick,
}: GoalsProgressProps) {
  const { goals, totalGoals, activeGoals, completedGoals, avgProgress, loading } = useSAMGoals();

  if (loading) {
    return <LoadingState compact={compact} />;
  }

  if (goals.length === 0) {
    return <EmptyState compact={compact} />;
  }

  // Get active goals to display (prioritize by priority, then by progress)
  const displayGoals = goals
    .filter((g) => g.status === 'active')
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.progress - a.progress;
    })
    .slice(0, compact ? 2 : maxGoals);

  // Compact view for overview grid
  if (compact) {
    return (
      <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <Target className="h-5 w-5 text-emerald-500" />
              Goals Progress
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {activeGoals} active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="flex items-center justify-around rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3 dark:from-emerald-950/30 dark:to-teal-950/30">
            <QuickStat icon={Target} label="Total" value={totalGoals} color="bg-slate-500" />
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <QuickStat icon={Zap} label="Active" value={activeGoals} color="bg-amber-500" />
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <QuickStat icon={TrendingUp} label="Progress" value={`${avgProgress}%`} color="bg-emerald-500" />
          </div>

          {/* Top Goals */}
          <div className="space-y-3">
            {displayGoals.map((goal) => (
              <GoalProgressCard
                key={goal.id}
                goal={goal}
                onClick={onGoalClick}
                showSubGoals={false}
              />
            ))}
          </div>

          {/* View All Button */}
          <Link href="/dashboard/user/goals" className="block">
            <Button variant="outline" size="sm" className="w-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
              View All Goals
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-emerald-500" />
            Goals Progress
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {activeGoals} active
            </Badge>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {completedGoals} completed
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:from-emerald-950/30 dark:to-teal-950/30">
          <QuickStat icon={Target} label="Total Goals" value={totalGoals} color="bg-slate-500" />
          <QuickStat icon={Zap} label="Active" value={activeGoals} color="bg-amber-500" />
          <QuickStat icon={CheckCircle2} label="Completed" value={completedGoals} color="bg-blue-500" />
          <QuickStat icon={TrendingUp} label="Avg Progress" value={`${avgProgress}%`} color="bg-emerald-500" />
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <Zap className="h-4 w-4 text-amber-500" />
            Active Goals ({activeGoals})
          </h4>
          <AnimatePresence mode="popLayout">
            {displayGoals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GoalProgressCard goal={goal} onClick={onGoalClick} showSubGoals />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* View All Button */}
        <Link href="/dashboard/user/goals" className="block">
          <Button variant="outline" className="w-full">
            View All {totalGoals} Goals
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
