/**
 * @sam-ai/agentic - Railway Metrics Exporter
 * Exports metrics as structured JSON logs for Railway logging system
 */
// ============================================================================
// RAILWAY EXPORTER
// ============================================================================
export class RailwayMetricsExporter {
    config;
    buffer = [];
    flushTimer = null;
    constructor(config = {}) {
        this.config = {
            serviceName: config.serviceName || 'sam-ai',
            environment: config.environment || process.env.RAILWAY_ENVIRONMENT || 'development',
            debug: config.debug ?? false,
            logger: config.logger || console,
            samplingRate: config.samplingRate ?? 1,
            batchSize: config.batchSize ?? 100,
            flushIntervalMs: config.flushIntervalMs ?? 5000,
        };
        // Start flush timer
        this.startFlushTimer();
    }
    // ============================================================================
    // METRIC EXPORT METHODS
    // ============================================================================
    /**
     * Export a generic metric
     */
    exportMetric(name, value, labels, metadata) {
        if (!this.shouldSample())
            return;
        const log = {
            type: 'metric',
            timestamp: new Date().toISOString(),
            service: this.config.serviceName,
            environment: this.config.environment,
            name,
            value,
            labels,
            metadata,
        };
        this.bufferLog(log);
    }
    /**
     * Export tool execution telemetry
     */
    exportToolExecution(event) {
        if (!this.shouldSample())
            return;
        const log = {
            type: 'event',
            timestamp: new Date().toISOString(),
            service: this.config.serviceName,
            environment: this.config.environment,
            category: 'tool_execution',
            action: event.toolName,
            status: event.status,
            durationMs: event.durationMs,
            userId: event.userId,
            sessionId: event.sessionId,
            metadata: {
                toolId: event.toolId,
                executionId: event.executionId,
                confirmationRequired: event.confirmationRequired,
                confirmationGiven: event.confirmationGiven,
                planId: event.planId,
                stepId: event.stepId,
                hasError: !!event.error,
                errorCode: event.error?.code,
            },
        };
        this.bufferLog(log);
        // Also export as metrics for aggregation
        this.exportMetric('sam.tool.execution', 1, {
            tool: event.toolName,
            status: event.status,
            confirmation_required: String(event.confirmationRequired),
        });
        if (event.durationMs) {
            this.exportMetric('sam.tool.latency_ms', event.durationMs, { tool: event.toolName, status: event.status });
        }
    }
    /**
     * Export memory retrieval telemetry
     */
    exportMemoryRetrieval(event) {
        if (!this.shouldSample())
            return;
        const log = {
            type: 'event',
            timestamp: new Date().toISOString(),
            service: this.config.serviceName,
            environment: this.config.environment,
            category: 'memory_retrieval',
            action: event.source,
            durationMs: event.latencyMs,
            userId: event.userId,
            sessionId: event.sessionId,
            metadata: {
                retrievalId: event.retrievalId,
                query: event.query.substring(0, 100), // Truncate for logging
                resultCount: event.resultCount,
                topRelevanceScore: event.topRelevanceScore,
                avgRelevanceScore: event.avgRelevanceScore,
                cacheHit: event.cacheHit,
            },
        };
        this.bufferLog(log);
        // Export metrics
        this.exportMetric('sam.memory.retrieval', 1, { source: event.source, cache_hit: String(event.cacheHit) });
        this.exportMetric('sam.memory.latency_ms', event.latencyMs, { source: event.source });
        this.exportMetric('sam.memory.relevance_score', event.avgRelevanceScore, { source: event.source });
    }
    /**
     * Export confidence prediction telemetry
     */
    exportConfidencePrediction(prediction) {
        if (!this.shouldSample())
            return;
        const log = {
            type: 'event',
            timestamp: new Date().toISOString(),
            service: this.config.serviceName,
            environment: this.config.environment,
            category: 'confidence_prediction',
            action: prediction.responseType,
            userId: prediction.userId,
            sessionId: prediction.sessionId,
            metadata: {
                predictionId: prediction.predictionId,
                responseId: prediction.responseId,
                predictedConfidence: prediction.predictedConfidence,
                factorCount: prediction.factors.length,
                hasOutcome: !!prediction.actualOutcome,
                accurate: prediction.actualOutcome?.accurate,
            },
        };
        this.bufferLog(log);
        // Export metrics
        this.exportMetric('sam.confidence.prediction', prediction.predictedConfidence, { response_type: prediction.responseType });
        if (prediction.actualOutcome) {
            this.exportMetric('sam.confidence.accuracy', prediction.actualOutcome.accurate ? 1 : 0, { response_type: prediction.responseType });
        }
    }
    /**
     * Export plan lifecycle event
     */
    exportPlanLifecycleEvent(event) {
        if (!this.shouldSample())
            return;
        const log = {
            type: 'event',
            timestamp: new Date().toISOString(),
            service: this.config.serviceName,
            environment: this.config.environment,
            category: 'plan_lifecycle',
            action: event.eventType,
            userId: event.userId,
            metadata: {
                eventId: event.eventId,
                planId: event.planId,
                stepId: event.stepId,
                previousState: event.previousState,
                newState: event.newState,
            },
        };
        this.bufferLog(log);
        // Export metrics
        this.exportMetric('sam.plan.event', 1, { event_type: event.eventType });
    }
    // ============================================================================
    // BUFFER MANAGEMENT
    // ============================================================================
    bufferLog(log) {
        this.buffer.push(log);
        // Flush if buffer is full
        if (this.buffer.length >= this.config.batchSize) {
            this.flush();
        }
    }
    startFlushTimer() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flushTimer = setInterval(() => {
            if (this.buffer.length > 0) {
                this.flush();
            }
        }, this.config.flushIntervalMs);
    }
    /**
     * Flush buffered logs to stdout
     */
    flush() {
        if (this.buffer.length === 0)
            return;
        const logs = this.buffer.splice(0, this.buffer.length);
        logs.forEach(log => {
            // Railway ingests JSON logs from stdout
            this.config.logger.log(JSON.stringify(log));
        });
        if (this.config.debug) {
            this.config.logger.info(`[RailwayExporter] Flushed ${logs.length} logs`);
        }
    }
    /**
     * Stop the exporter and flush remaining logs
     */
    shutdown() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        this.flush();
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    shouldSample() {
        return Math.random() < this.config.samplingRate;
    }
    /**
     * Create a child exporter with additional labels
     */
    withLabels(labels) {
        const childConfig = {
            ...this.config,
            serviceName: labels.service || this.config.serviceName,
        };
        return new RailwayMetricsExporter(childConfig);
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
let defaultExporter = null;
export function getRailwayExporter(config) {
    if (!defaultExporter) {
        defaultExporter = new RailwayMetricsExporter(config);
    }
    return defaultExporter;
}
export function createRailwayExporter(config) {
    return new RailwayMetricsExporter(config);
}
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/**
 * Log a metric to Railway
 */
export function logMetric(name, value, labels) {
    getRailwayExporter().exportMetric(name, value, labels);
}
/**
 * Log a tool execution to Railway
 */
export function logToolExecution(event) {
    getRailwayExporter().exportToolExecution(event);
}
/**
 * Log a memory retrieval to Railway
 */
export function logMemoryRetrieval(event) {
    getRailwayExporter().exportMemoryRetrieval(event);
}
/**
 * Log a confidence prediction to Railway
 */
export function logConfidencePrediction(prediction) {
    getRailwayExporter().exportConfidencePrediction(prediction);
}
/**
 * Log a plan lifecycle event to Railway
 */
export function logPlanLifecycleEvent(event) {
    getRailwayExporter().exportPlanLifecycleEvent(event);
}
//# sourceMappingURL=railway-exporter.js.map