/**
 * @sam-ai/agentic - Memory Quality Tracker
 * Tracks memory retrieval quality and relevance metrics
 */
import { v4 as uuidv4 } from 'uuid';
import { MemorySource } from './types';
// ============================================================================
// IN-MEMORY RETRIEVAL STORE
// ============================================================================
export class InMemoryMemoryRetrievalStore {
    events = new Map();
    maxEvents;
    constructor(maxEvents = 10000) {
        this.maxEvents = maxEvents;
    }
    async record(event) {
        if (this.events.size >= this.maxEvents) {
            const oldestKey = this.events.keys().next().value;
            if (oldestKey) {
                this.events.delete(oldestKey);
            }
        }
        this.events.set(event.retrievalId, event);
    }
    async getById(retrievalId) {
        return this.events.get(retrievalId) ?? null;
    }
    async recordFeedback(retrievalId, feedback) {
        const event = this.events.get(retrievalId);
        if (event) {
            event.userFeedback = feedback;
        }
    }
    async getMetrics(periodStart, periodEnd) {
        const events = Array.from(this.events.values()).filter((e) => e.timestamp >= periodStart && e.timestamp <= periodEnd);
        // Initialize source metrics
        const bySource = {
            [MemorySource.VECTOR_SEARCH]: this.emptySourceMetrics(),
            [MemorySource.KNOWLEDGE_GRAPH]: this.emptySourceMetrics(),
            [MemorySource.SESSION_CONTEXT]: this.emptySourceMetrics(),
            [MemorySource.CROSS_SESSION]: this.emptySourceMetrics(),
            [MemorySource.CURRICULUM]: this.emptySourceMetrics(),
            [MemorySource.EXTERNAL]: this.emptySourceMetrics(),
        };
        // Aggregate events
        const relevanceScores = [];
        const latencies = [];
        let cacheHits = 0;
        let emptyResults = 0;
        let positiveFeedback = 0;
        let feedbackCount = 0;
        for (const event of events) {
            relevanceScores.push(event.avgRelevanceScore);
            latencies.push(event.latencyMs);
            if (event.cacheHit)
                cacheHits++;
            if (event.resultCount === 0)
                emptyResults++;
            if (event.userFeedback) {
                feedbackCount++;
                if (event.userFeedback.helpful)
                    positiveFeedback++;
            }
            // Aggregate by source
            const sourceMetrics = bySource[event.source];
            sourceMetrics.searchCount++;
            sourceMetrics.avgRelevanceScore =
                (sourceMetrics.avgRelevanceScore * (sourceMetrics.searchCount - 1) +
                    event.avgRelevanceScore) /
                    sourceMetrics.searchCount;
            sourceMetrics.avgLatencyMs =
                (sourceMetrics.avgLatencyMs * (sourceMetrics.searchCount - 1) + event.latencyMs) /
                    sourceMetrics.searchCount;
            if (event.cacheHit) {
                sourceMetrics.cacheHitRate =
                    (sourceMetrics.cacheHitRate * (sourceMetrics.searchCount - 1) + 1) /
                        sourceMetrics.searchCount;
            }
        }
        // Calculate aggregates
        relevanceScores.sort((a, b) => a - b);
        latencies.sort((a, b) => a - b);
        return {
            searchCount: events.length,
            avgRelevanceScore: relevanceScores.length > 0
                ? relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length
                : 0,
            medianRelevanceScore: this.median(relevanceScores),
            cacheHitRate: events.length > 0 ? cacheHits / events.length : 0,
            avgLatencyMs: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
            p95LatencyMs: this.percentile(latencies, 95),
            emptyResultRate: events.length > 0 ? emptyResults / events.length : 0,
            positiveFeedbackRate: feedbackCount > 0 ? positiveFeedback / feedbackCount : 0,
            bySource,
            reindexQueueDepth: 0, // Would be populated by lifecycle manager
            lastReindexAt: undefined,
            periodStart,
            periodEnd,
        };
    }
    emptySourceMetrics() {
        return {
            searchCount: 0,
            avgRelevanceScore: 0,
            avgLatencyMs: 0,
            cacheHitRate: 0,
        };
    }
    median(sortedValues) {
        if (sortedValues.length === 0)
            return 0;
        const mid = Math.floor(sortedValues.length / 2);
        return sortedValues.length % 2 !== 0
            ? sortedValues[mid]
            : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
    }
    percentile(sortedValues, p) {
        if (sortedValues.length === 0)
            return 0;
        const index = Math.ceil((p / 100) * sortedValues.length) - 1;
        return sortedValues[Math.max(0, index)];
    }
    clear() {
        this.events.clear();
    }
}
export const DEFAULT_MEMORY_QUALITY_CONFIG = {
    enabled: true,
    sampleRate: 1.0,
    maxEvents: 10000,
    lowRelevanceThreshold: 0.3,
    highLatencyThreshold: 2000,
};
export class MemoryQualityTracker {
    store;
    config;
    logger;
    alertListeners = new Set();
    constructor(options) {
        this.config = { ...DEFAULT_MEMORY_QUALITY_CONFIG, ...options.config };
        this.store =
            options.store ?? new InMemoryMemoryRetrievalStore(this.config.maxEvents);
        this.logger = options.logger ?? console;
    }
    // ---------------------------------------------------------------------------
    // Event Recording
    // ---------------------------------------------------------------------------
    /**
     * Record a memory retrieval event
     */
    async recordRetrieval(params) {
        if (!this.config.enabled || !this.shouldSample()) {
            return '';
        }
        const retrievalId = uuidv4();
        const event = {
            retrievalId,
            userId: params.userId,
            sessionId: params.sessionId,
            query: params.query,
            source: params.source,
            resultCount: params.resultCount,
            topRelevanceScore: params.topRelevanceScore,
            avgRelevanceScore: params.avgRelevanceScore,
            cacheHit: params.cacheHit,
            latencyMs: params.latencyMs,
            timestamp: new Date(),
            metadata: params.metadata,
        };
        await this.store.record(event);
        // Check for alerts
        this.checkAlerts(event);
        this.logger.debug('Memory retrieval recorded', {
            retrievalId,
            source: params.source,
            resultCount: params.resultCount,
            avgRelevanceScore: params.avgRelevanceScore,
            latencyMs: params.latencyMs,
        });
        return retrievalId;
    }
    /**
     * Record user feedback for a retrieval
     */
    async recordFeedback(retrievalId, feedback) {
        await this.store.recordFeedback(retrievalId, {
            ...feedback,
            providedAt: new Date(),
        });
        this.logger.info('Memory retrieval feedback recorded', {
            retrievalId,
            helpful: feedback.helpful,
            relevanceRating: feedback.relevanceRating,
        });
    }
    // ---------------------------------------------------------------------------
    // Query Methods
    // ---------------------------------------------------------------------------
    async getRetrieval(retrievalId) {
        return this.store.getById(retrievalId);
    }
    async getMetrics(periodStart, periodEnd) {
        return this.store.getMetrics(periodStart, periodEnd);
    }
    /**
     * Get metrics for the last N minutes
     */
    async getRecentMetrics(minutes = 60) {
        const now = new Date();
        const start = new Date(now.getTime() - minutes * 60 * 1000);
        return this.getMetrics(start, now);
    }
    /**
     * Get quality summary for a specific source
     */
    async getSourceQuality(source, periodStart, periodEnd) {
        const metrics = await this.getMetrics(periodStart, periodEnd);
        return metrics.bySource[source];
    }
    // ---------------------------------------------------------------------------
    // Alerts
    // ---------------------------------------------------------------------------
    checkAlerts(event) {
        const alerts = [];
        if (event.avgRelevanceScore < this.config.lowRelevanceThreshold) {
            alerts.push({
                type: 'low_relevance',
                message: `Low relevance score: ${event.avgRelevanceScore.toFixed(2)}`,
                retrievalId: event.retrievalId,
                value: event.avgRelevanceScore,
                threshold: this.config.lowRelevanceThreshold,
            });
        }
        if (event.latencyMs > this.config.highLatencyThreshold) {
            alerts.push({
                type: 'high_latency',
                message: `High latency: ${event.latencyMs}ms`,
                retrievalId: event.retrievalId,
                value: event.latencyMs,
                threshold: this.config.highLatencyThreshold,
            });
        }
        if (event.resultCount === 0) {
            alerts.push({
                type: 'empty_results',
                message: 'No results returned for query',
                retrievalId: event.retrievalId,
                value: 0,
                threshold: 1,
            });
        }
        for (const alert of alerts) {
            this.emitAlert(alert);
        }
    }
    /**
     * Subscribe to quality alerts
     */
    onAlert(callback) {
        this.alertListeners.add(callback);
        return () => {
            this.alertListeners.delete(callback);
        };
    }
    emitAlert(alert) {
        for (const listener of this.alertListeners) {
            try {
                listener(alert);
            }
            catch (err) {
                this.logger.error('Error in alert listener', {
                    error: err instanceof Error ? err.message : 'Unknown',
                });
            }
        }
    }
    // ---------------------------------------------------------------------------
    // Helper Methods
    // ---------------------------------------------------------------------------
    shouldSample() {
        return Math.random() < this.config.sampleRate;
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
export function createMemoryQualityTracker(options) {
    return new MemoryQualityTracker(options ?? {});
}
export function createInMemoryMemoryRetrievalStore(maxEvents) {
    return new InMemoryMemoryRetrievalStore(maxEvents);
}
//# sourceMappingURL=memory-quality-tracker.js.map