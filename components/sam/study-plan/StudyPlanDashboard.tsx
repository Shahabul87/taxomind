'use client';

/**
 * StudyPlanDashboard Component
 *
 * A unique "Learning Journey Dashboard" that provides visual analytics
 * for study plan progress without duplicating the task list.
 *
 * Combines:
 * - Radial Progress (circular gauge)
 * - Weekly Journey Map (road map visualization)
 * - Study Activity Heatmap (GitHub-style calendar)
 * - Milestones Tracker (achievements)
 * - Pace & Projection (timeline with prediction)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { RadialProgress } from './RadialProgress';
import { WeeklyJourneyMap } from './WeeklyJourneyMap';
import { StudyActivityHeatmap } from './StudyActivityHeatmap';
import { MilestonesTracker } from './MilestonesTracker';
import { PaceProjection } from './PaceProjection';

import {
  calculateStudyPlanMetrics,
  calculateWeeklyProgress,
  findCurrentWeek,
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

interface StudyPlanDashboardProps {
  goalId: string;
  goal: GoalData;
  subGoals?: SubGoalData[];
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StudyPlanDashboard({
  goalId,
  goal,
  subGoals: initialSubGoals,
  onRefresh,
  isLoading = false,
  className,
}: StudyPlanDashboardProps) {
  // Memoize subGoals
  const subGoals = useMemo(
    () => initialSubGoals ?? goal.subGoals ?? [],
    [initialSubGoals, goal.subGoals]
  );

  // Calculate metrics
  const metrics = useMemo(
    () =>
      calculateStudyPlanMetrics(
        subGoals,
        goal.metadata,
        goal.targetDate,
        goal.createdAt
      ),
    [subGoals, goal.metadata, goal.targetDate, goal.createdAt]
  );

  // Calculate weekly progress
  const weeks = useMemo(
    () =>
      calculateWeeklyProgress(
        subGoals,
        goal.metadata?.preferences?.startDate ?? goal.createdAt
      ),
    [subGoals, goal.metadata?.preferences?.startDate, goal.createdAt]
  );

  // Find current week
  const currentWeekNumber = useMemo(() => findCurrentWeek(weeks), [weeks]);

  // Count completed weeks
  const weeksCompleted = weeks.filter((w) => w.completionRate === 100).length;

  // Parse dates
  const startDate = goal.metadata?.preferences?.startDate
    ? new Date(goal.metadata.preferences.startDate)
    : new Date(goal.createdAt);
  const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;

  return (
    <Card
      className={cn(
        'overflow-hidden border-slate-200 dark:border-slate-700',
        className
      )}
    >
      {/* Header */}
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 flex-shrink-0"
            >
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {goal.title}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
                >
                  Study Plan
                </Badge>
              </div>
              {goal.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {goal.description}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex-shrink-0 h-8 w-8 p-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Radial Progress + Weekly Journey */}
          <div className="lg:col-span-1 space-y-4">
            {/* Radial Progress */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50">
              <RadialProgress
                percentage={metrics.completionRate}
                tasksCompleted={metrics.tasksCompleted}
                tasksTotal={metrics.tasksTotal}
                hoursCompleted={Math.round(metrics.hoursCompleted)}
                streak={metrics.currentStreak}
              />
            </div>

            {/* Weekly Journey Map */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Weekly Progress
              </h4>
              <WeeklyJourneyMap
                weeks={weeks}
                currentWeek={currentWeekNumber}
              />
            </div>
          </div>

          {/* Middle Column: Activity Heatmap + Milestones */}
          <div className="lg:col-span-1 space-y-4">
            {/* Study Activity Heatmap */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50">
              <StudyActivityHeatmap
                subGoals={subGoals}
                startDate={startDate}
              />
            </div>

            {/* Milestones */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50">
              <MilestonesTracker
                completionRate={metrics.completionRate}
                tasksCompleted={metrics.tasksCompleted}
                tasksTotal={metrics.tasksTotal}
                weeksCompleted={weeksCompleted}
                totalWeeks={weeks.length}
                currentStreak={metrics.currentStreak}
              />
            </div>
          </div>

          {/* Right Column: Pace & Projection */}
          <div className="lg:col-span-1">
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 h-full">
              <PaceProjection
                startDate={startDate}
                targetDate={targetDate}
                estimatedCompletion={metrics.estimatedCompletion}
                daysAhead={metrics.daysAhead}
                scheduleStatus={metrics.scheduleStatus}
                completionRate={metrics.completionRate}
              />

              {/* Quick Stats */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded-lg bg-white/50 dark:bg-slate-800/50">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {Math.round(metrics.hoursCompleted)}h
                    </div>
                    <div className="text-[10px] text-slate-500">
                      of {Math.round(metrics.hoursCompleted + metrics.hoursRemaining)}h done
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/50 dark:bg-slate-800/50">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      Week {currentWeekNumber}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      of {weeks.length} weeks
                    </div>
                  </div>
                </div>
              </div>

              {/* View Full Plan Link */}
              <div className="mt-4">
                <a
                  href="#ai-study-plans"
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  View Tasks & Details
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StudyPlanDashboard;
