import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { AchievementCategory, AchievementRarity } from '@prisma/client';

/**
 * SAM Achievements - Real Implementation
 * Uses Prisma models for gamification system
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'teaching' | 'collaboration' | 'consistency' | 'mastery' | 'creativity';
  points: number;
  rarity?: string;
  isUnlocked?: boolean;
  progress?: number;
  unlockedAt?: Date | null;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: number;
  category: 'daily' | 'weekly' | 'monthly' | 'special';
  points: number;
  bonusMultiplier?: number;
  requirements: {
    type: 'create_content' | 'use_ai' | 'form_completion' | 'streak_maintenance' | 'collaboration' | 'improvement';
    target: number;
    conditions?: { [key: string]: string | number | boolean };
  };
  rewards: {
    points: number;
    badges?: string[];
    specialRewards?: string[];
  };
}

/**
 * Map Prisma category to legacy format
 */
function mapCategory(category: AchievementCategory): Achievement['category'] {
  const mapping: Record<AchievementCategory, Achievement['category']> = {
    STREAK: 'consistency',
    COMPLETION: 'learning',
    MASTERY: 'mastery',
    ENGAGEMENT: 'collaboration',
    SPEED: 'learning',
    DEDICATION: 'consistency',
    SOCIAL: 'collaboration',
    SPECIAL: 'creativity',
  };
  return mapping[category] ?? 'learning';
}

/**
 * Get achievements for user with real database queries
 */
export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  try {
    // Get all achievements and user progress
    const [allAchievements, userProgress] = await Promise.all([
      db.gamificationAchievement.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      db.gamificationUserAchievement.findMany({
        where: { userId },
      }),
    ]);

    // Map progress to achievement ID
    const progressMap = new Map(userProgress.map((p) => [p.achievementId, p]));

    return allAchievements.map((achievement) => {
      const progress = progressMap.get(achievement.id);
      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: mapCategory(achievement.category),
        points: achievement.xpReward,
        rarity: achievement.rarity.toLowerCase(),
        isUnlocked: progress?.isUnlocked ?? false,
        progress: progress ? (progress.currentProgress / progress.targetProgress) * 100 : 0,
        unlockedAt: progress?.unlockedAt ?? null,
      };
    });
  } catch (error) {
    logger.error('SAM Achievements: Failed to get user achievements', { userId, error });
    return [];
  }
}

/**
 * Award achievement to user with real database transaction
 */
export async function awardAchievement(userId: string, achievementId: string): Promise<void> {
  try {
    const achievement = await db.gamificationAchievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      logger.warn('SAM Achievements: Achievement not found', { achievementId });
      return;
    }

    await db.$transaction(async (tx) => {
      // Update or create user achievement progress
      await tx.gamificationUserAchievement.upsert({
        where: {
          userId_achievementId: { userId, achievementId },
        },
        update: {
          isUnlocked: true,
          unlockedAt: new Date(),
          timesEarned: { increment: 1 },
          isNew: true,
        },
        create: {
          userId,
          achievementId,
          currentProgress: 100,
          targetProgress: 100,
          isUnlocked: true,
          unlockedAt: new Date(),
          timesEarned: 1,
          isNew: true,
        },
      });

      // Award XP if achievement has XP reward
      if (achievement.xpReward > 0) {
        const userXP = await tx.gamificationUserXP.findUnique({
          where: { userId },
        });

        if (userXP) {
          const newXP = userXP.totalXP + achievement.xpReward;
          const newLevel = calculateLevel(newXP);

          await tx.gamificationUserXP.update({
            where: { userId },
            data: {
              totalXP: newXP,
              currentLevel: newLevel,
              totalAchievements: { increment: 1 },
            },
          });

          // Log XP transaction
          await tx.gamificationXPTransaction.create({
            data: {
              userXPId: userXP.id,
              amount: achievement.xpReward,
              source: 'ACHIEVEMENT',
              sourceId: achievementId,
              description: `Unlocked achievement: ${achievement.name}`,
              balanceBefore: userXP.totalXP,
              balanceAfter: newXP,
              levelBefore: userXP.currentLevel,
              levelAfter: newLevel,
            },
          });
        }
      }
    });

    logger.info('SAM Achievements: Awarded achievement', { userId, achievementId, name: achievement.name });
  } catch (error) {
    logger.error('SAM Achievements: Failed to award achievement', { userId, achievementId, error });
  }
}

