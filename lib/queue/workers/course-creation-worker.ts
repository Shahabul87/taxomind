/**
 * Course Creation Worker — BullMQ worker for async course generation
 *
 * Replaces inline SSE execution with queue-based processing:
 * 1. Receives CourseCreationJobData from the `course-creation` queue
 * 2. Runs the full orchestrator pipeline
 * 3. Stores SSE events in a Redis list for the relay route to read
 * 4. Updates progress in Redis for polling clients
 *
 * Gated by ENABLE_QUEUE_PROCESSING=true env var.
 */

import { Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '@/lib/logger';
import {
  orchestrateCourseCreation,
  resumeCourseCreation,
} from '@/lib/sam/course-creation/orchestrator';
import { queueManager } from '../queue-manager';
import type { WorkerFunction } from '../job-definitions';
import type {
  CourseCreationJobData,
  CourseCreationProgress,
  QueuedSSEEvent,
} from '../course-creation-types';
import {
  progressKey,
  eventStreamKey,
  completionKey,
  REDIS_TTL_SECONDS,
} from '../course-creation-types';

// ============================================================================
// Redis Connection (shared across worker invocations)
// ============================================================================

let redis: IORedis | null = null;

function getRedis(): IORedis {
  if (!redis) {
    redis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }
  return redis;
}

// ============================================================================
// Worker Handler
// ============================================================================

/**
 * Register course-creation worker with the queue manager.
 * Gated by ENABLE_QUEUE_PROCESSING — if disabled, the worker is not started
 * and jobs will simply sit in the queue (which is the expected behavior since
 * the sync SSE route handles generation inline when the flag is off).
 */
export function registerCourseCreationWorker(): void {
  if (process.env.ENABLE_QUEUE_PROCESSING !== 'true') {
    logger.info('[COURSE_WORKER] Queue processing disabled — skipping worker registration');
    return;
  }

  queueManager.registerHandler('course-creation', handleCourseCreation);
  queueManager.startWorker('course-creation');
  logger.info('[COURSE_WORKER] Course creation worker registered and started');
}

export const handleCourseCreation: WorkerFunction<CourseCreationJobData> = async (
  job: Job<CourseCreationJobData>,
) => {
  const { userId, runId, requestId, config } = job.data;
  const io = getRedis();
  let seq = 0;

  logger.info('[COURSE_WORKER] Starting course creation job', {
    jobId: job.id,
    runId,
    userId,
    courseTitle: config.courseTitle,
  });

  // ── Helper: push SSE event to Redis for relay ──
  async function pushEvent(type: string, data: Record<string, unknown>): Promise<void> {
    const event: QueuedSSEEvent = {
      type,
      data: { ...data, runId },
      seq: seq++,
      timestamp: new Date().toISOString(),
    };
    try {
      await io.rpush(eventStreamKey(runId), JSON.stringify(event));
      // Ensure TTL is set on first push
      if (seq === 1) {
        await io.expire(eventStreamKey(runId), REDIS_TTL_SECONDS);
      }
    } catch (error) {
      logger.warn('[COURSE_WORKER] Failed to push SSE event to Redis', {
        runId, type, error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ── Helper: update progress summary in Redis ──
  async function updateProgress(progress: Partial<CourseCreationProgress>): Promise<void> {
    try {
      const existing = await io.get(progressKey(runId));
      const current: CourseCreationProgress = existing
        ? JSON.parse(existing)
        : {
            status: 'running',
            currentChapter: 0,
            totalChapters: config.totalChapters,
            percentage: 0,
            chaptersCreated: 0,
            sectionsCreated: 0,
            updatedAt: new Date().toISOString(),
          };

      const updated: CourseCreationProgress = {
        ...current,
        ...progress,
        updatedAt: new Date().toISOString(),
      };

      await io.setex(progressKey(runId), REDIS_TTL_SECONDS, JSON.stringify(updated));
    } catch (error) {
      logger.warn('[COURSE_WORKER] Failed to update progress in Redis', {
        runId, error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ── Initialize progress ──
  await updateProgress({ status: 'running', percentage: 0 });
  await pushEvent('progress', { percentage: 0, message: 'Starting course creation...' });

  // ── Job-scoped abort controller ──
  const abortController = new AbortController();

  // BullMQ stalled-job detection: if the job is moved to stalled, abort
  job.on?.('stalled', () => {
    logger.warn('[COURSE_WORKER] Job stalled, aborting', { runId });
    abortController.abort();
  });

  try {
    // Track courseId from SSE events
    let lastKnownCourseId: string | undefined;

    const orchestrateOptions = {
      userId,
      runId,
      requestId,
      abortSignal: abortController.signal,
      config: {
        ...config,
        onProgress: (progress: { percentage: number; message: string; state: unknown }) => {
          pushEvent('progress', {
            percentage: progress.percentage,
            message: progress.message,
            state: progress.state,
          });
          updateProgress({ percentage: progress.percentage });
          job.updateProgress(Math.round(progress.percentage));
        },
        onError: (error: string, canRetry: boolean) => {
          pushEvent('error', { message: error, canRetry, courseId: lastKnownCourseId });
        },
      },
      onSSEEvent: (event: { type: string; data: Record<string, unknown> }) => {
        if (event.data.courseId && typeof event.data.courseId === 'string') {
          lastKnownCourseId = event.data.courseId;
          updateProgress({ courseId: event.data.courseId });
        }
        pushEvent(event.type, event.data);
      },
    };

    const result = await orchestrateCourseCreation(orchestrateOptions);

    if (result.success) {
      // Emit completion event
      await pushEvent('complete', {
        courseId: result.courseId,
        chaptersCreated: result.chaptersCreated ?? 0,
        sectionsCreated: result.sectionsCreated ?? 0,
        totalTime: result.stats?.totalTime ?? 0,
        averageQualityScore: result.stats?.averageQualityScore ?? 0,
      });

      await updateProgress({
        status: 'completed',
        courseId: result.courseId,
        percentage: 100,
        chaptersCreated: result.chaptersCreated ?? 0,
        sectionsCreated: result.sectionsCreated ?? 0,
        stats: result.stats ? {
          totalTime: result.stats.totalTime,
          averageQualityScore: result.stats.averageQualityScore,
        } : undefined,
      });

      // Set completion signal for relay to detect end
      await io.setex(completionKey(runId), REDIS_TTL_SECONDS, 'done');

      logger.info('[COURSE_WORKER] Course creation completed', {
        runId,
        courseId: result.courseId,
        chaptersCreated: result.chaptersCreated,
      });

      return {
        success: true,
        courseId: result.courseId,
        chaptersCreated: result.chaptersCreated,
        sectionsCreated: result.sectionsCreated,
      };
    } else {
      await pushEvent('error', {
        message: result.error ?? 'Course creation failed',
        courseId: result.courseId ?? lastKnownCourseId,
      });

      await updateProgress({
        status: 'failed',
        error: result.error,
        courseId: result.courseId ?? lastKnownCourseId,
      });

      await io.setex(completionKey(runId), REDIS_TTL_SECONDS, 'failed');

      throw new Error(result.error ?? 'Course creation pipeline returned failure');
    }
  } catch (error) {
    const isAbort = abortController.signal.aborted ||
      (error instanceof Error && error.name === 'AbortError');

    if (isAbort) {
      await updateProgress({ status: 'failed', error: 'Aborted' });
      await io.setex(completionKey(runId), REDIS_TTL_SECONDS, 'aborted');
      logger.info('[COURSE_WORKER] Job aborted', { runId });
      return { success: false, error: 'Aborted' };
    }

    const msg = error instanceof Error ? error.message : String(error);
    await pushEvent('error', { message: msg, canRetry: true });
    await updateProgress({ status: 'failed', error: msg, canRetry: true });
    await io.setex(completionKey(runId), REDIS_TTL_SECONDS, 'failed');

    logger.error('[COURSE_WORKER] Course creation failed', { runId, error: msg });
    throw error;
  }
};
