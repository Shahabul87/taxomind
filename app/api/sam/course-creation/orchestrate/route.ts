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
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { orchestrateCourseCreation, resumeCourseCreation } from '@/lib/sam/course-creation/orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 900; // 15 min per SSE segment; auto-reconnection handles longer courses

// In-memory in-flight dedup guard — blocks rapid double-submits within a single
// server process. Multi-instance safety is added via a DB-backed dedupe lock row
// in the RateLimit table (atomic unique key insert).
const inFlightRequests = new Map<string, number>();
const IN_FLIGHT_TTL_MS = 15 * 60 * 1000; // 15 minutes
const DB_DEDUPE_LOCK_ENDPOINT = 'sam_orchestrate_dedupe_lock';
const DB_DEDUPE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

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
  enableEscalationGate: z.boolean().optional(),
  fallbackPolicy: z.object({
    haltRateThreshold: z.number().min(0).max(1).optional(),
    haltOnExcessiveFallbacks: z.boolean().optional(),
  }).optional(),
  resumeCourseId: z.string().optional(),
  /** Client-generated idempotency key to prevent duplicate course creation */
  requestId: z.string().uuid().optional(),
  /** Teacher-approved course blueprint (replaces AI planning when present) */
  teacherBlueprint: z.object({
    chapters: z.array(z.object({
      position: z.number(),
      title: z.string(),
      goal: z.string(),
      bloomsLevel: z.string(),
      deliverable: z.string().optional(),
      prerequisiteChapters: z.array(z.number()).optional(),
      estimatedMinutes: z.number().optional(),
      sections: z.array(z.object({
        position: z.number(),
        title: z.string(),
        keyTopics: z.array(z.string()),
        estimatedMinutes: z.number().optional(),
        formativeAssessment: z.object({
          type: z.string(),
          prompt: z.string(),
        }).optional(),
      })),
    })),
    northStarProject: z.string().optional(),
    confidence: z.number(),
    riskAreas: z.array(z.string()),
    currentVersion: z.number().optional(),
    versions: z.array(z.unknown()).optional(),
  }).optional(),
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
    enableEscalationGate: config.enableEscalationGate ?? false,
    fallbackPolicy: {
      haltRateThreshold: config.fallbackPolicy?.haltRateThreshold ?? null,
      haltOnExcessiveFallbacks: config.fallbackPolicy?.haltOnExcessiveFallbacks ?? null,
    },
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

function getDedupeWindowStart(now = Date.now()): Date {
  return new Date(Math.floor(now / DB_DEDUPE_WINDOW_MS) * DB_DEDUPE_WINDOW_MS);
}

async function claimDbDedupeLock(identifier: string): Promise<boolean> {
  try {
    await db.rateLimit.create({
      data: {
        identifier,
        endpoint: DB_DEDUPE_LOCK_ENDPOINT,
        windowStart: getDedupeWindowStart(),
        count: 1,
      },
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return false;
    }
    throw error;
  }
}

async function releaseDbDedupeLock(identifier?: string): Promise<void> {
  if (!identifier) return;
  try {
    await db.rateLimit.deleteMany({
      where: {
        identifier,
        endpoint: DB_DEDUPE_LOCK_ENDPOINT,
      },
    });
  } catch {
    // Best effort lock cleanup only
  }
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  let inFlightKey: string | undefined;
  let dbDedupeLockKey: string | undefined;

  const releaseDedupeLocks = async (): Promise<void> => {
    releaseInFlight(inFlightKey);
    await releaseDbDedupeLock(dbDedupeLockKey);
  };

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
      dbDedupeLockKey = inFlightKey;

      if (!claimInFlight(inFlightKey)) {
        // Look up the active course so the client can show a Resume button
        // instead of a dead-end error. This is an error path, so the extra
        // query is acceptable.
        let activeCourseId: string | undefined;
        try {
          const activePlan = await db.sAMExecutionPlan.findFirst({
            where: {
              goal: { userId: user.id },
              status: { in: ['ACTIVE', 'DRAFT'] },
              checkpointData: { not: Prisma.AnyNull },
            },
            orderBy: { updatedAt: 'desc' },
            select: { checkpointData: true },
          });
          if (activePlan?.checkpointData) {
            const checkpoint = activePlan.checkpointData as Record<string, unknown>;
            activeCourseId = checkpoint.courseId as string | undefined;
          }
        } catch {
          // Non-critical — proceed without courseId
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Course creation already in progress',
            code: 'ALREADY_RUNNING',
            courseId: activeCourseId,
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const hasDbLock = await claimDbDedupeLock(dbDedupeLockKey);
      if (!hasDbLock) {
        releaseInFlight(inFlightKey);
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
          await releaseDedupeLocks();
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
          await releaseDedupeLocks();
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
        await releaseDedupeLocks();
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

        // Track courseId at stream scope so the catch block can include it
        // in error events. Updated by intercepting SSE events from the orchestrator.
        let lastKnownCourseId: string | undefined = config.resumeCourseId;

        function sendSSE(event: string, data: Record<string, unknown>) {
          if (streamClosed) return;
          const payload = `event: ${event}\ndata: ${JSON.stringify({ ...data, runId })}\n\n`;
          try {
            controller.enqueue(encoder.encode(payload));
          } catch {
            streamClosed = true;
          }
        }

        // Back-pressure: stop generation when client disconnects
        request.signal.addEventListener('abort', () => {
          streamClosed = true;
          clearInterval(heartbeat);
        });

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
                sendSSE('error', { message: error, canRetry, courseId: lastKnownCourseId });
              },
            },
            onSSEEvent: (event: { type: string; data: Record<string, unknown> }) => {
              // Intercept courseId from orchestrator events for error recovery
              if (event.data.courseId && typeof event.data.courseId === 'string') {
                lastKnownCourseId = event.data.courseId;
              }
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
              courseId: result.courseId ?? lastKnownCourseId,
              chaptersCreated: result.chaptersCreated,
              sectionsCreated: result.sectionsCreated,
            });
          } else if (result.courseId) {
            // Safety net: emit 'complete' for the resume early-return path
            // (checkpoint-manager returns {success:true} when all chapters
            // are already done, but doesn't emit an SSE event itself).
            // The frontend's handleComplete() deduplicates, so a second
            // 'complete' from the normal orchestrator path is harmless.
            sendSSE('complete', {
              courseId: result.courseId,
              chaptersCreated: result.chaptersCreated ?? 0,
              sectionsCreated: result.sectionsCreated ?? 0,
              totalTime: result.stats?.totalTime ?? 0,
              averageQualityScore: result.stats?.averageQualityScore ?? 0,
            });
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          const isTransient = error instanceof Error &&
            /timeout|ECONNRESET|EPIPE|network/i.test(error.message);
          logger.error('[ORCHESTRATE_ROUTE] Stream error:', {
            message: msg,
            userId: user.id,
            runId,
            courseId: lastKnownCourseId,
            isTransient,
          });
          sendSSE('error', {
            message: 'Course creation failed',
            courseId: lastKnownCourseId,
            canRetry: isTransient,
            errorClass: isTransient ? 'transient' : 'permanent',
          });
        } finally {
          await releaseDedupeLocks();
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
    await releaseDedupeLocks();
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const isTransient = error instanceof Error &&
      /timeout|ECONNRESET|EPIPE|network/i.test(error.message);
    logger.error('[ORCHESTRATE_ROUTE] Error:', {
      message: msg,
      isTransient,
    });
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