/**
 * Get active challenges using User.samActiveChallenges JSON field
 */
export async function getActiveChallenges(userId: string): Promise<Challenge[]> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        samActiveChallenges: true,
        samChallengeStartDate: true,
      },
    });

    if (!user?.samActiveChallenges) {
      // No active challenges - generate daily/weekly challenges
      const newChallenges = await generateChallengesForUser(userId);
      return newChallenges;
    }

    // Parse stored challenges
    const storedChallenges = user.samActiveChallenges as unknown as StoredChallenge[];

    // Filter out expired challenges
    const now = new Date();
    const activeChallenges = storedChallenges.filter((c) => {
      const endDate = new Date(c.endDate);
      return endDate > now;
    });

    // If all challenges expired, generate new ones
    if (activeChallenges.length === 0) {
      return await generateChallengesForUser(userId);
    }

    return activeChallenges.map(mapStoredToChallenge);
  } catch (error) {
    logger.error('SAM Achievements: Failed to get active challenges', { userId, error });
    return [];
  }
}

interface StoredChallenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: 'daily' | 'weekly' | 'monthly' | 'special';
  points: number;
  bonusMultiplier?: number;
  requirementType: string;
  requirementTarget: number;
  currentProgress: number;
  startDate: string;
  endDate: string;
}

function mapStoredToChallenge(stored: StoredChallenge): Challenge {
  return {
    id: stored.id,
    name: stored.name,
    description: stored.description,
    icon: stored.icon,
    difficulty: stored.difficulty,
    duration: Math.ceil((new Date(stored.endDate).getTime() - Date.now()) / (1000 * 60 * 60)),
    category: stored.category,
    points: stored.points,
    bonusMultiplier: stored.bonusMultiplier,
    requirements: {
      type: stored.requirementType as Challenge['requirements']['type'],
      target: stored.requirementTarget,
    },
    rewards: {
      points: stored.points,
    },
  };
}

/**
 * Generate new challenges for a user
 */
async function generateChallengesForUser(userId: string): Promise<Challenge[]> {
  const now = new Date();
  const dailyEnd = new Date(now);
  dailyEnd.setHours(23, 59, 59, 999);

  const weeklyEnd = new Date(now);
  weeklyEnd.setDate(weeklyEnd.getDate() + (7 - weeklyEnd.getDay()));
  weeklyEnd.setHours(23, 59, 59, 999);

  const dailyChallenges: StoredChallenge[] = [
    {
      id: `daily-learn-${now.toISOString().split('T')[0]}`,
      name: 'Daily Learner',
      description: 'Complete 3 learning sessions today',
      icon: '📚',
      difficulty: 'easy',
      category: 'daily',
      points: 50,
      bonusMultiplier: 1.5,
      requirementType: 'form_completion',
      requirementTarget: 3,
      currentProgress: 0,
      startDate: now.toISOString(),
      endDate: dailyEnd.toISOString(),
    },
    {
      id: `daily-ai-${now.toISOString().split('T')[0]}`,
      name: 'AI Explorer',
      description: 'Ask SAM 5 questions today',
      icon: '🤖',
      difficulty: 'easy',
      category: 'daily',
      points: 30,
      requirementType: 'use_ai',
      requirementTarget: 5,
      currentProgress: 0,
      startDate: now.toISOString(),
      endDate: dailyEnd.toISOString(),
    },
  ];

  const weeklyChallenges: StoredChallenge[] = [
    {
      id: `weekly-streak-${now.toISOString().split('T')[0]}`,
      name: 'Consistency Champion',
      description: 'Maintain a 7-day learning streak',
      icon: '🔥',
      difficulty: 'medium',
      category: 'weekly',
      points: 200,
      bonusMultiplier: 2,
      requirementType: 'streak_maintenance',
      requirementTarget: 7,
      currentProgress: 0,
      startDate: now.toISOString(),
      endDate: weeklyEnd.toISOString(),
    },
    {
      id: `weekly-improve-${now.toISOString().split('T')[0]}`,
      name: 'Skill Builder',
      description: 'Improve mastery by 10% in any topic',
      icon: '📈',
      difficulty: 'hard',
      category: 'weekly',
      points: 300,
      requirementType: 'improvement',
      requirementTarget: 10,
      currentProgress: 0,
      startDate: now.toISOString(),
      endDate: weeklyEnd.toISOString(),
    },
  ];

  const allChallenges = [...dailyChallenges, ...weeklyChallenges];

  // Store the new challenges
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        samActiveChallenges: allChallenges as unknown as Record<string, unknown>[],
        samChallengeStartDate: now,
      },
    });
  } catch (error) {
    logger.error('SAM Achievements: Failed to store challenges', { userId, error });
  }

  return allChallenges.map(mapStoredToChallenge);
}

