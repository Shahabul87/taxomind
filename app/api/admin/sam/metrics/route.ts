/**
 * SAM AI Observability Metrics API
 * Provides aggregated metrics for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { safeErrorResponse } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

interface MetricsResponse {
  success: boolean;
  data?: {
    toolMetrics: ToolMetricsData;
    confidenceMetrics: ConfidenceMetricsData;
    memoryMetrics: MemoryMetricsData;
    planMetrics: PlanMetricsData;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface ToolMetricsData {
  totalExecutions: number;
  successRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  confirmationRate: number;
  executionsByStatus: Record<string, number>;
  executionsByTool: Record<string, number>;
  recentExecutions: Array<{
    id: string;
    toolName: string;
    status: string;
    durationMs: number | null;
    createdAt: Date;
  }>;
}

interface ConfidenceMetricsData {
  totalPredictions: number;
  outcomesRecorded: number;
  avgPredictedConfidence: number;
  avgActualAccuracy: number;
  calibrationError: number;
  byResponseType: Array<{
    type: string;
    count: number;
    avgConfidence: number;
    accuracy: number;
  }>;
}

interface MemoryMetricsData {
  totalSearches: number;
  avgRelevanceScore: number;
  cacheHitRate: number;
  avgLatencyMs: number;
  emptyResultRate: number;
  bySource: Array<{
    source: string;
    count: number;
    avgRelevance: number;
    cacheHitRate: number;
  }>;
}

interface PlanMetricsData {
  totalEvents: number;
  activePlans: number;
  completedPlans: number;
  abandonedPlans: number;
  avgCompletionRate: number;
  eventsByType: Record<string, number>;
}

// ============================================================================
// HELPERS
// ============================================================================

function getTimeRange(range: string): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;

  switch (range) {
    case '1h':
      start = new Date(end.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.floor(sortedValues.length * percentile);
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

// ============================================================================
// API ROUTE
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse<MetricsResponse>> {
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin access required' },
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { timeRange = '24h' } = body;
    const { start, end } = getTimeRange(timeRange);

    // Fetch all metrics in parallel
    const [
      toolExecutions,
      confidenceScores,
      memoryRetrievals,
      planEvents,
    ] = await Promise.all([
      db.sAMToolExecution.findMany({
        where: {
          createdAt: { gte: start, lte: end },
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      db.sAMConfidenceScore.findMany({
        where: {
          predictedAt: { gte: start, lte: end },
        },
        take: 200,
      }),
      db.sAMMemoryRetrieval.findMany({
        where: {
          timestamp: { gte: start, lte: end },
        },
        take: 200,
      }),
      db.sAMPlanLifecycleEvent.findMany({
        where: {
          timestamp: { gte: start, lte: end },
        },
        take: 200,
      }),
    ]);

    // Calculate tool metrics
    const toolMetrics = calculateToolMetrics(toolExecutions);

    // Calculate confidence metrics
    const confidenceMetrics = calculateConfidenceMetrics(confidenceScores);

    // Calculate memory metrics
    const memoryMetrics = calculateMemoryMetrics(memoryRetrievals);

    // Calculate plan metrics
    const planMetrics = calculatePlanMetrics(planEvents);

    return NextResponse.json({
      success: true,
      data: {
        toolMetrics,
        confidenceMetrics,
        memoryMetrics,
        planMetrics,
      },
    });
  } catch (error) {
    logger.error('[SAM Metrics API] Error', error);
    return safeErrorResponse(error, 500, 'ADMIN_SAM_METRICS');
  }
}

// ============================================================================
// METRIC CALCULATIONS
// ============================================================================

interface ToolExecutionRow {
  id: string;
  toolName: string;
  status: string;
  durationMs: number | null;
  confirmationRequired: boolean;
  createdAt: Date;
}

function calculateToolMetrics(executions: ToolExecutionRow[]): ToolMetricsData {
  const total = executions.length;
  const successes = executions.filter(e => e.status === 'SUCCESS').length;
  const withConfirmation = executions.filter(e => e.confirmationRequired).length;

  const latencies = executions
    .filter(e => e.durationMs !== null)
    .map(e => e.durationMs as number)
    .sort((a, b) => a - b);

  const avgLatency = latencies.length > 0
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;

  const executionsByStatus: Record<string, number> = {};
  const executionsByTool: Record<string, number> = {};

  executions.forEach(e => {
    executionsByStatus[e.status] = (executionsByStatus[e.status] || 0) + 1;
    executionsByTool[e.toolName] = (executionsByTool[e.toolName] || 0) + 1;
  });

  return {
    totalExecutions: total,
    successRate: total > 0 ? successes / total : 0,
    avgLatencyMs: Math.round(avgLatency),
    p95LatencyMs: Math.round(calculatePercentile(latencies, 0.95)),
    confirmationRate: total > 0 ? withConfirmation / total : 0,
    executionsByStatus,
    executionsByTool,
    recentExecutions: executions.slice(0, 10).map(e => ({
      id: e.id,
      toolName: e.toolName,
      status: e.status,
      durationMs: e.durationMs,
      createdAt: e.createdAt,
    })),
  };
}

interface ConfidenceScoreRow {
  responseType: string;
  predictedConfidence: number;
  accurate: boolean | null;
}

function calculateConfidenceMetrics(predictions: ConfidenceScoreRow[]): ConfidenceMetricsData {
  const total = predictions.length;
  const withOutcomes = predictions.filter(p => p.accurate !== null);
  const accurate = withOutcomes.filter(p => p.accurate).length;

  const avgPredicted = total > 0
    ? predictions.reduce((sum, p) => sum + p.predictedConfidence, 0) / total
    : 0;

  const avgActual = withOutcomes.length > 0
    ? accurate / withOutcomes.length
    : 0;

  // Group by response type
  const byType: Record<string, { count: number; totalConfidence: number; accurate: number; withOutcome: number }> = {};

  predictions.forEach(p => {
    if (!byType[p.responseType]) {
      byType[p.responseType] = { count: 0, totalConfidence: 0, accurate: 0, withOutcome: 0 };
    }
    byType[p.responseType].count++;
    byType[p.responseType].totalConfidence += p.predictedConfidence;
    if (p.accurate !== null) {
      byType[p.responseType].withOutcome++;
      if (p.accurate) {
        byType[p.responseType].accurate++;
      }
    }
  });

  return {
    totalPredictions: total,
    outcomesRecorded: withOutcomes.length,
    avgPredictedConfidence: avgPredicted,
    avgActualAccuracy: avgActual,
    calibrationError: Math.abs(avgPredicted - avgActual),
    byResponseType: Object.entries(byType).map(([type, data]) => ({
      type,
      count: data.count,
      avgConfidence: data.count > 0 ? data.totalConfidence / data.count : 0,
      accuracy: data.withOutcome > 0 ? data.accurate / data.withOutcome : 0,
    })),
  };
}

interface MemoryRetrievalRow {
  source: string;
  resultCount: number;
  avgRelevanceScore: number;
  cacheHit: boolean;
  latencyMs: number;
}

function calculateMemoryMetrics(retrievals: MemoryRetrievalRow[]): MemoryMetricsData {
  const total = retrievals.length;
  const cacheHits = retrievals.filter(r => r.cacheHit).length;
  const emptyResults = retrievals.filter(r => r.resultCount === 0).length;

  const avgRelevance = total > 0
    ? retrievals.reduce((sum, r) => sum + r.avgRelevanceScore, 0) / total
    : 0;

  const avgLatency = total > 0
    ? retrievals.reduce((sum, r) => sum + r.latencyMs, 0) / total
    : 0;

  // Group by source
  const bySource: Record<string, { count: number; totalRelevance: number; cacheHits: number }> = {};

  retrievals.forEach(r => {
    if (!bySource[r.source]) {
      bySource[r.source] = { count: 0, totalRelevance: 0, cacheHits: 0 };
    }
    bySource[r.source].count++;
    bySource[r.source].totalRelevance += r.avgRelevanceScore;
    if (r.cacheHit) {
      bySource[r.source].cacheHits++;
    }
  });

  return {
    totalSearches: total,
    avgRelevanceScore: avgRelevance,
    cacheHitRate: total > 0 ? cacheHits / total : 0,
    avgLatencyMs: Math.round(avgLatency),
    emptyResultRate: total > 0 ? emptyResults / total : 0,
    bySource: Object.entries(bySource).map(([source, data]) => ({
      source,
      count: data.count,
      avgRelevance: data.count > 0 ? data.totalRelevance / data.count : 0,
      cacheHitRate: data.count > 0 ? data.cacheHits / data.count : 0,
    })),
  };
}

interface PlanEventRow {
  planId: string;
  eventType: string;
}

function calculatePlanMetrics(events: PlanEventRow[]): PlanMetricsData {
  const eventsByType: Record<string, number> = {};
  const planIds = new Set<string>();
  const completedPlanIds = new Set<string>();
  const abandonedPlanIds = new Set<string>();
  const activePlanIds = new Set<string>();

  events.forEach(e => {
    eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1;
    planIds.add(e.planId);

    if (e.eventType === 'completed') {
      completedPlanIds.add(e.planId);
    } else if (e.eventType === 'abandoned') {
      abandonedPlanIds.add(e.planId);
    } else if (e.eventType === 'activated' || e.eventType === 'step_started') {
      activePlanIds.add(e.planId);
    }
  });

  // Remove completed and abandoned from active
  completedPlanIds.forEach(id => activePlanIds.delete(id));
  abandonedPlanIds.forEach(id => activePlanIds.delete(id));

  const totalPlans = planIds.size;
  const completedCount = completedPlanIds.size;
  const completionRate = totalPlans > 0
    ? completedCount / totalPlans
    : 0;

  return {
    totalEvents: events.length,
    activePlans: activePlanIds.size,
    completedPlans: completedCount,
    abandonedPlans: abandonedPlanIds.size,
    avgCompletionRate: completionRate,
    eventsByType,
  };
}
