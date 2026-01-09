/**
 * Enhanced Gamification Service
 * Database-backed gamification system with XP, achievements, and leaderboards
 */

import { db } from '@/lib/db';
import {
  AchievementCategory,
  AchievementRarity,
  XPSource,
  LeaderboardPeriod,
  LEVEL_THRESHOLDS,
  type UserXP,
  type Achievement,
  type UserAchievement,
  type XPTransaction,
  type LeaderboardEntry,
  type AwardXPRequest,
  type AwardXPResponse,
} from '@/types/gamification';

// ==========================================
// Level Calculation Utilities
// ==========================================

export function calculateLevelFromXP(totalXP: number): {
  level: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  title: string;
} {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xpRequired) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || {
        ...currentLevel,
        xpRequired: currentLevel.xpRequired + 2000,
      };
      break;
    }
  }

  const xpInCurrentLevel = totalXP - currentLevel.xpRequired;
  const xpToNextLevel = nextLevel.xpRequired - currentLevel.xpRequired;

  return {
    level: currentLevel.level,
    xpInCurrentLevel,
    xpToNextLevel,
    title: currentLevel.title,
  };
}

// ==========================================
// User XP Operations
// ==========================================

export async function getUserXP(userId: string): Promise<UserXP | null> {
  const userXP = await db.gamificationUserXP.findUnique({
    where: { userId },
  });

  return userXP as UserXP | null;
}

export async function getOrCreateUserXP(userId: string): Promise<UserXP> {
  let userXP = await db.gamificationUserXP.findUnique({
    where: { userId },
  });

  if (!userXP) {
    userXP = await db.gamificationUserXP.create({
      data: {
        userId,
        totalXP: 0,
        currentLevel: 1,
        xpInCurrentLevel: 0,
        xpToNextLevel: 100,
        totalAchievements: 0,
        currentStreak: 0,
        longestStreak: 0,
        streakFreezeCount: 3,
      },
    });
  }

  return userXP as UserXP;
}

export async function awardXP(request: AwardXPRequest): Promise<AwardXPResponse> {
  const { userId, amount, source, sourceId, description, metadata } = request;

  // Get or create user XP record
  const userXP = await getOrCreateUserXP(userId);
  const balanceBefore = userXP.totalXP;
  const levelBefore = userXP.currentLevel;

  // Calculate new XP and level
  const newTotalXP = balanceBefore + amount;
  const levelCalc = calculateLevelFromXP(newTotalXP);
  const levelUp = levelCalc.level > levelBefore;

  // Update user XP
  const updatedUserXP = await db.gamificationUserXP.update({
    where: { userId },
    data: {
      totalXP: newTotalXP,
      currentLevel: levelCalc.level,
      xpInCurrentLevel: levelCalc.xpInCurrentLevel,
      xpToNextLevel: levelCalc.xpToNextLevel,
      lastActivityDate: new Date(),
    },
  });

  // Create transaction record
  const transaction = await db.gamificationXPTransaction.create({
    data: {
      userXPId: userXP.id,
      amount,
      source,
      sourceId,
      description,
      balanceBefore,
      balanceAfter: newTotalXP,
      levelBefore,
      levelAfter: levelCalc.level,
      metadata: metadata as Record<string, unknown> | undefined,
    },
  });

  // Check for any achievements that might be unlocked
  const achievementsUnlocked = await checkAndUnlockAchievements(userId, {
    xpEarned: amount,
    source,
    newTotalXP,
    newLevel: levelCalc.level,
  });

  return {
    success: true,
    transaction: transaction as XPTransaction,
    levelUp,
    newLevel: levelUp ? levelCalc.level : undefined,
    achievementsUnlocked,
  };
}

// ==========================================
// Achievement Operations
// ==========================================

export async function getAllAchievements(): Promise<Achievement[]> {
  const achievements = await db.gamificationAchievement.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
  });

  // Transform Prisma types to our Achievement type
  return achievements.map((a) => ({
    ...a,
    criteria: a.criteria as Record<string, unknown>,
    category: a.category as AchievementCategory,
    rarity: a.rarity as AchievementRarity,
  }));
}

