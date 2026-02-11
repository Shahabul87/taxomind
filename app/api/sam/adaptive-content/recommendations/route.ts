/**
 * SAM Adaptive Content - Recommendations Route
 * POST /api/sam/adaptive-content/recommendations
 *
 * Get content recommendations based on learning style.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createAdaptiveContentEngine } from '@sam-ai/educational';
import type { AdaptiveContentEngine, AdaptiveLearningStyle } from '@sam-ai/educational';
import { getAdaptiveContentAdapter } from '@/lib/adapters';
import { getSAMAdapter, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';

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

const RecommendationsSchema = z.object({
  userId: z.string().optional(),
  topic: z.string(),
  count: z.number().min(1).max(20).optional().default(5),
  style: z.enum(['visual', 'auditory', 'reading', 'kinesthetic', 'multimodal']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RecommendationsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const userId = parsed.data.userId || session.user.id;
    const engine = await createEngine(userId);

    // Get user profile
    const profile = await engine.getLearnerProfile(userId);

    if (!profile) {
      // Return empty recommendations if no profile
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No learner profile found. Complete some content to build your profile.',
      });
    }

    // Get recommendations
    const recommendations = await withRetryableTimeout(
      () => engine.getContentRecommendations(
        profile,
        parsed.data.topic,
        parsed.data.count
      ),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'adaptiveContent-getRecommendations'
    );

    // Also get style tips
    const style: AdaptiveLearningStyle = parsed.data.style || profile.primaryStyle;
    const tips = engine.getStyleTips(style);

    return NextResponse.json({
      success: true,
      data: recommendations,
      tips,
      profileStyle: profile.primaryStyle,
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[AdaptiveContent Recommendations] Timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { success: false, error: { message: 'Operation timed out. Please try again.' } },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[AdaptiveContent Recommendations] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to get recommendations' } },
      { status: 500 }
    );
  }
}
