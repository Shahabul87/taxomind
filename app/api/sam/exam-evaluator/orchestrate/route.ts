/**
 * Exam Evaluator Orchestrate API (SSE)
 *
 * Streams progress events as the 5-stage DIAGNOSE evaluation pipeline runs.
 * Auth and subscription checks happen once at the start.
 *
 * Events:
 *   stage_start        - A pipeline stage is beginning
 *   answer_evaluating  - AI is evaluating an answer
 *   answer_diagnosed   - An answer was diagnosed through 7 layers
 *   echo_back_generated - Echo-back teaching generated for an answer
 *   cognitive_profile   - Aggregate cognitive profile generated
 *   improvement_roadmap - Priority improvement roadmap generated
 *   thinking           - SAM&apos;s reasoning for transparency
 *   progress           - Percentage update
 *   stage_complete     - A pipeline stage finished
 *   complete           - Full pipeline done, includes results and stats
 *   error              - Something went wrong
 */

import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { orchestrateExamEvaluation } from '@/lib/sam/exam-evaluation/orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max for full evaluation

// =============================================================================
// VALIDATION
// =============================================================================

const OrchestrateEvalSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  evaluationMode: z
    .enum(['quick_grade', 'standard', 'deep_diagnostic'])
    .default('deep_diagnostic'),
  enableGapMapping: z.boolean().default(true),
  enableEchoBack: z.boolean().default(true),
  enableMisconceptionId: z.boolean().default(true),
  examId: z.string().optional(),
  courseId: z.string().optional(),
});

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const user = await currentUser();
    if (!user?.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Subscription gate: evaluation requires STARTER+
    const gateResult = await withSubscriptionGate(user.id, { category: 'generation' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    // 3. Validate body
    const body = await request.json();
    const parseResult = OrchestrateEvalSchema.safeParse(body);
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
    const params = parseResult.data;

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
          message: 'Starting DIAGNOSE evaluation pipeline...',
        });

        try {
          const result = await orchestrateExamEvaluation({
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
          });

          // Final event
          if (result.success) {
            sendSSE('complete', {
              attemptId: result.attemptId,
              cognitiveProfile: result.cognitiveProfile,
              improvementRoadmap: result.improvementRoadmap,
              echoBackCount: result.echoBackCount,
              stats: result.stats,
              goalId: result.goalId,
              planId: result.planId,
            });
          } else {
            sendSSE('error', {
              message: result.error ?? 'Evaluation failed',
              attemptId: result.attemptId,
              canRetry: true,
            });
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          logger.error('[EVAL_ORCHESTRATE_ROUTE] Stream error:', msg);
          sendSSE('error', { message: msg, canRetry: false });
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
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[EVAL_ORCHESTRATE_ROUTE] Error:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