export async function getUserAchievements(
  userId: string,
  options?: {
    unlockedOnly?: boolean;
    category?: AchievementCategory;
  }
): Promise<UserAchievement[]> {
  const where: Record<string, unknown> = { userId };

  if (options?.unlockedOnly) {
    where.isUnlocked = true;
  }

  const userAchievements = await db.gamificationUserAchievement.findMany({
    where,
    include: {
      achievement: true,
    },
    orderBy: [{ unlockedAt: 'desc' }, { createdAt: 'desc' }],
  });

  // Transform to UserAchievement type
  const transformedAchievements: UserAchievement[] = userAchievements.map((ua) => ({
    ...ua,
    progressData: ua.progressData as Record<string, unknown> | null,
    achievement: ua.achievement
      ? {
          ...ua.achievement,
          criteria: ua.achievement.criteria as Record<string, unknown>,
          category: ua.achievement.category as AchievementCategory,
          rarity: ua.achievement.rarity as AchievementRarity,
        }
      : null,
  }));

  if (options?.category) {
    return transformedAchievements.filter(
      (ua) => ua.achievement?.category === options.category
    );
  }

  return transformedAchievements;
}

export async function checkAndUnlockAchievements(
  userId: string,
  context: {
    xpEarned?: number;
    source?: XPSource;
    newTotalXP?: number;
    newLevel?: number;
    streakDays?: number;
    lessonsCompleted?: number;
    coursesCompleted?: number;
    quizScore?: number;
  }
): Promise<Achievement[]> {
  const unlockedAchievements: Achievement[] = [];

  // Get all active achievements
  const achievements = await db.gamificationAchievement.findMany({
    where: { isActive: true },
  });

  for (const achievement of achievements) {
    // Check if user already has this achievement (and it's not repeatable)
    const existingProgress = await db.gamificationUserAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existingProgress?.isUnlocked && !achievement.isRepeatable) {
      continue;
    }

    // Check if achievement criteria is met
    const criteria = achievement.criteria as Record<string, unknown>;
    const isMet = await checkAchievementCriteria(userId, criteria, context);

    if (isMet) {
      // Unlock or update achievement
      if (existingProgress) {
        await db.gamificationUserAchievement.update({
          where: { id: existingProgress.id },
          data: {
            isUnlocked: true,
            unlockedAt: new Date(),
            timesEarned: existingProgress.timesEarned + 1,
            isNew: true,
          },
        });
      } else {
        await db.gamificationUserAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            currentProgress: (criteria.target as number) || 1,
            targetProgress: (criteria.target as number) || 1,
            isUnlocked: true,
            unlockedAt: new Date(),
            timesEarned: 1,
            isNew: true,
          },
        });
      }

      // Award XP for achievement
      if (achievement.xpReward > 0) {
        await awardXP({
          userId,
          amount: achievement.xpReward,
          source: XPSource.ACHIEVEMENT,
          sourceId: achievement.id,
          description: `Achievement: ${achievement.name}`,
        });
      }

      // Transform to Achievement type
      unlockedAchievements.push({
        ...achievement,
        criteria: achievement.criteria as Record<string, unknown>,
        category: achievement.category as AchievementCategory,
        rarity: achievement.rarity as AchievementRarity,
      });
    }
  }

  return unlockedAchievements;
}

async function checkAchievementCriteria(
  userId: string,
  criteria: Record<string, unknown>,
  context: {
    xpEarned?: number;
    source?: XPSource;
    newTotalXP?: number;
    newLevel?: number;
    streakDays?: number;
    lessonsCompleted?: number;
    coursesCompleted?: number;
    quizScore?: number;
  }
): Promise<boolean> {
  const { type, target, metric } = criteria as {
    type: string;
    target: number;
    metric: string;
  };

  switch (type) {
    case 'COUNT': {
      // Count-based achievements
      if (metric === 'total_xp') return (context.newTotalXP || 0) >= target;
      if (metric === 'level') return (context.newLevel || 1) >= target;
      if (metric === 'lessons') return (context.lessonsCompleted || 0) >= target;
      if (metric === 'courses') return (context.coursesCompleted || 0) >= target;
      break;
    }
    case 'STREAK': {
      // Streak-based achievements
      if (metric === 'days') return (context.streakDays || 0) >= target;
      break;
    }
    case 'PERCENTAGE': {
      // Percentage-based achievements
      if (metric === 'quiz_score') return (context.quizScore || 0) >= target;
      break;
    }
  }

  return false;
}

