/**
 * SAM Mode Feedback Endpoint
 *
 * Dedicated endpoint for mode effectiveness feedback.
 * Records mode satisfaction data for analytics and mode improvement.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const ModeFeedbackSchema = z.object({
  modeId: z.string().min(1, 'Mode ID is required'),
  rating: z.enum(['EFFECTIVE', 'SOMEWHAT', 'NOT_EFFECTIVE', 'WRONG_MODE']),
  suggestion: z.string().optional(),
  comment: z.string().max(200).optional(),
  sessionId: z.string().optional(),
  messageCount: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validation = ModeFeedbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid feedback data',
            details: { errors: validation.error.errors },
          },
        },
        { status: 400 },
      );
    }

    const { modeId, rating, suggestion, comment, sessionId } = validation.data;

    // Store as a SAMFeedback record with mode-specific fields
    const feedback = await db.sAMFeedback.create({
      data: {
        userId: session.user.id,
        messageId: `mode-feedback-${requestId}`,
        sessionId: sessionId ?? `mode-${requestId}`,
        rating: rating === 'EFFECTIVE' || rating === 'SOMEWHAT' ? 'HELPFUL' : 'NOT_HELPFUL',
        comment: comment ?? null,
        modeId,
        modeFeedback: rating,
        modeSuggestion: suggestion ?? null,
      },
    });

    logger.info('[SAM_MODE_FEEDBACK] Recorded:', {
      feedbackId: feedback.id,
      userId: session.user.id,
      modeId,
      rating,
      suggestion,
    });

    return NextResponse.json(
      {
        success: true,
        data: { id: feedback.id, modeId, rating },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[SAM_MODE_FEEDBACK] Error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to record mode feedback' },
      },
      { status: 500 },
    );
  }
}
