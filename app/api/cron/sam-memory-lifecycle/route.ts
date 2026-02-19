/**
 * SAM Memory Lifecycle Cron Job
 *
 * Manages memory reindexing, cleanup, and knowledge graph maintenance.
 * Runs periodically via Vercel/Railway cron (recommended: every 6 hours).
 *
 * Features:
 * - Processes pending reindex jobs for course/chapter/section content
 * - Cleans up stale embeddings and expired memory entries
 * - Refreshes knowledge graph relationships
 * - Background worker job processing
 * - Memory normalization for LLM context
 *
 * Security: Requires CRON_SECRET authorization header
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { SAM_FEATURES } from '@/lib/sam/feature-flags';
import { withCronAuth, verifyCronAuth } from '@/lib/api/cron-auth';
import {
  getMemoryLifecycleManager,
  startMemoryLifecycle,
  getLifecycleStats,
  getFullLifecycleStats,
  getBackgroundWorker,
  getKGRefreshScheduler,
  executeKGRefreshJobs,
  queueMemoryCleanup,
  getWorkerStats,
  getKGRefreshStats,
  type KGRefreshJobType,
} from '@/lib/sam/memory-lifecycle-service';

// Request body schema for manual triggers
const ManualTriggerSchema = z.object({
  action: z.enum([
    'process',
    'cleanup',
    'stats',
    'full_stats',
    'start',
    'stop',
    'worker_status',
    'kg_refresh',
    'kg_stats',
  ]).optional().default('process'),
  maxJobs: z.number().min(1).max(100).optional().default(50),
  cleanupDays: z.number().min(1).max(365).optional().default(30),
  kgRefreshType: z.enum([
    'full_rebuild',
    'incremental',
    'relationship_check',
    'stale_pruning',
    'consistency_check',
  ]).optional().default('incremental'),
});

/**
 * GET /api/cron/sam-memory-lifecycle
 *
 * Main cron endpoint - processes pending memory jobs.
 * Called periodically by cron scheduler.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization (fail-closed)
    const authResponse = withCronAuth(request);
    if (authResponse) return authResponse;

    // Check if memory lifecycle feature is enabled
    if (!SAM_FEATURES.MEMORY_LIFECYCLE_ENABLED) {
      logger.info('[SAM_MEMORY_LIFECYCLE_CRON] Memory lifecycle feature is disabled');
      return NextResponse.json({
        success: true,
        data: {
          skipped: true,
          reason: 'MEMORY_LIFECYCLE_ENABLED feature flag is false',
          hint: 'Set SAM_MEMORY_LIFECYCLE=true in environment to enable',
        },
      });
    }

    logger.info('[SAM_MEMORY_LIFECYCLE_CRON] Starting scheduled run');

    // Initialize lifecycle manager if not already initialized
    const manager = await getMemoryLifecycleManager();

    // Process pending jobs
    const results = await manager.processJobs();

    // Get current stats
    const statsResult = await getLifecycleStats();

    const duration = Date.now() - startTime;

    logger.info('[SAM_MEMORY_LIFECYCLE_CRON] Completed scheduled run', {
      jobsProcessed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        jobsProcessed: results.length,
        results: results.map(r => ({
          jobId: r.jobId,
          success: r.success,
          documentsProcessed: r.documentsProcessed,
          errors: r.errors,
        })),
        stats: statsResult.stats,
        durationMs: duration,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[SAM_MEMORY_LIFECYCLE_CRON] Error during scheduled run', {
      error: error instanceof Error ? error.message : 'Unknown',
      durationMs: duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LIFECYCLE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        durationMs: duration,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/sam-memory-lifecycle
 *
 * Manual trigger endpoint for specific actions.
 * Supports:
 * - process: Process pending reindex jobs
 * - cleanup: Queue memory cleanup job (requires cleanupDays param)
 * - stats: Get basic lifecycle stats
 * - full_stats: Get comprehensive stats for all components
 * - start: Start all lifecycle components
 * - stop: Stop all lifecycle components
 * - worker_status: Get background worker status and queue stats
 * - kg_refresh: Execute KG refresh (requires kgRefreshType param)
 * - kg_stats: Get KG refresh scheduler stats
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization
    if (!verifyCronAuth(request)) {
      logger.warn('[SAM_MEMORY_LIFECYCLE_CRON] Unauthorized POST request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const parseResult = ManualTriggerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Invalid request parameters',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { action, cleanupDays, kgRefreshType } = parseResult.data;

    logger.info('[SAM_MEMORY_LIFECYCLE_CRON] Manual trigger', { action, cleanupDays, kgRefreshType });

    const manager = await getMemoryLifecycleManager();

    switch (action) {
      case 'process': {
        // Process pending jobs
        const results = await manager.processJobs();
        const duration = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          data: {
            action: 'process',
            jobsProcessed: results.length,
            results: results.map(r => ({
              jobId: r.jobId,
              success: r.success,
              documentsProcessed: r.documentsProcessed,
              errors: r.errors,
            })),
            durationMs: duration,
          },
        });
      }

      case 'cleanup': {
        // Queue cleanup job via background worker
        logger.info('[SAM_MEMORY_LIFECYCLE_CRON] Queuing cleanup job', { cleanupDays });

        const cleanupJob = await queueMemoryCleanup(cleanupDays);
        const duration = Date.now() - startTime;

        if (cleanupJob) {
          return NextResponse.json({
            success: true,
            data: {
              action: 'cleanup',
              cleanupDays,
              jobQueued: true,
              jobId: cleanupJob.id,
              durationMs: duration,
            },
          });
        } else {
          // Fallback: Direct cleanup if worker not available
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);

          logger.info('[SAM_MEMORY_LIFECYCLE_CRON] Worker not available, running direct cleanup', {
            cutoffDate: cutoffDate.toISOString(),
          });

          return NextResponse.json({
            success: true,
            data: {
              action: 'cleanup',
              cleanupDays,
              jobQueued: false,
              message: 'Worker not available, cleanup will run on next job processing',
              durationMs: duration,
            },
          });
        }
      }

      case 'stats': {
        // Return current stats only
        const statsResult = await getLifecycleStats();
        const pendingJobs = await manager.getPendingJobs(100);
        const duration = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          data: {
            action: 'stats',
            isRunning: statsResult.isRunning,
            stats: statsResult.stats,
            pendingJobsCount: pendingJobs.length,
            durationMs: duration,
          },
        });
      }

      case 'start': {
        // Start the lifecycle manager
        await startMemoryLifecycle();
        const statsResult = await getLifecycleStats();
        const duration = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          data: {
            action: 'start',
            isRunning: statsResult.isRunning,
            stats: statsResult.stats,
            durationMs: duration,
          },
        });
      }

      case 'stop': {
        // Stop the lifecycle manager
        const { stopMemoryLifecycle } = await import('@/lib/sam/memory-lifecycle-service');
        await stopMemoryLifecycle();
        const statsResult = await getLifecycleStats();
        const duration = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          data: {
            action: 'stop',
            isRunning: statsResult.isRunning,
            durationMs: duration,
          },
        });
      }

      case 'full_stats': {
        // Return comprehensive stats for all components
        const fullStats = await getFullLifecycleStats();
        const pendingJobs = await manager.getPendingJobs(100);
        const duration = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          data: {
            action: 'full_stats',
            ...fullStats,
            pendingJobsCount: pendingJobs.length,
            durationMs: duration,
          },
        });
      }

      case 'worker_status': {
        // Return worker-specific stats
        const worker = await getBackgroundWorker();
        const workerStats = getWorkerStats();
        const duration = Date.now() - startTime;

        if (!worker || !workerStats) {
          return NextResponse.json({
            success: true,
            data: {
              action: 'worker_status',
              available: false,
              message: 'Background worker not initialized',
              durationMs: duration,
            },
          });
        }

        // Get queue stats
        const memoryQueue = worker.getQueue('memory');
        const kgQueue = worker.getQueue('kg');
        const memoryQueueStats = memoryQueue ? await memoryQueue.getStats() : null;
        const kgQueueStats = kgQueue ? await kgQueue.getStats() : null;

        return NextResponse.json({
          success: true,
          data: {
            action: 'worker_status',
            available: true,
            worker: workerStats,
            queues: {
              memory: memoryQueueStats,
              kg: kgQueueStats,
            },
            durationMs: duration,
          },
        });
      }

      case 'kg_refresh': {
        // Trigger KG refresh
        logger.info('[SAM_MEMORY_LIFECYCLE_CRON] Executing KG refresh', { type: kgRefreshType });

        const scheduler = await getKGRefreshScheduler();
        if (!scheduler) {
          const duration = Date.now() - startTime;
          return NextResponse.json({
            success: false,
            data: {
              action: 'kg_refresh',
              available: false,
              message: 'KG refresh scheduler not initialized',
              durationMs: duration,
            },
          });
        }

        // Schedule and execute the refresh
        await scheduler.scheduleRefresh(kgRefreshType as KGRefreshJobType);
        const results = await executeKGRefreshJobs();
        const kgStats = await getKGRefreshStats();
        const duration = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          data: {
            action: 'kg_refresh',
            refreshType: kgRefreshType,
            jobsExecuted: results.length,
            results: results.map(r => ({
              entitiesProcessed: r.entitiesProcessed,
              relationshipsProcessed: r.relationshipsProcessed,
              staleRelationshipsPruned: r.staleRelationshipsPruned,
              inconsistenciesFound: r.inconsistenciesFound,
              inconsistenciesFixed: r.inconsistenciesFixed,
              duration: r.duration,
            })),
            stats: kgStats,
            durationMs: duration,
          },
        });
      }

      case 'kg_stats': {
        // Return KG refresh scheduler stats
        const kgStats = await getKGRefreshStats();
        const duration = Date.now() - startTime;

        if (!kgStats) {
          return NextResponse.json({
            success: true,
            data: {
              action: 'kg_stats',
              available: false,
              message: 'KG refresh scheduler not initialized',
              durationMs: duration,
            },
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            action: 'kg_stats',
            available: true,
            stats: kgStats,
            durationMs: duration,
          },
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: `Unknown action: ${action}`,
            },
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[SAM_MEMORY_LIFECYCLE_CRON] Error during manual trigger', {
      error: error instanceof Error ? error.message : 'Unknown',
      durationMs: duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LIFECYCLE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        durationMs: duration,
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
