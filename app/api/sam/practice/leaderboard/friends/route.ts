import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import { db } from '@/lib/db';
import type {
  LeaderboardTimeframe,
} from '@/lib/sam/stores/prisma-practice-leaderboard-store';

// Get practice stores from TaxomindContext singleton
const { practiceLeaderboard: leaderboardStore } = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const TimeframeEnum = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME']);

const GetLeaderboardQuerySchema = z.object({
  timeframe: TimeframeEnum.optional().default('WEEKLY'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================================================
// GET - Get friends practice leaderboard
// Note: Friends feature is not yet implemented. This returns only the current
// user's data as a placeholder until the friendship system is built.
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetLeaderboardQuerySchema.parse({
      timeframe: searchParams.get('timeframe') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    const periodStart = leaderboardStore.getCurrentPeriodStart(query.timeframe as LeaderboardTimeframe);

    // Note: Friendship model not yet implemented
    // For now, just return the current user's leaderboard entry
    const currentUserEntry = await db.practiceLeaderboard.findFirst({
      where: {
        scope: 'GLOBAL',
        timeframe: query.timeframe,
        periodStart,
        userId: session.user.id,
      },
    });

    // Create a placeholder response
    const entries = currentUserEntry
      ? [
          {
            ...currentUserEntry,
            friendRank: 1,
            isCurrentUser: true,
          },
        ]
      : [];

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: entries,
        currentUser: currentUserEntry
          ? { ...currentUserEntry, friendRank: 1, isCurrentUser: true }
          : null,
        podium: entries.slice(0, 3),
        friendsCount: 0,
        period: {
          timeframe: query.timeframe,
          start: periodStart,
          label: getPeriodLabel(query.timeframe, periodStart),
        },
        pagination: {
          total: entries.length,
          limit: query.limit,
          offset: query.offset,
          hasMore: false,
        },
        message: 'Friends feature coming soon. Add friends to compare your practice progress!',
      },
    });
  } catch (error) {
    logger.error('Error fetching friends leaderboard:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch friends leaderboard' },
      { status: 500 }
    );
  }
}

// Helper function
function getPeriodLabel(timeframe: string, periodStart: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  switch (timeframe) {
    case 'DAILY':
      return periodStart.toLocaleDateString('en-US', { ...options, year: 'numeric' });
    case 'WEEKLY': {
      const weekEnd = new Date(periodStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${periodStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;
    }
    case 'MONTHLY':
      return periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'ALL_TIME':
      return 'All Time';
    default:
      return 'This Period';
  }
}
