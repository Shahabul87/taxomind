import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get spaced repetition store from TaxomindContext singleton
const { spacedRepetition: spacedRepetitionStore } = getPracticeStores();

// ============================================================================
// GET - Get review statistics for the current user
// ============================================================================

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get comprehensive statistics
    const stats = await spacedRepetitionStore.getStats(session.user.id);

    // Calculate additional insights
    const totalDueNow = stats.overdueCount + stats.dueTodayCount;
    const retentionHealth =
      stats.averageRetention >= 80
        ? 'excellent'
        : stats.averageRetention >= 60
          ? 'good'
          : stats.averageRetention >= 40
            ? 'fair'
            : 'needs improvement';

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalPending: stats.totalPending,
          overdueCount: stats.overdueCount,
          dueTodayCount: stats.dueTodayCount,
          dueThisWeekCount: stats.dueThisWeekCount,
          totalDueNow,
          averageEaseFactor: stats.averageEaseFactor,
          averageRetention: stats.averageRetention,
          topicsByPriority: stats.topicsByPriority,
          completedToday: stats.completedToday,
          streakDays: stats.streakDays,
        },
        insights: {
          retentionHealth,
          retentionHealthMessage: getRetentionMessage(retentionHealth),
          recommendedAction: getRecommendedAction(stats),
          prioritySummary: {
            urgent: stats.topicsByPriority.urgent,
            high: stats.topicsByPriority.high,
            medium: stats.topicsByPriority.medium,
            low: stats.topicsByPriority.low,
          },
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching review stats:', error);
    return NextResponse.json({ error: 'Failed to fetch review stats' }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRetentionMessage(health: string): string {
  switch (health) {
    case 'excellent':
      return 'Your memory retention is excellent! Keep up the great work.';
    case 'good':
      return 'Your retention is good. Regular reviews will help maintain it.';
    case 'fair':
      return 'Your retention could be better. Try reviewing more frequently.';
    case 'needs improvement':
      return 'Your retention needs attention. Consider shorter review intervals.';
    default:
      return 'Keep reviewing to improve your retention.';
  }
}

function getRecommendedAction(stats: {
  overdueCount: number;
  dueTodayCount: number;
  topicsByPriority: { urgent: number; high: number };
}): string {
  if (stats.topicsByPriority.urgent > 0) {
    return `Review ${stats.topicsByPriority.urgent} urgent topic${stats.topicsByPriority.urgent > 1 ? 's' : ''} to prevent further memory decay.`;
  }

  if (stats.overdueCount > 0) {
    return `Complete ${stats.overdueCount} overdue review${stats.overdueCount > 1 ? 's' : ''} to catch up.`;
  }

  if (stats.dueTodayCount > 0) {
    return `Complete ${stats.dueTodayCount} review${stats.dueTodayCount > 1 ? 's' : ''} due today to maintain your streak.`;
  }

  if (stats.topicsByPriority.high > 0) {
    return `Consider reviewing ${stats.topicsByPriority.high} high-priority topic${stats.topicsByPriority.high > 1 ? 's' : ''} for better retention.`;
  }

  return 'Great job! You are all caught up on your reviews.';
}
