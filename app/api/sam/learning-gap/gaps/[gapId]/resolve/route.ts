import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAnalyticsStores } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ResolveGapBodySchema = z.object({
  resolution: z.string().min(1).max(500).optional(),
  masteryAchieved: z.number().min(0).max(100).optional(),
});

// ============================================================================
// POST - Mark gap as resolved
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gapId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gapId } = await params;

    if (!gapId) {
      return NextResponse.json({ error: 'Gap ID is required' }, { status: 400 });
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const data = ResolveGapBodySchema.parse(body);

    const { learningGap: gapStore } = getAnalyticsStores();

    // Get the gap first to verify ownership
    const gap = await gapStore.getGapById(gapId);

    if (!gap) {
      return NextResponse.json({ error: 'Gap not found' }, { status: 404 });
    }

    if (gap.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (gap.status === 'resolved') {
      return NextResponse.json(
        { error: 'Gap is already resolved' },
        { status: 400 }
      );
    }

    // Mark as resolved
    const updatedGap = await gapStore.updateGap(gapId, {
      status: 'resolved',
      resolvedAt: new Date(),
      resolution: data.resolution,
      currentMastery: data.masteryAchieved ?? gap.currentMastery,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedGap.id,
        status: updatedGap.status,
        resolvedAt: updatedGap.resolvedAt?.toISOString(),
        message: 'Gap marked as resolved successfully',
      },
    });
  } catch (error) {
    logger.error('Error resolving learning gap:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to resolve gap' },
      { status: 500 }
    );
  }
}
