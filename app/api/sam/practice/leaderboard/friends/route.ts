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

    // Get user's friends (both directions of friendship)
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { userId: session.user.id, status: 'ACCEPTED' },
          { friendId: session.user.id, status: 'ACCEPTED' },
        ],
      },
      select: {
        userId: true,
        friendId: true,
      },
    });

    // Extract friend IDs
    const friendIds = new Set<string>();
    friendships.forEach((f) => {
      if (f.userId === session.user.id) {
        friendIds.add(f.friendId);
      } else {
        friendIds.add(f.userId);
      }
    });

    // Include current user in the leaderboard
    friendIds.add(session.user.id);

    const periodStart = leaderboardStore.getCurrentPeriodStart(query.timeframe as LeaderboardTimeframe);

    // Get leaderboard entries for friends from the global scope
    // (we filter by friend IDs manually since FRIENDS scope would need a scopeId)
    const allEntries = await db.practiceLeaderboard.findMany({
      where: {
        scope: 'GLOBAL',
        timeframe: query.timeframe,
        periodStart,
        userId: { in: Array.from(friendIds) },
      },
      orderBy: [
        { qualityHours: 'desc' },
        { sessionsCount: 'desc' },
      ],
    });

    // Enrich with rank among friends
    const rankedEntries = allEntries.map((entry, index) => ({
      ...entry,
      friendRank: index + 1,
      isCurrentUser: entry.userId === session.user.id,
    }));

    // Apply pagination
    const paginatedEntries = rankedEntries.slice(
      query.offset,
      query.offset + query.limit
    );

    // Get current user's entry
    const currentUserEntry = rankedEntries.find((e) => e.userId === session.user.id);

    // Get top 3 friends for podium
    const podium = rankedEntries.slice(0, 3);

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: paginatedEntries,
        currentUser: currentUserEntry ?? null,
        podium,
        friendsCount: friendIds.size - 1, // Exclude current user
        period: {
          timeframe: query.timeframe,
          start: periodStart,
          label: getPeriodLabel(query.timeframe, periodStart),
        },
        pagination: {
          total: rankedEntries.length,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < rankedEntries.length,
        },
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
