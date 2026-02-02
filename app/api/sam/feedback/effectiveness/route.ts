/**
 * Mode Effectiveness Analytics Endpoint
 *
 * Returns aggregated mode effectiveness scores from both
 * in-memory Bayesian tracking and database feedback records.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { getModeEffectivenessScores, getAllPresetScores } from '@/lib/sam/pipeline/preset-tracker';

interface EffectivenessResponse {
  modes: Record<string, {
    score: number;
    usageCount: number;
    positiveCount: number;
    negativeCount: number;
  }>;
  presets: Array<{
    preset: string;
    bayesianScore: number;
    positiveCount: number;
    negativeCount: number;
    totalUsages: number;
  }>;
  dbFeedbackSummary: Array<{
    modeId: string;
    totalFeedback: number;
    helpfulCount: number;
    notHelpfulCount: number;
  }>;
}

export async function GET(): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          metadata: { timestamp, requestId },
        },
        { status: 401 },
      );
    }

    // In-memory mode effectiveness scores
    const modeScores = getModeEffectivenessScores();

    // In-memory preset scores
    const presetScores = getAllPresetScores().map((p) => ({
      preset: p.preset,
      bayesianScore: p.bayesianScore,
      positiveCount: p.positiveCount,
      negativeCount: p.negativeCount,
      totalUsages: p.totalUsages,
    }));

    // Database feedback grouped by modeId
    let dbFeedbackSummary: EffectivenessResponse['dbFeedbackSummary'] = [];
    try {
      const dbResults = await db.sAMFeedback.groupBy({
        by: ['modeId'],
        _count: { id: true, rating: true },
        where: { modeId: { not: null } },
      });

      // Get helpful counts per mode
      const helpfulCounts = await db.sAMFeedback.groupBy({
        by: ['modeId'],
        _count: { id: true },
        where: { modeId: { not: null }, rating: 'HELPFUL' },
      });

      const helpfulMap = new Map<string, number>();
      for (const row of helpfulCounts) {
        if (row.modeId) helpfulMap.set(row.modeId, row._count.id);
      }

      dbFeedbackSummary = dbResults
        .filter((r) => r.modeId !== null)
        .map((r) => ({
          modeId: r.modeId as string,
          totalFeedback: r._count.id,
          helpfulCount: helpfulMap.get(r.modeId as string) ?? 0,
          notHelpfulCount: r._count.id - (helpfulMap.get(r.modeId as string) ?? 0),
        }));
    } catch (dbError) {
      logger.warn('[SAM_EFFECTIVENESS] DB query failed:', dbError);
    }

    const data: EffectivenessResponse = {
      modes: modeScores,
      presets: presetScores,
      dbFeedbackSummary,
    };

    return NextResponse.json({
      success: true,
      data,
      metadata: { timestamp, requestId },
    });
  } catch (error) {
    logger.error('[SAM_EFFECTIVENESS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch effectiveness data' },
        metadata: { timestamp, requestId },
      },
      { status: 500 },
    );
  }
}
