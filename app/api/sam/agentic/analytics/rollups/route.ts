/**
 * SAM Agentic Analytics Rollups API
 * Generates scheduled progress rollups for learning analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { generateProgressRollup, type RollupPeriod } from '@/lib/sam/analytics-rollups';

const CRON_SECRET = process.env.CRON_SECRET;

const querySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily'),
  userId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

// ============================================================================
// GET /api/sam/agentic/analytics/rollups
// ============================================================================

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      logger.warn('[SAM_ROLLUPS] Unauthorized cron access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      period: searchParams.get('period') ?? undefined,
      userId: searchParams.get('userId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { period, userId, limit } = parsed.data;

    const users = userId
      ? [{ id: userId }]
      : await db.user.findMany({
          select: { id: true },
          take: limit ?? 250,
        });

    const results: Array<{ userId: string; status: 'ok' | 'failed' }> = [];
    let successCount = 0;

    for (const user of users) {
      try {
        await generateProgressRollup(user.id, period as RollupPeriod);

        results.push({ userId: user.id, status: 'ok' });
        successCount += 1;
      } catch (error) {
        logger.warn('[SAM_ROLLUPS] Failed to generate rollup', {
          userId: user.id,
          error,
        });
        results.push({ userId: user.id, status: 'failed' });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        succeeded: successCount,
        failed: results.length - successCount,
        durationMs: Date.now() - startTime,
        period,
        results,
      },
    });
  } catch (error) {
    logger.error('[SAM_ROLLUPS] Error generating rollups:', error);
    return NextResponse.json(
      { error: 'Failed to generate rollups' },
      { status: 500 }
    );
  }
}
