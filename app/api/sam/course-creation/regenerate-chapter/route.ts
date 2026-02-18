/**
 * Chapter Regeneration API
 *
 * Regenerates a single chapter and all its sections using the same
 * quality gates and prompt pipeline as the original course creation.
 *
 * POST /api/sam/course-creation/regenerate-chapter
 * Body: { courseId, chapterId, chapterPosition }
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { regenerateChapter } from '@/lib/sam/course-creation/orchestrator';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes max for single chapter regeneration

// =============================================================================
// VALIDATION
// =============================================================================

const RegenerateRequestSchema = z.object({
  courseId: z.string().min(1),
  chapterId: z.string().min(1),
  chapterPosition: z.number().int().min(1),
});

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    // 1. Auth
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Subscription gate: regeneration requires STARTER+
    const gateResult = await withSubscriptionGate(user.id, { category: 'generation' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    // 3. Validate body
    const body = await request.json();
    const parseResult = RegenerateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { courseId, chapterId, chapterPosition } = parseResult.data;

    logger.info('[REGENERATE_CHAPTER] Starting regeneration', {
      userId: user.id,
      courseId,
      chapterId,
      chapterPosition,
    });

    // 4. Regenerate
    const result = await withRetryableTimeout(
      () => regenerateChapter({
        userId: user.id,
        courseId,
        chapterId,
        chapterPosition,
      }),
      TIMEOUT_DEFAULTS.AI_GENERATION,
      'regenerateChapter'
    );

    if (result.success) {
      logger.info('[REGENERATE_CHAPTER] Regeneration complete', {
        chapterId: result.chapterId,
        sectionsRegenerated: result.sectionsRegenerated,
        qualityScore: result.qualityScore,
      });

      return NextResponse.json({
        success: true,
        chapterId: result.chapterId,
        chapterTitle: result.chapterTitle,
        sectionsRegenerated: result.sectionsRegenerated,
        qualityScore: result.qualityScore,
      });
    }

    logger.error('[REGENERATE_CHAPTER] Regeneration failed', { error: result.error });
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[REGENERATE_CHAPTER] Error:', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
