/**
 * SAM Gamification Leaderboard API
 * Returns ranked users based on XP for the LeaderboardWidget component
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import type { LeaderboardPeriod } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetLeaderboardQuerySchema = z.object({
  scope: z.enum(['global', 'course']).default('global'),
  period: z.enum(['weekly', 'monthly', 'all-time']).default('weekly'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  courseId: z.string().optional(),
  includeCurrentUser: z.coerce.boolean().default(false),
});

// ============================================================================
// TYPE MAPPINGS
// ============================================================================

/**
 * Maps frontend period strings to Prisma LeaderboardPeriod enum
 */
const PERIOD_MAP: Record<string, LeaderboardPeriod> = {
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  'all-time': 'ALL_TIME',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the start date for the current period
 */
function getPeriodStart(period: LeaderboardPeriod): Date {
  const now = new Date();

  switch (period) {
    case 'WEEKLY': {
      // Start of current week (Sunday)
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek;
    }
    case 'MONTHLY': {
      // Start of current month
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    case 'ALL_TIME':
    default:
      // Very old date for all-time
      return new Date(2020, 0, 1);
  }
}

/**
 * Get user initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// RESPONSE INTERFACE
// ============================================================================

interface LeaderboardEntry {
  id: string;
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  streak: number;
  badgeCount: number;
  isCurrentUser: boolean;
}

// ============================================================================
// GET - Get leaderboard entries
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetLeaderboardQuerySchema.parse({
      scope: searchParams.get('scope') ?? 'global',
      period: searchParams.get('period') ?? 'weekly',
      limit: searchParams.get('limit') ?? 10,
      courseId: searchParams.get('courseId') ?? undefined,
      includeCurrentUser: searchParams.get('includeCurrentUser') ?? false,
    });

    const prismaPeriod = PERIOD_MAP[query.period];
    const periodStart = getPeriodStart(prismaPeriod);

    // First, try to get entries from the leaderboard table
    let leaderboardEntries = await db.gamificationLeaderboardEntry.findMany({
      where: {
        period: prismaPeriod,
        periodStart: {
          gte: periodStart,
        },
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
      orderBy: {
        xpEarned: 'desc',
      },
      take: query.limit,
    });

    // If no entries in leaderboard table, fall back to GamificationUserXP
    if (leaderboardEntries.length === 0) {
      // Get user XP data directly
      const userXPData = await db.gamificationUserXP.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          totalXP: 'desc',
        },
        take: query.limit,
      });

      // Also get badge counts for each user
      const userIds = userXPData.map((u) => u.userId);
      const badgeCounts = await db.userBadge.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
        },
        _count: {
          id: true,
        },
      });

      const badgeCountMap = new Map(badgeCounts.map((bc) => [bc.userId, bc._count.id]));

      // Transform to LeaderboardEntry format
      const entries: LeaderboardEntry[] = userXPData.map((userData, index) => ({
        id: userData.id,
        rank: index + 1,
        userId: userData.userId,
        name: userData.user.name || `User ${getInitials(userData.userId)}`,
        avatar: userData.user.image || undefined,
        xp: userData.totalXP,
        streak: userData.currentStreak,
        badgeCount: badgeCountMap.get(userData.userId) || 0,
        isCurrentUser: userData.userId === session.user.id,
      }));

      // Get current user entry if requested and not in list
      let currentUserEntry: LeaderboardEntry | null = null;
      if (query.includeCurrentUser) {
        const currentUserInList = entries.find((e) => e.isCurrentUser);
        if (!currentUserInList) {
          const currentUserXP = await db.gamificationUserXP.findUnique({
            where: { userId: session.user.id },
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

          if (currentUserXP) {
            // Calculate approximate rank
            const higherRankedCount = await db.gamificationUserXP.count({
              where: {
                totalXP: { gt: currentUserXP.totalXP },
              },
            });

            const currentUserBadgeCount = await db.userBadge.count({
              where: { userId: session.user.id },
            });

            currentUserEntry = {
              id: currentUserXP.id,
              rank: higherRankedCount + 1,
              userId: session.user.id,
              name: currentUserXP.user.name || 'You',
              avatar: currentUserXP.user.image || undefined,
              xp: currentUserXP.totalXP,
              streak: currentUserXP.currentStreak,
              badgeCount: currentUserBadgeCount,
              isCurrentUser: true,
            };
          }
        }
      }

      logger.info(
        `Fetched ${entries.length} leaderboard entries from UserXP for user ${session.user.id}`
      );

      return NextResponse.json({
        success: true,
        data: {
          entries,
          currentUserEntry,
          period: query.period,
          scope: query.scope,
        },
      });
    }

    // Transform leaderboard entries to response format
    // Get badge counts for all users
    const userIds = leaderboardEntries.map((e) => e.userId);
    const badgeCounts = await db.userBadge.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
      },
      _count: {
        id: true,
      },
    });
    const badgeCountMap = new Map(badgeCounts.map((bc) => [bc.userId, bc._count.id]));

    // Get streak info from GamificationUserXP
    const userXPInfo = await db.gamificationUserXP.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        userId: true,
        currentStreak: true,
      },
    });
    const streakMap = new Map(userXPInfo.map((u) => [u.userId, u.currentStreak]));

    const entries: LeaderboardEntry[] = leaderboardEntries.map((entry, index) => ({
      id: entry.id,
      rank: entry.rank ?? index + 1,
      userId: entry.userId,
      name: entry.user.name || `User ${getInitials(entry.userId)}`,
      avatar: entry.user.image || undefined,
      xp: entry.xpEarned,
      streak: streakMap.get(entry.userId) || 0,
      badgeCount: badgeCountMap.get(entry.userId) || 0,
      isCurrentUser: entry.userId === session.user.id,
    }));

    // Get current user entry if requested and not in list
    let currentUserEntry: LeaderboardEntry | null = null;
    if (query.includeCurrentUser) {
      const currentUserInList = entries.find((e) => e.isCurrentUser);
      if (!currentUserInList) {
        const currentUserLeaderboard = await db.gamificationLeaderboardEntry.findFirst({
          where: {
            userId: session.user.id,
            period: prismaPeriod,
            periodStart: { gte: periodStart },
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

        if (currentUserLeaderboard) {
          const currentUserXP = await db.gamificationUserXP.findUnique({
            where: { userId: session.user.id },
            select: { currentStreak: true },
          });

          const currentUserBadgeCount = await db.userBadge.count({
            where: { userId: session.user.id },
          });

          currentUserEntry = {
            id: currentUserLeaderboard.id,
            rank: currentUserLeaderboard.rank ?? 999,
            userId: session.user.id,
            name: currentUserLeaderboard.user.name || 'You',
            avatar: currentUserLeaderboard.user.image || undefined,
            xp: currentUserLeaderboard.xpEarned,
            streak: currentUserXP?.currentStreak || 0,
            badgeCount: currentUserBadgeCount,
            isCurrentUser: true,
          };
        }
      }
    }

    logger.info(`Fetched ${entries.length} leaderboard entries for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: {
        entries,
        currentUserEntry,
        period: query.period,
        scope: query.scope,
      },
    });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
