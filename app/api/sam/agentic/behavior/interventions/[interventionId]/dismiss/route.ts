/**
 * SAM Intervention Dismiss API
 * Allows users to dismiss an intervention
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getProactiveStores } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const DismissBodySchema = z.object({
  feedback: z.string().max(500).optional(),
}).optional();

// ============================================================================
// POST - Dismiss an intervention
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ interventionId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interventionId } = await params;

    if (!interventionId) {
      return NextResponse.json(
        { error: 'Intervention ID is required' },
        { status: 400 }
      );
    }

    // Parse optional body for feedback
    let feedback: string | undefined;
    try {
      const body = await req.json();
      const validated = DismissBodySchema.parse(body);
      feedback = validated?.feedback;
    } catch {
      // Body is optional, ignore parse errors
    }

    const { intervention: interventionStore } = getProactiveStores();

    // Verify the intervention exists
    const intervention = await interventionStore.get(interventionId);

    if (!intervention) {
      return NextResponse.json(
        { error: 'Intervention not found' },
        { status: 404 }
      );
    }

    // Record the dismissal result
    await interventionStore.recordResult(interventionId, {
      success: false,
      userResponse: 'dismissed',
      feedback,
    });

    logger.info(`Dismissed intervention ${interventionId} for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: {
        interventionId,
        dismissed: true,
        dismissedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error dismissing intervention:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to dismiss intervention' },
      { status: 500 }
    );
  }
}
