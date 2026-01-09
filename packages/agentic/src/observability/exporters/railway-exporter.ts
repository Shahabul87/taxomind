/**
 * @sam-ai/agentic - Railway Metrics Exporter
 * Exports metrics as structured JSON logs for Railway logging system
 */

import type {
  ToolExecutionEvent,
  MemoryRetrievalEvent,
  ConfidencePrediction,
  PlanLifecycleEvent,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface RailwayExporterConfig {
  /** Service name for log identification */
  serviceName?: string;
  /** Environment (production, staging, development) */
  environment?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom logger (defaults to console) */
  logger?: Pick<Console, 'log' | 'error' | 'warn' | 'info'>;
  /** Sampling rate for metrics (0-1, default 1 = log all) */
  samplingRate?: number;
  /** Batch size for bulk exports */
  batchSize?: number;
  /** Flush interval in ms (default 5000) */
  flushIntervalMs?: number;
}

export interface RailwayMetricLog {
  type: 'metric';
  timestamp: string;
  service: string;
  environment: string;
  name: string;
  value: number;
  labels?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface RailwayEventLog {
  type: 'event';
  timestamp: string;
  service: string;
  environment: string;
  category: string;
  action: string;
  status?: string;
  durationMs?: number;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// RAILWAY EXPORTER
// ============================================================================

export class RailwayMetricsExporter {
  private readonly config: Required<RailwayExporterConfig>;
  private readonly buffer: Array<RailwayMetricLog | RailwayEventLog> = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: RailwayExporterConfig = {}) {
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
  exportMetric(
    name: string,
    value: number,
    labels?: Record<string, string>,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.shouldSample()) return;

    const log: RailwayMetricLog = {
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
  exportToolExecution(event: ToolExecutionEvent): void {
    if (!this.shouldSample()) return;

    const log: RailwayEventLog = {
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
    this.exportMetric(
      'sam.tool.execution',
      1,
      {
        tool: event.toolName,
        status: event.status,
        confirmation_required: String(event.confirmationRequired),
      }
    );

    if (event.durationMs) {
      this.exportMetric(
        'sam.tool.latency_ms',
        event.durationMs,
        { tool: event.toolName, status: event.status }
      );
    }
  }

  /**
   * Export memory retrieval telemetry
   */
  exportMemoryRetrieval(event: MemoryRetrievalEvent): void {
    if (!this.shouldSample()) return;

    const log: RailwayEventLog = {
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
    this.exportMetric(
      'sam.memory.retrieval',
      1,
      { source: event.source, cache_hit: String(event.cacheHit) }
    );

    this.exportMetric(
      'sam.memory.latency_ms',
      event.latencyMs,
      { source: event.source }
    );

    this.exportMetric(
      'sam.memory.relevance_score',
      event.avgRelevanceScore,
      { source: event.source }
    );
  }

  /**
   * Export confidence prediction telemetry
   */
  exportConfidencePrediction(prediction: ConfidencePrediction): void {
    if (!this.shouldSample()) return;

    const log: RailwayEventLog = {
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
    this.exportMetric(
      'sam.confidence.prediction',
      prediction.predictedConfidence,
      { response_type: prediction.responseType }
    );

    if (prediction.actualOutcome) {
      this.exportMetric(
        'sam.confidence.accuracy',
        prediction.actualOutcome.accurate ? 1 : 0,
        { response_type: prediction.responseType }
      );
    }
  }

  /**
   * Export plan lifecycle event
   */
  exportPlanLifecycleEvent(event: PlanLifecycleEvent): void {
    if (!this.shouldSample()) return;

    const log: RailwayEventLog = {
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
    this.exportMetric(
      'sam.plan.event',
      1,
      { event_type: event.eventType }
    );
  }

  // ============================================================================
  // BUFFER MANAGEMENT
  // ============================================================================

  private bufferLog(log: RailwayMetricLog | RailwayEventLog): void {
    this.buffer.push(log);

    // Flush if buffer is full
    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
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
  flush(): void {
    if (this.buffer.length === 0) return;

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
  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    this.flush();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private shouldSample(): boolean {
    return Math.random() < this.config.samplingRate;
  }

  /**
   * Create a child exporter with additional labels
   */
  withLabels(labels: Record<string, string>): RailwayMetricsExporter {
    const childConfig: RailwayExporterConfig = {
      ...this.config,
      serviceName: labels.service || this.config.serviceName,
    };

    return new RailwayMetricsExporter(childConfig);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let defaultExporter: RailwayMetricsExporter | null = null;

export function getRailwayExporter(config?: RailwayExporterConfig): RailwayMetricsExporter {
  if (!defaultExporter) {
    defaultExporter = new RailwayMetricsExporter(config);
  }
  return defaultExporter;
}

export function createRailwayExporter(config?: RailwayExporterConfig): RailwayMetricsExporter {
  return new RailwayMetricsExporter(config);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Log a metric to Railway
 */
export function logMetric(
  name: string,
  value: number,
  labels?: Record<string, string>
): void {
  getRailwayExporter().exportMetric(name, value, labels);
}

/**
 * Log a tool execution to Railway
 */
export function logToolExecution(event: ToolExecutionEvent): void {
  getRailwayExporter().exportToolExecution(event);
}

/**
 * Log a memory retrieval to Railway
 */
export function logMemoryRetrieval(event: MemoryRetrievalEvent): void {
  getRailwayExporter().exportMemoryRetrieval(event);
}

/**
 * Log a confidence prediction to Railway
 */
export function logConfidencePrediction(prediction: ConfidencePrediction): void {
  getRailwayExporter().exportConfidencePrediction(prediction);
}

/**
 * Log a plan lifecycle event to Railway
 */
export function logPlanLifecycleEvent(event: PlanLifecycleEvent): void {
  getRailwayExporter().exportPlanLifecycleEvent(event);
}
