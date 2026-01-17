import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get spaced repetition store from TaxomindContext singleton
const { spacedRepetition: spacedRepetitionStore } = getPracticeStores();

// ============================================================================
// POST - Skip a review (reschedule for tomorrow)
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

    // Skip the review and reschedule for tomorrow
    const updatedReview = await spacedRepetitionStore.skipReview(id);

    logger.info(`Skipped review ${id}, rescheduled for tomorrow`);

    return NextResponse.json({
      success: true,
      data: {
        review: {
          id: updatedReview.id,
          conceptId: updatedReview.conceptId,
          nextReviewDate: updatedReview.nextReviewDate,
          retentionEstimate: updatedReview.retentionEstimate,
        },
        message: 'Review skipped and rescheduled for tomorrow.',
        warning:
          'Skipping reviews frequently may affect your retention. Try to complete reviews when possible.',
      },
    });
  } catch (error) {
    logger.error('Error skipping review:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to skip review' }, { status: 500 });
  }
}
