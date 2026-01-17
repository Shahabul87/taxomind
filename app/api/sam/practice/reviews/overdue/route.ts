import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get spaced repetition store from TaxomindContext singleton
const { spacedRepetition: spacedRepetitionStore } = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetOverdueQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function enrichReview(review: {
  id: string;
  nextReviewDate: Date;
  retentionEstimate: number;
  priority: string;
  [key: string]: unknown;
}) {
  const now = new Date();
  const nextReview = new Date(review.nextReviewDate);
  const daysOverdue = Math.abs(
    Math.floor((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    ...review,
    daysOverdue,
    isOverdue: true,
    urgencyLevel: daysOverdue > 14 ? 'critical' : daysOverdue > 7 ? 'high' : 'medium',
  };
}

// ============================================================================
// GET - Get overdue reviews (past their review date)
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetOverdueQuerySchema.parse({
      limit: searchParams.get('limit') ?? undefined,
    });

    // Get overdue reviews
    const reviews = await spacedRepetitionStore.getOverdueReviews(session.user.id, query.limit);

    // Enrich reviews with computed fields
    const enrichedReviews = reviews.map(enrichReview);

    // Group by urgency level
    const byUrgency = {
      critical: enrichedReviews.filter((r) => r.urgencyLevel === 'critical').length,
      high: enrichedReviews.filter((r) => r.urgencyLevel === 'high').length,
      medium: enrichedReviews.filter((r) => r.urgencyLevel === 'medium').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        reviews: enrichedReviews,
        count: enrichedReviews.length,
        byUrgency,
        summary: {
          message:
            enrichedReviews.length > 0
              ? `You have ${enrichedReviews.length} overdue review${enrichedReviews.length > 1 ? 's' : ''} that need attention.`
              : 'Great job! You have no overdue reviews.',
          hasOverdue: enrichedReviews.length > 0,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching overdue reviews:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch overdue reviews' }, { status: 500 });
  }
}
