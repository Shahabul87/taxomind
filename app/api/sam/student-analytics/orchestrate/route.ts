/**
 * Student Analytics Orchestrate API (SSE)
 *
 * Streams progress events as the 5-stage PRISM analytics pipeline runs.
 * Auth and subscription checks happen once at the start.
 *
 * Events:
 *   stage_start            - A pipeline stage is beginning
 *   stage_complete         - A pipeline stage finished
 *   thinking               - SAM&apos;s reasoning for transparency
 *   progress               - Percentage update
 *   cognitive_map_computed - Bloom&apos;s cognitive map computed
 *   blooms_profile         - Per-level mastery data
 *   fragile_knowledge_alert - Fragile knowledge detected
 *   interpretive_insight   - AI interpretation result
 *   alert_generated        - A student alert
 *   prescription_generated - A prescription
 *   report_section         - A report section
 *   complete               - Full pipeline done
 *   error                  - Something went wrong
 */

import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { orchestrateStudentAnalytics } from '@/lib/sam/student-analytics/orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

// =============================================================================
// VALIDATION
// =============================================================================

const OrchestrateSchema = z.object({
  analysisDepth: z
    .enum(['quick_snapshot', 'standard', 'deep_analysis'])
    .default('standard'),
  courseScope: z
    .enum(['all_courses', 'specific_course', 'recent_activity'])
    .default('all_courses'),
  timeRange: z
    .enum(['last_7_days', 'last_30_days', 'last_90_days', 'all_time'])
    .default('last_30_days'),
  courseId: z.string().optional(),
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

    // 2. Subscription gate
    const gateResult = await withSubscriptionGate(user.id, {
      category: 'generation',
    });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    // 3. Validate body
    const body = await request.json();
    const parseResult = OrchestrateSchema.safeParse(body);
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
          message: 'Starting PRISM student analytics pipeline...',
        });

        try {
          const result = await withRetryableTimeout(
            () => orchestrateStudentAnalytics({
              params,
              userId: user.id,
              abortSignal: request.signal,
              onSSEEvent: (event: {
                type: string;
                data: Record<string, unknown>;
              }) => {
                sendSSE(event.type, event.data);
              },
              onProgress: (progress: {
                percentage: number;
                message: string;
              }) => {
                sendSSE('progress', {
                  percentage: progress.percentage,
                  message: progress.message,
                });
              },
            }),
            TIMEOUT_DEFAULTS.AI_GENERATION,
            'orchestrateStudentAnalytics'
          );

          if (result.success) {
            sendSSE('complete', {
              report: result.report,
              cognitiveMap: result.cognitiveMap,
              prescriptions: result.prescriptions,
              interpretiveAnalysis: result.interpretiveAnalysis,
              stats: result.stats,
              goalId: result.goalId,
              planId: result.planId,
            });
          } else {
            sendSSE('error', {
              message: result.error ?? 'Analytics failed',
              canRetry: true,
            });
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          logger.error('[STUDENT_ANALYTICS_ROUTE] Stream error:', msg);
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
    logger.error('[STUDENT_ANALYTICS_ROUTE] Error:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
