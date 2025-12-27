/**
 * SAM Calibration Cron Route
 *
 * Triggers evaluation calibration + drift analysis.
 * Invoke via a scheduled cron job with ?apiKey=...
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  createEvaluationCalibrator,
  createInMemorySampleStore,
  createPrismaSampleStore,
} from '@/lib/sam/calibration';

export const runtime = 'nodejs';

async function resolveSampleStore() {
  try {
    const { db } = await import('@/lib/db');
    const prisma = db as unknown as { calibrationSample?: unknown };

    if (prisma && typeof prisma === 'object' && 'calibrationSample' in prisma) {
      return createPrismaSampleStore({ prisma });
    }
  } catch (error) {
    logger.warn('[SAM_CALIBRATION] Prisma store unavailable, using in-memory store.', error);
  }

  return createInMemorySampleStore();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const apiKey = searchParams.get('apiKey');
  const action = searchParams.get('action') ?? 'run';

  const expectedKey = process.env.SAM_CRON_API_KEY ?? process.env.CRON_API_KEY;
  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sampleStore = await resolveSampleStore();
    const calibrator = createEvaluationCalibrator({
      sampleStore,
      logger: logger,
      onAlert: (alert) => {
        logger.warn('[SAM_CALIBRATION] Alert:', alert);
      },
    });

    if (action === 'status') {
      const status = await calibrator.getStatus();
      return NextResponse.json({ status });
    }

    const result = await calibrator.calibrate();
    const status = await calibrator.getStatus();

    return NextResponse.json({
      result,
      status,
    });
  } catch (error) {
    logger.error('[SAM_CALIBRATION] Calibration failed:', error);
    return NextResponse.json(
      { error: 'Calibration failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
