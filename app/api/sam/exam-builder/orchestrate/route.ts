/**
 * Exam Builder Orchestrate API (SSE)
 *
 * Streams progress events as the 5-stage Bloom's exam creation pipeline runs.
 * Auth and subscription checks happen once at the start.
 *
 * Events:
 *   stage_start        - A pipeline stage is beginning
 *   item_generating    - AI is generating a question
 *   item_complete      - A question was generated and saved
 *   bloom_distribution - Planned Bloom's distribution by level
 *   concept_map        - Decomposed concepts with prerequisites
 *   thinking           - SAM's reasoning for transparency
 *   validation_result  - Assembly validation results (7 checks)
 *   progress           - Percentage update
 *   stage_complete     - A pipeline stage finished
 *   complete           - Full pipeline done, includes examId and stats
 *   error              - Something went wrong
 */

import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { logger } from '@/lib/logger';
import { safeErrorMessage } from '@/lib/api/safe-error';
import { z } from 'zod';
import { orchestrateExamCreation } from '@/lib/sam/exam-generation/orchestrator';
import type { ExamBuilderParams } from '@/lib/sam/exam-generation/agentic-types';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max for full exam generation

// =============================================================================
// VALIDATION
// =============================================================================

const BloomsDistributionSchema = z.record(
  z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
  z.number().min(0).max(100)
);

const OrchestrateExamSchema = z.object({
  topic: z.string().min(2).max(200),
  subtopics: z.union([
    z.array(z.string().min(1).max(200)).min(1).max(30),
    z.literal('auto'),
  ]).default('auto'),
  studentLevel: z.enum(['novice', 'intermediate', 'advanced', 'research']).default('intermediate'),
  examPurpose: z.enum(['diagnostic', 'mastery', 'placement', 'research-readiness']).default('diagnostic'),
  bloomsDistribution: z.union([
    BloomsDistributionSchema,
    z.literal('auto'),
  ]).default('auto'),
  questionCount: z.number().int().min(5).max(50).default(15),
  timeLimit: z.number().int().min(5).max(300).nullable().default(60),
  questionFormats: z.array(
    z.enum(['mcq', 'short_answer', 'long_answer', 'design_problem', 'code_challenge'])
  ).min(1).max(5).default(['mcq', 'short_answer']),
  // Optional context (from section page)
  sectionId: z.string().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
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
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Subscription gate: exam creation requires STARTER+
    const gateResult = await withSubscriptionGate(user.id, { category: 'generation' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    // 3. Validate body
    const body = await request.json();
    const parseResult = OrchestrateExamSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const params = parseResult.data as ExamBuilderParams;

    // 4. Set up SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendSSE(event: string, data: Record<string, unknown>) {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          try {
            controller.enqueue(encoder.encode(payload));
          } catch {
            // Stream closed by client
          }
        }

        sendSSE('progress', {
          percentage: 0,
          message: 'Starting exam creation pipeline...',
        });

        try {
          const result = await withRetryableTimeout(
            () => orchestrateExamCreation({
              params,
              userId: user.id,
              abortSignal: request.signal,
              onSSEEvent: (event: { type: string; data: Record<string, unknown> }) => {
                sendSSE(event.type, event.data);
              },
              onProgress: (progress: { percentage: number; message: string }) => {
                sendSSE('progress', {
                  percentage: progress.percentage,
                  message: progress.message,
                });
              },
            }),
            TIMEOUT_DEFAULTS.AI_GENERATION,
            'orchestrateExamCreation'
          );

          // Final event
          if (result.success) {
            sendSSE('complete', {
              examId: result.examId,
              questionCount: result.questionCount,
              bloomsProfile: result.bloomsProfile,
              cognitiveProfileTemplate: result.cognitiveProfileTemplate,
              stats: result.stats,
              goalId: result.goalId,
              planId: result.planId,
            });
          } else {
            sendSSE('error', {
              message: result.error ?? 'Exam creation failed',
              examId: result.examId,
              canRetry: true,
            });
          }
        } catch (error) {
          logger.error('[EXAM_ORCHESTRATE_ROUTE] Stream error:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          sendSSE('error', { message: safeErrorMessage(error), canRetry: false });
        } finally {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
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
    logger.error('[EXAM_ORCHESTRATE_ROUTE] Error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(
      JSON.stringify({ success: false, error: safeErrorMessage(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
