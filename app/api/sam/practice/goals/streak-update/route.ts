import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get practice goal store from TaxomindContext singleton
const { practiceGoal: practiceGoalStore } = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateStreakGoalsSchema = z.object({
  currentStreak: z.number().int().min(0),
});

// ============================================================================
// POST - Update all streak-based goals for a user
// Called by the daily streak cron job after calculating user streaks
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = UpdateStreakGoalsSchema.parse(body);

    // Update all streak goals using store method
    const results = await practiceGoalStore.updateStreakGoals(
      session.user.id,
      data.currentStreak
    );

    // Separate completed goals for logging/notification
    const completedGoals = results.filter((r) => r.wasCompleted);

    if (completedGoals.length > 0) {
      logger.info(
        `User ${session.user.id} completed ${completedGoals.length} streak goal(s): ` +
        completedGoals.map((g) => g.goal.title).join(', ')
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        currentStreak: data.currentStreak,
        goalsUpdated: results.length,
        goalsCompleted: completedGoals.length,
        updates: results.map((r) => ({
          goalId: r.goal.id,
          title: r.goal.title,
          previousValue: r.previousValue,
          newValue: r.newValue,
          targetValue: r.goal.targetValue,
          wasCompleted: r.wasCompleted,
          progressPercent: Math.min((r.newValue / r.goal.targetValue) * 100, 100),
        })),
        completedGoals: completedGoals.map((g) => ({
          id: g.goal.id,
          title: g.goal.title,
          targetValue: g.goal.targetValue,
          completedAt: g.goal.completedAt,
        })),
      },
      message: completedGoals.length > 0
        ? `Great streak! You completed ${completedGoals.length} streak goal(s)!`
        : results.length > 0
          ? `Streak goals updated to ${data.currentStreak} days`
          : 'No active streak goals to update',
    });
  } catch (error) {
    logger.error('Error updating streak goals:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update streak goals' }, { status: 500 });
  }
}
