'use client';

/**
 * StudyPlanView Component
 *
 * Displays a complete AI-generated study plan with weekly sections
 * and daily tasks. Fetches plan data from SAM goals API and allows
 * task completion tracking.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Target,
  Trophy,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WeeklySection, type WeekData } from './WeeklySection';
import type { DailyTask } from './DailyTaskList';

// ============================================================================
// TYPES
// ============================================================================

interface StudyPlanMetadata {
  planType: string;
  totalWeeks: number;
  totalTasks: number;
  estimatedHours: number;
  milestones?: Array<{
    afterWeek: number;
    title: string;
    description?: string;
  }>;
  preferences?: {
    learningStyles?: string[];
    motivation?: string;
    startDate?: string;
    targetEndDate?: string;
  };
}

interface SubGoalData {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  estimatedMinutes?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  order: number;
  metadata?: {
    weekNumber?: number;
    weekTitle?: string;
    dayNumber?: number;
    scheduledDate?: string;
    taskType?: string;
    contentLinks?: Array<{ url?: string; title?: string }>;
  };
}

interface GoalData {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  targetDate?: string;
  createdAt: string;
  metadata?: StudyPlanMetadata;
  subGoals?: SubGoalData[];
}

interface StudyPlanViewProps {
  goalId: string;
  className?: string;
  defaultExpanded?: boolean;
  onTaskComplete?: (taskId: string) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StudyPlanView({
  goalId,
  className,
  defaultExpanded = true,
  onTaskComplete,
}: StudyPlanViewProps) {
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(!defaultExpanded);

  // Use ref to track if we have already fetched
  const fetchedRef = useRef(false);

  // Fetch goal data
  const fetchGoal = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/sam/agentic/goals/${goalId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setGoal(result.data);
      } else {
        setError(result.error?.message || 'Failed to load study plan');
      }
    } catch (err) {
      console.error('Error fetching study plan:', err);
      setError('Failed to load study plan');
    } finally {
      setIsLoading(false);
    }
  }, [goalId]);

  // Initial fetch
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchGoal();
    }
  }, [fetchGoal]);

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
                  ? { ...sg, status: completed ? 'completed' : 'pending' }
                  : sg
              ),
            };
          });
          onTaskComplete?.(taskId);
        } else {
          console.error('Failed to update task:', result.error);
        }
      } catch (err) {
        console.error('Error updating task:', err);
      } finally {
        setIsUpdating(null);
      }
    },
    [goalId, isUpdating, onTaskComplete]
  );

  // Group subgoals by week
  const weeklyData: WeekData[] = React.useMemo(() => {
    if (!goal?.subGoals) return [];

    const weekMap = new Map<number, { title: string; tasks: DailyTask[] }>();

    for (const sg of goal.subGoals) {
      const weekNum = sg.metadata?.weekNumber ?? 1;
      const weekTitle = sg.metadata?.weekTitle ?? `Week ${weekNum}`;

      if (!weekMap.has(weekNum)) {
        weekMap.set(weekNum, { title: weekTitle, tasks: [] });
      }

      weekMap.get(weekNum)!.tasks.push({
        id: sg.id,
        title: sg.title,
        description: sg.description,
        status: sg.status,
        estimatedMinutes: sg.estimatedMinutes,
        difficulty: sg.difficulty,
        metadata: sg.metadata,
      });
    }

    // Sort tasks within each week by order/day number
    for (const week of weekMap.values()) {
      week.tasks.sort((a, b) => {
        const dayA = a.metadata?.dayNumber ?? 0;
        const dayB = b.metadata?.dayNumber ?? 0;
        return dayA - dayB;
      });
    }

    // Convert to array and sort by week number
    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([weekNumber, data]) => ({
        weekNumber,
        title: data.title,
        tasks: data.tasks,
      }));
  }, [goal?.subGoals]);

  // Calculate overall progress
  const totalTasks = goal?.subGoals?.length ?? 0;
  const completedTasks =
    goal?.subGoals?.filter((sg) => sg.status === 'completed').length ?? 0;
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate time remaining
  const totalMinutes =
    goal?.subGoals?.reduce((sum, sg) => sum + (sg.estimatedMinutes ?? 0), 0) ?? 0;
  const completedMinutes =
    goal?.subGoals
      ?.filter((sg) => sg.status === 'completed')
      .reduce((sum, sg) => sum + (sg.estimatedMinutes ?? 0), 0) ?? 0;
  const remainingHours = Math.round((totalMinutes - completedMinutes) / 60);

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
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
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchGoal}
              className="ml-auto"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!goal) return null;

  const isComplete = overallProgress === 100;

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
      <CardHeader className="pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-700 px-3 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
            <div
              className={cn(
                'p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0',
                isComplete
                  ? 'bg-emerald-100 dark:bg-emerald-900/50'
                  : 'bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50'
              )}
            >
              {isComplete ? (
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {goal.title}
              </CardTitle>
              {goal.description && (
                <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 sm:mt-1 line-clamp-2">
                  {goal.description}
                </CardDescription>
              )}
            </div>
          </div>

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 p-0"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-3 sm:mt-4">
          <Badge
            className={cn(
              'text-[10px] sm:text-xs px-1.5 sm:px-2',
              isComplete
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
            )}
          >
            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
            {completedTasks}/{totalTasks} tasks
          </Badge>

          <Badge className="text-[10px] sm:text-xs px-1.5 sm:px-2 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
            <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
            {weeklyData.length} weeks
          </Badge>

          {remainingHours > 0 && !isComplete && (
            <Badge className="text-[10px] sm:text-xs px-1.5 sm:px-2 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              {remainingHours}h left
            </Badge>
          )}

          {goal.targetDate && (
            <Badge className="text-[10px] sm:text-xs px-1.5 sm:px-2 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
              <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span className="hidden xs:inline">Due </span>{new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-3 sm:mt-4">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Overall Progress</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress
            value={overallProgress}
            className={cn('h-1.5 sm:h-2', isComplete && '[&>div]:bg-emerald-500')}
          />
        </div>
      </CardHeader>

      {/* Content */}
      {!isCollapsed && (
        <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
          {/* Weekly Sections */}
          <div className="space-y-2 sm:space-y-3">
            {weeklyData.map((week, index) => (
              <WeeklySection
                key={week.weekNumber}
                week={week}
                onToggleTask={handleToggleTask}
                isUpdating={isUpdating}
                defaultExpanded={index === 0}
              />
            ))}
          </div>

          {/* Milestones (if any) */}
          {goal.metadata?.milestones && goal.metadata.milestones.length > 0 && (
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-700">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                Milestones
              </h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {goal.metadata.milestones.map((milestone, idx) => {
                  const completedWeeks = weeklyData.filter((w) => {
                    const weekComplete = w.tasks.every((t) => t.status === 'completed');
                    return weekComplete && w.weekNumber <= milestone.afterWeek;
                  }).length;
                  const isMilestoneComplete = completedWeeks >= milestone.afterWeek;

                  return (
                    <Badge
                      key={idx}
                      className={cn(
                        'text-[10px] sm:text-xs px-1.5 sm:px-2',
                        isMilestoneComplete
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      )}
                    >
                      {isMilestoneComplete && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />}
                      Wk {milestone.afterWeek}: {milestone.title}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default StudyPlanView;
