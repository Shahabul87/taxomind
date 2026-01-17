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

const CompleteReviewSchema = z.object({
  score: z.number().min(0).max(100),
});

// ============================================================================
// POST - Complete a review and schedule the next one
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate the review exists and belongs to the user
    const existingReview = await spacedRepetitionStore.getById(id);

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (existingReview.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const data = CompleteReviewSchema.parse(body);

    // Complete the review and get the updated schedule
    const result = await spacedRepetitionStore.completeReview(id, {
      score: data.score,
    });

    // Calculate improvement metrics
    const intervalChange = result.next.interval - result.current.interval;
    const easeFactorChange = result.next.easeFactor - result.current.easeFactor;

    logger.info(
      `Completed review ${id}: score ${data.score}%, next review in ${result.next.interval} days`
    );

    return NextResponse.json({
      success: true,
      data: {
        completed: {
          id: result.current.id,
          conceptId: result.current.conceptId,
          score: data.score,
          previousInterval: result.current.interval,
          previousEaseFactor: result.current.easeFactor,
        },
        next: {
          id: result.next.id,
          nextReviewDate: result.next.nextReviewDate,
          interval: result.next.interval,
          easeFactor: result.next.easeFactor,
          repetitions: result.next.repetitions,
          retentionEstimate: result.next.retentionEstimate,
          priority: result.next.priority,
        },
        improvement: {
          intervalChange,
          intervalChangeLabel: getIntervalChangeLabel(intervalChange),
          easeFactorChange: Math.round(easeFactorChange * 100) / 100,
          isImproving: intervalChange > 0 && easeFactorChange >= 0,
        },
        feedback: getPerformanceFeedback(data.score, result.next.interval),
      },
    });
  } catch (error) {
    logger.error('Error completing review:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to complete review' }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getIntervalChangeLabel(change: number): string {
  if (change > 14) return 'Great progress! Next review much later.';
  if (change > 7) return 'Good progress! Interval extended.';
  if (change > 0) return 'Progress! Interval slightly extended.';
  if (change === 0) return 'Interval unchanged.';
  if (change > -7) return 'Needs practice. Interval shortened.';
  return 'Needs more practice. Interval significantly shortened.';
}

function getPerformanceFeedback(score: number, nextInterval: number): string {
  if (score >= 90) {
    return `Excellent! You scored ${score}%. Your next review is in ${nextInterval} days.`;
  }
  if (score >= 70) {
    return `Good job! You scored ${score}%. Keep practicing to extend intervals further.`;
  }
  if (score >= 50) {
    return `Decent effort with ${score}%. Review more frequently to strengthen retention.`;
  }
  return `You scored ${score}%. Consider reviewing this topic more often to improve retention.`;
}
