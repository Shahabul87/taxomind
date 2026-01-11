/**
 * @sam-ai/adapter-prisma - Observability Store
 * Database-backed implementation for metrics, tool telemetry, and confidence calibration
 */

import type {
  ToolExecutionEvent,
  ToolMetrics,
  MemoryRetrievalEvent,
  MemoryQualityMetrics,
  ConfidencePrediction,
  ConfidenceOutcome,
  VerificationMethod,
  CalibrationMetrics,
  PlanLifecycleEvent,
  ConfidencePredictionStore,
} from '@sam-ai/agentic';

import {
  // Use renamed exports to avoid conflicts with tool-registry types
  TelemetryToolExecutionStatus as ToolExecutionStatus,
  TelemetryMemorySource as MemorySource,
  TelemetryResponseType as ResponseType,
} from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

export interface PrismaObservabilityStoreConfig {
  prisma: PrismaClient;
}

// Prisma client type
type PrismaClient = {
  sAMMetric: {
    create: (args: Record<string, unknown>) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
    groupBy: (args: Record<string, unknown>) => Promise<unknown[]>;
    deleteMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
  };
  sAMToolExecution: {
    create: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
    findUnique: (args: Record<string, unknown>) => Promise<ToolExecutionRecord | null>;
    findMany: (args: Record<string, unknown>) => Promise<ToolExecutionRecord[]>;
    count: (args: Record<string, unknown>) => Promise<number>;
    aggregate: (args: Record<string, unknown>) => Promise<unknown>;
    groupBy: (args: Record<string, unknown>) => Promise<unknown[]>;
  };
  sAMConfidenceScore: {
    create: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
    findUnique: (args: Record<string, unknown>) => Promise<ConfidenceRecord | null>;
    findMany: (args: Record<string, unknown>) => Promise<ConfidenceRecord[]>;
    count: (args: Record<string, unknown>) => Promise<number>;
    aggregate: (args: Record<string, unknown>) => Promise<unknown>;
  };
  sAMMemoryRetrieval: {
    create: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<MemoryRetrievalRecord[]>;
    count: (args: Record<string, unknown>) => Promise<number>;
    aggregate: (args: Record<string, unknown>) => Promise<unknown>;
    groupBy: (args: Record<string, unknown>) => Promise<unknown[]>;
  };
  sAMPlanLifecycleEvent: {
    create: (args: Record<string, unknown>) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<PlanEventRecord[]>;
    count: (args: Record<string, unknown>) => Promise<number>;
    groupBy: (args: Record<string, unknown>) => Promise<unknown[]>;
  };
  sAMAggregatedMetrics: {
    upsert: (args: Record<string, unknown>) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<AggregatedMetricsRecord[]>;
  };
};

// Record types
interface ToolExecutionRecord {
  id: string;
  toolId: string;
  toolName: string;
  userId: string;
  sessionId: string | null;
  planId: string | null;
  stepId: string | null;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
  confirmationRequired: boolean;
  confirmationGiven: boolean | null;
  inputSummary: string | null;
  outputSummary: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  errorRetryable: boolean | null;
  tags: Record<string, string> | null;
  createdAt: Date;
}

interface ConfidenceRecord {
  id: string;
  userId: string;
  sessionId: string | null;
  responseId: string;
  responseType: string;
  predictedConfidence: number;
  factors: unknown;
  predictedAt: Date;
  accurate: boolean | null;
  userVerified: boolean | null;
  verificationMethod: string | null;
  qualityScore: number | null;
  outcomeRecordedAt: Date | null;
  outcomeNotes: string | null;
  metadata: unknown;
}

interface MemoryRetrievalRecord {
  id: string;
  userId: string;
  sessionId: string | null;
  query: string;
  source: string;
  resultCount: number;
  topRelevanceScore: number;
  avgRelevanceScore: number;
  cacheHit: boolean;
  latencyMs: number;
  feedbackHelpful: boolean | null;
  feedbackRating: number | null;
  feedbackComment: string | null;
  feedbackProvidedAt: Date | null;
  metadata: unknown;
  timestamp: Date;
}

