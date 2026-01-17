import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get practice goal store from TaxomindContext singleton
const { practiceGoal: practiceGoalStore } = getPracticeStores();

// ============================================================================
// GET - Get comprehensive goal statistics
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get comprehensive stats from store
    const stats = await practiceGoalStore.getGoalStats(session.user.id);

    // Calculate additional metrics
    const totalTargetValue = stats.recentlyCompleted.reduce(
      (sum, goal) => sum + goal.targetValue,
      0
    );
    const avgTargetValue = stats.completedGoals > 0
      ? totalTargetValue / stats.completedGoals
      : 0;

    // Get all active goals to calculate urgency metrics
    const activeGoals = await practiceGoalStore.getActiveGoals(session.user.id);

    const overdueGoals = activeGoals.filter(
      (g) => g.deadline && new Date(g.deadline) < new Date()
    );

    const upcomingDeadlines = activeGoals
      .filter((g) => g.deadline)
      .sort((a, b) => {
        if (!a.deadline || !b.deadline) return 0;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })
      .slice(0, 5)
      .map((g) => ({
        id: g.id,
        title: g.title,
        deadline: g.deadline,
        progressPercentage: Math.min(100, (g.currentValue / g.targetValue) * 100),
        daysRemaining: g.deadline
          ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
      }));

    // Calculate completion velocity (goals completed per week over last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCompletions = stats.recentlyCompleted.filter(
      (g) => g.completedAt && new Date(g.completedAt) >= thirtyDaysAgo
    );
    const completionVelocity = (recentCompletions.length / 30) * 7; // Per week

    // Progress distribution
    const progressDistribution = {
      notStarted: activeGoals.filter((g) => g.currentValue === 0).length,
      inProgress: activeGoals.filter(
        (g) => g.currentValue > 0 && g.currentValue < g.targetValue * 0.5
      ).length,
      halfwayThere: activeGoals.filter(
        (g) => g.currentValue >= g.targetValue * 0.5 && g.currentValue < g.targetValue * 0.9
      ).length,
      almostDone: activeGoals.filter(
        (g) => g.currentValue >= g.targetValue * 0.9 && !g.isCompleted
      ).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        // Basic stats
        totalGoals: stats.totalGoals,
        activeGoals: stats.activeGoals,
        completedGoals: stats.completedGoals,
        completionRate: Math.round(stats.completionRate * 100) / 100,

        // By type distribution
        byType: stats.byType,

        // Urgency metrics
        overdueCount: overdueGoals.length,
        upcomingDeadlines,

        // Velocity metrics
        completionVelocity: Math.round(completionVelocity * 100) / 100,
        recentlyCompletedCount: stats.recentlyCompleted.length,
        avgTargetValue: Math.round(avgTargetValue * 100) / 100,

        // Progress distribution
        progressDistribution,

        // Recently completed goals (for celebration/motivation)
        recentlyCompleted: stats.recentlyCompleted.map((g) => ({
          id: g.id,
          title: g.title,
          goalType: g.goalType,
          targetValue: g.targetValue,
          completedAt: g.completedAt,
          skillName: g.skillName,
        })),
      },
    });
  } catch (error) {
    logger.error('Error fetching practice goal stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
