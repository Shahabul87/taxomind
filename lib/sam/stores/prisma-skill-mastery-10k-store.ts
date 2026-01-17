/**
 * Prisma Store for 10,000 Hour Skill Mastery Tracking
 * Tracks progress toward mastery with quality-adjusted hours
 */

import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type PracticeMilestoneType =
  | 'HOURS_100'
  | 'HOURS_500'
  | 'HOURS_1000'
  | 'HOURS_2500'
  | 'HOURS_5000'
  | 'HOURS_7500'
  | 'HOURS_10000';

export type ProficiencyLevel =
  | 'BEGINNER'
  | 'NOVICE'
  | 'INTERMEDIATE'
  | 'COMPETENT'
  | 'PROFICIENT'
  | 'ADVANCED'
  | 'EXPERT'
  | 'MASTER';

export interface SkillMastery10K {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  totalRawHours: number;
  totalQualityHours: number;
  targetHours: number;
  progressPercentage: number;
  estimatedDaysToGoal?: number;
  sessionsCount: number;
  averageSessionMinutes: number;
  averageQualityScore: number;
  lastPracticedAt?: Date;
  currentStreak: number;
  longestStreak: number;
  streakStartDate?: Date;
  lastStreakDate?: Date;
  hoursThisWeek: number;
  hoursThisMonth: number;
  avgWeeklyHours: number;
  avgMonthlyHours: number;
  proficiencyLevel: ProficiencyLevel;
  bestSessionDuration: number;
  bestQualityMultiplier: number;
  bestSessionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PracticeMilestone {
  id: string;
  userId: string;
  skillMasteryId: string;
  skillId: string;
  skillName: string;
  milestoneType: PracticeMilestoneType;
  hoursRequired: number;
  hoursAtUnlock: number;
  unlockedAt: Date;
  claimed: boolean;
  claimedAt?: Date;
  xpReward: number;
  badgeId?: string;
  badgeName?: string;
  rewardMetadata?: Record<string, unknown>;
  celebrationShown: boolean;
  shareCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSkillMasteryInput {
  userId: string;
  skillId: string;
  skillName: string;
  targetHours?: number;
}

export interface UpdateSkillMasteryInput {
  totalRawHours?: number;
  totalQualityHours?: number;
  sessionsCount?: number;
  averageSessionMinutes?: number;
  averageQualityScore?: number;
  lastPracticedAt?: Date;
  currentStreak?: number;
  longestStreak?: number;
  streakStartDate?: Date;
  lastStreakDate?: Date;
  hoursThisWeek?: number;
  hoursThisMonth?: number;
  bestSessionDuration?: number;
  bestQualityMultiplier?: number;
  bestSessionDate?: Date;
}

export interface SkillMastery10KStore {
  // CRUD
  create(input: CreateSkillMasteryInput): Promise<SkillMastery10K>;
  getById(id: string): Promise<SkillMastery10K | null>;
  getByUserAndSkill(userId: string, skillId: string): Promise<SkillMastery10K | null>;
  update(id: string, input: UpdateSkillMasteryInput): Promise<SkillMastery10K>;
  delete(id: string): Promise<void>;

  // Queries
  getUserMasteries(userId: string): Promise<SkillMastery10K[]>;
  getUserTopSkills(userId: string, limit?: number): Promise<SkillMastery10K[]>;
  getMasteryOverview(userId: string): Promise<MasteryOverview>;

  // Session Integration
  recordSessionToMastery(
    userId: string,
    skillId: string,
    skillName: string,
    rawHours: number,
    qualityHours: number,
    sessionDuration: number,
    qualityMultiplier: number
  ): Promise<SkillMastery10K>;

  // Milestones
  getMilestones(userId: string): Promise<PracticeMilestone[]>;
  getSkillMilestones(skillMasteryId: string): Promise<PracticeMilestone[]>;
  claimMilestone(milestoneId: string): Promise<PracticeMilestone>;
  markCelebrationShown(milestoneId: string): Promise<void>;

  // Streak Management
  updateStreak(userId: string, skillId: string): Promise<{ current: number; longest: number }>;
  resetBrokenStreaks(userId: string): Promise<void>;
}

export interface MasteryOverview {
  totalSkillsTracking: number;
  totalRawHours: number;
  totalQualityHours: number;
  averageProgress: number;
  skillsAtMilestone: { milestone: PracticeMilestoneType; count: number }[];
  topSkill?: { skillName: string; qualityHours: number; progress: number };
  currentStreak: number;
  longestStreak: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const MILESTONE_HOURS: Record<PracticeMilestoneType, number> = {
  HOURS_100: 100,
  HOURS_500: 500,
  HOURS_1000: 1000,
  HOURS_2500: 2500,
  HOURS_5000: 5000,
  HOURS_7500: 7500,
  HOURS_10000: 10000,
};

export const MILESTONE_XP_REWARDS: Record<PracticeMilestoneType, number> = {
  HOURS_100: 100,
  HOURS_500: 250,
  HOURS_1000: 500,
  HOURS_2500: 1000,
  HOURS_5000: 2500,
  HOURS_7500: 5000,
  HOURS_10000: 10000,
};

export const MILESTONE_BADGE_NAMES: Record<PracticeMilestoneType, string> = {
  HOURS_100: 'Century Club',
  HOURS_500: 'Dedicated Learner',
  HOURS_1000: 'Thousand Hour Club',
  HOURS_2500: 'Quarter Master',
  HOURS_5000: 'Halfway Hero',
  HOURS_7500: 'Elite Practitioner',
  HOURS_10000: 'Grand Master',
};

// Proficiency levels based on quality hours
function getProficiencyLevel(qualityHours: number): ProficiencyLevel {
  if (qualityHours >= 10000) return 'MASTER';
  if (qualityHours >= 7500) return 'EXPERT';
  if (qualityHours >= 5000) return 'ADVANCED';
  if (qualityHours >= 2500) return 'PROFICIENT';
  if (qualityHours >= 1000) return 'COMPETENT';
  if (qualityHours >= 500) return 'INTERMEDIATE';
  if (qualityHours >= 100) return 'NOVICE';
  return 'BEGINNER';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapPrismaMastery(mastery: Prisma.SkillMastery10KGetPayload<object>): SkillMastery10K {
  return {
    id: mastery.id,
    userId: mastery.userId,
    skillId: mastery.skillId,
    skillName: mastery.skillName,
    totalRawHours: mastery.totalRawHours,
    totalQualityHours: mastery.totalQualityHours,
    targetHours: mastery.targetHours,
    progressPercentage: mastery.progressPercentage,
    estimatedDaysToGoal: mastery.estimatedDaysToGoal ?? undefined,
    sessionsCount: mastery.sessionsCount,
    averageSessionMinutes: mastery.averageSessionMinutes,
    averageQualityScore: mastery.averageQualityScore,
    lastPracticedAt: mastery.lastPracticedAt ?? undefined,
    currentStreak: mastery.currentStreak,
    longestStreak: mastery.longestStreak,
    streakStartDate: mastery.streakStartDate ?? undefined,
    lastStreakDate: mastery.lastStreakDate ?? undefined,
    hoursThisWeek: mastery.hoursThisWeek,
    hoursThisMonth: mastery.hoursThisMonth,
    avgWeeklyHours: mastery.avgWeeklyHours,
    avgMonthlyHours: mastery.avgMonthlyHours,
    proficiencyLevel: mastery.proficiencyLevel as ProficiencyLevel,
    bestSessionDuration: mastery.bestSessionDuration,
    bestQualityMultiplier: mastery.bestQualityMultiplier,
    bestSessionDate: mastery.bestSessionDate ?? undefined,
    createdAt: mastery.createdAt,
    updatedAt: mastery.updatedAt,
  };
}

function mapPrismaMilestone(milestone: Prisma.PracticeMilestoneGetPayload<object>): PracticeMilestone {
  return {
    id: milestone.id,
    userId: milestone.userId,
    skillMasteryId: milestone.skillMasteryId,
    skillId: milestone.skillId,
    skillName: milestone.skillName,
    milestoneType: milestone.milestoneType as PracticeMilestoneType,
    hoursRequired: milestone.hoursRequired,
    hoursAtUnlock: milestone.hoursAtUnlock,
    unlockedAt: milestone.unlockedAt,
    claimed: milestone.claimed,
    claimedAt: milestone.claimedAt ?? undefined,
    xpReward: milestone.xpReward,
    badgeId: milestone.badgeId ?? undefined,
    badgeName: milestone.badgeName ?? undefined,
    rewardMetadata: milestone.rewardMetadata as Record<string, unknown> | undefined,
    celebrationShown: milestone.celebrationShown,
    shareCount: milestone.shareCount,
    createdAt: milestone.createdAt,
    updatedAt: milestone.updatedAt,
  };
}

// ============================================================================
// PRISMA SKILL MASTERY 10K STORE
// ============================================================================

export class PrismaSkillMastery10KStore implements SkillMastery10KStore {
  // ---------------------------------------------------------------------------
  // CRUD Operations
  // ---------------------------------------------------------------------------

  async create(input: CreateSkillMasteryInput): Promise<SkillMastery10K> {
    const mastery = await db.skillMastery10K.create({
      data: {
        userId: input.userId,
        skillId: input.skillId,
        skillName: input.skillName,
        targetHours: input.targetHours || 10000,
      },
    });

    return mapPrismaMastery(mastery);
  }

  async getById(id: string): Promise<SkillMastery10K | null> {
    const mastery = await db.skillMastery10K.findUnique({
      where: { id },
    });

    if (!mastery) return null;
    return mapPrismaMastery(mastery);
  }

  async getByUserAndSkill(userId: string, skillId: string): Promise<SkillMastery10K | null> {
    const mastery = await db.skillMastery10K.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });

    if (!mastery) return null;
    return mapPrismaMastery(mastery);
  }

  async update(id: string, input: UpdateSkillMasteryInput): Promise<SkillMastery10K> {
    const mastery = await db.skillMastery10K.update({
      where: { id },
      data: {
        totalRawHours: input.totalRawHours,
        totalQualityHours: input.totalQualityHours,
        sessionsCount: input.sessionsCount,
        averageSessionMinutes: input.averageSessionMinutes,
        averageQualityScore: input.averageQualityScore,
        lastPracticedAt: input.lastPracticedAt,
        currentStreak: input.currentStreak,
        longestStreak: input.longestStreak,
        streakStartDate: input.streakStartDate,
        lastStreakDate: input.lastStreakDate,
        hoursThisWeek: input.hoursThisWeek,
        hoursThisMonth: input.hoursThisMonth,
        bestSessionDuration: input.bestSessionDuration,
        bestQualityMultiplier: input.bestQualityMultiplier,
        bestSessionDate: input.bestSessionDate,
      },
    });

    return mapPrismaMastery(mastery);
  }

  async delete(id: string): Promise<void> {
    await db.skillMastery10K.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  async getUserMasteries(userId: string): Promise<SkillMastery10K[]> {
    const masteries = await db.skillMastery10K.findMany({
      where: { userId },
      orderBy: { totalQualityHours: 'desc' },
    });

    return masteries.map(mapPrismaMastery);
  }

  async getUserTopSkills(userId: string, limit = 5): Promise<SkillMastery10K[]> {
    const masteries = await db.skillMastery10K.findMany({
      where: { userId },
      orderBy: { totalQualityHours: 'desc' },
      take: limit,
    });

    return masteries.map(mapPrismaMastery);
  }

  async getMasteryOverview(userId: string): Promise<MasteryOverview> {
    const masteries = await db.skillMastery10K.findMany({
      where: { userId },
    });

    const totalSkillsTracking = masteries.length;
    const totalRawHours = masteries.reduce((sum, m) => sum + m.totalRawHours, 0);
    const totalQualityHours = masteries.reduce((sum, m) => sum + m.totalQualityHours, 0);
    const averageProgress =
      totalSkillsTracking > 0
        ? masteries.reduce((sum, m) => sum + m.progressPercentage, 0) / totalSkillsTracking
        : 0;

    // Find top skill
    const topMastery = masteries.length > 0
      ? masteries.reduce((max, m) =>
          m.totalQualityHours > max.totalQualityHours ? m : max
        )
      : null;

    // Calculate streaks
    const currentStreak = masteries.length > 0
      ? Math.max(...masteries.map((m) => m.currentStreak))
      : 0;
    const longestStreak = masteries.length > 0
      ? Math.max(...masteries.map((m) => m.longestStreak))
      : 0;

    // Count skills at each milestone
    const milestoneTypes: PracticeMilestoneType[] = [
      'HOURS_100',
      'HOURS_500',
      'HOURS_1000',
      'HOURS_2500',
      'HOURS_5000',
      'HOURS_7500',
      'HOURS_10000',
    ];
    const skillsAtMilestone = milestoneTypes.map((milestone) => ({
      milestone,
      count: masteries.filter(
        (m) => m.totalQualityHours >= MILESTONE_HOURS[milestone]
      ).length,
    }));

    return {
      totalSkillsTracking,
      totalRawHours,
      totalQualityHours,
      averageProgress,
      skillsAtMilestone,
      topSkill: topMastery
        ? {
            skillName: topMastery.skillName,
            qualityHours: topMastery.totalQualityHours,
            progress: topMastery.progressPercentage,
          }
        : undefined,
      currentStreak,
      longestStreak,
    };
  }

  // ---------------------------------------------------------------------------
  // Session Integration
  // ---------------------------------------------------------------------------

  async recordSessionToMastery(
    userId: string,
    skillId: string,
    skillName: string,
    rawHours: number,
    qualityHours: number,
    sessionDuration: number,
    qualityMultiplier: number
  ): Promise<SkillMastery10K> {
    // Get or create mastery record
    let mastery = await db.skillMastery10K.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!mastery) {
      // Create new mastery record
      mastery = await db.skillMastery10K.create({
        data: {
          userId,
          skillId,
          skillName,
          totalRawHours: rawHours,
          totalQualityHours: qualityHours,
          sessionsCount: 1,
          averageSessionMinutes: sessionDuration,
          averageQualityScore: qualityMultiplier,
          lastPracticedAt: now,
          currentStreak: 1,
          longestStreak: 1,
          streakStartDate: today,
          lastStreakDate: today,
          hoursThisWeek: qualityHours,
          hoursThisMonth: qualityHours,
          proficiencyLevel: getProficiencyLevel(qualityHours),
          progressPercentage: (qualityHours / 10000) * 100,
          bestSessionDuration: sessionDuration,
          bestQualityMultiplier: qualityMultiplier,
          bestSessionDate: now,
        },
      });
    } else {
      // Update existing mastery record
      const newTotalRawHours = mastery.totalRawHours + rawHours;
      const newTotalQualityHours = mastery.totalQualityHours + qualityHours;
      const newSessionsCount = mastery.sessionsCount + 1;
      const newAvgSessionMinutes =
        (mastery.averageSessionMinutes * mastery.sessionsCount + sessionDuration) /
        newSessionsCount;
      const newAvgQualityScore =
        (mastery.averageQualityScore * mastery.sessionsCount + qualityMultiplier) /
        newSessionsCount;

      // Update streak
      let newCurrentStreak = mastery.currentStreak;
      let newLongestStreak = mastery.longestStreak;
      let newStreakStartDate = mastery.streakStartDate;

      if (mastery.lastStreakDate) {
        const lastStreakDate = new Date(mastery.lastStreakDate);
        const daysDiff = Math.floor(
          (today.getTime() - lastStreakDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          // Continue streak
          newCurrentStreak++;
          if (newCurrentStreak > newLongestStreak) {
            newLongestStreak = newCurrentStreak;
          }
        } else if (daysDiff > 1) {
          // Streak broken
          newCurrentStreak = 1;
          newStreakStartDate = today;
        }
        // daysDiff === 0: same day, no streak change
      } else {
        // First practice, start streak
        newCurrentStreak = 1;
        newStreakStartDate = today;
      }

      // Update best session records
      const newBestDuration = Math.max(mastery.bestSessionDuration, sessionDuration);
      const newBestMultiplier = Math.max(mastery.bestQualityMultiplier, qualityMultiplier);
      const bestSessionDate =
        sessionDuration > mastery.bestSessionDuration ? now : mastery.bestSessionDate;

      mastery = await db.skillMastery10K.update({
        where: { id: mastery.id },
        data: {
          totalRawHours: newTotalRawHours,
          totalQualityHours: newTotalQualityHours,
          sessionsCount: newSessionsCount,
          averageSessionMinutes: newAvgSessionMinutes,
          averageQualityScore: newAvgQualityScore,
          lastPracticedAt: now,
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          streakStartDate: newStreakStartDate,
          lastStreakDate: today,
          hoursThisWeek: mastery.hoursThisWeek + qualityHours,
          hoursThisMonth: mastery.hoursThisMonth + qualityHours,
          proficiencyLevel: getProficiencyLevel(newTotalQualityHours),
          progressPercentage: (newTotalQualityHours / mastery.targetHours) * 100,
          bestSessionDuration: newBestDuration,
          bestQualityMultiplier: newBestMultiplier,
          bestSessionDate,
        },
      });

      // Check for new milestones
      await this.checkAndCreateMilestones(
        mastery.id,
        userId,
        skillId,
        skillName,
        mastery.totalQualityHours - qualityHours, // previous hours
        newTotalQualityHours
      );
    }

    // Compute rolling averages after session update
    const rollingAverages = await this.computeRollingAverages(userId, skillId);
    if (rollingAverages) {
      mastery = await db.skillMastery10K.update({
        where: { id: mastery.id },
        data: {
          avgWeeklyHours: rollingAverages.avgWeeklyHours,
          avgMonthlyHours: rollingAverages.avgMonthlyHours,
          estimatedDaysToGoal: rollingAverages.estimatedDaysToGoal,
        },
      });
    }

    return mapPrismaMastery(mastery);
  }

  // ---------------------------------------------------------------------------
  // Milestones
  // ---------------------------------------------------------------------------

  async getMilestones(userId: string): Promise<PracticeMilestone[]> {
    const milestones = await db.practiceMilestone.findMany({
      where: { userId },
      orderBy: [{ unlockedAt: 'desc' }],
    });

    return milestones.map(mapPrismaMilestone);
  }

  async getSkillMilestones(skillMasteryId: string): Promise<PracticeMilestone[]> {
    const milestones = await db.practiceMilestone.findMany({
      where: { skillMasteryId },
      orderBy: [{ hoursRequired: 'asc' }],
    });

    return milestones.map(mapPrismaMilestone);
  }

  async claimMilestone(milestoneId: string): Promise<PracticeMilestone> {
    const milestone = await db.practiceMilestone.update({
      where: { id: milestoneId },
      data: {
        claimed: true,
        claimedAt: new Date(),
      },
    });

    return mapPrismaMilestone(milestone);
  }

  async markCelebrationShown(milestoneId: string): Promise<void> {
    await db.practiceMilestone.update({
      where: { id: milestoneId },
      data: { celebrationShown: true },
    });
  }

  // ---------------------------------------------------------------------------
  // Streak Management
  // ---------------------------------------------------------------------------

  async updateStreak(
    userId: string,
    skillId: string
  ): Promise<{ current: number; longest: number }> {
    const mastery = await db.skillMastery10K.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });

    if (!mastery) {
      return { current: 0, longest: 0 };
    }

    return {
      current: mastery.currentStreak,
      longest: mastery.longestStreak,
    };
  }

  async resetBrokenStreaks(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Reset streaks for skills not practiced in the last 2 days
    await db.skillMastery10K.updateMany({
      where: {
        userId,
        lastStreakDate: {
          lt: twoDaysAgo,
        },
        currentStreak: {
          gt: 0,
        },
      },
      data: {
        currentStreak: 0,
        streakStartDate: null,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Compute rolling averages for a user's skill mastery.
   * Calculates avgWeeklyHours (7-day rolling), avgMonthlyHours (30-day rolling),
   * and estimatedDaysToGoal based on current pace.
   */
  private async computeRollingAverages(
    userId: string,
    skillId: string
  ): Promise<{
    avgWeeklyHours: number;
    avgMonthlyHours: number;
    estimatedDaysToGoal: number | null;
  } | null> {
    try {
      // Get the mastery record to know the target
      const mastery = await db.skillMastery10K.findUnique({
        where: { userId_skillId: { userId, skillId } },
      });

      if (!mastery) return null;

      // Calculate date boundaries
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get sessions from the last 30 days for this skill
      const recentSessions = await db.practiceSession.findMany({
        where: {
          userId,
          skillId,
          status: 'COMPLETED',
          endedAt: { gte: monthAgo },
        },
        select: {
          qualityHours: true,
          endedAt: true,
        },
      });

      // Calculate weekly hours (last 7 days)
      const weeklyHours = recentSessions
        .filter((s) => s.endedAt && s.endedAt >= weekAgo)
        .reduce((sum, s) => sum + (s.qualityHours ?? 0), 0);

      // Calculate monthly hours (last 30 days)
      const monthlyHours = recentSessions.reduce(
        (sum, s) => sum + (s.qualityHours ?? 0),
        0
      );

      // Calculate averages (daily rate extrapolated)
      const avgWeeklyHours = weeklyHours; // Total hours in last week
      const avgMonthlyHours = monthlyHours; // Total hours in last month

      // Calculate estimated days to goal
      // Use weekly rate as the more recent indicator
      const dailyRate = avgWeeklyHours / 7;
      const remainingHours = mastery.targetHours - mastery.totalQualityHours;

      let estimatedDaysToGoal: number | null = null;
      if (dailyRate > 0 && remainingHours > 0) {
        estimatedDaysToGoal = Math.ceil(remainingHours / dailyRate);
      } else if (remainingHours <= 0) {
        estimatedDaysToGoal = 0; // Already reached goal
      }

      return {
        avgWeeklyHours,
        avgMonthlyHours,
        estimatedDaysToGoal,
      };
    } catch (error) {
      // Log but don't fail the main operation
      console.error('Error computing rolling averages:', error);
      return null;
    }
  }

  private async checkAndCreateMilestones(
    masteryId: string,
    userId: string,
    skillId: string,
    skillName: string,
    previousHours: number,
    currentHours: number
  ): Promise<void> {
    const milestoneTypes: PracticeMilestoneType[] = [
      'HOURS_100',
      'HOURS_500',
      'HOURS_1000',
      'HOURS_2500',
      'HOURS_5000',
      'HOURS_7500',
      'HOURS_10000',
    ];

    for (const milestoneType of milestoneTypes) {
      const requiredHours = MILESTONE_HOURS[milestoneType];

      // Check if this milestone was just crossed
      if (previousHours < requiredHours && currentHours >= requiredHours) {
        // Check if milestone already exists
        const existing = await db.practiceMilestone.findUnique({
          where: {
            userId_skillId_milestoneType: {
              userId,
              skillId,
              milestoneType,
            },
          },
        });

        if (!existing) {
          // Create new milestone
          await db.practiceMilestone.create({
            data: {
              userId,
              skillMasteryId: masteryId,
              skillId,
              skillName,
              milestoneType,
              hoursRequired: requiredHours,
              hoursAtUnlock: currentHours,
              xpReward: MILESTONE_XP_REWARDS[milestoneType],
              badgeName: MILESTONE_BADGE_NAMES[milestoneType],
            },
          });
        }
      }
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaSkillMastery10KStore(): PrismaSkillMastery10KStore {
  return new PrismaSkillMastery10KStore();
}

// Export constants for use in other modules
export {
  MILESTONE_HOURS,
  MILESTONE_XP_REWARDS,
  MILESTONE_BADGE_NAMES,
  getProficiencyLevel,
};
