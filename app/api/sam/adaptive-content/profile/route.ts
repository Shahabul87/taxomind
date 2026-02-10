/**
 * SAM Adaptive Content - Profile Route
 * GET/POST /api/sam/adaptive-content/profile
 *
 * Get or create a learner profile for adaptive content.
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

const ProfileRequestSchema = z.object({
  userId: z.string().optional(),
  courseId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const engine = await createEngine(session.user.id);
    const profile = await engine.getLearnerProfile(session.user.id);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('[AdaptiveContent Profile] GET error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to get profile' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ProfileRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const userId = parsed.data.userId || session.user.id;
    const engine = await createEngine(userId);

    // Get or create profile
    const profile = await engine.getLearnerProfile(userId);

    // If no profile exists, detect style first to create one
    if (!profile) {
      const styleResult = await engine.detectLearningStyle(userId);
      const newProfile = await engine.getLearnerProfile(userId);

      return NextResponse.json({
        success: true,
        data: newProfile,
        styleDetection: styleResult,
        isNew: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: profile,
      isNew: false,
    });
  } catch (error) {
    logger.error('[AdaptiveContent Profile] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to get/create profile' } },
      { status: 500 }
    );
  }
}