interface PlanEventRecord {
  id: string;
  planId: string;
  userId: string;
  eventType: string;
  stepId: string | null;
  previousState: string | null;
  newState: string | null;
  metadata: unknown;
  timestamp: Date;
}

interface AggregatedMetricsRecord {
  id: string;
  metricType: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  data: unknown;
  createdAt: Date;
}

// ============================================================================
// TOOL TELEMETRY STORE
// ============================================================================

export class PrismaToolTelemetryStore {
  private prisma: PrismaClient;

  constructor(config: PrismaObservabilityStoreConfig) {
    this.prisma = config.prisma;
  }

  async recordExecution(event: ToolExecutionEvent): Promise<void> {
    await this.prisma.sAMToolExecution.create({
      data: {
        id: event.executionId,
        toolId: event.toolId,
        toolName: event.toolName,
        userId: event.userId,
        sessionId: event.sessionId || null,
        planId: event.planId || null,
        stepId: event.stepId || null,
        status: event.status,
        startedAt: event.startedAt,
        completedAt: event.completedAt || null,
        durationMs: event.durationMs || null,
        confirmationRequired: event.confirmationRequired,
        confirmationGiven: event.confirmationGiven || null,
        inputSummary: event.inputSummary || null,
        outputSummary: event.outputSummary || null,
        errorCode: event.error?.code || null,
        errorMessage: event.error?.message || null,
        errorRetryable: event.error?.retryable || null,
        tags: event.tags || {},
      },
    });
  }

  async updateExecution(
    executionId: string,
    updates: Partial<ToolExecutionEvent>
  ): Promise<void> {
    await this.prisma.sAMToolExecution.update({
      where: { id: executionId },
      data: {
        status: updates.status,
        completedAt: updates.completedAt,
        durationMs: updates.durationMs,
        confirmationGiven: updates.confirmationGiven,
        outputSummary: updates.outputSummary,
        errorCode: updates.error?.code,
        errorMessage: updates.error?.message,
        errorRetryable: updates.error?.retryable,
      },
    });
  }

  async getExecution(executionId: string): Promise<ToolExecutionEvent | null> {
    const record = await this.prisma.sAMToolExecution.findUnique({
      where: { id: executionId },
    });

    if (!record) return null;

    return this.mapRecordToEvent(record);
  }

  async getMetrics(
    periodStart: Date,
    periodEnd: Date,
    toolId?: string
  ): Promise<ToolMetrics> {
    const where: Record<string, unknown> = {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    };

    if (toolId) {
      where.toolId = toolId;
    }

    const executions = await this.prisma.sAMToolExecution.findMany({
      where,
    });

    // Calculate metrics
    const total = executions.length;
    const successes = executions.filter(e => e.status === 'success').length;
    const latencies = executions
      .filter(e => e.durationMs !== null)
      .map(e => e.durationMs as number)
      .sort((a, b) => a - b);

    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    const p50 = latencies.length > 0
      ? latencies[Math.floor(latencies.length * 0.5)]
      : 0;

    const p95 = latencies.length > 0
      ? latencies[Math.floor(latencies.length * 0.95)]
      : 0;

    const p99 = latencies.length > 0
      ? latencies[Math.floor(latencies.length * 0.99)]
      : 0;

    const withConfirmation = executions.filter(e => e.confirmationRequired);
    const confirmedCount = withConfirmation.filter(e => e.confirmationGiven === true).length;

    const failuresByCode: Record<string, number> = {};
    executions.filter(e => e.status === 'failed' && e.errorCode).forEach(e => {
      const code = e.errorCode as string;
      failuresByCode[code] = (failuresByCode[code] || 0) + 1;
    });

    const executionsByTool: Record<string, number> = {};
    executions.forEach(e => {
      executionsByTool[e.toolName] = (executionsByTool[e.toolName] || 0) + 1;
    });

    return {
      executionCount: total,
      successRate: total > 0 ? successes / total : 0,
      avgLatencyMs: avgLatency,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      confirmationRate: total > 0 ? withConfirmation.length / total : 0,
      confirmationAcceptRate: withConfirmation.length > 0
        ? confirmedCount / withConfirmation.length
        : 0,
      failuresByCode,
      executionsByTool,
      periodStart,
      periodEnd,
    };
  }

