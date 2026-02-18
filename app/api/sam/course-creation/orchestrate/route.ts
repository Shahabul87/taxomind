/**
 * Course Creation Orchestrate API (SSE)
 *
 * Streams progress events as the 3-stage course creation pipeline runs.
 * Auth and subscription checks happen once at the start.
 *
 * Events:
 *   stage_start     - A pipeline stage is beginning
 *   item_generating - AI is generating a chapter/section/detail
 *   item_complete   - An item was generated and saved
 *   thinking        - SAM's reasoning for transparency
 *   progress        - Percentage update
 *   stage_complete  - A pipeline stage finished
 *   complete        - Full pipeline done, includes courseId and stats
 *   error           - Something went wrong
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { orchestrateCourseCreation, resumeCourseCreation } from '@/lib/sam/course-creation/orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 900; // 15 min per SSE segment; auto-reconnection handles longer courses

// In-memory in-flight dedup guard — blocks rapid double-submits within a single
// server process. NOTE: this is per-instance only; in multi-instance deployments
// (e.g. Railway with multiple replicas), each process has its own Map. Cross-instance
// dedup is handled by the DB-level requestFingerprint unique constraint in
// orchestrateCourseCreation(), forming a defense-in-depth pattern.
const inFlightRequests = new Map<string, number>();
const IN_FLIGHT_TTL_MS = 15 * 60 * 1000; // 15 minutes

// =============================================================================
// VALIDATION
// =============================================================================

const OrchestrateRequestSchema = z.object({
  courseTitle: z.string().min(3).max(200),
  courseDescription: z.string().min(10).max(2000),
  targetAudience: z.string().min(3).max(200),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  totalChapters: z.number().int().min(1).max(20),
  sectionsPerChapter: z.number().int().min(1).max(10),
  learningObjectivesPerChapter: z.number().int().min(1).max(10).default(5),
  learningObjectivesPerSection: z.number().int().min(1).max(5).default(3),
  courseGoals: z.array(z.string().max(500)).min(1).max(20),
  bloomsFocus: z.array(z.string()).default([]),
  preferredContentTypes: z.array(z.string()).default([]),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  courseIntent: z.string().max(1000).optional(),
  includeAssessments: z.boolean().optional(),
  duration: z.string().max(50).optional(),
  resumeCourseId: z.string().optional(),
  /** Client-generated idempotency key to prevent duplicate course creation */
  requestId: z.string().uuid().optional(),
});

