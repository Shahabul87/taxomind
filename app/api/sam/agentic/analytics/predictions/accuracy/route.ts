/**
 * SAM Prediction Accuracy Tracking API
 * Tracks and reports on prediction accuracy over time
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

interface AccuracyMetrics {
  totalPredictions: number;
  verifiedPredictions: number;
  accuratePredictions: number;
  accuracyRate: number;
  avgConfidence: number;
  avgError: number;
  byType: Record<string, TypeMetrics>;
  calibration: CalibrationBucket[];
  trend: 'improving' | 'stable' | 'declining';
}

interface TypeMetrics {
  total: number;
  verified: number;
  accurate: number;
  accuracyRate: number;
  avgError: number;
}

interface CalibrationBucket {
  confidenceRange: string;
  predictedAccuracy: number;
  actualAccuracy: number;
  count: number;
  calibrationError: number;
}

// ============================================================================
// VALIDATION
// ============================================================================

const verifySchema = z.object({
  predictionId: z.string().min(1),
  actualValue: z.number().min(0).max(100),
  notes: z.string().optional(),
});

const querySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d'),
  type: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateAccuracyScore(predicted: number, actual: number): number {
  const error = Math.abs(predicted - actual);
  // Score is 1 - (error / 100), clamped between 0 and 1
  return Math.max(0, Math.min(1, 1 - error / 100));
}

function isAccurate(predicted: number, actual: number, threshold = 15): boolean {
  return Math.abs(predicted - actual) <= threshold;
}

function determineTrend(recentAccuracy: number, previousAccuracy: number): 'improving' | 'stable' | 'declining' {
  const diff = recentAccuracy - previousAccuracy;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;

  switch (period) {
    case '7d':
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
    default:
      start = new Date(0);
      break;
  }

  return { start, end };
}

// ============================================================================
// GET /api/sam/agentic/analytics/predictions/accuracy
// Get prediction accuracy metrics
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
      period: searchParams.get('period') ?? undefined,
      type: searchParams.get('type') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters' } },
        { status: 400 }
      );
    }

    const { period, type } = parsed.data;
    const { start, end } = getDateRange(period);

    // Fetch predictions with optional type filter
    const predictions = await db.sAMPrediction.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: start, lte: end },
        ...(type ? { type: type as SAMPredictionType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Calculate metrics
    const totalPredictions = predictions.length;
    const verifiedPredictions = predictions.filter(
      (p) => p.status === 'VERIFIED_ACCURATE' || p.status === 'VERIFIED_INACCURATE'
    );
    const verifiedCount = verifiedPredictions.length;
    const accurateCount = predictions.filter((p) => p.status === 'VERIFIED_ACCURATE').length;

    // Calculate averages
    let totalConfidence = 0;
    let totalError = 0;
    let errorCount = 0;

    for (const pred of predictions) {
      totalConfidence += pred.confidence;
      if (pred.actualValue !== null && pred.accuracyScore !== null) {
        totalError += 1 - pred.accuracyScore;
        errorCount++;
      }
    }

    const avgConfidence = totalPredictions > 0 ? totalConfidence / totalPredictions : 0;
    const avgError = errorCount > 0 ? totalError / errorCount : 0;
    const accuracyRate = verifiedCount > 0 ? accurateCount / verifiedCount : 0;

    // Calculate by type
    const byType: Record<string, TypeMetrics> = {};
    const types = ['GRADE', 'COMPLETION', 'MASTERY', 'ENGAGEMENT', 'RISK'] as const;

    for (const t of types) {
      const typePreds = predictions.filter((p) => p.type === t);
      const typeVerified = typePreds.filter(
        (p) => p.status === 'VERIFIED_ACCURATE' || p.status === 'VERIFIED_INACCURATE'
      );
      const typeAccurate = typePreds.filter((p) => p.status === 'VERIFIED_ACCURATE');

      let typeError = 0;
      let typeErrorCount = 0;
      for (const pred of typePreds) {
        if (pred.actualValue !== null && pred.accuracyScore !== null) {
          typeError += 1 - pred.accuracyScore;
          typeErrorCount++;
        }
      }

      byType[t] = {
        total: typePreds.length,
        verified: typeVerified.length,
        accurate: typeAccurate.length,
        accuracyRate: typeVerified.length > 0 ? typeAccurate.length / typeVerified.length : 0,
        avgError: typeErrorCount > 0 ? typeError / typeErrorCount : 0,
      };
    }

    // Calculate calibration buckets
    const calibrationBuckets: CalibrationBucket[] = [];
    const bucketRanges = [
      { min: 0, max: 20, label: '0-20%' },
      { min: 20, max: 40, label: '20-40%' },
      { min: 40, max: 60, label: '40-60%' },
      { min: 60, max: 80, label: '60-80%' },
      { min: 80, max: 100, label: '80-100%' },
    ];

    for (const range of bucketRanges) {
      const bucketPreds = verifiedPredictions.filter(
        (p) => p.confidence * 100 >= range.min && p.confidence * 100 < range.max
      );

      if (bucketPreds.length > 0) {
        const avgPredicted = bucketPreds.reduce((sum, p) => sum + p.confidence, 0) / bucketPreds.length;
        const actualAccurate = bucketPreds.filter((p) => p.status === 'VERIFIED_ACCURATE').length;
        const actualAccuracy = actualAccurate / bucketPreds.length;

        calibrationBuckets.push({
          confidenceRange: range.label,
          predictedAccuracy: avgPredicted,
          actualAccuracy,
          count: bucketPreds.length,
          calibrationError: Math.abs(avgPredicted - actualAccuracy),
        });
      }
    }

    // Calculate trend by comparing recent vs older predictions
    const midpoint = new Date((start.getTime() + end.getTime()) / 2);
    const recentPreds = verifiedPredictions.filter((p) => p.createdAt >= midpoint);
    const olderPreds = verifiedPredictions.filter((p) => p.createdAt < midpoint);

    const recentAccuracy =
      recentPreds.length > 0
        ? recentPreds.filter((p) => p.status === 'VERIFIED_ACCURATE').length / recentPreds.length
        : 0;
    const olderAccuracy =
      olderPreds.length > 0
        ? olderPreds.filter((p) => p.status === 'VERIFIED_ACCURATE').length / olderPreds.length
        : 0;

    const trend = determineTrend(recentAccuracy * 100, olderAccuracy * 100);

    const metrics: AccuracyMetrics = {
      totalPredictions,
      verifiedPredictions: verifiedCount,
      accuratePredictions: accurateCount,
      accuracyRate,
      avgConfidence,
      avgError,
      byType,
      calibration: calibrationBuckets,
      trend,
    };

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        period,
        dateRange: { start: start.toISOString(), end: end.toISOString() },
      },
    });
  } catch (error) {
    logger.error('Error getting prediction accuracy:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get accuracy metrics' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/sam/agentic/analytics/predictions/accuracy
// Verify a prediction outcome
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = verifySchema.parse(body);

    // Find the prediction
    const prediction = await db.sAMPrediction.findFirst({
      where: {
        id: validated.predictionId,
        userId: user.id,
      },
    });

    if (!prediction) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Prediction not found' } },
        { status: 404 }
      );
    }

    // Calculate accuracy
    const accuracyScore = calculateAccuracyScore(prediction.predictedValue, validated.actualValue);
    const accurate = isAccurate(prediction.predictedValue, validated.actualValue);
    const status: SAMPredictionStatus = accurate ? 'VERIFIED_ACCURATE' : 'VERIFIED_INACCURATE';

    // Update the prediction
    const updated = await db.sAMPrediction.update({
      where: { id: validated.predictionId },
      data: {
        actualValue: validated.actualValue,
        accuracyScore,
        status,
        verifiedAt: new Date(),
        verificationMethod: 'manual',
        notes: validated.notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        predicted: updated.predictedValue,
        actual: updated.actualValue,
        accuracyScore,
        status,
        isAccurate: accurate,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    logger.error('Error verifying prediction:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to verify prediction' } },
      { status: 500 }
    );
  }
}
