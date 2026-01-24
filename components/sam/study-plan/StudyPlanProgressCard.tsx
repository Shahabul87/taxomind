'use client';

/**
 * StudyPlanProgressCard Component
 *
 * Enhanced progress visualization for AI-generated study plans.
 * Combines MetricsDashboard, WeeklyTimeline, CurrentWeekPanel,
 * and ScheduleStatusBanner for comprehensive progress tracking.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Trophy,
  RefreshCw,
  Loader2,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { MetricsDashboard } from './MetricsDashboard';
import { WeeklyTimeline } from './WeeklyTimeline';
import { CurrentWeekPanel } from './CurrentWeekPanel';
import { ScheduleStatusBanner } from './ScheduleStatusBanner';
import type { DailyTask } from './DailyTaskList';

import {
  calculateStudyPlanMetrics,
  calculateWeeklyProgress,
  findCurrentWeek,
  type StudyPlanMetrics,
  type WeekProgress,
  type SubGoalData,
  type GoalMetadata,
} from '@/lib/sam/study-plan-metrics';

// ============================================================================
// TYPES
// ============================================================================

interface GoalData {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  targetDate?: string;
  createdAt: string;
  metadata?: GoalMetadata;
  subGoals?: SubGoalData[];
}

interface StudyPlanProgressCardProps {
  goalId: string;
  /** Pre-fetched goal data (optional - will fetch if not provided) */
  goal?: GoalData | null;
  /** Pre-fetched sub-goals (optional) */
  subGoals?: SubGoalData[];
  compact?: boolean;
  className?: string;
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  onRefresh?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StudyPlanProgressCard({
  goalId,
  goal: initialGoal,
  subGoals: initialSubGoals,
  compact = false,
  className,
  onTaskToggle,
  onRefresh,
}: StudyPlanProgressCardProps) {
  const [goal, setGoal] = useState<GoalData | null>(initialGoal ?? null);
  const [isLoading, setIsLoading] = useState(!initialGoal);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const fetchedRef = useRef(false);

  // Fetch goal data if not provided
  const fetchGoal = useCallback(async () => {
    if (initialGoal) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/sam/agentic/goals/${goalId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setGoal(result.data);
      } else {
        setError(result.error?.message ?? 'Failed to load study plan');
      }
    } catch (err) {
      console.error('Error fetching study plan:', err);
      setError('Failed to load study plan');
    } finally {
      setIsLoading(false);
    }
  }, [goalId, initialGoal]);

  // Initial fetch
  useEffect(() => {
    if (!fetchedRef.current && !initialGoal) {
      fetchedRef.current = true;
      fetchGoal();
    }
  }, [fetchGoal, initialGoal]);

  // Sync with prop changes
  useEffect(() => {
    if (initialGoal) {
      setGoal(initialGoal);
    }
  }, [initialGoal]);

  // Toggle task completion
  const handleToggleTask = useCallback(
    async (taskId: string, completed: boolean) => {
      if (isUpdating) return;

      setIsUpdating(taskId);
      try {
        const response = await fetch(
          `/api/sam/agentic/goals/${goalId}/subgoals/${taskId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: completed ? 'completed' : 'pending',
              completedAt: completed ? new Date().toISOString() : null,
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          // Update local state
          setGoal((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              subGoals: prev.subGoals?.map((sg) =>
                sg.id === taskId
                  ? {
                      ...sg,
                      status: completed ? 'completed' : 'pending',
                      completedAt: completed ? new Date().toISOString() : null,
                    }
                  : sg
              ),
            };
          });
          onTaskToggle?.(taskId, completed);
        } else {
          console.error('Failed to update task:', result.error);
        }
      } catch (err) {
        console.error('Error updating task:', err);
      } finally {
        setIsUpdating(null);
      }
    },
    [goalId, isUpdating, onTaskToggle]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    fetchedRef.current = false;
    await fetchGoal();
    onRefresh?.();
  }, [fetchGoal, onRefresh]);

  // Memoize subGoals to avoid recalculation on every render
  const subGoals = useMemo(
    () => initialSubGoals ?? goal?.subGoals ?? [],
    [initialSubGoals, goal?.subGoals]
  );

  const metrics: StudyPlanMetrics = useMemo(
    () =>
      calculateStudyPlanMetrics(
        subGoals,
        goal?.metadata,
        goal?.targetDate,
        goal?.createdAt
      ),
    [subGoals, goal?.metadata, goal?.targetDate, goal?.createdAt]
  );

  const weeks: WeekProgress[] = useMemo(
    () =>
      calculateWeeklyProgress(
        subGoals,
        goal?.metadata?.preferences?.startDate ?? goal?.createdAt
      ),
    [subGoals, goal?.metadata?.preferences?.startDate, goal?.createdAt]
  );

  const currentWeekNumber = useMemo(() => findCurrentWeek(weeks), [weeks]);

  // Get current week data and tasks
  const currentWeek = weeks.find((w) => w.weekNumber === (selectedWeek ?? currentWeekNumber)) ?? null;

  const currentWeekTasks: DailyTask[] = useMemo(() => {
    const weekNum = selectedWeek ?? currentWeekNumber;
    return subGoals
      .filter((sg) => sg.metadata?.weekNumber === weekNum)
      .map((sg) => ({
        id: sg.id,
        title: sg.title,
        description: undefined,
        status: sg.status,
        estimatedMinutes: sg.estimatedMinutes,
        metadata: sg.metadata,
      }))
      .sort((a, b) => (a.metadata?.dayNumber ?? 0) - (b.metadata?.dayNumber ?? 0));
  }, [subGoals, selectedWeek, currentWeekNumber]);

  // Parse target date
  const targetDate = goal?.targetDate ? new Date(goal.targetDate) : null;

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-red-200 dark:border-red-800', className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium flex-1">{error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!goal) return null;

  const isComplete = metrics.completionRate === 100;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200',
        isComplete
          ? 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
        className
      )}
    >
      {/* Header */}
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'p-3 rounded-xl flex-shrink-0',
                isComplete
                  ? 'bg-emerald-100 dark:bg-emerald-900/50'
                  : 'bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50'
              )}
            >
              {isComplete ? (
                <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {goal.title}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Study Plan
                </Badge>
              </div>
              {goal.description && (
                <CardDescription className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                  {goal.description}
                </CardDescription>
              )}
            </div>
          </div>

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Overall Progress</span>
            <span className="font-medium">{metrics.completionRate}%</span>
          </div>
          <Progress
            value={metrics.completionRate}
            className={cn('h-2', isComplete && '[&>div]:bg-emerald-500')}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Metrics Dashboard */}
        <MetricsDashboard metrics={metrics} compact={compact} />

        {/* Weekly Timeline */}
        {weeks.length > 0 && (
          <WeeklyTimeline
            weeks={weeks}
            currentWeek={selectedWeek ?? currentWeekNumber}
            onWeekClick={setSelectedWeek}
          />
        )}

        {/* Current Week Panel */}
        {currentWeek && currentWeekTasks.length > 0 && (
          <CurrentWeekPanel
            week={currentWeek}
            tasks={currentWeekTasks}
            onTaskToggle={handleToggleTask}
            isUpdating={isUpdating}
            defaultExpanded={!compact}
          />
        )}

        {/* Schedule Status Banner */}
        <ScheduleStatusBanner metrics={metrics} targetDate={targetDate} />
      </CardContent>
    </Card>
  );
}

export default StudyPlanProgressCard;
