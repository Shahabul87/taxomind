import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
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
// GET - Get global practice leaderboard
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

    // Get leaderboard entries
    const entries = await leaderboardStore.getLeaderboard({
      scope: 'GLOBAL',
      timeframe: query.timeframe as LeaderboardTimeframe,
      limit: query.limit,
      offset: query.offset,
    });

    // Get current user's rank
    const userRank = await leaderboardStore.getUserRank(session.user.id, {
      scope: 'GLOBAL',
      timeframe: query.timeframe as LeaderboardTimeframe,
    });

    // Get top 3 for podium display
    const topThree = await leaderboardStore.getTopUsers({
      scope: 'GLOBAL',
      timeframe: query.timeframe as LeaderboardTimeframe,
      limit: 3,
    });

    // Calculate period info
    const periodStart = leaderboardStore.getCurrentPeriodStart(query.timeframe as LeaderboardTimeframe);
    const periodEnd = getPeriodEnd(periodStart, query.timeframe);

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: entries,
        currentUser: userRank,
        podium: topThree,
        period: {
          timeframe: query.timeframe,
          start: periodStart,
          end: periodEnd,
          label: getPeriodLabel(query.timeframe, periodStart),
        },
        pagination: {
          limit: query.limit,
          offset: query.offset,
          hasMore: entries.length === query.limit,
        },
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

    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

// Helper functions
function getPeriodEnd(periodStart: Date, timeframe: string): Date {
  const end = new Date(periodStart);

  switch (timeframe) {
    case 'DAILY':
      end.setDate(end.getDate() + 1);
      break;
    case 'WEEKLY':
      end.setDate(end.getDate() + 7);
      break;
    case 'MONTHLY':
      end.setMonth(end.getMonth() + 1);
      break;
    case 'ALL_TIME':
      end.setFullYear(end.getFullYear() + 100);
      break;
  }

  return end;
}

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
