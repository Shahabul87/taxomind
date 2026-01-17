/**
 * Prisma Store for Practice Goal Management
 * Handles goal CRUD and automatic progress updates when practice sessions end
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { PracticeGoal as PrismaGoal, PracticeGoalType, Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type GoalType = 'HOURS' | 'QUALITY_HOURS' | 'SESSIONS' | 'STREAK' | 'WEEKLY_HOURS';

export interface PracticeGoal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  goalType: GoalType;
  targetValue: number;
  currentValue: number;
  skillId?: string | null;
  skillName?: string | null;
  deadline?: Date | null;
  startDate: Date;
  isCompleted: boolean;
  completedAt?: Date | null;
  reminderEnabled: boolean;
  reminderFrequency?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePracticeGoalInput {
  userId: string;
  title: string;
  description?: string;
  goalType: GoalType;
  targetValue: number;
  skillId?: string;
  skillName?: string;
  deadline?: Date;
  reminderEnabled?: boolean;
  reminderFrequency?: string;
}

export interface UpdatePracticeGoalInput {
  title?: string;
  description?: string | null;
  targetValue?: number;
  currentValue?: number;
  deadline?: Date | null;
  reminderEnabled?: boolean;
  reminderFrequency?: string | null;
  isCompleted?: boolean;
}

export interface GoalProgressUpdate {
  rawHours: number;
  qualityHours: number;
  sessionsCount: number;
  skillId?: string;
}

export interface GoalFilters {
  status?: 'active' | 'completed' | 'all';
  skillId?: string;
  goalType?: GoalType;
}

export interface UpdatedGoalResult {
  goal: PracticeGoal;
  previousValue: number;
  newValue: number;
  wasCompleted: boolean;
  progressDelta: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapPrismaGoal(prismaGoal: PrismaGoal): PracticeGoal {
  return {
    id: prismaGoal.id,
    userId: prismaGoal.userId,
    title: prismaGoal.title,
    description: prismaGoal.description,
    goalType: prismaGoal.goalType as GoalType,
    targetValue: prismaGoal.targetValue,
    currentValue: prismaGoal.currentValue,
    skillId: prismaGoal.skillId,
    skillName: prismaGoal.skillName,
    deadline: prismaGoal.deadline,
    startDate: prismaGoal.startDate,
    isCompleted: prismaGoal.isCompleted,
    completedAt: prismaGoal.completedAt,
    reminderEnabled: prismaGoal.reminderEnabled,
    reminderFrequency: prismaGoal.reminderFrequency,
    createdAt: prismaGoal.createdAt,
    updatedAt: prismaGoal.updatedAt,
  };
}

function isWithinCurrentWeek(date: Date): boolean {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return date >= startOfWeek && date < endOfWeek;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export class PrismaPracticeGoalStore {
  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  async create(input: CreatePracticeGoalInput): Promise<PracticeGoal> {
    const goal = await db.practiceGoal.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        goalType: input.goalType as PracticeGoalType,
        targetValue: input.targetValue,
        skillId: input.skillId,
        skillName: input.skillName,
        deadline: input.deadline,
        reminderEnabled: input.reminderEnabled ?? false,
        reminderFrequency: input.reminderFrequency,
      },
    });
    return mapPrismaGoal(goal);
  }

  async getById(id: string): Promise<PracticeGoal | null> {
    const goal = await db.practiceGoal.findUnique({
      where: { id },
    });
    return goal ? mapPrismaGoal(goal) : null;
  }

  async update(id: string, input: UpdatePracticeGoalInput): Promise<PracticeGoal> {
    // Check if goal should be auto-completed
    let isCompleted = input.isCompleted;
    let completedAt: Date | undefined;

    if (input.currentValue !== undefined) {
      const existing = await db.practiceGoal.findUnique({ where: { id } });
      if (existing) {
        const targetValue = input.targetValue ?? existing.targetValue;
        if (input.currentValue >= targetValue && !existing.isCompleted) {
          isCompleted = true;
          completedAt = new Date();
        }
      }
    }

    const goal = await db.practiceGoal.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        targetValue: input.targetValue,
        currentValue: input.currentValue,
        deadline: input.deadline,
        reminderEnabled: input.reminderEnabled,
        reminderFrequency: input.reminderFrequency,
        isCompleted,
        completedAt,
      },
    });
    return mapPrismaGoal(goal);
  }

  async delete(id: string): Promise<void> {
    await db.practiceGoal.delete({ where: { id } });
  }

  // --------------------------------------------------------------------------
  // Query Operations
  // --------------------------------------------------------------------------

  async getUserGoals(userId: string, filters?: GoalFilters): Promise<PracticeGoal[]> {
    const where: Prisma.PracticeGoalWhereInput = { userId };

    if (filters?.status === 'active') {
      where.isCompleted = false;
    } else if (filters?.status === 'completed') {
      where.isCompleted = true;
    }

    if (filters?.skillId) {
      where.skillId = filters.skillId;
    }

    if (filters?.goalType) {
      where.goalType = filters.goalType as PracticeGoalType;
    }

    const goals = await db.practiceGoal.findMany({
      where,
      orderBy: [
        { isCompleted: 'asc' },
        { deadline: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return goals.map(mapPrismaGoal);
  }

  async getActiveGoals(userId: string): Promise<PracticeGoal[]> {
    return this.getUserGoals(userId, { status: 'active' });
  }

  // --------------------------------------------------------------------------
  // Progress Update Operations
  // --------------------------------------------------------------------------

  /**
   * Update all active goals when a practice session ends
   * Returns list of goals that were updated and whether any were completed
   */
  async updateGoalsOnSessionEnd(
    userId: string,
    sessionData: GoalProgressUpdate
  ): Promise<UpdatedGoalResult[]> {
    const activeGoals = await this.getActiveGoals(userId);
    const results: UpdatedGoalResult[] = [];

    for (const goal of activeGoals) {
      // Skip if goal is for a specific skill and session is for different skill
      if (goal.skillId && sessionData.skillId && goal.skillId !== sessionData.skillId) {
        continue;
      }

      // Also skip if goal has skillId but session doesn't
      if (goal.skillId && !sessionData.skillId) {
        continue;
      }

      let progressDelta = 0;

      switch (goal.goalType) {
        case 'HOURS':
          progressDelta = sessionData.rawHours;
          break;
        case 'QUALITY_HOURS':
          progressDelta = sessionData.qualityHours;
          break;
        case 'SESSIONS':
          progressDelta = sessionData.sessionsCount;
          break;
        case 'WEEKLY_HOURS':
          // For weekly goals, only add if we're within the goal's week
          // If no deadline, assume current week
          if (!goal.deadline || isWithinCurrentWeek(goal.deadline)) {
            progressDelta = sessionData.rawHours;
          }
          break;
        case 'STREAK':
          // Streak goals are updated by the daily cron job, not on session end
          continue;
        default:
          continue;
      }

      if (progressDelta > 0) {
        const previousValue = goal.currentValue;
        const newValue = previousValue + progressDelta;
        const wasCompleted = newValue >= goal.targetValue && !goal.isCompleted;

        // Update the goal
        const updatedGoal = await db.practiceGoal.update({
          where: { id: goal.id },
          data: {
            currentValue: newValue,
            isCompleted: wasCompleted ? true : undefined,
            completedAt: wasCompleted ? new Date() : undefined,
          },
        });

        results.push({
          goal: mapPrismaGoal(updatedGoal),
          previousValue,
          newValue,
          wasCompleted,
          progressDelta,
        });

        logger.info(
          `Updated goal "${goal.title}": ${previousValue.toFixed(2)} -> ${newValue.toFixed(2)} ` +
          `(+${progressDelta.toFixed(2)})${wasCompleted ? ' [COMPLETED!]' : ''}`
        );
      }
    }

    return results;
  }

  /**
   * Update streak-based goals (called by daily cron job)
   */
  async updateStreakGoals(userId: string, currentStreak: number): Promise<UpdatedGoalResult[]> {
    const streakGoals = await db.practiceGoal.findMany({
      where: {
        userId,
        goalType: 'STREAK',
        isCompleted: false,
      },
    });

    const results: UpdatedGoalResult[] = [];

    for (const goal of streakGoals) {
      const previousValue = goal.currentValue;
      const wasCompleted = currentStreak >= goal.targetValue;

      const updatedGoal = await db.practiceGoal.update({
        where: { id: goal.id },
        data: {
          currentValue: currentStreak,
          isCompleted: wasCompleted ? true : undefined,
          completedAt: wasCompleted ? new Date() : undefined,
        },
      });

      results.push({
        goal: mapPrismaGoal(updatedGoal),
        previousValue,
        newValue: currentStreak,
        wasCompleted,
        progressDelta: currentStreak - previousValue,
      });
    }

    return results;
  }

  /**
   * Reset weekly goals at the start of each week (called by weekly cron job)
   */
  async resetWeeklyGoals(): Promise<number> {
    const result = await db.practiceGoal.updateMany({
      where: {
        goalType: 'WEEKLY_HOURS',
        isCompleted: false,
      },
      data: {
        currentValue: 0,
      },
    });

    logger.info(`Reset ${result.count} weekly goals`);
    return result.count;
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  async getGoalStats(userId: string): Promise<{
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    completionRate: number;
    byType: Record<string, number>;
    recentlyCompleted: PracticeGoal[];
  }> {
    const allGoals = await db.practiceGoal.findMany({
      where: { userId },
    });

    const completedGoals = allGoals.filter((g) => g.isCompleted);
    const activeGoals = allGoals.filter((g) => !g.isCompleted);

    const byType = allGoals.reduce(
      (acc, g) => {
        acc[g.goalType] = (acc[g.goalType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Recently completed (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyCompleted = completedGoals
      .filter((g) => g.completedAt && g.completedAt >= sevenDaysAgo)
      .map(mapPrismaGoal);

    return {
      totalGoals: allGoals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      completionRate: allGoals.length > 0
        ? (completedGoals.length / allGoals.length) * 100
        : 0,
      byType,
      recentlyCompleted,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaPracticeGoalStore(): PrismaPracticeGoalStore {
  return new PrismaPracticeGoalStore();
}