  private mapRecordToEvent(record: ToolExecutionRecord): ToolExecutionEvent {
    return {
      executionId: record.id,
      toolId: record.toolId,
      toolName: record.toolName,
      userId: record.userId,
      sessionId: record.sessionId || undefined,
      planId: record.planId || undefined,
      stepId: record.stepId || undefined,
      startedAt: record.startedAt || new Date(),
      completedAt: record.completedAt || undefined,
      durationMs: record.durationMs || undefined,
      status: record.status as ToolExecutionStatus,
      error: record.errorCode ? {
        code: record.errorCode,
        message: record.errorMessage || 'Unknown error',
        retryable: record.errorRetryable || false,
      } : undefined,
      confirmationRequired: record.confirmationRequired,
      confirmationGiven: record.confirmationGiven || undefined,
      inputSummary: record.inputSummary || undefined,
      outputSummary: record.outputSummary || undefined,
      tags: (record.tags as Record<string, string>) || undefined,
    };
  }
}

// ============================================================================
// CONFIDENCE CALIBRATION STORE
// ============================================================================

export class PrismaConfidenceCalibrationStore implements ConfidencePredictionStore {
  private prisma: PrismaClient;

  constructor(config: PrismaObservabilityStoreConfig) {
    this.prisma = config.prisma;
  }

  async record(prediction: ConfidencePrediction): Promise<void> {
    await this.prisma.sAMConfidenceScore.create({
      data: {
        id: prediction.predictionId,
        userId: prediction.userId,
        sessionId: prediction.sessionId || null,
        responseId: prediction.responseId,
        responseType: prediction.responseType,
        predictedConfidence: prediction.predictedConfidence,
        factors: prediction.factors,
        predictedAt: prediction.predictedAt,
        accurate: prediction.actualOutcome?.accurate || null,
        userVerified: prediction.actualOutcome?.userVerified || null,
        verificationMethod: prediction.actualOutcome?.verificationMethod || null,
        qualityScore: prediction.actualOutcome?.qualityScore || null,
        outcomeRecordedAt: prediction.actualOutcome?.recordedAt || null,
        outcomeNotes: prediction.actualOutcome?.notes || null,
      },
    });
  }

  async getById(predictionId: string): Promise<ConfidencePrediction | null> {
    const record = await this.prisma.sAMConfidenceScore.findUnique({
      where: { id: predictionId },
    });

    if (!record) return null;

    return {
      predictionId: record.id,
      userId: record.userId,
      sessionId: record.sessionId || undefined,
      responseId: record.responseId,
      responseType: record.responseType as ConfidencePrediction['responseType'],
      predictedConfidence: record.predictedConfidence,
      factors: record.factors as ConfidencePrediction['factors'],
      predictedAt: record.predictedAt,
      actualOutcome: record.accurate !== null ? {
        accurate: record.accurate,
        userVerified: record.userVerified ?? false,
        verificationMethod: (record.verificationMethod as VerificationMethod) ?? 'implicit',
        qualityScore: record.qualityScore ?? undefined,
        recordedAt: record.outcomeRecordedAt ?? new Date(),
        notes: record.outcomeNotes ?? undefined,
      } : undefined,
    };
  }

  async recordOutcome(
    predictionId: string,
    outcome: ConfidenceOutcome
  ): Promise<void> {
    await this.prisma.sAMConfidenceScore.update({
      where: { id: predictionId },
      data: {
        accurate: outcome.accurate,
        userVerified: outcome.userVerified,
        verificationMethod: outcome.verificationMethod,
        qualityScore: outcome.qualityScore ?? null,
        outcomeRecordedAt: outcome.recordedAt,
        outcomeNotes: outcome.notes ?? null,
      },
    });
  }

