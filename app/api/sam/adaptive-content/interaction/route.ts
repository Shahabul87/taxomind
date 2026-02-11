/**
 * SAM Adaptive Content - Interaction Route
 * POST /api/sam/adaptive-content/interaction
 *
 * Record content interactions for style detection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createAdaptiveContentEngine } from '@sam-ai/educational';
import type { AdaptiveContentEngine, ContentFormat } from '@sam-ai/educational';
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

const InteractionSchema = z.object({
  contentId: z.string(),
  format: z.enum([
    'text', 'video', 'audio', 'diagram', 'infographic',
    'interactive', 'simulation', 'quiz', 'code_example', 'case_study'
  ]),
  timeSpent: z.number(),
  scrollDepth: z.number().min(0).max(100),
  replayCount: z.number().optional(),
  pauseCount: z.number().optional(),
  notesTaken: z.boolean().optional(),
  completed: z.boolean(),
  checkPerformance: z.number().min(0).max(100).optional(),
  userId: z.string().optional(),
  timestamp: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = InteractionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const userId = parsed.data.userId || session.user.id;
    const engine = await createEngine(userId);

    // Record the interaction
    await withRetryableTimeout(() => engine.recordInteraction({
      userId,
      contentId: parsed.data.contentId,
      format: parsed.data.format as ContentFormat,
      timeSpent: parsed.data.timeSpent,
      scrollDepth: parsed.data.scrollDepth,
      replayCount: parsed.data.replayCount,
      pauseCount: parsed.data.pauseCount,
      notesTaken: parsed.data.notesTaken,
      completed: parsed.data.completed,
      checkPerformance: parsed.data.checkPerformance,
      timestamp: parsed.data.timestamp ? new Date(parsed.data.timestamp) : new Date(),
    }), TIMEOUT_DEFAULTS.AI_ANALYSIS, 'adaptiveContent-recordInteraction');

    return NextResponse.json({
      success: true,
      message: 'Interaction recorded',
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[AdaptiveContent Interaction] Timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { success: false, error: { message: 'Operation timed out. Please try again.' } },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[AdaptiveContent Interaction] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to record interaction' } },
      { status: 500 }
    );
  }
}