// ==========================================
// Streak Operations
// ==========================================

export async function updateStreak(userId: string): Promise<{
  current: number;
  longest: number;
  maintained: boolean;
  freezeUsed: boolean;
}> {
  const userXP = await getOrCreateUserXP(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = userXP.lastActivityDate;
  let maintained = false;
  let freezeUsed = false;
  let currentStreak = userXP.currentStreak;
  let longestStreak = userXP.longestStreak;

  if (!lastActivity) {
    // First activity
    currentStreak = 1;
    maintained = true;
  } else {
    const lastDate = new Date(lastActivity);
    lastDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      // Same day
      maintained = true;
    } else if (daysDiff === 1) {
      // Consecutive day
      currentStreak += 1;
      maintained = true;
    } else if (daysDiff === 2 && userXP.streakFreezeCount > 0) {
      // Missed one day but have freeze
      currentStreak += 1;
      maintained = true;
      freezeUsed = true;
      await db.gamificationUserXP.update({
        where: { userId },
        data: {
          streakFreezeCount: userXP.streakFreezeCount - 1,
        },
      });
    } else {
      // Streak broken
      currentStreak = 1;
      maintained = false;
    }
  }

  // Update longest streak if needed
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  await db.gamificationUserXP.update({
    where: { userId },
    data: {
      currentStreak,
      longestStreak,
      lastActivityDate: today,
    },
  });

  // Check for streak achievements
  await checkAndUnlockAchievements(userId, { streakDays: currentStreak });

  return { current: currentStreak, longest: longestStreak, maintained, freezeUsed };
}

// ==========================================
// Leaderboard Operations
// ==========================================

