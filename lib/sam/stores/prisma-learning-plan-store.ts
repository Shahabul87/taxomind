/**
 * LearningPlan Store - Implements LearningPlanStore interface from @sam-ai/agentic
 * Uses Prisma with SAMExecutionPlan model for persistent multi-session plan storage
 *
 * Maps LearningPlan to SAMExecutionPlan:
 * - weeklyMilestones, dailyTargets, difficultyAdjustments, paceAdjustments → stored in `schedule` JSON
 * - durationWeeks, currentWeek, currentDay → stored in `checkpointData` JSON
 */

import { getDb } from './db-provider';
import {
  type LearningPlanStore,
  type LearningPlan,
  type WeeklyMilestone,
  type DailyTarget,
  type WeeklyBreakdown,
  type DifficultyAdjustment,
  type PaceAdjustment,
  LearningPlanStatus,
  MilestoneStatus,
} from '@sam-ai/agentic';

/**
 * Structure for storing LearningPlan-specific data in the schedule JSON field
 */
interface LearningPlanScheduleData {
  weeklyMilestones: WeeklyMilestone[];
  dailyTargets: DailyTarget[];
  difficultyAdjustments: DifficultyAdjustment[];
  paceAdjustments: PaceAdjustment[];
}

/**
 * Structure for storing LearningPlan tracking data in checkpointData JSON field
 */
interface LearningPlanTrackingData {
  durationWeeks: number;
  currentWeek: number;
  currentDay: number;
  title: string;
  description: string;
}

/**
 * Map Prisma status enum to agentic package LearningPlanStatus
 */
const mapPrismaStatus = (status: string): LearningPlanStatus => {
  const map: Record<string, LearningPlanStatus> = {
    DRAFT: LearningPlanStatus.DRAFT,
    ACTIVE: LearningPlanStatus.ACTIVE,
    PAUSED: LearningPlanStatus.PAUSED,
    COMPLETED: LearningPlanStatus.COMPLETED,
    FAILED: LearningPlanStatus.ABANDONED,
    CANCELLED: LearningPlanStatus.ABANDONED,
  };
  return map[status] || LearningPlanStatus.DRAFT;
};

/**
 * Map agentic package LearningPlanStatus to Prisma enum
 */
const mapAgenticStatus = (
  status: LearningPlanStatus
): 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' => {
  const map: Record<
    LearningPlanStatus,
    'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  > = {
    [LearningPlanStatus.DRAFT]: 'DRAFT',
    [LearningPlanStatus.ACTIVE]: 'ACTIVE',
    [LearningPlanStatus.PAUSED]: 'PAUSED',
    [LearningPlanStatus.COMPLETED]: 'COMPLETED',
    [LearningPlanStatus.ABANDONED]: 'CANCELLED',
  };
  return map[status] || 'DRAFT';
};

/**
 * Helper to parse dates from JSON (handles string dates)
 */
function parseDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Try to parse as ISO date
    const date = new Date(obj);
    if (!isNaN(date.getTime()) && obj.match(/^\d{4}-\d{2}-\d{2}/)) {
      return date as unknown as T;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(parseDates) as unknown as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = parseDates(value);
    }
    return result as T;
  }
  return obj;
}

/**
 * Convert Prisma SAMExecutionPlan to agentic LearningPlan
 */
