/**
 * SAM Agentic Quality Analytics API
 * Provides quality metrics including confidence calibration, memory quality, and tool performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCombinedSession } from '@/lib/auth/combined-session';
import { logger } from '@/lib/logger';
import { getSAMTelemetryService } from '@/lib/sam/telemetry';

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  hours: z.coerce.number().int().min(1).max(168).optional(),
  period: z.enum(['day', 'week', 'month']).optional(),
  metric: z.enum(['calibration', 'memory', 'tools', 'all']).optional().default('all'),
  includeBreakdown: z.coerce.boolean().optional().default(true),
});

// Convert period to hours
function periodToHours(period?: string): number {
  switch (period) {
    case 'day': return 24;
    case 'week': return 168;
    case 'month': return 720;
    default: return 24;
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface QualityMetrics {
  period: {
    start: string;
    end: string;
    hours: number;
  };
  calibration?: {
    predictionCount: number;
    outcomesRecorded: number;
    avgPredictedConfidence: number;
    avgActualAccuracy: number;
    calibrationError: number;
    brierScore: number;
    calibrationBuckets?: Array<{
      rangeStart: number;
      rangeEnd: number;
      count: number;
      avgPredicted: number;
      actualAccuracy: number;
      error: number;
    }>;
    byResponseType?: Record<string, {
      predictionCount: number;
      avgPredictedConfidence: number;
      avgActualAccuracy: number;
      calibrationError: number;
    }>;
  };
  memory?: {
    searchCount: number;
    avgRelevanceScore: number;
    medianRelevanceScore: number;
    cacheHitRate: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    emptyResultRate: number;
    positiveFeedbackRate: number;
    bySource?: Record<string, {
      searchCount: number;
      avgRelevanceScore: number;
      avgLatencyMs: number;
      cacheHitRate: number;
    }>;
  };
  tools?: {
    executionCount: number;
    successRate: number;
    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    confirmationRate: number;
    confirmationAcceptRate: number;
    failuresByCode?: Record<string, number>;
    executionsByTool?: Record<string, number>;
  };
  summary: {
    overallQualityScore: number;
    calibrationScore: number;
    memoryScore: number;
    toolsScore: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateQualityScore(calibrationError: number, successRate: number, avgRelevance: number): number {
  // Weight: calibration 30%, tools 40%, memory 30%
  const calibrationScore = Math.max(0, 1 - calibrationError);
  const toolsScore = successRate;
  const memoryScore = avgRelevance;

  return (calibrationScore * 0.3) + (toolsScore * 0.4) + (memoryScore * 0.3);
}

// ============================================================================
// GET /api/sam/agentic/analytics/quality
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Support both user and admin authentication
    const session = await getCombinedSession();
    if (!session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      hours: searchParams.get('hours'),
      period: searchParams.get('period'),
      metric: searchParams.get('metric'),
      includeBreakdown: searchParams.get('includeBreakdown'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Use hours if provided, otherwise convert period to hours
    const hours = parsed.data.hours ?? periodToHours(parsed.data.period);
    const { metric, includeBreakdown } = parsed.data;

    const telemetry = getSAMTelemetryService();
    telemetry.start();

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);

    const qualityMetrics: QualityMetrics = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        hours,
      },
      summary: {
        overallQualityScore: 0,
        calibrationScore: 0,
        memoryScore: 0,
        toolsScore: 0,
        trend: 'stable',
      },
    };

    // Get calibration metrics
    if (metric === 'all' || metric === 'calibration') {
      const days = Math.ceil(hours / 24);
      const calibrationData = await telemetry.getCalibrationMetrics(days);

      qualityMetrics.calibration = {
        predictionCount: calibrationData.predictionCount,
        outcomesRecorded: calibrationData.outcomesRecorded,
        avgPredictedConfidence: calibrationData.avgPredictedConfidence,
        avgActualAccuracy: calibrationData.avgActualAccuracy,
        calibrationError: calibrationData.calibrationError,
        brierScore: calibrationData.brierScore,
      };

      if (includeBreakdown) {
        qualityMetrics.calibration.calibrationBuckets = calibrationData.calibrationBuckets;
        qualityMetrics.calibration.byResponseType = calibrationData.byResponseType;
      }

      qualityMetrics.summary.calibrationScore = Math.max(0, 1 - calibrationData.calibrationError);
    }

    // Get memory metrics
    if (metric === 'all' || metric === 'memory') {
      const minutes = hours * 60;
      const memoryData = await telemetry.getMemoryMetrics(minutes);

      qualityMetrics.memory = {
        searchCount: memoryData.searchCount,
        avgRelevanceScore: memoryData.avgRelevanceScore,
        medianRelevanceScore: memoryData.medianRelevanceScore,
        cacheHitRate: memoryData.cacheHitRate,
        avgLatencyMs: memoryData.avgLatencyMs,
        p95LatencyMs: memoryData.p95LatencyMs,
        emptyResultRate: memoryData.emptyResultRate,
        positiveFeedbackRate: memoryData.positiveFeedbackRate,
      };

      if (includeBreakdown) {
        qualityMetrics.memory.bySource = memoryData.bySource;
      }

      qualityMetrics.summary.memoryScore = memoryData.avgRelevanceScore;
    }

    // Get tool metrics
    if (metric === 'all' || metric === 'tools') {
      const minutes = hours * 60;
      const toolsData = await telemetry.getToolMetrics(minutes);

      qualityMetrics.tools = {
        executionCount: toolsData.executionCount,
        successRate: toolsData.successRate,
        avgLatencyMs: toolsData.avgLatencyMs,
        p50LatencyMs: toolsData.p50LatencyMs,
        p95LatencyMs: toolsData.p95LatencyMs,
        p99LatencyMs: toolsData.p99LatencyMs,
        confirmationRate: toolsData.confirmationRate,
        confirmationAcceptRate: toolsData.confirmationAcceptRate,
      };

      if (includeBreakdown) {
        qualityMetrics.tools.failuresByCode = toolsData.failuresByCode;
        qualityMetrics.tools.executionsByTool = toolsData.executionsByTool;
      }

      qualityMetrics.summary.toolsScore = toolsData.successRate;
    }

    // Calculate overall quality score
    qualityMetrics.summary.overallQualityScore = calculateQualityScore(
      qualityMetrics.calibration?.calibrationError ?? 0,
      qualityMetrics.tools?.successRate ?? 1,
      qualityMetrics.memory?.avgRelevanceScore ?? 1
    );

    return NextResponse.json({
      success: true,
      data: qualityMetrics,
    });
  } catch (error) {
    logger.error('Error fetching quality metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quality metrics' },
      { status: 500 }
    );
  }
}
