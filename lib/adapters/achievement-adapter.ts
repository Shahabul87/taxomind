/**
 * Shared Achievement Database Adapter
 * Used by all achievement-related API routes
 */

import { createAchievementEngine } from '@sam-ai/educational';
import type { AchievementDatabaseAdapter, AchievementProgress, UserStats } from '@sam-ai/educational';
import { getSAMConfig } from '@/lib/adapters';
import { db } from '@/lib/db';

// Create achievement-specific database adapter
export function createAchievementDatabaseAdapter(): AchievementDatabaseAdapter {
  return {
    async getUserStats(userId: string, courseId?: string): Promise<UserStats> {
      // Get total points from SAMPoints
      const points = await db.sAMPoints.aggregate({
        where: { userId, ...(courseId && { courseId }) },
        _sum: { points: true },
      });

      // Get streak from SAMStreak
      const streak = await db.sAMStreak.findUnique({
        where: { userId },
      });

      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          samActiveChallenges: true,
          samCompletedChallenges: true,
        },
      });

      // Calculate level based on points (every 1000 points = 1 level)
      const totalPoints = points._sum.points ?? 0;
      const level = Math.floor(totalPoints / 1000) + 1;

      return {
        points: totalPoints,
        streak: streak?.currentStreak ?? 0,
        level,
        badges: [],
        completedChallenges: (user?.samCompletedChallenges as string[]) ?? [],
        activeChallenges: (user?.samActiveChallenges as string[]) ?? [],
      };
    },

    async getUserBadges(userId: string): Promise<Array<{ description: string }>> {
      return db.sAMBadge.findMany({
        where: { userId },
        select: { description: true },
      });
    },

    async unlockBadge(
      userId: string,
      data: {
        badgeType: string;
        level: number;
        description: string;
        requirements: Record<string, unknown>;
        courseId?: string;
        chapterId?: string;
      }
    ): Promise<void> {
      // Map level number to BadgeLevel enum
      const levelMap: Record<number, 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'> = {
        1: 'BRONZE',
        2: 'SILVER',
        3: 'GOLD',
        4: 'PLATINUM',
        5: 'DIAMOND',
      };
      const badgeLevel = levelMap[data.level] ?? 'BRONZE';

      // Map generic badge types to SAMBadgeType enum
      const badgeTypeMap: Record<string, 'FIRST_INTERACTION' | 'FORM_MASTER' | 'CONTENT_CREATOR' | 'CHAT_EXPERT' | 'STREAK_KEEPER' | 'LEARNING_CHAMPION' | 'TEACHING_MENTOR' | 'ANALYTICS_EXPLORER' | 'PRODUCTIVITY_HERO'> = {
        COMPLETION: 'LEARNING_CHAMPION',
        STREAK: 'STREAK_KEEPER',
        ACHIEVEMENT: 'PRODUCTIVITY_HERO',
        MILESTONE: 'FIRST_INTERACTION',
        SPECIAL: 'ANALYTICS_EXPLORER',
      };
      const mappedBadgeType = badgeTypeMap[data.badgeType] ?? 'FIRST_INTERACTION';

      await db.sAMBadge.create({
        data: {
          userId,
          badgeType: mappedBadgeType,
          badgeId: `${data.badgeType}-${Date.now()}`,
          name: data.description,
          description: data.description,
          level: badgeLevel,
          context: data.requirements,
          courseId: data.courseId,
        },
      });
    },

    async awardPoints(
      userId: string,
      data: {
        points: number;
        reason: string;
        source: string;
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
      }
    ): Promise<void> {
      // Map source to SAMPointsCategory enum
      const categoryMap: Record<string, 'FORM_INTERACTION' | 'CONTENT_CREATION' | 'CHAT_ENGAGEMENT' | 'ACHIEVEMENT_UNLOCK' | 'DAILY_ACTIVITY' | 'LEARNING_PROGRESS' | 'TEACHING_ACTIVITY' | 'COLLABORATION'> = {
        ACHIEVEMENT: 'ACHIEVEMENT_UNLOCK',
        CHALLENGE: 'DAILY_ACTIVITY',
        STREAK: 'DAILY_ACTIVITY',
        BONUS: 'ACHIEVEMENT_UNLOCK',
        LEVEL_UP: 'LEARNING_PROGRESS',
        ACTIVITY: 'DAILY_ACTIVITY',
      };
      const category = categoryMap[data.source] ?? 'DAILY_ACTIVITY';

      await db.sAMPoints.create({
        data: {
          userId,
          points: data.points,
          reason: data.reason,
          category,
          courseId: data.courseId,
          chapterId: data.chapterId,
          sectionId: data.sectionId,
        },
      });
    },

    async updateStreak(
      userId: string,
      data: {
        streakType: string;
        currentStreak: number;
        longestStreak: number;
        courseId?: string;
      }
    ): Promise<void> {
      // Map streakType to SAMStreakType enum
      const streakTypeMap: Record<string, 'DAILY_INTERACTION' | 'WEEKLY_ENGAGEMENT' | 'FORM_COMPLETION' | 'CONTENT_CREATION' | 'CHAT_ACTIVITY'> = {
        DAILY_INTERACTION: 'DAILY_INTERACTION',
        CONTENT_CREATION: 'CONTENT_CREATION',
        FORM_COMPLETION: 'FORM_COMPLETION',
        LEARNING_STREAK: 'DAILY_INTERACTION', // Map to closest type
        CHAT_ACTIVITY: 'CHAT_ACTIVITY',
        WEEKLY_ENGAGEMENT: 'WEEKLY_ENGAGEMENT',
      };
      const mappedStreakType = streakTypeMap[data.streakType] ?? 'DAILY_INTERACTION';

      // SAMStreak has userId as unique - one streak per user
      await db.sAMStreak.upsert({
        where: {
          userId,
        },
        update: {
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
          streakType: mappedStreakType,
          lastActivityDate: new Date(),
          metadata: data.courseId ? { courseId: data.courseId } : undefined,
        },
        create: {
          userId,
          streakType: mappedStreakType,
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
          lastActivityDate: new Date(),
          metadata: data.courseId ? { courseId: data.courseId } : undefined,
        },
      });
    },

    async recordInteraction(data: {
      userId: string;
      interactionType: string;
      context: string;
      result: string;
      courseId?: string;
      chapterId?: string;
      sectionId?: string;
    }): Promise<void> {
      type SAMInteractionType = 'NAVIGATION' | 'FORM_POPULATE' | 'FORM_SUBMIT' | 'FORM_VALIDATE' | 'CONTENT_GENERATE' | 'CHAT_MESSAGE' | 'QUICK_ACTION' | 'ANALYTICS_VIEW' | 'GAMIFICATION_ACTION' | 'LEARNING_ASSISTANCE';
      const validType: SAMInteractionType = 'GAMIFICATION_ACTION';

      await db.sAMInteraction.create({
        data: {
          userId: data.userId,
          interactionType: validType,
          context: { action: data.interactionType, data: data.context, result: data.result },
          actionTaken: data.result,
          courseId: data.courseId,
          chapterId: data.chapterId,
          sectionId: data.sectionId,
        },
      });
    },

    async getUserChallenges(userId: string): Promise<{
      activeChallenges: string[];
      completedChallenges: string[];
      challengeStartDate?: Date;
    }> {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          samActiveChallenges: true,
          samCompletedChallenges: true,
          samChallengeStartDate: true,
        },
      });

      return {
        activeChallenges: (user?.samActiveChallenges as string[]) ?? [],
        completedChallenges: (user?.samCompletedChallenges as string[]) ?? [],
        challengeStartDate: user?.samChallengeStartDate ?? undefined,
      };
    },

    async updateUserChallenges(
      userId: string,
      data: {
        activeChallenges?: string[];
        completedChallenges?: string[];
        challengeStartDate?: Date;
      }
    ): Promise<void> {
      await db.user.update({
        where: { id: userId },
        data: {
          ...(data.activeChallenges !== undefined && { samActiveChallenges: data.activeChallenges }),
          ...(data.completedChallenges !== undefined && { samCompletedChallenges: data.completedChallenges }),
          ...(data.challengeStartDate !== undefined && { samChallengeStartDate: data.challengeStartDate }),
        },
      });
    },

    async getInteractionsSince(
      userId: string,
      since: Date,
      actionType?: string
    ): Promise<Array<{ createdAt: Date; context: unknown }>> {
      const interactions = await db.sAMInteraction.findMany({
        where: {
          userId,
          createdAt: { gte: since },
          ...(actionType && {
            context: {
              path: ['action'],
              equals: actionType,
            },
          }),
        },
        select: {
          createdAt: true,
          context: true,
        },
      });

      return interactions;
    },

    async checkAchievementProgress(
      achievementId: string,
      userId: string
    ): Promise<AchievementProgress> {
      const badges = await db.sAMBadge.findMany({
        where: { userId, description: achievementId },
      });

      return {
        completed: badges.length > 0,
        progress: badges.length > 0 ? 100 : 0,
        total: 100,
      };
    },
  };
}

// Lazy initialization
let _achievementEngine: ReturnType<typeof createAchievementEngine> | null = null;

export function getAchievementEngine() {
  if (!_achievementEngine) {
    _achievementEngine = createAchievementEngine({
      samConfig: getSAMConfig(),
      database: createAchievementDatabaseAdapter(),
    });
  }
  return _achievementEngine;
}
