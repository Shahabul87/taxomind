/**
 * SAM Preset Feedback Endpoint
 *
 * Accepts thumbs up/down feedback for engine presets
 * to improve future engine selection via effectiveness tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUserOrAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { recordPresetFeedback } from '@/lib/sam/pipeline/preset-tracker';

export const runtime = 'nodejs';

const FeedbackSchema = z.object({
  preset: z.string().min(1),
  thumbsUp: z.boolean(),
  modeId: z.string().optional(),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUserOrAdmin();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validation = FeedbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 },
      );
    }

    const { preset, thumbsUp, modeId } = validation.data;

    recordPresetFeedback(preset, thumbsUp);

    logger.info('[SAM_FEEDBACK] Preset feedback recorded:', {
      userId: user.id,
      preset,
      thumbsUp,
      modeId,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[SAM_FEEDBACK] Error:', errorMessage);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