function toAgenticLearningPlan(plan: {
  id: string;
  goalId: string;
  userId: string;
  startDate: Date | null;
  targetDate: Date | null;
  overallProgress: number;
  status: string;
  schedule: unknown;
  checkpointData: unknown;
  createdAt: Date;
  updatedAt: Date;
}): LearningPlan {
  const scheduleData = parseDates(plan.schedule as LearningPlanScheduleData) || {
    weeklyMilestones: [],
    dailyTargets: [],
    difficultyAdjustments: [],
    paceAdjustments: [],
  };

  const trackingData = parseDates(plan.checkpointData as LearningPlanTrackingData) || {
    durationWeeks: 1,
    currentWeek: 1,
    currentDay: 1,
    title: '',
    description: '',
  };

  return {
    id: plan.id,
    userId: plan.userId,
    goalId: plan.goalId,
    title: trackingData.title || '',
    description: trackingData.description || '',
    startDate: plan.startDate || new Date(),
    targetDate: plan.targetDate || new Date(),
    durationWeeks: trackingData.durationWeeks || 1,
    weeklyMilestones: scheduleData.weeklyMilestones || [],
    dailyTargets: scheduleData.dailyTargets || [],
    currentWeek: trackingData.currentWeek || 1,
    currentDay: trackingData.currentDay || 1,
    overallProgress: plan.overallProgress || 0,
    difficultyAdjustments: scheduleData.difficultyAdjustments || [],
    paceAdjustments: scheduleData.paceAdjustments || [],
    status: mapPrismaStatus(plan.status),
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

/**
 * Prisma implementation of LearningPlanStore
 * Uses SAMExecutionPlan model with JSON fields for learning-specific data
 */
export class PrismaLearningPlanStore implements LearningPlanStore {
  /**
   * Get a learning plan by ID
   */
  async get(id: string): Promise<LearningPlan | null> {
    const plan = await getDb().sAMExecutionPlan.findUnique({
      where: { id },
    });

    if (!plan) return null;
    return toAgenticLearningPlan(plan);
  }

  /**
   * Get all learning plans for a user
   */
  async getByUser(userId: string): Promise<LearningPlan[]> {
    const plans = await getDb().sAMExecutionPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map(toAgenticLearningPlan);
  }

  /**
   * Get active learning plan for a user
   */
  async getActive(userId: string): Promise<LearningPlan | null> {
    const plan = await getDb().sAMExecutionPlan.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!plan) return null;
    return toAgenticLearningPlan(plan);
  }

  /**
   * Create a new learning plan
   */
  async create(
    plan: Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<LearningPlan> {
    const scheduleData: LearningPlanScheduleData = {
      weeklyMilestones: plan.weeklyMilestones,
      dailyTargets: plan.dailyTargets,
      difficultyAdjustments: plan.difficultyAdjustments,
      paceAdjustments: plan.paceAdjustments,
    };

    const trackingData: LearningPlanTrackingData = {
      durationWeeks: plan.durationWeeks,
      currentWeek: plan.currentWeek,
      currentDay: plan.currentDay,
      title: plan.title,
      description: plan.description,
    };

    const newPlan = await getDb().sAMExecutionPlan.create({
      data: {
        goalId: plan.goalId,
        userId: plan.userId,
        startDate: plan.startDate,
        targetDate: plan.targetDate,
        overallProgress: plan.overallProgress,
        status: mapAgenticStatus(plan.status),
        schedule: scheduleData as unknown as Record<string, unknown>,
        checkpointData: trackingData as unknown as Record<string, unknown>,
      },
    });

    return toAgenticLearningPlan(newPlan);
  }

  /**
   * Update a learning plan
   */
  async update(id: string, updates: Partial<LearningPlan>): Promise<LearningPlan> {
    const existingPlan = await getDb().sAMExecutionPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      throw new Error(`Learning plan not found: ${id}`);
    }

    // Get current data from JSON fields (cast through unknown for Prisma.JsonValue)
    const currentSchedule = (existingPlan.schedule as unknown as LearningPlanScheduleData) || {
      weeklyMilestones: [],
      dailyTargets: [],
      difficultyAdjustments: [],
      paceAdjustments: [],
    };

    const currentTracking = (existingPlan.checkpointData as unknown as LearningPlanTrackingData) || {
      durationWeeks: 1,
      currentWeek: 1,
      currentDay: 1,
      title: '',
      description: '',
    };

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (updates.startDate !== undefined) updateData.startDate = updates.startDate;
    if (updates.targetDate !== undefined) updateData.targetDate = updates.targetDate;
    if (updates.overallProgress !== undefined) updateData.overallProgress = updates.overallProgress;
    if (updates.status !== undefined) updateData.status = mapAgenticStatus(updates.status);

    // Update schedule JSON if any related fields changed
    if (
      updates.weeklyMilestones !== undefined ||
      updates.dailyTargets !== undefined ||
      updates.difficultyAdjustments !== undefined ||
      updates.paceAdjustments !== undefined
    ) {
      const newSchedule: LearningPlanScheduleData = {
        weeklyMilestones: updates.weeklyMilestones ?? currentSchedule.weeklyMilestones,
        dailyTargets: updates.dailyTargets ?? currentSchedule.dailyTargets,
        difficultyAdjustments:
          updates.difficultyAdjustments ?? currentSchedule.difficultyAdjustments,
        paceAdjustments: updates.paceAdjustments ?? currentSchedule.paceAdjustments,
      };
      updateData.schedule = newSchedule as unknown as Record<string, unknown>;
    }

    // Update tracking JSON if any related fields changed
    if (
      updates.durationWeeks !== undefined ||
      updates.currentWeek !== undefined ||
      updates.currentDay !== undefined ||
      updates.title !== undefined ||
      updates.description !== undefined
    ) {
      const newTracking: LearningPlanTrackingData = {
        durationWeeks: updates.durationWeeks ?? currentTracking.durationWeeks,
        currentWeek: updates.currentWeek ?? currentTracking.currentWeek,
        currentDay: updates.currentDay ?? currentTracking.currentDay,
        title: updates.title ?? currentTracking.title,
        description: updates.description ?? currentTracking.description,
      };
      updateData.checkpointData = newTracking as unknown as Record<string, unknown>;
    }

    const updatedPlan = await getDb().sAMExecutionPlan.update({
      where: { id },
      data: updateData,
    });

    return toAgenticLearningPlan(updatedPlan);
  }

  /**
   * Delete a learning plan
   */
  async delete(id: string): Promise<boolean> {
    try {
      await getDb().sAMExecutionPlan.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get daily target for a specific date
   */
  async getDailyTarget(planId: string, date: Date): Promise<DailyTarget | null> {
    const plan = await getDb().sAMExecutionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) return null;

    const scheduleData = parseDates(plan.schedule as unknown as LearningPlanScheduleData);
    if (!scheduleData?.dailyTargets) return null;

    const dateStr = date.toISOString().split('T')[0];
    return (
      scheduleData.dailyTargets.find((target) => {
        const targetDate = target.date instanceof Date ? target.date : new Date(target.date);
        return targetDate.toISOString().split('T')[0] === dateStr;
      }) ?? null
    );
  }

  /**
   * Update daily target for a specific date
   */
  async updateDailyTarget(
    planId: string,
    date: Date,
    updates: Partial<DailyTarget>
  ): Promise<DailyTarget> {
    const plan = await getDb().sAMExecutionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error(`Learning plan not found: ${planId}`);
    }

    const scheduleData = parseDates(plan.schedule as unknown as LearningPlanScheduleData) || {
      weeklyMilestones: [],
      dailyTargets: [],
      difficultyAdjustments: [],
      paceAdjustments: [],
    };

    const dateStr = date.toISOString().split('T')[0];
    const targetIndex = scheduleData.dailyTargets.findIndex((target) => {
      const targetDate = target.date instanceof Date ? target.date : new Date(target.date);
      return targetDate.toISOString().split('T')[0] === dateStr;
    });

    let updatedTarget: DailyTarget;

    if (targetIndex >= 0) {
      // Update existing target
      updatedTarget = {
        ...scheduleData.dailyTargets[targetIndex],
        ...updates,
      };
      scheduleData.dailyTargets[targetIndex] = updatedTarget;
    } else {
      // Create new target for this date
      updatedTarget = {
        date,
        weekNumber: updates.weekNumber ?? 1,
        dayOfWeek: date.getDay(),
        activities: updates.activities ?? [],
        estimatedMinutes: updates.estimatedMinutes ?? 30,
        actualMinutes: updates.actualMinutes,
        completed: updates.completed ?? false,
        completedAt: updates.completedAt,
        notes: updates.notes,
        ...updates,
      };
      scheduleData.dailyTargets.push(updatedTarget);
    }

    await getDb().sAMExecutionPlan.update({
      where: { id: planId },
      data: {
        schedule: scheduleData as unknown as Record<string, unknown>,
      },
    });

    return updatedTarget;
  }

  /**
   * Get weekly breakdown for a specific week
   */
  async getWeeklyBreakdown(planId: string, weekNumber: number): Promise<WeeklyBreakdown | null> {
    const plan = await getDb().sAMExecutionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) return null;

    const scheduleData = parseDates(plan.schedule as unknown as LearningPlanScheduleData);
    if (!scheduleData) return null;

    const milestone = scheduleData.weeklyMilestones?.find(
      (m) => m.weekNumber === weekNumber
    );

    if (!milestone) return null;

    // Get daily targets for this week
    const weekDailyTargets = scheduleData.dailyTargets?.filter(
      (target) => target.weekNumber === weekNumber
    ) ?? [];

    // Calculate week date range
    const startDate = plan.startDate ?? new Date();
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(weekStartDate.getDate() + (weekNumber - 1) * 7);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    // Calculate totals
    const totalEstimatedMinutes = weekDailyTargets.reduce(
      (sum, target) => sum + (target.estimatedMinutes || 0),
      0
    );
    const totalActualMinutes = weekDailyTargets.reduce(
      (sum, target) => sum + (target.actualMinutes || 0),
      0
    );

    // Calculate progress
    const completedCount = weekDailyTargets.filter((t) => t.completed).length;
    const progress =
      weekDailyTargets.length > 0 ? (completedCount / weekDailyTargets.length) * 100 : 0;

    return {
      planId,
      weekNumber,
      startDate: weekStartDate,
      endDate: weekEndDate,
      milestone,
      dailyTargets: weekDailyTargets,
      totalEstimatedMinutes,
      totalActualMinutes,
      progress,
      status: milestone.status || MilestoneStatus.PENDING,
    };
  }
}

/**
 * Factory function to create a PrismaLearningPlanStore
 */
export function createPrismaLearningPlanStore(): PrismaLearningPlanStore {
  return new PrismaLearningPlanStore();
}
