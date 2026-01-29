/**
 * Bloom's Classification Feedback API Route
 *
 * Phase 5: Confidence Calibration Learning Loop
 * Collects feedback on Bloom's classifications to improve accuracy over time
 *
 * Endpoints:
 * - POST: Submit feedback on a classification
 * - GET: Retrieve calibration metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import crypto from 'crypto';
import type { BloomsFeedbackType } from '@prisma/client';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const FeedbackRequestSchema = z.object({
  // The content that was classified
  content: z.string().min(1, 'Content is required'),

  // Prediction data
  predictedLevel: z.number().int().min(1).max(6),
  predictedSubLevel: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
  predictedConfidence: z.number().min(0).max(1).default(0.5),

  // Correction data (at least one of these should be provided)
  actualLevel: z.number().int().min(1).max(6).optional(),
  actualSubLevel: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
  assessmentOutcome: z.number().min(0).max(1).optional(),

  // Feedback type
  feedbackType: z.enum(['EXPLICIT', 'IMPLICIT', 'EXPERT']).default('EXPLICIT'),

  // Context
  courseId: z.string().optional(),
  sectionId: z.string().optional(),

  // Metadata
  analysisMethod: z.enum(['keyword', 'ai', 'hybrid']).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a hash of content for deduplication and tracking
 */
function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ============================================================================
// POST HANDLER - Submit Feedback
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request
    const validationResult = FeedbackRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid request',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const {
      content,
      predictedLevel,
      predictedSubLevel,
      predictedConfidence,
      actualLevel,
      actualSubLevel,
      assessmentOutcome,
      feedbackType,
      courseId,
      sectionId,
      analysisMethod,
    } = validationResult.data;

    // Validate that at least some correction data is provided
    if (!actualLevel && !assessmentOutcome) {
      return NextResponse.json({
        error: 'At least one of actualLevel or assessmentOutcome must be provided',
      }, { status: 400 });
    }

    // Expert feedback requires ADMIN role
    if (feedbackType === 'EXPERT' && user.role !== 'ADMIN') {
      return NextResponse.json({
        error: 'Expert feedback requires ADMIN role',
      }, { status: 403 });
    }

    // Generate content hash
    const contentHash = generateContentHash(content);

    // Store feedback in database
    const feedback = await db.bloomsClassificationFeedback.create({
      data: {
        contentHash,
        predictedLevel,
        predictedSubLevel,
        predictedConfidence,
        actualLevel,
        actualSubLevel,
        assessmentOutcome,
        feedbackType: feedbackType as BloomsFeedbackType,
        userId: user.id,
        courseId,
        sectionId,
        analysisMethod,
      },
    });

    // Check if this provides enough data for recalibration
    const recentFeedbackCount = await db.bloomsClassificationFeedback.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    logger.info('Bloom\'s classification feedback recorded', {
      feedbackId: feedback.id,
      contentHash,
      predictedLevel,
      actualLevel,
      feedbackType,
      recentFeedbackCount,
    });

    return NextResponse.json({
      success: true,
      data: {
        feedbackId: feedback.id,
        contentHash,
        isCorrection: actualLevel !== undefined && actualLevel !== predictedLevel,
        message: 'Feedback recorded successfully',
      },
      metadata: {
        recentFeedbackCount,
        calibrationReady: recentFeedbackCount >= 100,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Bloom\'s feedback submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET HANDLER - Retrieve Calibration Metrics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodType = searchParams.get('periodType') ?? 'weekly';
    const includeDetails = searchParams.get('includeDetails') === 'true';

    // Get the latest calibration metrics
    const latestMetrics = await db.bloomsCalibrationMetrics.findFirst({
      where: { periodType },
      orderBy: { periodEnd: 'desc' },
    });

    // Get feedback statistics
    const feedbackStats = await db.bloomsClassificationFeedback.groupBy({
      by: ['feedbackType'],
      _count: true,
    });

    // Get accuracy by level (only where we have actual level data)
    const accuracyByLevel = await db.$queryRaw`
      SELECT
        "predictedLevel",
        COUNT(*) as total,
        SUM(CASE WHEN "predictedLevel" = "actualLevel" THEN 1 ELSE 0 END) as correct
      FROM "blooms_classification_feedback"
      WHERE "actualLevel" IS NOT NULL
      GROUP BY "predictedLevel"
      ORDER BY "predictedLevel"
    ` as Array<{ predictedLevel: number; total: bigint; correct: bigint }>;

    // Format accuracy data
    const accuracyData: Record<number, { correct: number; total: number; accuracy: number }> = {};
    for (const row of accuracyByLevel) {
      const total = Number(row.total);
      const correct = Number(row.correct);
      accuracyData[row.predictedLevel] = {
        correct,
        total,
        accuracy: total > 0 ? correct / total : 0,
      };
    }

    // Get recent feedback trend
    const recentFeedback = await db.bloomsClassificationFeedback.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    // Get feedback details if requested
    let feedbackDetails = null;
    if (includeDetails && user.role === 'ADMIN') {
      feedbackDetails = await db.bloomsClassificationFeedback.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          contentHash: true,
          predictedLevel: true,
          predictedSubLevel: true,
          actualLevel: true,
          actualSubLevel: true,
          feedbackType: true,
          createdAt: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        metrics: latestMetrics ? {
          totalSamples: latestMetrics.totalSamples,
          overallAccuracy: latestMetrics.overallAccuracy,
          expectedCalibrationError: latestMetrics.expectedCalibrationError,
          maxCalibrationError: latestMetrics.maxCalibrationError,
          confidenceAdjustment: latestMetrics.confidenceAdjustment,
          periodStart: latestMetrics.periodStart,
          periodEnd: latestMetrics.periodEnd,
        } : null,
        feedbackStats: feedbackStats.reduce((acc, stat) => {
          acc[stat.feedbackType] = stat._count;
          return acc;
        }, {} as Record<string, number>),
        accuracyByLevel: accuracyData,
        recentFeedbackCount: recentFeedback,
        calibrationReady: recentFeedback >= 100,
        ...(feedbackDetails && { feedbackDetails }),
      },
      metadata: {
        periodType,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Bloom\'s calibration metrics retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve calibration metrics' },
      { status: 500 }
    );
  }
}
