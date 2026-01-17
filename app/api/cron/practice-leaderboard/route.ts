import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

// ============================================================================
// CRON: Practice Leaderboard Recalculation
// Schedule: Hourly
// Purpose: Recalculate practice leaderboard rankings for all timeframes
// ============================================================================

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

type LeaderboardTimeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting practice leaderboard recalculation...');

    const timeframes: LeaderboardTimeframe[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'];
    const results: Record<string, number> = {};

    for (const timeframe of timeframes) {
      const count = await recalculateLeaderboard(timeframe);
      results[timeframe] = count;
      console.log(`[CRON] Processed ${count} entries for ${timeframe} leaderboard`);
    }

    console.log('[CRON] Practice leaderboard recalculation complete');

    return NextResponse.json({
      success: true,
      data: {
        message: 'Leaderboard recalculation complete',
        processedEntries: results,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[CRON] Error recalculating leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to recalculate leaderboard' },
      { status: 500 }
    );
  }
}

// Recalculate leaderboard for a specific timeframe
async function recalculateLeaderboard(timeframe: LeaderboardTimeframe): Promise<number> {
  // Get period start date
  const periodStart = getPeriodStart(timeframe);

  // Aggregate practice data for the period
  const practiceData = await db.practiceSession.groupBy({
    by: ['userId'],
    where: {
      status: 'COMPLETED',
      startedAt: periodStart ? { gte: periodStart } : undefined,
    },
    _sum: {
      rawHours: true,
      qualityHours: true,
    },
    _count: {
      id: true,
    },
    _avg: {
      qualityMultiplier: true,
    },
  });

  // Get existing entries for this timeframe and period
  const existingEntries = await db.practiceLeaderboard.findMany({
    where: {
      timeframe,
      periodStart: periodStart ?? new Date(0),
    },
    select: { id: true, userId: true },
  });

  const existingUserIds = new Set(existingEntries.map((e) => e.userId));

  // Also get streak data for each user
  const userStreaks = await db.skillMastery10K.groupBy({
    by: ['userId'],
    _max: {
      currentStreak: true,
    },
  });

  const streakMap = new Map(
    userStreaks.map((s) => [s.userId, s._max.currentStreak ?? 0])
  );

  // Sort by quality hours to get ranks
  const sortedData = practiceData
    .map((d) => ({
      userId: d.userId,
      totalHours: d._sum.rawHours ?? 0,
      qualityHours: d._sum.qualityHours ?? 0,
      sessionsCount: d._count.id,
      avgQualityMultiplier: d._avg.qualityMultiplier ?? 1,
      streakDays: streakMap.get(d.userId) ?? 0,
    }))
    .sort((a, b) => b.qualityHours - a.qualityHours);

  // Batch upsert leaderboard entries
  let processedCount = 0;

  for (let i = 0; i < sortedData.length; i++) {
    const entry = sortedData[i];
    const rank = i + 1;

    // Find existing entry
    const existingEntry = existingEntries.find((e) => e.userId === entry.userId);

    if (existingEntry) {
      // Update existing entry
      await db.practiceLeaderboard.update({
        where: { id: existingEntry.id },
        data: {
          rank,
          previousRank: rank, // Will be updated properly on next run
          totalHours: entry.totalHours,
          qualityHours: entry.qualityHours,
          sessionsCount: entry.sessionsCount,
          avgQualityMultiplier: entry.avgQualityMultiplier,
          streakDays: entry.streakDays,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new entry
      await db.practiceLeaderboard.create({
        data: {
          userId: entry.userId,
          timeframe,
          periodStart: periodStart ?? new Date(0),
          rank,
          previousRank: rank,
          totalHours: entry.totalHours,
          qualityHours: entry.qualityHours,
          sessionsCount: entry.sessionsCount,
          avgQualityMultiplier: entry.avgQualityMultiplier,
          streakDays: entry.streakDays,
        },
      });
    }

    processedCount++;
  }

  // Remove entries for users who are no longer in the leaderboard
  const currentUserIds = new Set(sortedData.map((d) => d.userId));
  const removedUserIds = [...existingUserIds].filter((id) => !currentUserIds.has(id));

  if (removedUserIds.length > 0) {
    await db.practiceLeaderboard.deleteMany({
      where: {
        timeframe,
        periodStart: periodStart ?? new Date(0),
        userId: { in: removedUserIds },
      },
    });
  }

  return processedCount;
}

// Get period start date based on timeframe
function getPeriodStart(timeframe: LeaderboardTimeframe): Date | null {
  const now = new Date();

  switch (timeframe) {
    case 'DAILY': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case 'WEEKLY': {
      const start = new Date(now);
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case 'MONTHLY': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return start;
    }
    case 'ALL_TIME':
      return null;
    default:
      return null;
  }
}
