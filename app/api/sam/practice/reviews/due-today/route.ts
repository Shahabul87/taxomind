import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get spaced repetition store from TaxomindContext singleton
const { spacedRepetition: spacedRepetitionStore } = getPracticeStores();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function enrichReview(review: {
  id: string;
  nextReviewDate: Date;
  retentionEstimate: number;
  isOverdue: boolean;
  priority: string;
  [key: string]: unknown;
}) {
  return {
    ...review,
    urgencyLabel: review.isOverdue ? 'overdue' : 'due today',
    priorityOrder: getPriorityOrder(review.priority, review.isOverdue),
  };
}

function getPriorityOrder(priority: string, isOverdue: boolean): number {
  if (isOverdue) return 0;
  switch (priority) {
    case 'urgent':
      return 1;
    case 'high':
      return 2;
    case 'medium':
      return 3;
    case 'low':
      return 4;
    default:
      return 5;
  }
}

// ============================================================================
// GET - Get reviews due today (including overdue)
// ============================================================================

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get reviews due today (includes overdue)
    const reviews = await spacedRepetitionStore.getDueToday(session.user.id);

    // Enrich and sort reviews by priority
    const enrichedReviews = reviews.map(enrichReview).sort((a, b) => a.priorityOrder - b.priorityOrder);

    // Separate overdue from due today
    const overdue = enrichedReviews.filter((r) => r.isOverdue);
    const dueToday = enrichedReviews.filter((r) => !r.isOverdue);

    return NextResponse.json({
      success: true,
      data: {
        reviews: enrichedReviews,
        breakdown: {
          overdue: {
            count: overdue.length,
            reviews: overdue,
          },
          dueToday: {
            count: dueToday.length,
            reviews: dueToday,
          },
        },
        totalCount: enrichedReviews.length,
        summary: {
          message: getSummaryMessage(overdue.length, dueToday.length),
          estimatedTime: Math.ceil(enrichedReviews.length * 2), // ~2 minutes per review
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching reviews due today:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews due today' }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getSummaryMessage(overdueCount: number, dueTodayCount: number): string {
  const total = overdueCount + dueTodayCount;

  if (total === 0) {
    return 'You have no reviews due today. Great job staying on top of your studies!';
  }

  const parts: string[] = [];

  if (overdueCount > 0) {
    parts.push(`${overdueCount} overdue review${overdueCount > 1 ? 's' : ''}`);
  }

  if (dueTodayCount > 0) {
    parts.push(`${dueTodayCount} review${dueTodayCount > 1 ? 's' : ''} due today`);
  }

  return `You have ${parts.join(' and ')} to complete.`;
}
