/**
 * Depth Analysis Orchestrate API (SSE)
 *
 * Streams progress events as the agentic depth analysis pipeline runs.
 * Mirrors the architecture of course-creation/orchestrate/route.ts.
 *
 * Events:
 *   analysis_start    - Pipeline initialized with course info
 *   strategy_planned  - Analysis strategy determined
 *   chapter_analyzing - A chapter analysis is starting
 *   chapter_complete  - A chapter analysis finished
 *   issue_found       - A quality issue was detected
 *   framework_result  - Framework-specific result available
 *   cross_chapter_start - Cross-chapter analysis starting
 *   flow_issue_found  - Cross-chapter flow issue detected
 *   post_processing   - Post-processing stage update
 *   progress          - Percentage update
 *   resume_hydrate    - Resume state loaded (checkpoint recovery)
 *   complete          - Full pipeline done, includes analysisId and stats
 *   error             - Something went wrong
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { orchestrateDepthAnalysis } from '@/lib/sam/depth-analysis/orchestrator';
import type { DepthAnalysisSSEEventType } from '@/lib/sam/depth-analysis/types';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 min max for depth analysis

// In-memory dedup guard — blocks rapid double-submits
const inFlightRequests = new Map<string, number>();
const IN_FLIGHT_TTL_MS = 10 * 60 * 1000; // 10 minutes

// =============================================================================
// VALIDATION
// =============================================================================

const AnalysisRequestSchema = z.object({
  courseId: z.string().min(1),
  mode: z.enum(['quick', 'standard', 'deep', 'comprehensive']).default('standard'),
  frameworks: z.array(z.enum(['blooms', 'dok', 'solo', 'fink', 'marzano', 'gagne', 'qm', 'olc']))
    .default(['blooms', 'dok']),
  focusAreas: z.array(z.string()).default([]),
  forceReanalyze: z.boolean().default(false),
  resumeFromAnalysis: z.string().optional(),
});

function claimInFlight(key: string): boolean {
  const now = Date.now();
  const existing = inFlightRequests.get(key);
  if (existing && now - existing < IN_FLIGHT_TTL_MS) return false;
  inFlightRequests.set(key, now);
  return true;
}

function releaseInFlight(key?: string): void {
  if (!key) return;
  inFlightRequests.delete(key);
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  let inFlightKey: string | undefined;

  try {
    // 0. Rate limit
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

    // 2. Subscription gate: depth analysis requires active subscription
    const gateResult = await withSubscriptionGate(user.id, { category: 'analysis' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    // 3. Validate body
    const body = await request.json();
    const parseResult = AnalysisRequestSchema.safeParse(body);
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
    const config = parseResult.data;

    // 4. In-process dedupe guard
    inFlightKey = `depth-analysis:${user.id}:${config.courseId}`;
    if (!config.resumeFromAnalysis && !claimInFlight(inFlightKey)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Depth analysis already in progress for this course',
          code: 'ALREADY_RUNNING',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Generate correlation ID
    const runId = crypto.randomUUID();
    logger.info('[DEPTH_ANALYSIS_ROUTE] Starting analysis run', {
      runId,
      userId: user.id,
      courseId: config.courseId,
      mode: config.mode,
    });

    // 6. Set up SSE stream with heartbeat
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let streamClosed = false;
        const streamAbort = new AbortController();

        function markStreamClosed() {
          streamClosed = true;
          if (!streamAbort.signal.aborted) {
            streamAbort.abort();
          }
        }

        const combinedSignal = AbortSignal.any([request.signal, streamAbort.signal]);

        function sendSSE(event: string, data: Record<string, unknown>) {
          if (streamClosed) return;
          const payload = `event: ${event}\ndata: ${JSON.stringify({ ...data, runId })}\n\n`;
          try {
            controller.enqueue(encoder.encode(payload));
          } catch {
            markStreamClosed();
          }
        }

        // Back-pressure: stop when client disconnects
        request.signal.addEventListener('abort', () => {
          markStreamClosed();
          clearInterval(heartbeat);
        });

        // Heartbeat: send SSE comment every 15s
        const heartbeat = setInterval(() => {
          if (streamClosed) { clearInterval(heartbeat); return; }
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            markStreamClosed();
            clearInterval(heartbeat);
          }
        }, 15_000);

        sendSSE('progress', {
          percent: 0,
          message: 'Starting depth analysis...',
        });

        try {
          const emitSSE = (event: DepthAnalysisSSEEventType, data: Record<string, unknown>) => {
            sendSSE(event, data);
          };

          await orchestrateDepthAnalysis({
            userId: user.id,
            courseId: config.courseId,
            mode: config.mode,
            frameworks: config.frameworks,
            focusAreas: config.focusAreas,
            forceReanalyze: config.forceReanalyze,
            resumeFromAnalysis: config.resumeFromAnalysis,
            emitSSE,
            abortSignal: combinedSignal,
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          const isTransient = error instanceof Error &&
            /timeout|ECONNRESET|EPIPE|network/i.test(error.message);
          logger.error('[DEPTH_ANALYSIS_ROUTE] Stream error:', {
            message: msg,
            userId: user.id,
            runId,
            courseId: config.courseId,
            isTransient,
          });
          sendSSE('error', {
            message: 'Depth analysis failed',
            courseId: config.courseId,
            canRetry: isTransient,
            errorClass: isTransient ? 'transient' : 'permanent',
          });
        } finally {
          releaseInFlight(inFlightKey);
          clearInterval(heartbeat);
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
        'X-Run-Id': runId,
      },
    });
  } catch (error) {
    releaseInFlight(inFlightKey);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[DEPTH_ANALYSIS_ROUTE] Error:', { message: msg });
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
