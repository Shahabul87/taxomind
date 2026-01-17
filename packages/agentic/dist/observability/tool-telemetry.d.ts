/**
 * @sam-ai/agentic - Tool Telemetry
 * Tracks tool execution metrics for observability
 */
import type { ToolExecutionEvent, ToolExecutionError, ToolExecutionStore, ToolExecutionQuery, ToolMetrics, ObservabilityLogger } from './types';
export declare class InMemoryToolExecutionStore implements ToolExecutionStore {
    private events;
    private readonly maxEvents;
    constructor(maxEvents?: number);
    record(event: ToolExecutionEvent): Promise<void>;
    getById(executionId: string): Promise<ToolExecutionEvent | null>;
    query(options: ToolExecutionQuery): Promise<ToolExecutionEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<ToolMetrics>;
    private percentile;
    clear(): void;
}
export interface ToolTelemetryConfig {
    /** Enable telemetry collection */
    enabled: boolean;
    /** Sample rate for events (0-1, 1 = all events) */
    sampleRate: number;
    /** Max events to keep in memory */
    maxEvents: number;
    /** Sanitize sensitive data from inputs/outputs */
    sanitize: boolean;
    /** Fields to redact from inputs/outputs */
    redactFields: string[];
}
export declare const DEFAULT_TOOL_TELEMETRY_CONFIG: ToolTelemetryConfig;
export declare class ToolTelemetry {
    private readonly store;
    private readonly config;
    private readonly logger;
    private activeExecutions;
    constructor(options: {
        store?: ToolExecutionStore;
        config?: Partial<ToolTelemetryConfig>;
        logger?: ObservabilityLogger;
    });
    /**
     * Start tracking a tool execution
     */
    startExecution(params: {
        toolId: string;
        toolName: string;
        userId: string;
        sessionId?: string;
        planId?: string;
        stepId?: string;
        confirmationRequired: boolean;
        input?: unknown;
        tags?: Record<string, string>;
    }): string;
    /**
     * Record confirmation response
     */
    recordConfirmation(executionId: string, confirmed: boolean): void;
    /**
     * Mark execution as started (after confirmation)
     */
    markExecuting(executionId: string): void;
    /**
     * Complete a tool execution
     */
    completeExecution(executionId: string, success: boolean, output?: unknown, error?: ToolExecutionError): Promise<void>;
    /**
     * Record a timeout
     */
    recordTimeout(executionId: string): Promise<void>;
    /**
     * Record a cancellation
     */
    recordCancellation(executionId: string): Promise<void>;
    getExecution(executionId: string): Promise<ToolExecutionEvent | null>;
    queryExecutions(query: ToolExecutionQuery): Promise<ToolExecutionEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<ToolMetrics>;
    /**
     * Get metrics for the last N minutes
     */
    getRecentMetrics(minutes?: number): Promise<ToolMetrics>;
    /**
     * Get active execution count
     */
    getActiveExecutionCount(): number;
    private shouldSample;
    private sanitizeAndSummarize;
}
export declare function createToolTelemetry(options?: {
    store?: ToolExecutionStore;
    config?: Partial<ToolTelemetryConfig>;
    logger?: ObservabilityLogger;
}): ToolTelemetry;
export declare function createInMemoryToolExecutionStore(maxEvents?: number): InMemoryToolExecutionStore;
//# sourceMappingURL=tool-telemetry.d.ts.map