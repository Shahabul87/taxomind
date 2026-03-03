/**
 * Creator Analytics Orchestrate API (SSE)
 *
 * Streams progress events as the 6-stage PRISM creator analytics pipeline runs.
 * Auth and subscription checks happen once at the start.
 *
 * Events:
 *   stage_start              - A pipeline stage is beginning
 *   stage_complete           - A pipeline stage finished
 *   thinking                 - SAM&apos;s reasoning for transparency
 *   progress                 - Percentage update
 *   cohort_distribution      - Bloom&apos;s distribution across cohort
 *   dropout_risk_analysis    - Dropout risk breakdown
 *   fragile_knowledge_alarm  - Cohort fragile knowledge alert
 *   content_effectiveness    - Content quality summary
 *   root_cause_identified    - A root cause
 *   prescription_generated   - A prescription
 *   report_section           - A report section
 *   complete                 - Full pipeline done
 *   error                    - Something went wrong
 */

import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { logger } from '@/lib/logger';
import { safeErrorMessage } from '@/lib/api/safe-error';
import { z } from 'zod';
import { orchestrateCreatorAnalytics } from '@/lib/sam/creator-analytics/orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

// =============================================================================
// VALIDATION
// =============================================================================

const OrchestrateSchema = z.object({
  courseId: z.string().min(1),
  courseName: z.string().optional(),
  timeRange: z
    .enum(['last_7_days', 'last_30_days', 'last_90_days', 'all_time'])
    .default('last_30_days'),
  focusArea: z
    .enum([
      'cognitive_health',
      'engagement',
      'content_quality',
      'predictions',
      'comprehensive',
    ])
    .default('comprehensive'),
  analysisDepth: z
    .enum(['overview', 'standard', 'deep_dive'])
    .default('standard'),
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
          message: 'Starting PRISM creator analytics pipeline...',
        });

        try {
          const result = await withRetryableTimeout(
            () => orchestrateCreatorAnalytics({
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
            'orchestrateCreatorAnalytics'
          );

          if (result.success) {
            sendSSE('complete', {
              report: result.report,
              cohortAnalysis: result.cohortAnalysis,
              contentQuality: result.contentQuality,
              rootCauseAnalysis: result.rootCauseAnalysis,
              prescriptions: result.prescriptions,
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
          logger.error('[CREATOR_ANALYTICS_ROUTE] Stream error:', {
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
    logger.error('[CREATOR_ANALYTICS_ROUTE] Error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(
      JSON.stringify({ success: false, error: safeErrorMessage(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