  async getCalibrationMetrics(
    periodStart: Date,
    periodEnd: Date
  ): Promise<CalibrationMetrics> {
    const predictions = await this.prisma.sAMConfidenceScore.findMany({
      where: {
        predictedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    const withOutcomes = predictions.filter(p => p.accurate !== null);
    const avgPredicted = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.predictedConfidence, 0) / predictions.length
      : 0;

    const avgActual = withOutcomes.length > 0
      ? withOutcomes.filter(p => p.accurate).length / withOutcomes.length
      : 0;

    // Calculate calibration buckets
    const buckets = this.calculateCalibrationBuckets(predictions as ConfidenceRecord[]);

    // Calculate metrics by response type
    const byResponseType = this.calculateMetricsByType(predictions as ConfidenceRecord[]);

    // Brier score calculation
    const brierScore = withOutcomes.length > 0
      ? withOutcomes.reduce((sum, p) => {
          const actual = p.accurate ? 1 : 0;
          return sum + Math.pow(p.predictedConfidence - actual, 2);
        }, 0) / withOutcomes.length
      : 0;

    return {
      predictionCount: predictions.length,
      outcomesRecorded: withOutcomes.length,
      avgPredictedConfidence: avgPredicted,
      avgActualAccuracy: avgActual,
      calibrationError: Math.abs(avgPredicted - avgActual),
      brierScore,
      calibrationBuckets: buckets,
      verificationOverrideRate: 0,
      byResponseType,
      periodStart,
      periodEnd,
    };
  }

  private calculateCalibrationBuckets(predictions: ConfidenceRecord[]): CalibrationMetrics['calibrationBuckets'] {
    const bucketRanges = [
      { start: 0, end: 0.2 },
      { start: 0.2, end: 0.4 },
      { start: 0.4, end: 0.6 },
      { start: 0.6, end: 0.8 },
      { start: 0.8, end: 1.0 },
    ];

    return bucketRanges.map(({ start, end }) => {
      const inBucket = predictions.filter(
        p => p.predictedConfidence >= start && p.predictedConfidence < end
      );

      const withOutcomes = inBucket.filter(p => p.accurate !== null);
      const avgPredicted = inBucket.length > 0
        ? inBucket.reduce((sum, p) => sum + p.predictedConfidence, 0) / inBucket.length
        : (start + end) / 2;

      const actualAccuracy = withOutcomes.length > 0
        ? withOutcomes.filter(p => p.accurate).length / withOutcomes.length
        : 0;

      return {
        rangeStart: start,
        rangeEnd: end,
        count: inBucket.length,
        avgPredicted,
        actualAccuracy,
        error: Math.abs(avgPredicted - actualAccuracy),
      };
    });
  }

  private calculateMetricsByType(predictions: ConfidenceRecord[]): Record<ResponseType, {
    predictionCount: number;
    avgPredictedConfidence: number;
    avgActualAccuracy: number;
    calibrationError: number;
  }> {
    const types: ResponseType[] = ['explanation', 'answer', 'recommendation', 'assessment', 'intervention', 'tool_result'];
    const result: Record<string, {
      predictionCount: number;
      avgPredictedConfidence: number;
      avgActualAccuracy: number;
      calibrationError: number;
    }> = {};

    types.forEach(type => {
      const ofType = predictions.filter(p => p.responseType === type);
      const withOutcomes = ofType.filter(p => p.accurate !== null);

      const avgPredicted = ofType.length > 0
        ? ofType.reduce((sum, p) => sum + p.predictedConfidence, 0) / ofType.length
        : 0;

      const avgActual = withOutcomes.length > 0
        ? withOutcomes.filter(p => p.accurate).length / withOutcomes.length
        : 0;

      result[type] = {
        predictionCount: ofType.length,
        avgPredictedConfidence: avgPredicted,
        avgActualAccuracy: avgActual,
        calibrationError: Math.abs(avgPredicted - avgActual),
      };
    });

    return result as Record<ResponseType, typeof result[string]>;
  }
}

// ============================================================================
// MEMORY QUALITY STORE
// ============================================================================

export class PrismaMemoryQualityStore {
  private prisma: PrismaClient;

  constructor(config: PrismaObservabilityStoreConfig) {
    this.prisma = config.prisma;
  }

  async recordRetrieval(event: MemoryRetrievalEvent): Promise<void> {
    await this.prisma.sAMMemoryRetrieval.create({
      data: {
        id: event.retrievalId,
        userId: event.userId,
        sessionId: event.sessionId || null,
        query: event.query,
        source: event.source,
        resultCount: event.resultCount,
        topRelevanceScore: event.topRelevanceScore,
        avgRelevanceScore: event.avgRelevanceScore,
        cacheHit: event.cacheHit,
        latencyMs: event.latencyMs,
        feedbackHelpful: event.userFeedback?.helpful || null,
        feedbackRating: event.userFeedback?.relevanceRating || null,
        feedbackComment: event.userFeedback?.comment || null,
        feedbackProvidedAt: event.userFeedback?.providedAt || null,
        metadata: event.metadata || {},
        timestamp: event.timestamp,
      },
    });
  }

  async recordFeedback(
    retrievalId: string,
    helpful: boolean,
    rating?: number,
    comment?: string
  ): Promise<void> {
    await this.prisma.sAMMemoryRetrieval.update({
      where: { id: retrievalId },
      data: {
        feedbackHelpful: helpful,
        feedbackRating: rating || null,
        feedbackComment: comment || null,
        feedbackProvidedAt: new Date(),
      },
    });
  }

  async getQualityMetrics(
    periodStart: Date,
    periodEnd: Date
  ): Promise<MemoryQualityMetrics> {
    const retrievals = await this.prisma.sAMMemoryRetrieval.findMany({
      where: {
        timestamp: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    const total = retrievals.length;
    const cacheHits = retrievals.filter(r => r.cacheHit).length;
    const withFeedback = retrievals.filter(r => r.feedbackHelpful !== null);
    const positiveFeedback = withFeedback.filter(r => r.feedbackHelpful).length;
    const emptyResults = retrievals.filter(r => r.resultCount === 0).length;

    const avgRelevance = total > 0
      ? retrievals.reduce((sum, r) => sum + r.avgRelevanceScore, 0) / total
      : 0;

    const relevanceScores = retrievals.map(r => r.avgRelevanceScore).sort((a, b) => a - b);
    const medianRelevance = relevanceScores.length > 0
      ? relevanceScores[Math.floor(relevanceScores.length / 2)]
      : 0;

    const latencies = retrievals.map(r => r.latencyMs).sort((a, b) => a - b);
    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;
    const p95Latency = latencies.length > 0
      ? latencies[Math.floor(latencies.length * 0.95)]
      : 0;

    // Group by source
    const bySource = this.calculateSourceMetrics(retrievals);

    return {
      searchCount: total,
      avgRelevanceScore: avgRelevance,
      medianRelevanceScore: medianRelevance,
      cacheHitRate: total > 0 ? cacheHits / total : 0,
      avgLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      emptyResultRate: total > 0 ? emptyResults / total : 0,
      positiveFeedbackRate: withFeedback.length > 0
        ? positiveFeedback / withFeedback.length
        : 0,
      bySource,
      reindexQueueDepth: 0,
      periodStart,
      periodEnd,
    };
  }

  private calculateSourceMetrics(
    retrievals: MemoryRetrievalRecord[]
  ): Record<MemorySource, {
    searchCount: number;
    avgRelevanceScore: number;
    avgLatencyMs: number;
    cacheHitRate: number;
  }> {
    const sources: MemorySource[] = [
      'vector_search', 'knowledge_graph', 'session_context',
      'cross_session', 'curriculum', 'external'
    ];

    const result: Record<string, {
      searchCount: number;
      avgRelevanceScore: number;
      avgLatencyMs: number;
      cacheHitRate: number;
    }> = {};

    sources.forEach(source => {
      const ofSource = retrievals.filter(r => r.source === source);
      const cacheHits = ofSource.filter(r => r.cacheHit).length;

      result[source] = {
        searchCount: ofSource.length,
        avgRelevanceScore: ofSource.length > 0
          ? ofSource.reduce((sum, r) => sum + r.avgRelevanceScore, 0) / ofSource.length
          : 0,
        avgLatencyMs: ofSource.length > 0
          ? ofSource.reduce((sum, r) => sum + r.latencyMs, 0) / ofSource.length
          : 0,
        cacheHitRate: ofSource.length > 0 ? cacheHits / ofSource.length : 0,
      };
    });

    return result as Record<MemorySource, typeof result[string]>;
  }
}

// ============================================================================
// PLAN LIFECYCLE STORE
// ============================================================================

export class PrismaPlanLifecycleStore {
  private prisma: PrismaClient;

  constructor(config: PrismaObservabilityStoreConfig) {
    this.prisma = config.prisma;
  }

  async recordEvent(event: PlanLifecycleEvent): Promise<void> {
    await this.prisma.sAMPlanLifecycleEvent.create({
      data: {
        id: event.eventId,
        planId: event.planId,
        userId: event.userId,
        eventType: event.eventType,
        stepId: event.stepId || null,
        previousState: event.previousState || null,
        newState: event.newState || null,
        metadata: event.metadata || {},
        timestamp: event.timestamp,
      },
    });
  }

  async getEvents(
    planId: string,
    limit?: number
  ): Promise<PlanLifecycleEvent[]> {
    const records = await this.prisma.sAMPlanLifecycleEvent.findMany({
      where: { planId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return records.map(this.mapRecordToEvent);
  }

  async getUserEvents(
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<PlanLifecycleEvent[]> {
    const records = await this.prisma.sAMPlanLifecycleEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return records.map(this.mapRecordToEvent);
  }

  private mapRecordToEvent(record: PlanEventRecord): PlanLifecycleEvent {
    return {
      eventId: record.id,
      planId: record.planId,
      userId: record.userId,
      eventType: record.eventType as PlanLifecycleEvent['eventType'],
      stepId: record.stepId || undefined,
      previousState: record.previousState || undefined,
      newState: record.newState || undefined,
      metadata: (record.metadata as Record<string, unknown>) || undefined,
      timestamp: record.timestamp,
    };
  }
}

// ============================================================================
// UNIFIED METRICS STORE
// ============================================================================

export class PrismaMetricsStore {
  private prisma: PrismaClient;

  constructor(config: PrismaObservabilityStoreConfig) {
    this.prisma = config.prisma;
  }

  async recordMetric(
    name: string,
    value: number,
    labels?: Record<string, string>,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    await this.prisma.sAMMetric.create({
      data: {
        name,
        value,
        labels: labels || {},
        userId: userId || null,
        sessionId: sessionId || null,
      },
    });
  }

  async getMetrics(
    name: string,
    periodStart: Date,
    periodEnd: Date,
    userId?: string
  ): Promise<Array<{ value: number; timestamp: Date; labels: Record<string, string> }>> {
    const where: Record<string, unknown> = {
      name,
      timestamp: {
        gte: periodStart,
        lte: periodEnd,
      },
    };

    if (userId) {
      where.userId = userId;
    }

    const records = await this.prisma.sAMMetric.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    return records.map(r => ({
      value: (r as { value: number; timestamp: Date; labels: Record<string, string> }).value,
      timestamp: (r as { value: number; timestamp: Date; labels: Record<string, string> }).timestamp,
      labels: ((r as { value: number; timestamp: Date; labels: Record<string, string> }).labels || {}) as Record<string, string>,
    }));
  }

  async cleanup(olderThan: Date): Promise<number> {
    const result = await this.prisma.sAMMetric.deleteMany({
      where: {
        timestamp: {
          lt: olderThan,
        },
      },
    });

    return result.count;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createPrismaObservabilityStores(config: PrismaObservabilityStoreConfig) {
  return {
    toolTelemetry: new PrismaToolTelemetryStore(config),
    confidenceCalibration: new PrismaConfidenceCalibrationStore(config),
    memoryQuality: new PrismaMemoryQualityStore(config),
    planLifecycle: new PrismaPlanLifecycleStore(config),
    metrics: new PrismaMetricsStore(config),
  };
}
