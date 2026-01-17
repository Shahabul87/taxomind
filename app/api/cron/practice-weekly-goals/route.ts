import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get practice goal store for resetting weekly goals
const { practiceGoal: practiceGoalStore } = getPracticeStores();

// ============================================================================
// CRON: Weekly Practice Goal Reset
// Schedule: Every Sunday at midnight (start of week)
// Purpose: Reset WEEKLY_HOURS goals to allow fresh progress tracking
// ============================================================================

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

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

    console.log('[CRON] Starting weekly practice goal reset...');

    // Reset all weekly goals (sets currentValue back to 0)
    const resetCount = await practiceGoalStore.resetWeeklyGoals();

    console.log(`[CRON] Reset ${resetCount} weekly goals`);
    console.log('[CRON] Weekly practice goal reset complete');

    return NextResponse.json({
      success: true,
      data: {
        message: 'Weekly goals reset complete',
        stats: {
          goalsReset: resetCount,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[CRON] Error resetting weekly goals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset weekly goals' },
      { status: 500 }
    );
  }
}