/**
 * Update challenge progress for a user
 */
export async function updateChallengeProgress(
  userId: string,
  challengeId: string,
  progressIncrement: number
): Promise<{ completed: boolean; challenge?: Challenge }> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        samActiveChallenges: true,
        samCompletedChallenges: true,
      },
    });

    if (!user?.samActiveChallenges) {
      return { completed: false };
    }

    const activeChallenges = user.samActiveChallenges as unknown as StoredChallenge[];
    const challengeIndex = activeChallenges.findIndex((c) => c.id === challengeId);

    if (challengeIndex === -1) {
      return { completed: false };
    }

    const challenge = activeChallenges[challengeIndex];
    challenge.currentProgress += progressIncrement;

    const isCompleted = challenge.currentProgress >= challenge.requirementTarget;

    if (isCompleted) {
      // Move to completed challenges
      const completedChallenges = (user.samCompletedChallenges as unknown as StoredChallenge[]) || [];
      completedChallenges.push(challenge);

      // Remove from active
      activeChallenges.splice(challengeIndex, 1);

      await db.user.update({
        where: { id: userId },
        data: {
          samActiveChallenges: activeChallenges as unknown as Record<string, unknown>[],
          samCompletedChallenges: completedChallenges as unknown as Record<string, unknown>[],
          samTotalPoints: { increment: challenge.points * (challenge.bonusMultiplier || 1) },
        },
      });

      logger.info('SAM Achievements: Challenge completed', {
        userId,
        challengeId,
        points: challenge.points,
      });

      return { completed: true, challenge: mapStoredToChallenge(challenge) };
    }

    // Update progress
    await db.user.update({
      where: { id: userId },
      data: {
        samActiveChallenges: activeChallenges as unknown as Record<string, unknown>[],
      },
    });

    logger.debug('SAM Achievements: Challenge progress updated', {
      userId,
      challengeId,
      progress: challenge.currentProgress,
      target: challenge.requirementTarget,
    });

    return { completed: false };
  } catch (error) {
    logger.error('SAM Achievements: Failed to update challenge progress', {
      userId,
      challengeId,
      error,
    });
    return { completed: false };
  }
}

/**
 * Get user points from database
 */
export async function getUserPoints(userId: string): Promise<number> {
  try {
    const userXP = await db.gamificationUserXP.findUnique({
      where: { userId },
      select: { totalXP: true },
    });
    return userXP?.totalXP ?? 0;
  } catch (error) {
    logger.error('SAM Achievements: Failed to get user points', { userId, error });
    return 0;
  }
}

/**
 * Calculate user level based on XP
 * Level formula: Level = floor(sqrt(XP / 50)) + 1
 * This gives a slower progression at higher levels
 */
export function calculateLevel(points: number): number {
  if (points <= 0) return 1;
  return Math.floor(Math.sqrt(points / 50)) + 1;
}

/**
 * Get achievement recommendations based on user progress
 */
