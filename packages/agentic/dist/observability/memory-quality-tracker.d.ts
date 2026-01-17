/**
 * @sam-ai/agentic - Memory Quality Tracker
 * Tracks memory retrieval quality and relevance metrics
 */
import type { MemoryRetrievalEvent, MemoryFeedback, MemoryRetrievalStore, MemoryQualityMetrics, SourceMetrics, ObservabilityLogger } from './types';
import { MemorySource } from './types';
export declare class InMemoryMemoryRetrievalStore implements MemoryRetrievalStore {
    private events;
    private readonly maxEvents;
    constructor(maxEvents?: number);
    record(event: MemoryRetrievalEvent): Promise<void>;
    getById(retrievalId: string): Promise<MemoryRetrievalEvent | null>;
    recordFeedback(retrievalId: string, feedback: MemoryFeedback): Promise<void>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<MemoryQualityMetrics>;
    private emptySourceMetrics;
    private median;
    private percentile;
    clear(): void;
}
export interface MemoryQualityConfig {
    /** Enable tracking */
    enabled: boolean;
    /** Sample rate (0-1) */
    sampleRate: number;
    /** Max events to store */
    maxEvents: number;
    /** Low relevance threshold for alerts */
    lowRelevanceThreshold: number;
    /** High latency threshold for alerts (ms) */
    highLatencyThreshold: number;
}
export declare const DEFAULT_MEMORY_QUALITY_CONFIG: MemoryQualityConfig;
export declare class MemoryQualityTracker {
    private readonly store;
    private readonly config;
    private readonly logger;
    private readonly alertListeners;
    constructor(options: {
        store?: MemoryRetrievalStore;
        config?: Partial<MemoryQualityConfig>;
        logger?: ObservabilityLogger;
    });
    /**
     * Record a memory retrieval event
     */
    recordRetrieval(params: {
        userId: string;
        sessionId?: string;
        query: string;
        source: MemorySource;
        resultCount: number;
        topRelevanceScore: number;
        avgRelevanceScore: number;
        cacheHit: boolean;
        latencyMs: number;
        metadata?: Record<string, unknown>;
    }): Promise<string>;
    /**
     * Record user feedback for a retrieval
     */
    recordFeedback(retrievalId: string, feedback: Omit<MemoryFeedback, 'providedAt'>): Promise<void>;
    getRetrieval(retrievalId: string): Promise<MemoryRetrievalEvent | null>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<MemoryQualityMetrics>;
    /**
     * Get metrics for the last N minutes
     */
    getRecentMetrics(minutes?: number): Promise<MemoryQualityMetrics>;
    /**
     * Get quality summary for a specific source
     */
    getSourceQuality(source: MemorySource, periodStart: Date, periodEnd: Date): Promise<SourceMetrics>;
    private checkAlerts;
    /**
     * Subscribe to quality alerts
     */
    onAlert(callback: (alert: MemoryQualityAlert) => void): () => void;
    private emitAlert;
    private shouldSample;
}
export interface MemoryQualityAlert {
    type: 'low_relevance' | 'high_latency' | 'empty_results';
    message: string;
    retrievalId: string;
    value: number;
    threshold: number;
}
export declare function createMemoryQualityTracker(options?: {
    store?: MemoryRetrievalStore;
    config?: Partial<MemoryQualityConfig>;
    logger?: ObservabilityLogger;
}): MemoryQualityTracker;
export declare function createInMemoryMemoryRetrievalStore(maxEvents?: number): InMemoryMemoryRetrievalStore;
//# sourceMappingURL=memory-quality-tracker.d.ts.map