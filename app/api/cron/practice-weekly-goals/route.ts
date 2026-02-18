import { NextRequest, NextResponse } from 'next/server';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import { withCronAuth } from '@/lib/api/cron-auth';

// Get practice goal store for resetting weekly goals
const { practiceGoal: practiceGoalStore } = getPracticeStores();

// ============================================================================
// CRON: Weekly Practice Goal Reset
// Schedule: Every Sunday at midnight (start of week)
// Purpose: Reset WEEKLY_HOURS goals to allow fresh progress tracking
// ============================================================================

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verify authorization (fail-closed)
    const authResponse = withCronAuth(request);
    if (authResponse) return authResponse;

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
