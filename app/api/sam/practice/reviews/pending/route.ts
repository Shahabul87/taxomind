import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import type { ReviewScheduleEntry } from '@/lib/sam/stores/prisma-spaced-repetition-store';

// Get spaced repetition store from TaxomindContext singleton
const { spacedRepetition: spacedRepetitionStore } = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetPendingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
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
// GET - Get pending reviews (includes overdue and due today)
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetPendingQuerySchema.parse({
      limit: searchParams.get('limit') ?? undefined,
    });

    // Get reviews that are due now (not including future)
    const reviews = await spacedRepetitionStore.getPendingReviews(session.user.id, {
      limit: query.limit,
      includeFuture: false,
    });

    // Enrich reviews with computed fields
    const enrichedReviews = reviews.map(enrichReview);

    return NextResponse.json({
      success: true,
      data: {
        reviews: enrichedReviews,
        count: enrichedReviews.length,
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

    return NextResponse.json({ error: 'Failed to fetch pending reviews' }, { status: 500 });
  }
}
