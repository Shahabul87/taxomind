import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import { withCronAuth } from '@/lib/api/cron-auth';

// Get practice goal store from TaxomindContext singleton
const { practiceGoal: practiceGoalStore } = getPracticeStores();

// ============================================================================
// POST - Reset all weekly goals (called by weekly cron job)
// This endpoint is protected by a cron secret
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Verify authorization (fail-closed)
    const authResponse = withCronAuth(req);
    if (authResponse) return authResponse;

    // Reset all weekly goals
    const resetCount = await practiceGoalStore.resetWeeklyGoals();

    logger.info(`Weekly goals reset: ${resetCount} goals reset to 0`);

    return NextResponse.json({
      success: true,
      data: {
        goalsReset: resetCount,
        resetAt: new Date().toISOString(),
      },
      message: `Successfully reset ${resetCount} weekly goal(s)`,
    });
  } catch (error) {
    logger.error('Error resetting weekly goals:', error);
    return NextResponse.json({ error: 'Failed to reset weekly goals' }, { status: 500 });
  }
}

// ============================================================================
// GET - Check next reset time and current weekly goals status
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Calculate next Sunday midnight (start of new week)
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7; // Days until next Sunday
    const nextReset = new Date(now);
    nextReset.setDate(now.getDate() + daysUntilSunday);
    nextReset.setHours(0, 0, 0, 0);

    // Calculate hours until reset
    const hoursUntilReset = Math.ceil(
      (nextReset.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    return NextResponse.json({
      success: true,
      data: {
        currentTime: now.toISOString(),
        nextResetAt: nextReset.toISOString(),
        hoursUntilReset,
        daysUntilReset: Math.ceil(hoursUntilReset / 24),
      },
    });
  } catch (error) {
    logger.error('Error getting weekly reset info:', error);
    return NextResponse.json({ error: 'Failed to get reset info' }, { status: 500 });
  }
}
