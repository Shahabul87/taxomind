/**
 * NAVIGATOR Skill Builder - SSE Streaming Endpoint
 *
 * 6-stage pipeline that streams progress events back to the client.
 * Follows the same SSE pattern as the existing skill-roadmap/generate route.
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { runNavigatorPipeline } from '@/lib/sam/skill-navigator/orchestrator';
import type { NavigatorCollectedParams } from '@/lib/sam/skill-navigator/agentic-types';

export const runtime = 'nodejs';

// Validation schema
const NavigatorParamsSchema = z.object({
  skillName: z.string().min(2).max(200),
  goalOutcome: z.string().min(5).max(1000),
  goalType: z.enum([
    'career_switch',
    'job_interview',
    'research',
    'build_product',
    'hobby',
    'job_requirement',
    'teaching',
  ]),
  currentLevel: z.enum([
    'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
  ]),
  targetLevel: z.enum([
    'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
  ]),
  hoursPerWeek: z.number().min(1).max(60).default(10),
  deadline: z.string().default('flexible'),
  learningStyle: z.string().default('MIXED'),
});

// Level ordering for validation
const LEVEL_ORDER = [
  'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
] as const;

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Subscription gate: navigator generation requires STARTER+
    const gateResult = await withSubscriptionGate(session.user.id, { category: 'generation' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await request.json();
    const validated = NavigatorParamsSchema.parse(body);

    // Validate target > current level
    const currentIdx = LEVEL_ORDER.indexOf(validated.currentLevel);
    const targetIdx = LEVEL_ORDER.indexOf(validated.targetLevel);
    if (targetIdx <= currentIdx) {
      return new Response(
        JSON.stringify({ error: 'Target level must be above current level' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const userId = session.user.id;

    const params: NavigatorCollectedParams = {
      skillName: validated.skillName,
      goalOutcome: validated.goalOutcome,
      goalType: validated.goalType,
      currentLevel: validated.currentLevel,
      targetLevel: validated.targetLevel,
      hoursPerWeek: validated.hoursPerWeek,
      deadline: validated.deadline,
      learningStyle: validated.learningStyle,
    };

    logger.info('[NavigatorRoute] Starting NAVIGATOR pipeline', {
      userId,
      skillName: params.skillName,
      goalType: params.goalType,
    });

    // Create SSE stream
    const abortController = new AbortController();

    request.signal.addEventListener('abort', () => {
      abortController.abort();
    });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        await runNavigatorPipeline(userId, params, controller, abortController.signal);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid parameters',
          details: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    logger.error('[NavigatorRoute] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
