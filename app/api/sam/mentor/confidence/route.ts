/**
 * SAM AI Mentor - Confidence Calibration API
 *
 * Tracks and analyzes student confidence vs actual performance
 * to improve metacognitive awareness.
 *
 * Note: Uses SAMInteraction model for storage until dedicated model is added.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Request validation schemas
const GetCalibrationSchema = z.object({
  topicId: z.string().optional(),
  courseId: z.string().uuid().optional(),
  days: z.number().min(1).max(365).optional().default(30),
});

const LogConfidenceSchema = z.object({
  questionId: z.string().min(1),
  topicId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  isCorrect: z.boolean().optional(),
  timeSpent: z.number().min(0).default(0),
});

// Type for confidence log context stored in SAMInteraction
interface ConfidenceLogContext {
  type: 'confidence_log';
  questionId: string;
  topicId: string;
  confidence: number;
  isCorrect: boolean;
  wasOverconfident: boolean;
  wasUnderconfident: boolean;
  timeSpent: number;
}

/**
 * GET - Get confidence calibration analytics
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = GetCalibrationSchema.parse({
      topicId: searchParams.get('topicId') || undefined,
      courseId: searchParams.get('courseId') || undefined,
      days: searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validatedParams.days);

    // Get confidence logs from SAMInteraction (filter by context type)
    const interactions = await db.sAMInteraction.findMany({
      where: {
        userId: user.id,
        interactionType: 'ANALYTICS_VIEW',
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Filter to only confidence logs and extract context
    const logs = interactions
      .filter(i => {
        const ctx = i.context as Record<string, unknown> | null;
        return ctx?.type === 'confidence_log';
      })
      .map(i => {
        const ctx = i.context as unknown as ConfidenceLogContext;
        return {
          id: i.id,
          questionId: ctx.questionId,
          topicId: ctx.topicId,
          confidence: ctx.confidence,
          isCorrect: ctx.isCorrect,
          wasOverconfident: ctx.wasOverconfident,
          wasUnderconfident: ctx.wasUnderconfident,
          timeSpent: ctx.timeSpent,
          createdAt: i.createdAt,
        };
      })
      .filter(log => !validatedParams.topicId || log.topicId === validatedParams.topicId)
      .slice(0, 100);

    if (logs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No confidence data available yet. Complete more assessments to track calibration.',
          calibration: null,
        },
      });
    }

    // Calculate overall calibration metrics
    let overconfidentCount = 0;
    let underconfidentCount = 0;
    let calibratedCount = 0;

    for (const log of logs) {
      if (log.wasOverconfident) {
        overconfidentCount++;
      } else if (log.wasUnderconfident) {
        underconfidentCount++;
      } else {
        calibratedCount++;
      }
    }

    // Calculate average confidence for correct vs incorrect answers
    const correctLogs = logs.filter(l => l.isCorrect);
    const incorrectLogs = logs.filter(l => !l.isCorrect);

    const avgConfidenceWhenCorrect = correctLogs.length > 0
      ? correctLogs.reduce((sum, l) => sum + l.confidence, 0) / correctLogs.length
      : 0;

    const avgConfidenceWhenIncorrect = incorrectLogs.length > 0
      ? incorrectLogs.reduce((sum, l) => sum + l.confidence, 0) / incorrectLogs.length
      : 0;

    // Calibration score: Higher is better (1 = perfect calibration)
    const calibrationGap = avgConfidenceWhenCorrect - avgConfidenceWhenIncorrect;
    const calibrationScore = Math.max(0, Math.min(1, 0.5 + calibrationGap / 2));

    // Calculate by topic
    const topicStats: Record<string, {
      correct: number;
      total: number;
      confidenceSum: number;
      overconfident: number;
      underconfident: number;
    }> = {};

    for (const log of logs) {
      if (!topicStats[log.topicId]) {
        topicStats[log.topicId] = { correct: 0, total: 0, confidenceSum: 0, overconfident: 0, underconfident: 0 };
      }
      topicStats[log.topicId].total++;
      topicStats[log.topicId].confidenceSum += log.confidence;
      if (log.isCorrect) topicStats[log.topicId].correct++;
      if (log.wasOverconfident) topicStats[log.topicId].overconfident++;
      if (log.wasUnderconfident) topicStats[log.topicId].underconfident++;
    }

    const topicCalibration = Object.entries(topicStats).map(([topicId, stats]) => {
      const accuracy = stats.correct / stats.total;
      const avgConfidence = stats.confidenceSum / stats.total;
      const calibrationError = Math.abs(accuracy - avgConfidence);

      return {
        topicId,
        accuracy,
        avgConfidence,
        calibrationError,
        overconfidentPercent: (stats.overconfident / stats.total) * 100,
        underconfidentPercent: (stats.underconfident / stats.total) * 100,
        sampleSize: stats.total,
        trend: stats.total >= 5
          ? stats.overconfident > stats.underconfident ? 'overconfident' : 'underconfident'
          : 'insufficient_data',
      };
    });

    topicCalibration.sort((a, b) => b.calibrationError - a.calibrationError);

    // Generate insights
    const insights: string[] = [];

    if (calibrationScore > 0.8) {
      insights.push('Excellent calibration! Your confidence levels accurately reflect your knowledge.');
    } else if (calibrationScore > 0.6) {
      insights.push('Good calibration. Minor adjustments could improve accuracy.');
    } else if (calibrationScore > 0.4) {
      insights.push('Moderate calibration. Consider being more thoughtful about confidence ratings.');
    } else {
      insights.push('Poor calibration. Your confidence ratings differ significantly from actual performance.');
    }

    if (overconfidentCount > calibratedCount) {
      insights.push('Tendency toward overconfidence detected. Consider being more conservative in predictions.');
    } else if (underconfidentCount > calibratedCount) {
      insights.push('Tendency toward underconfidence detected. You may know more than you think!');
    }

    const worstTopics = topicCalibration.slice(0, 3).filter(t => t.calibrationError > 0.2);
    if (worstTopics.length > 0) {
      insights.push(`Topics needing calibration work: ${worstTopics.map(t => t.topicId).join(', ')}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        overallCalibration: {
          calibrationScore,
          avgConfidenceWhenCorrect,
          avgConfidenceWhenIncorrect,
          overconfidentPercent: (overconfidentCount / logs.length) * 100,
          underconfidentPercent: (underconfidentCount / logs.length) * 100,
          calibratedPercent: (calibratedCount / logs.length) * 100,
          totalSamples: logs.length,
          accuracy: (correctLogs.length / logs.length) * 100,
        },
        byTopic: topicCalibration,
        insights,
        recentLogs: logs.slice(0, 10).map(log => ({
          questionId: log.questionId,
          topicId: log.topicId,
          confidence: log.confidence,
          isCorrect: log.isCorrect,
          wasOverconfident: log.wasOverconfident,
          wasUnderconfident: log.wasUnderconfident,
          timeSpent: log.timeSpent,
          createdAt: log.createdAt.toISOString(),
        })),
      },
    });

  } catch (error) {
    logger.error('[CONFIDENCE] Get calibration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request parameters', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get calibration data' } },
      { status: 500 }
    );
  }
}

/**
 * POST - Log a new confidence prediction
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = LogConfidenceSchema.parse(body);

    const { questionId, topicId, confidence, isCorrect, timeSpent } = validatedData;

    // Determine calibration status if we have the result
    let wasOverconfident = false;
    let wasUnderconfident = false;

    if (isCorrect !== undefined) {
      wasOverconfident = confidence > 0.7 && !isCorrect;
      wasUnderconfident = confidence < 0.3 && isCorrect;
    }

    // Store as SAMInteraction with context
    const interaction = await db.sAMInteraction.create({
      data: {
        userId: user.id,
        interactionType: 'ANALYTICS_VIEW',
        context: {
          type: 'confidence_log',
          questionId,
          topicId,
          confidence,
          isCorrect: isCorrect ?? false,
          wasOverconfident,
          wasUnderconfident,
          timeSpent,
        } satisfies ConfidenceLogContext,
        actionTaken: 'confidence_logged',
      },
    });

    // Generate immediate feedback
    let feedback: string | null = null;
    if (isCorrect !== undefined) {
      if (!wasOverconfident && !wasUnderconfident) {
        feedback = 'Good calibration! Your confidence matched your performance.';
      } else if (wasOverconfident) {
        feedback = 'You were overconfident here. Consider studying this topic more.';
      } else if (wasUnderconfident) {
        feedback = 'You underestimated yourself! You know more than you think.';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: interaction.id,
        questionId,
        topicId,
        confidence,
        isCorrect,
        wasOverconfident,
        wasUnderconfident,
        feedback,
      },
    });

  } catch (error) {
    logger.error('[CONFIDENCE] Log confidence error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to log confidence' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a confidence log with actual result
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { logId, isCorrect } = z.object({
      logId: z.string(),
      isCorrect: z.boolean(),
    }).parse(body);

    // Verify ownership
    const interaction = await db.sAMInteraction.findFirst({
      where: { id: logId, userId: user.id },
    });

    if (!interaction) {
      return NextResponse.json(
        { success: false, error: { code: 'LOG_NOT_FOUND', message: 'Confidence log not found' } },
        { status: 404 }
      );
    }

    const ctx = interaction.context as ConfidenceLogContext | null;
    if (!ctx || ctx.type !== 'confidence_log') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_LOG', message: 'Not a confidence log' } },
        { status: 400 }
      );
    }

    // Calculate calibration status
    const wasOverconfident = ctx.confidence > 0.7 && !isCorrect;
    const wasUnderconfident = ctx.confidence < 0.3 && isCorrect;

    // Update the context
    const updatedContext: ConfidenceLogContext = {
      ...ctx,
      isCorrect,
      wasOverconfident,
      wasUnderconfident,
    };

    await db.sAMInteraction.update({
      where: { id: logId },
      data: {
        context: updatedContext,
      },
    });

    // Generate feedback
    let feedback: string;
    if (!wasOverconfident && !wasUnderconfident) {
      feedback = 'Good calibration! Your confidence matched your performance.';
    } else if (wasOverconfident) {
      feedback = 'You were overconfident. Consider being more conservative next time.';
    } else {
      feedback = 'You underestimated yourself! Trust your knowledge more.';
    }

    return NextResponse.json({
      success: true,
      data: {
        id: logId,
        questionId: ctx.questionId,
        topicId: ctx.topicId,
        confidence: ctx.confidence,
        isCorrect,
        wasOverconfident,
        wasUnderconfident,
        feedback,
      },
    });

  } catch (error) {
    logger.error('[CONFIDENCE] Update confidence error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update confidence log' } },
      { status: 500 }
    );
  }
}
