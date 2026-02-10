/**
 * SAM Adaptive Content - Detect Style Route
 * POST /api/sam/adaptive-content/detect-style
 *
 * Detect learning style from user interactions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createAdaptiveContentEngine } from '@sam-ai/educational';
import type { AdaptiveContentEngine } from '@sam-ai/educational';
import { getAdaptiveContentAdapter } from '@/lib/adapters';
import { getSAMAdapter } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';

/**
 * Create a user-scoped AdaptiveContentEngine instance.
 */
async function createEngine(userId: string): Promise<AdaptiveContentEngine> {
  const aiAdapter = await getSAMAdapter({ userId, capability: 'analysis' });

  return createAdaptiveContentEngine({
    database: getAdaptiveContentAdapter(),
    aiAdapter,
    enableCaching: true,
    minInteractionsForAdaptation: 5,
  });
}

const DetectStyleSchema = z.object({
  userId: z.string().optional(),
  courseId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = DetectStyleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const userId = parsed.data.userId || session.user.id;
    const engine = await createEngine(userId);

    // Detect learning style from interactions
    const styleResult = await engine.detectLearningStyle(userId);

    // Update profile if it exists, or let the engine create one
    const profile = await engine.updateProfileFromInteractions(userId);

    return NextResponse.json({
      success: true,
      data: styleResult,
      profile,
    });
  } catch (error) {
    logger.error('[AdaptiveContent DetectStyle] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to detect learning style' } },
      { status: 500 }
    );
  }
}
