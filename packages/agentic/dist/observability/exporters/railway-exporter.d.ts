/**
 * @sam-ai/agentic - Railway Metrics Exporter
 * Exports metrics as structured JSON logs for Railway logging system
 */
import type { ToolExecutionEvent, MemoryRetrievalEvent, ConfidencePrediction, PlanLifecycleEvent } from '../types';
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
export declare class RailwayMetricsExporter {
    private readonly config;
    private readonly buffer;
    private flushTimer;
    constructor(config?: RailwayExporterConfig);
    /**
     * Export a generic metric
     */
    exportMetric(name: string, value: number, labels?: Record<string, string>, metadata?: Record<string, unknown>): void;
    /**
     * Export tool execution telemetry
     */
    exportToolExecution(event: ToolExecutionEvent): void;
    /**
     * Export memory retrieval telemetry
     */
    exportMemoryRetrieval(event: MemoryRetrievalEvent): void;
    /**
     * Export confidence prediction telemetry
     */
    exportConfidencePrediction(prediction: ConfidencePrediction): void;
    /**
     * Export plan lifecycle event
     */
    exportPlanLifecycleEvent(event: PlanLifecycleEvent): void;
    private bufferLog;
    private startFlushTimer;
    /**
     * Flush buffered logs to stdout
     */
    flush(): void;
    /**
     * Stop the exporter and flush remaining logs
     */
    shutdown(): void;
    private shouldSample;
    /**
     * Create a child exporter with additional labels
     */
    withLabels(labels: Record<string, string>): RailwayMetricsExporter;
}
export declare function getRailwayExporter(config?: RailwayExporterConfig): RailwayMetricsExporter;
export declare function createRailwayExporter(config?: RailwayExporterConfig): RailwayMetricsExporter;
/**
 * Log a metric to Railway
 */
export declare function logMetric(name: string, value: number, labels?: Record<string, string>): void;
/**
 * Log a tool execution to Railway
 */
export declare function logToolExecution(event: ToolExecutionEvent): void;
/**
 * Log a memory retrieval to Railway
 */
export declare function logMemoryRetrieval(event: MemoryRetrievalEvent): void;
/**
 * Log a confidence prediction to Railway
 */
export declare function logConfidencePrediction(prediction: ConfidencePrediction): void;
/**
 * Log a plan lifecycle event to Railway
 */
export declare function logPlanLifecycleEvent(event: PlanLifecycleEvent): void;
//# sourceMappingURL=railway-exporter.d.ts.map