function buildRequestFingerprint(config: z.infer<typeof OrchestrateRequestSchema>): string {
  const canonical = JSON.stringify({
    courseTitle: config.courseTitle.trim(),
    courseDescription: config.courseDescription.trim(),
    targetAudience: config.targetAudience.trim(),
    difficulty: config.difficulty,
    totalChapters: config.totalChapters,
    sectionsPerChapter: config.sectionsPerChapter,
    learningObjectivesPerChapter: config.learningObjectivesPerChapter,
    learningObjectivesPerSection: config.learningObjectivesPerSection,
    courseGoals: config.courseGoals.map((g) => g.trim()),
    bloomsFocus: config.bloomsFocus,
    preferredContentTypes: config.preferredContentTypes,
    category: config.category ?? '',
    subcategory: config.subcategory ?? '',
    courseIntent: config.courseIntent ?? '',
    includeAssessments: config.includeAssessments ?? null,
    duration: config.duration ?? '',
  });
  return crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}

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
    // 0. Rate limit — prevent abuse of expensive 15-min SSE sessions
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

    // 2. Subscription gate: course creation requires STARTER+
    const gateResult = await withSubscriptionGate(user.id, { category: 'generation' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    // 3. Validate body
    const body = await request.json();
    const parseResult = OrchestrateRequestSchema.safeParse(body);
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

    // New course creation requires a client-provided idempotency key.
    // Resume requests are naturally idempotent by courseId + checkpoint state.
    if (!config.resumeCourseId && !config.requestId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'requestId is required for new course creation',
          code: 'MISSING_REQUEST_ID',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const requestFingerprint = config.resumeCourseId ? undefined : buildRequestFingerprint(config);

    // 3a2. In-process dedupe guard (moved BEFORE DB checks to close TOCTOU race).
    // Establishes atomic in-memory lock first, then validates against DB.
    const dedupeKey = config.requestId ?? requestFingerprint;
    if (!config.resumeCourseId && dedupeKey) {
      inFlightKey = `${user.id}:${dedupeKey}`;
      if (!claimInFlight(inFlightKey)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Course creation already in progress',
            code: 'ALREADY_RUNNING',
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    // 3b. Idempotency check: if requestId is provided, check for existing pipeline
    if (config.requestId) {
      const existingPlan = await db.sAMExecutionPlan.findFirst({
        where: {
          goal: { userId: user.id },
          OR: [
            {
              metadata: {
                path: ['requestId'],
                equals: config.requestId,
              },
            },
            ...(requestFingerprint ? [{
              metadata: {
                path: ['requestFingerprint'],
                equals: requestFingerprint,
              },
            }] : []),
          ],
        },
        select: {
          id: true,
          status: true,
          checkpointData: true,
        },
      });

      if (existingPlan) {
        const checkpoint = existingPlan.checkpointData as Record<string, unknown> | null;
        const courseId = checkpoint?.courseId as string | undefined;

        if (existingPlan.status === 'ACTIVE' || existingPlan.status === 'DRAFT') {
          releaseInFlight(inFlightKey);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Course creation already in progress',
              code: 'ALREADY_RUNNING',
              runId: existingPlan.id,
              courseId,
            }),
            { status: 409, headers: { 'Content-Type': 'application/json' } },
          );
        }

        if (existingPlan.status === 'COMPLETED' && courseId) {
          releaseInFlight(inFlightKey);
          return new Response(
            JSON.stringify({
              success: true,
              code: 'ALREADY_COMPLETE',
              courseId,
              planId: existingPlan.id,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        // FAILED or PAUSED plans are allowed to retry with same requestId
      }
    }

    // 3c. Secondary dedup for non-requestId callers or race windows:
    // block if a matching fingerprint is already ACTIVE or DRAFT recently.
    if (requestFingerprint) {
      const activeMatch = await db.sAMExecutionPlan.findFirst({
        where: {
          goal: { userId: user.id },
          status: { in: ['ACTIVE', 'DRAFT'] },
          metadata: {
            path: ['requestFingerprint'],
            equals: requestFingerprint,
          },
        },
        select: {
          id: true,
          status: true,
          checkpointData: true,
        },
      });

      if (activeMatch) {
        releaseInFlight(inFlightKey);
        const checkpoint = activeMatch.checkpointData as Record<string, unknown> | null;
        const courseId = checkpoint?.courseId as string | undefined;
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Course creation already in progress',
            code: 'ALREADY_RUNNING',
            runId: activeMatch.id,
            courseId,
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    // 4. Generate correlation ID for end-to-end tracing across the 15-min SSE session
    const runId = crypto.randomUUID();
    logger.info('[ORCHESTRATE_ROUTE] Starting course creation run', { runId, userId: user.id });

    // 5. Set up SSE stream with heartbeat to prevent connection timeout
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let streamClosed = false;

        function sendSSE(event: string, data: Record<string, unknown>) {
          if (streamClosed) return;
          const payload = `event: ${event}\ndata: ${JSON.stringify({ ...data, runId })}\n\n`;
          try {
            controller.enqueue(encoder.encode(payload));
          } catch {
            streamClosed = true;
          }
        }

        // Heartbeat: send SSE comment every 15s to keep connection alive
        // during long AI calls (roadmap generation can take 60-120s)
        const heartbeat = setInterval(() => {
          if (streamClosed) { clearInterval(heartbeat); return; }
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            streamClosed = true;
            clearInterval(heartbeat);
          }
        }, 15_000);

        sendSSE('progress', {
          percentage: 0,
          message: 'Starting course creation...',
        });

        try {
          const orchestrateOptions = {
            userId: user.id,
            runId,
            requestId: config.requestId,
            requestFingerprint,
            abortSignal: request.signal,
            config: {
              ...config,
              onProgress: (progress: { percentage: number; message: string; state: unknown }) => {
                sendSSE('progress', {
                  percentage: progress.percentage,
                  message: progress.message,
                  state: progress.state,
                });
              },
              onError: (error: string, canRetry: boolean) => {
                sendSSE('error', { message: error, canRetry });
              },
            },
            onSSEEvent: (event: { type: string; data: Record<string, unknown> }) => {
              sendSSE(event.type, event.data);
            },
          };

          const result = config.resumeCourseId
            ? await resumeCourseCreation({
                ...orchestrateOptions,
                resumeCourseId: config.resumeCourseId,
              })
            : await orchestrateCourseCreation(orchestrateOptions);

          // The orchestrator's own 'complete' event already flows through
          // onSSEEvent → sendSSE. Only emit error as a safety net.
          if (!result.success) {
            sendSSE('error', {
              message: result.error ?? 'Course creation failed',
              courseId: result.courseId,
              chaptersCreated: result.chaptersCreated,
              sectionsCreated: result.sectionsCreated,
            });
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          logger.error('[ORCHESTRATE_ROUTE] Stream error:', msg);
          sendSSE('error', { message: msg });
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
    logger.error('[ORCHESTRATE_ROUTE] Error:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
