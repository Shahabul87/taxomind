/**
 * SAM Prediction History API
 * Provides historical prediction data for visualization
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import type { SAMPredictionType, SAMPredictionStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface PredictionHistoryItem {
  id: string;
  type: string;
  title: string;
  predictedValue: number;
  actualValue: number | null;
  confidence: number;
  accuracyScore: number | null;
  status: string;
  createdAt: string;
  verifiedAt: string | null;
  courseId: string | null;
  skillId: string | null;
}

interface PredictionHistoryStats {
  total: number;
  pending: number;
  verified: number;
  accurate: number;
  avgAccuracy: number;
  recentTrend: {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  type: z.string().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'VERIFIED_ACCURATE', 'VERIFIED_INACCURATE']).optional(),
  period: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d'),
});

// ============================================================================
// GET /api/sam/agentic/analytics/predictions/history
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      period: searchParams.get('period') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters' } },
        { status: 400 }
      );
    }

    const { limit, offset, type, status, period } = parsed.data;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    // Build where clause
    const where: {
      userId: string;
      createdAt?: { gte: Date };
      type?: SAMPredictionType;
      status?: SAMPredictionStatus;
    } = {
      userId: user.id,
      createdAt: { gte: startDate },
    };

    if (type) {
      where.type = type as SAMPredictionType;
    }
    if (status) {
      where.status = status as SAMPredictionStatus;
    }

    // Fetch predictions with pagination
    const [predictions, totalCount] = await Promise.all([
      db.sAMPrediction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.sAMPrediction.count({ where }),
    ]);

    // Map to response format
    const history: PredictionHistoryItem[] = predictions.map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      predictedValue: p.predictedValue,
      actualValue: p.actualValue,
      confidence: p.confidence,
      accuracyScore: p.accuracyScore,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      verifiedAt: p.verifiedAt?.toISOString() ?? null,
      courseId: p.courseId,
      skillId: p.skillId,
    }));

    // Calculate stats
    const allPredictions = await db.sAMPrediction.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        accuracyScore: true,
        createdAt: true,
      },
      take: 500,
    });

    const pendingCount = allPredictions.filter((p) => p.status === 'ACTIVE' || p.status === 'EXPIRED').length;
    const verifiedPreds = allPredictions.filter(
      (p) => p.status === 'VERIFIED_ACCURATE' || p.status === 'VERIFIED_INACCURATE'
    );
    const accurateCount = allPredictions.filter((p) => p.status === 'VERIFIED_ACCURATE').length;

    // Calculate average accuracy
    const accuracyScores = verifiedPreds
      .filter((p) => p.accuracyScore !== null)
      .map((p) => p.accuracyScore as number);
    const avgAccuracy = accuracyScores.length > 0
      ? accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length
      : 0;

    // Calculate recent trend (compare last 7 days to previous 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentVerified = verifiedPreds.filter((p) => p.createdAt >= sevenDaysAgo);
    const olderVerified = verifiedPreds.filter(
      (p) => p.createdAt >= fourteenDaysAgo && p.createdAt < sevenDaysAgo
    );

    const recentAccurate = recentVerified.filter((p) =>
      allPredictions.find((ap) => ap === p)?.status === 'VERIFIED_ACCURATE'
    ).length;
    const olderAccurate = olderVerified.filter((p) =>
      allPredictions.find((ap) => ap === p)?.status === 'VERIFIED_ACCURATE'
    ).length;

    const recentRate = recentVerified.length > 0 ? recentAccurate / recentVerified.length : 0;
    const olderRate = olderVerified.length > 0 ? olderAccurate / olderVerified.length : 0;
    const changePercent = olderRate > 0 ? ((recentRate - olderRate) / olderRate) * 100 : 0;

    const stats: PredictionHistoryStats = {
      total: allPredictions.length,
      pending: pendingCount,
      verified: verifiedPreds.length,
      accurate: accurateCount,
      avgAccuracy,
      recentTrend: {
        direction: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable',
        changePercent: Math.abs(changePercent),
      },
    };

    // Generate timeline data for charts
    const timelineData = generateTimelineData(allPredictions, period);

    return NextResponse.json({
      success: true,
      data: {
        history,
        stats,
        timeline: timelineData,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
    });
  } catch (error) {
    logger.error('Error getting prediction history:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get prediction history' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface TimelinePoint {
  date: string;
  total: number;
  verified: number;
  accurate: number;
  accuracyRate: number;
}

function generateTimelineData(
  predictions: Array<{
    status: SAMPredictionStatus;
    accuracyScore: number | null;
    createdAt: Date;
  }>,
  period: string
): TimelinePoint[] {
  const timeline: TimelinePoint[] = [];

  // Determine granularity based on period
  let intervalDays: number;
  let numIntervals: number;

  switch (period) {
    case '7d':
      intervalDays = 1;
      numIntervals = 7;
      break;
    case '30d':
      intervalDays = 3;
      numIntervals = 10;
      break;
    case '90d':
      intervalDays = 7;
      numIntervals = 13;
      break;
    default:
      intervalDays = 30;
      numIntervals = 12;
      break;
  }

  const now = new Date();

  for (let i = numIntervals - 1; i >= 0; i--) {
    const endDate = new Date(now.getTime() - i * intervalDays * 24 * 60 * 60 * 1000);
    const startDate = new Date(endDate.getTime() - intervalDays * 24 * 60 * 60 * 1000);

    const intervalPreds = predictions.filter(
      (p) => p.createdAt >= startDate && p.createdAt < endDate
    );

    const verified = intervalPreds.filter(
      (p) => p.status === 'VERIFIED_ACCURATE' || p.status === 'VERIFIED_INACCURATE'
    );
    const accurate = intervalPreds.filter((p) => p.status === 'VERIFIED_ACCURATE');

    timeline.push({
      date: endDate.toISOString().split('T')[0],
      total: intervalPreds.length,
      verified: verified.length,
      accurate: accurate.length,
      accuracyRate: verified.length > 0 ? accurate.length / verified.length : 0,
    });
  }

  return timeline;
}
