/**
 * SAM Proactive Scheduler Cron Job
 * Evaluates user activity and schedules proactive check-ins/interventions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getProactiveScheduler } from '@/lib/sam/agentic-proactive-scheduler';
import { dispatchInterventionNotifications } from '@/lib/sam/agentic-notifications';

const CRON_SECRET = process.env.CRON_SECRET;

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  notify: z.coerce.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      logger.warn('[SAM_PROACTIVE_CRON] Unauthorized cron access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      limit: searchParams.get('limit') ?? undefined,
      notify: searchParams.get('notify') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { limit, notify } = parsed.data;

    const users = await db.user.findMany({
      select: { id: true },
      take: limit ?? 500,
    });

    const scheduler = getProactiveScheduler();

    let processed = 0;
    let interventionsCreated = 0;
    let notificationsSent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        processed += 1;
        const result = await scheduler.evaluateAndSchedule(user.id);

        interventionsCreated += result.interventions.length;

        if (notify && result.interventions.length > 0) {
          await dispatchInterventionNotifications(user.id, result.interventions, {
            channels: ['auto'],
          });
          notificationsSent += result.interventions.length;
        }
      } catch (error) {
        failed += 1;
        logger.warn('[SAM_PROACTIVE_CRON] Scheduler evaluation failed', {
          userId: user.id,
          error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed,
        interventionsCreated,
        notificationsSent,
        failed,
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('[SAM_PROACTIVE_CRON] Error processing proactive scheduler:', error);
    return NextResponse.json({ error: 'Failed to process proactive scheduler' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
