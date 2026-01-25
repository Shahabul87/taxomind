/**
 * Study Plan Metrics Calculation Utilities
 *
 * Provides functions to calculate various metrics for AI-generated study plans
 * including time tracking, task completion, schedule status, and streaks.
 */

import type { DailyTask } from '@/components/sam/study-plan/DailyTaskList';

// ============================================================================
// TYPES
// ============================================================================

export type ScheduleStatus = 'ahead' | 'on-track' | 'behind' | 'at-risk';

export interface StudyPlanMetrics {
  // Time-based metrics
  hoursCompleted: number;
  hoursRemaining: number;
  hoursTotal: number;
  dailyAverage: number;

  // Task-based metrics
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number;

  // Schedule-based metrics
  currentWeek: number;
  totalWeeks: number;
  daysAhead: number; // negative = behind schedule
  estimatedCompletion: Date | null;
  scheduleStatus: ScheduleStatus;

  // Streak metrics
  currentStreak: number;
  bestStreak: number;
}

export interface WeekProgress {
  weekNumber: number;
  title: string;
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number;
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  startDate: Date | null;
  endDate: Date | null;
  hoursCompleted: number;
  hoursTotal: number;
}

export interface GoalMetadata {
  planType?: string;
  totalWeeks?: number;
  totalTasks?: number;
  estimatedHours?: number;
  preferences?: {
    startDate?: string;
    targetEndDate?: string;
  };
}