export async function getAchievementRecommendations(userId: string): Promise<Achievement[]> {
  try {
    // Get achievements user has NOT unlocked but has some progress on
    const nearCompletion = await db.gamificationUserAchievement.findMany({
      where: {
        userId,
        isUnlocked: false,
        currentProgress: { gt: 0 },
      },
      include: {
        achievement: true,
      },
      orderBy: {
        currentProgress: 'desc',
      },
      take: 5,
    });

    return nearCompletion.map((progress) => ({
      id: progress.achievement.id,
      name: progress.achievement.name,
      description: progress.achievement.description,
      icon: progress.achievement.icon,
      category: mapCategory(progress.achievement.category),
      points: progress.achievement.xpReward,
      rarity: progress.achievement.rarity.toLowerCase(),
      isUnlocked: false,
      progress: (progress.currentProgress / progress.targetProgress) * 100,
    }));
  } catch (error) {
    logger.error('SAM Achievements: Failed to get recommendations', { userId, error });
    return [];
  }
}

/**
 * Check achievement progress for a specific achievement
 */
export async function checkAchievementProgress(
  userId: string,
  achievementId: string
): Promise<{ completed: boolean; progress: number; total: number }> {
  try {
    const progress = await db.gamificationUserAchievement.findUnique({
      where: {
        userId_achievementId: { userId, achievementId },
      },
    });

    if (!progress) {
      const achievement = await db.gamificationAchievement.findUnique({
        where: { id: achievementId },
      });
      return {
        completed: false,
        progress: 0,
        total: achievement ? 100 : 0,
      };
    }

    return {
      completed: progress.isUnlocked,
      progress: progress.currentProgress,
      total: progress.targetProgress,
    };
  } catch (error) {
    logger.error('SAM Achievements: Failed to check progress', { userId, achievementId, error });
    return { completed: false, progress: 0, total: 100 };
  }
}

/**
 * Get user streak information
 */
export async function getUserStreak(userId: string): Promise<{
  current: number;
  longest: number;
  lastActivityDate: Date | null;
}> {
  try {
    const userXP = await db.gamificationUserXP.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
      },
    });

    return {
      current: userXP?.currentStreak ?? 0,
      longest: userXP?.longestStreak ?? 0,
      lastActivityDate: userXP?.lastActivityDate ?? null,
    };
  } catch (error) {
    logger.error('SAM Achievements: Failed to get streak', { userId, error });
    return { current: 0, longest: 0, lastActivityDate: null };
  }
}

/**
 * Update user activity and streak
 */
export async function updateUserActivity(userId: string): Promise<void> {
  try {
    const userXP = await db.gamificationUserXP.findUnique({
      where: { userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!userXP) {
      // Create new XP record
      await db.gamificationUserXP.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
        },
      });
      return;
    }

    const lastActivity = userXP.lastActivityDate;
    if (!lastActivity) {
      // First activity
      await db.gamificationUserXP.update({
        where: { userId },
        data: {
          currentStreak: 1,
          longestStreak: Math.max(1, userXP.longestStreak),
          lastActivityDate: today,
        },
      });
      return;
    }

    const lastActivityDate = new Date(lastActivity);
    lastActivityDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day - no streak update
      return;
    } else if (daysDiff === 1) {
      // Consecutive day - increment streak
      const newStreak = userXP.currentStreak + 1;
      await db.gamificationUserXP.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, userXP.longestStreak),
          lastActivityDate: today,
        },
      });
    } else {
      // Streak broken - reset to 1
      await db.gamificationUserXP.update({
        where: { userId },
        data: {
          currentStreak: 1,
          lastActivityDate: today,
        },
      });
    }
  } catch (error) {
    logger.error('SAM Achievements: Failed to update activity', { userId, error });
  }
}

// Export empty arrays for backward compatibility (achievements are now in database)
export const TEACHER_ACHIEVEMENTS: Achievement[] = [];
export const STUDENT_ACHIEVEMENTS: Achievement[] = [];
export const DAILY_CHALLENGES: Challenge[] = [];
export const WEEKLY_CHALLENGES: Challenge[] = [];
export const CHALLENGES: Challenge[] = [];
