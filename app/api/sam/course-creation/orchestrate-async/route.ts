/**
 * Async Course Creation API — Queue-Based SSE Relay
 *
 * POST: Enqueue a course creation job, return { runId, jobId } immediately.
 * GET:  SSE stream that reads queued events from Redis and relays to the client.
 *       Supports reconnection via Last-Event-ID header.
 *
 * Gated by ENABLE_QUEUE_PROCESSING=true env var.
 * When disabled, returns 503 with instructions to use the inline /orchestrate route.
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import IORedis from 'ioredis';
import { currentUser } from '@/lib/auth';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { logger } from '@/lib/logger';
import { safeErrorMessage } from '@/lib/api/safe-error';
import { z } from 'zod';
import { getQueueManager } from '@/lib/queue/queue-manager';
import type { CourseCreationJobData } from '@/lib/queue/course-creation-types';
import {
  eventStreamKey,
  progressKey,
  completionKey,
  REDIS_TTL_SECONDS,
} from '@/lib/queue/course-creation-types';

export const runtime = 'nodejs';

const QUEUE_ENABLED = process.env.ENABLE_QUEUE_PROCESSING === 'true';
const QUEUE_NAME = 'course-creation';

// ============================================================================
// Validation (same schema as the inline orchestrate route)
// ============================================================================

const AsyncOrchestrateSchema = z.object({
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
  requestId: z.string().uuid(),
  teacherBlueprint: z.unknown().optional(),
  parallelMode: z.boolean().optional(),
});

// ============================================================================
// POST — Enqueue course creation job
// ============================================================================

export async function POST(request: NextRequest) {
  if (!QUEUE_ENABLED) {
    return NextResponse.json(
      { success: false, error: 'Queue processing is disabled. Use /orchestrate instead.', code: 'QUEUE_DISABLED' },
      { status: 503 },
    );
  }

  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const gateResult = await withSubscriptionGate(user.id, { category: 'generation' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await request.json();
    const parseResult = AsyncOrchestrateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const config = parseResult.data;
    const runId = crypto.randomUUID();

    // Enqueue job
    const queueManager = getQueueManager();
    const jobData: CourseCreationJobData = {
      userId: user.id,
      requestId: config.requestId,
      runId,
      config,
      timestamp: new Date(),
    };

    const job = await queueManager.addJob(
      QUEUE_NAME,
      'generate-course-content',
      jobData,
      {
        jobId: runId,
        timeout: 20 * 60 * 1000, // 20 minute hard limit
        attempts: 1,
        removeOnComplete: 50,
        removeOnFail: 20,
      },
    );

    logger.info('[ORCHESTRATE_ASYNC] Job enqueued', {
      runId,
      jobId: job.id,
      userId: user.id,
      courseTitle: config.courseTitle,
    });

    return NextResponse.json({
      success: true,
      runId,
      jobId: job.id,
      mode: 'async',
      sseUrl: `/api/sam/course-creation/orchestrate-async?runId=${runId}`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[ORCHESTRATE_ASYNC] Failed to enqueue job', { error: msg });
    return NextResponse.json(
      { success: false, error: 'Failed to enqueue course creation' },
      { status: 500 },
    );
  }
}

// ============================================================================
// GET — SSE relay from Redis event stream
// ============================================================================

export async function GET(request: NextRequest) {
  if (!QUEUE_ENABLED) {
    return NextResponse.json(
      { success: false, error: 'Queue processing is disabled', code: 'QUEUE_DISABLED' },
      { status: 503 },
    );
  }

  const runId = request.nextUrl.searchParams.get('runId');
  if (!runId) {
    return NextResponse.json(
      { success: false, error: 'runId query parameter is required' },
      { status: 400 },
    );
  }

  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Support reconnection: resume from last received seq number
  const lastEventId = request.headers.get('Last-Event-ID');
  const resumeFromSeq = lastEventId ? parseInt(lastEventId, 10) : -1;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let pollRedis: IORedis | null = null;

      function close() {
        closed = true;
        pollRedis?.disconnect();
      }

      request.signal.addEventListener('abort', close);

      try {
        pollRedis = new IORedis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0', 10),
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        });
        await pollRedis.connect();
      } catch {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: 'Redis unavailable' })}\n\n`));
        controller.close();
        return;
      }

      // Heartbeat to keep the SSE connection alive
      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return; }
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          close();
          clearInterval(heartbeat);
        }
      }, 10_000);

      try {
        // First, replay any events we missed during reconnection
        if (resumeFromSeq >= 0) {
          const existingEvents = await pollRedis.lrange(eventStreamKey(runId), 0, -1);
          for (const raw of existingEvents) {
            if (closed) break;
            try {
              const event = JSON.parse(raw);
              if (event.seq > resumeFromSeq) {
                const payload = `id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
                controller.enqueue(encoder.encode(payload));
              }
            } catch {
              // Skip malformed events
            }
          }
        }

        // Poll for new events using BLPOP-style approach
        // We use LRANGE with periodic polling instead of BLPOP to avoid
        // blocking the Redis connection and to support heartbeats.
        let lastSeenIndex = 0;

        while (!closed) {
          // Check for completion signal
          const isDone = await pollRedis.get(completionKey(runId));
          if (isDone) {
            // Drain remaining events
            const remaining = await pollRedis.lrange(eventStreamKey(runId), lastSeenIndex, -1);
            for (const raw of remaining) {
              try {
                const event = JSON.parse(raw);
                if (event.seq > resumeFromSeq) {
                  const payload = `id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
                  controller.enqueue(encoder.encode(payload));
                }
              } catch {
                // Skip malformed
              }
            }
            break;
          }

          // Poll for new events
          const events = await pollRedis.lrange(eventStreamKey(runId), lastSeenIndex, lastSeenIndex + 9);
          if (events.length > 0) {
            lastSeenIndex += events.length;
            for (const raw of events) {
              if (closed) break;
              try {
                const event = JSON.parse(raw);
                if (event.seq > resumeFromSeq) {
                  const payload = `id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
                  controller.enqueue(encoder.encode(payload));
                }
              } catch {
                // Skip malformed
              }
            }
          } else {
            // No new events — wait before polling again
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Check if progress shows job already completed/failed
          const progressRaw = await pollRedis.get(progressKey(runId));
          if (progressRaw) {
            const progress = JSON.parse(progressRaw);
            if (progress.status === 'completed' || progress.status === 'failed') {
              // Give a moment for remaining events to flush
              await new Promise(resolve => setTimeout(resolve, 1000));
              // Drain remaining
              const remaining = await pollRedis.lrange(eventStreamKey(runId), lastSeenIndex, -1);
              for (const raw of remaining) {
                try {
                  const event = JSON.parse(raw);
                  if (event.seq > resumeFromSeq) {
                    const payload = `id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
                    controller.enqueue(encoder.encode(payload));
                  }
                } catch {
                  // Skip malformed
                }
              }
              break;
            }
          }
        }
      } catch (error) {
        if (!closed) {
          logger.error('[ORCHESTRATE_ASYNC] SSE relay error:', {
            message: error instanceof Error ? error.message : String(error),
          });
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: safeErrorMessage(error) })}\n\n`));
        }
      } finally {
        clearInterval(heartbeat);
        close();
        try { controller.close(); } catch { /* already closed */ }
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
}
