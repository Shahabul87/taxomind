import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import type { ReviewScheduleEntry } from '@/lib/sam/stores';

// Get spaced repetition store from TaxomindContext singleton
const { spacedRepetition: spacedRepetitionStore } = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetReviewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  includeFuture: z.coerce.boolean().optional().default(true),
});

const ScheduleReviewSchema = z.object({
  conceptId: z.string().min(1),
  conceptName: z.string().optional(),
  skillId: z.string().optional(),
  skillName: z.string().optional(),
  score: z.number().min(0).max(100),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function enrichReview(review: ReviewScheduleEntry) {
  const now = new Date();
  const nextReview = new Date(review.nextReviewDate);
  const daysUntilReview = Math.ceil(
    (nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    ...review,
    daysUntilReview,
    urgencyLabel: review.isOverdue
      ? 'overdue'
      : daysUntilReview === 0
        ? 'due today'
        : daysUntilReview <= 3
          ? 'due soon'
          : 'upcoming',
  };
}

// ============================================================================
// GET - Get pending reviews (due now or in the future)
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetReviewsQuerySchema.parse({
      limit: searchParams.get('limit') ?? undefined,
      includeFuture: searchParams.get('includeFuture') ?? undefined,
    });

    // Get pending reviews using store
    const reviews = await spacedRepetitionStore.getPendingReviews(session.user.id, {
      limit: query.limit,
      includeFuture: query.includeFuture,
    });

    // Get statistics
    const stats = await spacedRepetitionStore.getStats(session.user.id);

    // Enrich reviews with computed fields
    const enrichedReviews = reviews.map(enrichReview);

    return NextResponse.json({
      success: true,
      data: {
        reviews: enrichedReviews,
        stats: {
          totalPending: stats.totalPending,
          overdueCount: stats.overdueCount,
          dueTodayCount: stats.dueTodayCount,
          dueThisWeekCount: stats.dueThisWeekCount,
          averageRetention: stats.averageRetention,
          topicsByPriority: stats.topicsByPriority,
        },
        pagination: {
          limit: query.limit,
          returned: enrichedReviews.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching pending reviews:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// ============================================================================
// POST - Schedule a new review (or update existing) based on performance
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = ScheduleReviewSchema.parse(body);

    // Schedule or update review using SM-2 algorithm
    const review = await spacedRepetitionStore.scheduleReview({
      userId: session.user.id,
      conceptId: data.conceptId,
      conceptName: data.conceptName,
      skillId: data.skillId,
      skillName: data.skillName,
      score: data.score,
    });

    logger.info(
      `Scheduled review for concept ${data.conceptId}: next review in ${review.interval} days`
    );

    return NextResponse.json({
      success: true,
      data: enrichReview(review),
    });
  } catch (error) {
    logger.error('Error scheduling review:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to schedule review' }, { status: 500 });
  }
}