export async function getLeaderboard(
  period: LeaderboardPeriod,
  options?: {
    limit?: number;
    offset?: number;
    userId?: string;
  }
): Promise<{
  entries: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry;
  totalParticipants: number;
}> {
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  const periodStart = getLeaderboardPeriodStart(period);

  const entries = await db.gamificationLeaderboardEntry.findMany({
    where: {
      period,
      periodStart,
      isVisible: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { xpEarned: 'desc' },
    take: limit,
    skip: offset,
  });

  const totalParticipants = await db.gamificationLeaderboardEntry.count({
    where: {
      period,
      periodStart,
      isVisible: true,
    },
  });

  let currentUserEntry: LeaderboardEntry | undefined;
  if (options?.userId) {
    const userEntry = await db.gamificationLeaderboardEntry.findFirst({
      where: {
        userId: options.userId,
        period,
        periodStart,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    currentUserEntry = userEntry as LeaderboardEntry | undefined;
  }

  return {
    entries: entries as LeaderboardEntry[],
    currentUserEntry,
    totalParticipants,
  };
}

function getLeaderboardPeriodStart(period: LeaderboardPeriod): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (period) {
    case LeaderboardPeriod.WEEKLY: {
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      return new Date(now.setDate(diff));
    }
    case LeaderboardPeriod.MONTHLY: {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    case LeaderboardPeriod.ALL_TIME: {
      return new Date(2020, 0, 1); // Platform start date
    }
  }
}

export async function updateLeaderboardEntry(
  userId: string,
  period: LeaderboardPeriod,
  stats: {
    xpEarned?: number;
    achievementsUnlocked?: number;
    lessonsCompleted?: number;
    quizzesTaken?: number;
    studyMinutes?: number;
  }
): Promise<LeaderboardEntry> {
  const periodStart = getLeaderboardPeriodStart(period);
  const periodEnd =
    period === LeaderboardPeriod.ALL_TIME ? null : getLeaderboardPeriodEnd(period);

  const existingEntry = await db.gamificationLeaderboardEntry.findUnique({
    where: {
      userId_period_periodStart: {
        userId,
        period,
        periodStart,
      },
    },
  });

  if (existingEntry) {
    const updated = await db.gamificationLeaderboardEntry.update({
      where: { id: existingEntry.id },
      data: {
        xpEarned: existingEntry.xpEarned + (stats.xpEarned || 0),
        achievementsUnlocked:
          existingEntry.achievementsUnlocked + (stats.achievementsUnlocked || 0),
        lessonsCompleted: existingEntry.lessonsCompleted + (stats.lessonsCompleted || 0),
        quizzesTaken: existingEntry.quizzesTaken + (stats.quizzesTaken || 0),
        studyMinutes: existingEntry.studyMinutes + (stats.studyMinutes || 0),
        lastCalculatedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });
    return updated as LeaderboardEntry;
  }

  const created = await db.gamificationLeaderboardEntry.create({
    data: {
      userId,
      period,
      periodStart,
      periodEnd,
      xpEarned: stats.xpEarned || 0,
      achievementsUnlocked: stats.achievementsUnlocked || 0,
      lessonsCompleted: stats.lessonsCompleted || 0,
      quizzesTaken: stats.quizzesTaken || 0,
      studyMinutes: stats.studyMinutes || 0,
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return created as LeaderboardEntry;
}

function getLeaderboardPeriodEnd(period: LeaderboardPeriod): Date | null {
  const now = new Date();

  switch (period) {
    case LeaderboardPeriod.WEEKLY: {
      const periodStart = getLeaderboardPeriodStart(period);
      return new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    }
    case LeaderboardPeriod.MONTHLY: {
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
    default:
      return null;
  }
}

// ==========================================
// Dashboard Data
// ==========================================

export async function getGamificationDashboard(userId: string) {
  const [userXP, recentAchievements, nearCompletion, leaderboardData, streakData] =
    await Promise.all([
      getOrCreateUserXP(userId),
      getUserAchievements(userId, { unlockedOnly: true }),
      getUserNearCompletionAchievements(userId),
      getLeaderboard(LeaderboardPeriod.WEEKLY, { limit: 10, userId }),
      getUserXP(userId).then((xp) => ({
        current: xp?.currentStreak || 0,
        longest: xp?.longestStreak || 0,
        todayActive: isActiveToday(xp?.lastActivityDate),
        freezesAvailable: xp?.streakFreezeCount || 0,
      })),
    ]);

  return {
    xp: userXP,
    recentAchievements: recentAchievements.slice(0, 5),
    nearCompletion,
    leaderboard: leaderboardData.entries,
    streak: streakData,
  };
}

async function getUserNearCompletionAchievements(
  userId: string
): Promise<UserAchievement[]> {
  const userAchievements = await db.gamificationUserAchievement.findMany({
    where: {
      userId,
      isUnlocked: false,
    },
    include: {
      achievement: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Filter to achievements that are 50%+ complete
  return userAchievements
    .filter(
      (ua: { currentProgress: number; targetProgress: number }) =>
        ua.currentProgress / ua.targetProgress >= 0.5
    )
    .slice(0, 5) as UserAchievement[];
}

function isActiveToday(lastActivityDate?: Date | null): boolean {
  if (!lastActivityDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(lastActivityDate);
  lastDate.setHours(0, 0, 0, 0);
  return today.getTime() === lastDate.getTime();
}

// ==========================================
// Preferences Operations
// ==========================================

export async function getGamificationPreferences(userId: string) {
  let preferences = await db.gamificationPreferences.findUnique({
    where: { userId },
  });

  if (!preferences) {
    preferences = await db.gamificationPreferences.create({
      data: {
        userId,
        achievementNotifications: true,
        levelUpNotifications: true,
        streakReminders: true,
        leaderboardUpdates: false,
        showOnLeaderboard: true,
        showAchievements: true,
        showLevel: true,
        showStreak: true,
        pinnedAchievements: [],
      },
    });
  }

  return preferences;
}

export async function updateGamificationPreferences(
  userId: string,
  updates: Partial<{
    achievementNotifications: boolean;
    levelUpNotifications: boolean;
    streakReminders: boolean;
    leaderboardUpdates: boolean;
    showOnLeaderboard: boolean;
    showAchievements: boolean;
    showLevel: boolean;
    showStreak: boolean;
    pinnedAchievements: string[];
  }>
) {
  return db.gamificationPreferences.upsert({
    where: { userId },
    update: updates,
    create: {
      userId,
      ...updates,
    },
  });
}
