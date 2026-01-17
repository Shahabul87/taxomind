/**
 * @sam-ai/adapter-prisma - Observability Store
 * Database-backed implementation for metrics, tool telemetry, and confidence calibration
 */
import type { ToolExecutionEvent, ToolMetrics, MemoryRetrievalEvent, MemoryQualityMetrics, ConfidencePrediction, ConfidenceOutcome, CalibrationMetrics, PlanLifecycleEvent, ConfidencePredictionStore } from '@sam-ai/agentic';
export interface PrismaObservabilityStoreConfig {
    prisma: PrismaClient;
}
type PrismaClient = {
    sAMMetric: {
        create: (args: Record<string, unknown>) => Promise<unknown>;
        findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
        groupBy: (args: Record<string, unknown>) => Promise<unknown[]>;
        deleteMany: (args: Record<string, unknown>) => Promise<{
            count: number;
        }>;
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
export declare class PrismaToolTelemetryStore {
    private prisma;
    constructor(config: PrismaObservabilityStoreConfig);
    recordExecution(event: ToolExecutionEvent): Promise<void>;
    updateExecution(executionId: string, updates: Partial<ToolExecutionEvent>): Promise<void>;
    getExecution(executionId: string): Promise<ToolExecutionEvent | null>;
    getMetrics(periodStart: Date, periodEnd: Date, toolId?: string): Promise<ToolMetrics>;
    /**
     * Query tool executions with filters
     */
    queryExecutions(options: {
        startTime?: Date;
        endTime?: Date;
        toolId?: string;
        toolName?: string;
        userId?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<ToolExecutionEvent[]>;
    /**
     * Count tool executions matching filters
     */
    countExecutions(options: {
        startTime?: Date;
        endTime?: Date;
        toolId?: string;
        userId?: string;
        status?: string;
    }): Promise<number>;
    private mapRecordToEvent;
}
export declare class PrismaConfidenceCalibrationStore implements ConfidencePredictionStore {
    private prisma;
    constructor(config: PrismaObservabilityStoreConfig);
    record(prediction: ConfidencePrediction): Promise<void>;
    getById(predictionId: string): Promise<ConfidencePrediction | null>;
    recordOutcome(predictionId: string, outcome: ConfidenceOutcome): Promise<void>;
    getCalibrationMetrics(periodStart: Date, periodEnd: Date): Promise<CalibrationMetrics>;
    private calculateCalibrationBuckets;
    private calculateMetricsByType;
}
export declare class PrismaMemoryQualityStore {
    private prisma;
    constructor(config: PrismaObservabilityStoreConfig);
    recordRetrieval(event: MemoryRetrievalEvent): Promise<void>;
    recordFeedback(retrievalId: string, helpful: boolean, rating?: number, comment?: string): Promise<void>;
    getQualityMetrics(periodStart: Date, periodEnd: Date): Promise<MemoryQualityMetrics>;
    private calculateSourceMetrics;
}
export declare class PrismaPlanLifecycleStore {
    private prisma;
    constructor(config: PrismaObservabilityStoreConfig);
    recordEvent(event: PlanLifecycleEvent): Promise<void>;
    getEvents(planId: string, limit?: number): Promise<PlanLifecycleEvent[]>;
    getUserEvents(userId: string, periodStart: Date, periodEnd: Date): Promise<PlanLifecycleEvent[]>;
    private mapRecordToEvent;
}
export declare class PrismaMetricsStore {
    private prisma;
    constructor(config: PrismaObservabilityStoreConfig);
    recordMetric(name: string, value: number, labels?: Record<string, string>, userId?: string, sessionId?: string): Promise<void>;
    getMetrics(name: string, periodStart: Date, periodEnd: Date, userId?: string): Promise<Array<{
        value: number;
        timestamp: Date;
        labels: Record<string, string>;
    }>>;
    cleanup(olderThan: Date): Promise<number>;
}
export declare function createPrismaObservabilityStores(config: PrismaObservabilityStoreConfig): {
    toolTelemetry: PrismaToolTelemetryStore;
    confidenceCalibration: PrismaConfidenceCalibrationStore;
    memoryQuality: PrismaMemoryQualityStore;
    planLifecycle: PrismaPlanLifecycleStore;
    metrics: PrismaMetricsStore;
};
export {};
//# sourceMappingURL=observability-store.d.ts.map