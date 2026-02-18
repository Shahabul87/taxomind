/**
 * SAM Analytics Rollups Cron Job
 * Queues progress rollups for all users on a schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { z } from 'zod';
import { generateProgressRollup, type RollupPeriod } from '@/lib/sam/analytics-rollups';
import { withCronAuth } from '@/lib/api/cron-auth';
const DEFAULT_QUEUE = process.env.SAM_AGENTIC_QUEUE ?? 'agentic';

const querySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily'),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization (fail-closed)
    const authResponse = withCronAuth(req);
    if (authResponse) return authResponse;

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      period: searchParams.get('period') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { period, limit } = parsed.data;

    const users = await db.user.findMany({
      select: { id: true },
      take: limit ?? 500,
    });

    let queued = 0;
    let processed = 0;
    let failed = 0;

    let queueManager: typeof import('@/lib/queue/queue-manager').queueManager | null = null;

    try {
      const queueModule = await import('@/lib/queue/queue-manager');
      queueManager = queueModule.queueManager;
    } catch (error) {
      logger.warn('[SAM_ROLLUPS_CRON] Queue manager unavailable, falling back to inline processing', error);
      queueManager = null;
    }

    for (const user of users) {
      try {
        if (queueManager) {
          await queueManager.addJob(
            DEFAULT_QUEUE,
            'sam-analytics-rollup',
            {
              userId: user.id,
              period,
            },
            { removeOnComplete: 50, removeOnFail: 20 }
          );
          queued += 1;
        } else {
          await generateProgressRollup(user.id, period as RollupPeriod);
          processed += 1;
        }
      } catch (error) {
        failed += 1;
        logger.warn('[SAM_ROLLUPS_CRON] Rollup failed', { userId: user.id, error });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        period,
        queued,
        processed,
        failed,
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('[SAM_ROLLUPS_CRON] Error processing rollups:', error);
    return NextResponse.json({ error: 'Failed to process rollups' }, { status: 500 });
  }
}