export interface SubGoalData {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  estimatedMinutes?: number;
  completedAt?: string | null;
  metadata?: {
    weekNumber?: number;
    weekTitle?: string;
    dayNumber?: number;
    scheduledDate?: string;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse a date string safely, returning null if invalid
 */
function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Get the difference in days between two dates
 */
function getDaysDifference(date1: Date, date2: Date): number {
  const diffTime = date1.getTime() - date2.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get the start of day for a date
 */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ============================================================================
// WEEK PROGRESS CALCULATION
// ============================================================================

/**
 * Group sub-goals by week and calculate progress for each week
 */
export function calculateWeeklyProgress(
  subGoals: SubGoalData[],
  startDate?: string | null
): WeekProgress[] {
  if (!subGoals || subGoals.length === 0) {
    return [];
  }

  // Group by week number
  const weekMap = new Map<
    number,
    {
      title: string;
      tasks: SubGoalData[];
      dates: Date[];
    }
  >();

  for (const sg of subGoals) {
    const weekNum = sg.metadata?.weekNumber ?? 1;
    const weekTitle = sg.metadata?.weekTitle ?? `Week ${weekNum}`;

    if (!weekMap.has(weekNum)) {
      weekMap.set(weekNum, { title: weekTitle, tasks: [], dates: [] });
    }

    const week = weekMap.get(weekNum)!;
    week.tasks.push(sg);

    // Collect scheduled dates
    const scheduledDate = parseDate(sg.metadata?.scheduledDate);
    if (scheduledDate) {
      week.dates.push(scheduledDate);
    }
  }

  // Determine current week based on date
  const today = new Date();
  const planStart = parseDate(startDate) ?? today;
  const weeksSinceStart = Math.floor(getDaysDifference(today, planStart) / 7) + 1;

  // Convert to array and calculate progress
  const weeks: WeekProgress[] = [];

  for (const [weekNumber, data] of weekMap.entries()) {
    const completedTasks = data.tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = data.tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate hours
    const hoursTotal = data.tasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0) / 60;
    const hoursCompleted =
      data.tasks
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0) / 60;

    // Get date range
    const sortedDates = data.dates.sort((a, b) => a.getTime() - b.getTime());
    const startDate = sortedDates[0] ?? null;
    const endDate = sortedDates[sortedDates.length - 1] ?? null;

    // Determine status
    let status: WeekProgress['status'] = 'upcoming';
    if (completionRate === 100) {
      status = 'completed';
    } else if (weekNumber === weeksSinceStart) {
      status = 'current';
    } else if (weekNumber < weeksSinceStart) {
      // Past week not completed = behind
      status = completionRate > 0 ? 'current' : 'upcoming';
    } else if (weekNumber > weeksSinceStart + 1) {
      status = 'locked';
    }

    weeks.push({
      weekNumber,
      title: data.title,
      tasksCompleted: completedTasks,
      tasksTotal: totalTasks,
      completionRate,
      status,
      startDate,
      endDate,
      hoursCompleted,
      hoursTotal,
    });
  }

  // Sort by week number
  return weeks.sort((a, b) => a.weekNumber - b.weekNumber);
}

/**
 * Find the current week based on date and progress
 */
export function findCurrentWeek(weeks: WeekProgress[]): number {
  // Find the first incomplete week
  for (const week of weeks) {
    if (week.status === 'current' || week.completionRate < 100) {
      return week.weekNumber;
    }
  }

  // All complete, return last week
  return weeks.length > 0 ? weeks[weeks.length - 1].weekNumber : 1;
}

// ============================================================================
// STREAK CALCULATION
// ============================================================================

interface StreakResult {
  currentStreak: number;
  bestStreak: number;
}

/**
 * Calculate current and best streak from completed tasks
 */
export function calculateStreak(completedTasks: SubGoalData[]): StreakResult {
  if (!completedTasks || completedTasks.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Get unique completion dates
  const completionDates = new Set<string>();

  for (const task of completedTasks) {
    if (task.completedAt) {
      const date = parseDate(task.completedAt);
      if (date) {
        completionDates.add(startOfDay(date).toISOString().split('T')[0]);
      }
    }
  }

  // Sort dates
  const sortedDates = Array.from(completionDates).sort();

  if (sortedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Calculate streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 1;

  const today = startOfDay(new Date()).toISOString().split('T')[0];
  const yesterday = startOfDay(
    new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).toISOString().split('T')[0];

  // Check if most recent date is today or yesterday (for current streak)
  const lastDate = sortedDates[sortedDates.length - 1];
  const isCurrentStreakActive = lastDate === today || lastDate === yesterday;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = getDaysDifference(currDate, prevDate);

    if (diffDays === 1) {
      tempStreak++;
    } else {
      bestStreak = Math.max(bestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  bestStreak = Math.max(bestStreak, tempStreak);

  // Calculate current streak (must include today or yesterday)
  if (isCurrentStreakActive) {
    let streak = 1;
    for (let i = sortedDates.length - 1; i > 0; i--) {
      const currDate = new Date(sortedDates[i]);
      const prevDate = new Date(sortedDates[i - 1]);
      const diffDays = getDaysDifference(currDate, prevDate);

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    currentStreak = streak;
  }

  return { currentStreak, bestStreak };
}

// ============================================================================
// SCHEDULE CALCULATION
// ============================================================================

interface ScheduleAnalysis {
  daysAhead: number;
  estimatedCompletion: Date | null;
  scheduleStatus: 'ahead' | 'on-track' | 'behind' | 'at-risk';
}

/**
 * Calculate schedule status based on expected vs actual progress
 */
export function calculateScheduleStatus(
  completedTasks: number,
  totalTasks: number,
  startDate: Date | null,
  targetDate: Date | null
): ScheduleAnalysis {
  const today = new Date();

  // No target date - can't determine schedule status
  if (!targetDate || !startDate) {
    return {
      daysAhead: 0,
      estimatedCompletion: null,
      scheduleStatus: 'on-track',
    };
  }

  // Calculate expected progress at this point
  const totalDays = getDaysDifference(targetDate, startDate);
  const daysElapsed = getDaysDifference(today, startDate);

  if (totalDays <= 0 || totalTasks === 0) {
    return {
      daysAhead: 0,
      estimatedCompletion: null,
      scheduleStatus: 'on-track',
    };
  }

  const expectedProgressRate = daysElapsed / totalDays;
  const expectedTasksCompleted = Math.floor(totalTasks * expectedProgressRate);
  const actualProgress = completedTasks / totalTasks;

  // Calculate days ahead/behind
  const tasksAhead = completedTasks - expectedTasksCompleted;
  const tasksPerDay = totalTasks / totalDays;
  const daysAhead = Math.round(tasksAhead / (tasksPerDay || 1));

  // Estimate completion date based on current pace
  let estimatedCompletion: Date | null = null;
  if (completedTasks > 0) {
    const daysPerTask = daysElapsed / completedTasks;
    const remainingTasks = totalTasks - completedTasks;
    const daysToComplete = remainingTasks * daysPerTask;
    estimatedCompletion = new Date(today.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
  } else if (daysElapsed > 0) {
    // No tasks completed yet
    estimatedCompletion = new Date(targetDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  // Determine status
  let scheduleStatus: ScheduleAnalysis['scheduleStatus'] = 'on-track';

  if (daysAhead >= 2) {
    scheduleStatus = 'ahead';
  } else if (daysAhead <= -7 || (estimatedCompletion && estimatedCompletion > targetDate)) {
    scheduleStatus = 'at-risk';
  } else if (daysAhead <= -2) {
    scheduleStatus = 'behind';
  }

  return { daysAhead, estimatedCompletion, scheduleStatus };
}

// ============================================================================
// MAIN METRICS CALCULATION
// ============================================================================

/**
 * Calculate all metrics for a study plan
 */
export function calculateStudyPlanMetrics(
  subGoals: SubGoalData[],
  metadata?: GoalMetadata,
  goalTargetDate?: string | null,
  goalCreatedAt?: string | null
): StudyPlanMetrics {
  if (!subGoals || subGoals.length === 0) {
    return {
      hoursCompleted: 0,
      hoursRemaining: 0,
      hoursTotal: 0,
      dailyAverage: 0,
      tasksCompleted: 0,
      tasksTotal: 0,
      completionRate: 0,
      currentWeek: 1,
      totalWeeks: metadata?.totalWeeks ?? 0,
      daysAhead: 0,
      estimatedCompletion: null,
      scheduleStatus: 'on-track',
      currentStreak: 0,
      bestStreak: 0,
    };
  }

  // Task metrics
  const completedSubGoals = subGoals.filter((sg) => sg.status === 'completed');
  const tasksCompleted = completedSubGoals.length;
  const tasksTotal = subGoals.length;
  const completionRate = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

  // Time metrics
  const hoursTotal = subGoals.reduce((sum, sg) => sum + (sg.estimatedMinutes ?? 0), 0) / 60;
  const hoursCompleted =
    completedSubGoals.reduce((sum, sg) => sum + (sg.estimatedMinutes ?? 0), 0) / 60;
  const hoursRemaining = hoursTotal - hoursCompleted;

  // Calculate daily average
  const startDate = parseDate(metadata?.preferences?.startDate ?? goalCreatedAt);
  const today = new Date();
  const daysActive = startDate ? Math.max(1, getDaysDifference(today, startDate)) : 1;
  const dailyAverage = hoursCompleted / daysActive;

  // Week metrics
  const weeks = calculateWeeklyProgress(
    subGoals,
    metadata?.preferences?.startDate ?? goalCreatedAt
  );
  const currentWeek = findCurrentWeek(weeks);
  const totalWeeks = metadata?.totalWeeks ?? weeks.length;

  // Schedule metrics
  const targetDate = parseDate(metadata?.preferences?.targetEndDate ?? goalTargetDate);
  const { daysAhead, estimatedCompletion, scheduleStatus } = calculateScheduleStatus(
    tasksCompleted,
    tasksTotal,
    startDate,
    targetDate
  );

  // Streak metrics
  const { currentStreak, bestStreak } = calculateStreak(completedSubGoals);

  return {
    hoursCompleted: Math.round(hoursCompleted * 10) / 10,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    hoursTotal: Math.round(hoursTotal * 10) / 10,
    dailyAverage: Math.round(dailyAverage * 10) / 10,
    tasksCompleted,
    tasksTotal,
    completionRate: Math.round(completionRate),
    currentWeek,
    totalWeeks,
    daysAhead,
    estimatedCompletion,
    scheduleStatus,
    currentStreak,
    bestStreak,
  };
}

/**
 * Check if a goal is a study plan based on metadata
 */
export function isStudyPlan(metadata?: GoalMetadata): boolean {
  return metadata?.planType === 'study_plan' || (metadata?.totalWeeks ?? 0) > 0;
}

/**
 * Check if a goal is a study plan based on metadata and/or subGoals
 * More robust detection that checks subGoals for week structure
 */
export function isStudyPlanGoal(
  metadata?: GoalMetadata,
  subGoals?: SubGoalData[]
): boolean {
  // Check metadata first
  if (metadata?.planType === 'study_plan') return true;
  if ((metadata?.totalWeeks ?? 0) > 0) return true;

  // Check if subGoals have week structure
  if (subGoals && subGoals.length > 0) {
    const hasWeekStructure = subGoals.some(
      (sg) => sg.metadata?.weekNumber !== undefined && sg.metadata.weekNumber > 0
    );
    if (hasWeekStructure) return true;
  }

  return false;
}

/**
 * Format hours for display (e.g., "12h" or "12.5h")
 */
export function formatHours(hours: number): string {
  if (hours === 0) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours.toFixed(1)}h`;
}

/**
 * Format days ahead/behind for display
 */
export function formatDaysAhead(days: number): string {
  if (days === 0) return 'On track';
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ahead`;
  return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} behind`;
}
