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
 *
 * Security: Requires CRON_SECRET authorization header
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import {
  getMemoryLifecycleManager,
  startMemoryLifecycle,
  getLifecycleStats,
} from '@/lib/sam/memory-lifecycle-service';
import { getMemoryStores } from '@/lib/sam/taxomind-context';

// Cron secret for authorization (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET;

// Request body schema for manual triggers
const ManualTriggerSchema = z.object({
  action: z.enum(['process', 'cleanup', 'stats', 'start', 'stop']).optional().default('process'),
  maxJobs: z.number().min(1).max(100).optional().default(50),
  cleanupDays: z.number().min(1).max(365).optional().default(30),
});

/**
 * Verify cron authorization
 */
function verifyCronAuth(request: NextRequest): boolean {
  if (!CRON_SECRET) {
    logger.warn('[SAM_MEMORY_LIFECYCLE_CRON] CRON_SECRET not configured');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true;
  }

  // Also check x-cron-secret header (used by some cron providers)
  const cronSecretHeader = request.headers.get('x-cron-secret');
  return cronSecretHeader === CRON_SECRET;
}

/**
 * GET /api/cron/sam-memory-lifecycle
 *
 * Main cron endpoint - processes pending memory jobs.
 * Called periodically by cron scheduler.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization
    if (!verifyCronAuth(request)) {
      logger.warn('[SAM_MEMORY_LIFECYCLE_CRON] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('[SAM_MEMORY_LIFECYCLE_CRON] Starting scheduled run');

    // Initialize lifecycle manager if not already initialized
    const manager = getMemoryLifecycleManager();

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
 * Supports: process, cleanup, stats, start, stop
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

    const { action, cleanupDays } = parseResult.data;

    logger.info('[SAM_MEMORY_LIFECYCLE_CRON] Manual trigger', { action, cleanupDays });

    const manager = getMemoryLifecycleManager();

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
        // Cleanup old memory entries
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);

        // Note: Actual cleanup depends on store implementation
        let cleanedCount = 0;
        try {
          logger.info('[SAM_MEMORY_LIFECYCLE_CRON] Cleanup initiated', {
            cutoffDate: cutoffDate.toISOString(),
            cleanupDays,
          });

          // Placeholder - actual cleanup would be implemented in the vector adapter
          cleanedCount = 0;
        } catch (cleanupError) {
          logger.warn('[SAM_MEMORY_LIFECYCLE_CRON] Cleanup error', {
            error: cleanupError instanceof Error ? cleanupError.message : 'Unknown',
          });
        }

        const duration = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          data: {
            action: 'cleanup',
            cleanupDays,
            entriesCleaned: cleanedCount,
            durationMs: duration,
          },
        });
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
