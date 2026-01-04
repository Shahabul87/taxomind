/**
 * @sam-ai/agentic - Tool Telemetry
 * Tracks tool execution metrics for observability
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ToolExecutionEvent,
  ToolExecutionError,
  ToolExecutionStore,
  ToolExecutionQuery,
  ToolMetrics,
  ObservabilityLogger,
} from './types';
import { ToolExecutionStatus } from './types';

// ============================================================================
// IN-MEMORY TOOL EXECUTION STORE
// ============================================================================

export class InMemoryToolExecutionStore implements ToolExecutionStore {
  private events: Map<string, ToolExecutionEvent> = new Map();
  private readonly maxEvents: number;

  constructor(maxEvents: number = 10000) {
    this.maxEvents = maxEvents;
  }

  async record(event: ToolExecutionEvent): Promise<void> {
    // Enforce max events (FIFO eviction)
    if (this.events.size >= this.maxEvents) {
      const oldestKey = this.events.keys().next().value;
      if (oldestKey) {
        this.events.delete(oldestKey);
      }
    }
    this.events.set(event.executionId, event);
  }

  async getById(executionId: string): Promise<ToolExecutionEvent | null> {
    return this.events.get(executionId) ?? null;
  }

  async query(options: ToolExecutionQuery): Promise<ToolExecutionEvent[]> {
    let results = Array.from(this.events.values());

    if (options.userId) {
      results = results.filter((e) => e.userId === options.userId);
    }

    if (options.toolId) {
      results = results.filter((e) => e.toolId === options.toolId);
    }

    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      results = results.filter((e) => statuses.includes(e.status));
    }

    if (options.planId) {
      results = results.filter((e) => e.planId === options.planId);
    }

    if (options.startTime) {
      results = results.filter((e) => e.startedAt >= options.startTime!);
    }

    if (options.endTime) {
      results = results.filter((e) => e.startedAt <= options.endTime!);
    }

    // Sort by startedAt descending
    results.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 100;
    return results.slice(offset, offset + limit);
  }

  async getMetrics(periodStart: Date, periodEnd: Date): Promise<ToolMetrics> {
    const events = Array.from(this.events.values()).filter(
      (e) => e.startedAt >= periodStart && e.startedAt <= periodEnd
    );

    const completedEvents = events.filter(
      (e) => e.status === ToolExecutionStatus.SUCCESS || e.status === ToolExecutionStatus.FAILED
    );

    const successfulEvents = events.filter((e) => e.status === ToolExecutionStatus.SUCCESS);
    const latencies = completedEvents
      .filter((e) => e.durationMs !== undefined)
      .map((e) => e.durationMs!)
      .sort((a, b) => a - b);

    const confirmationRequiredEvents = events.filter((e) => e.confirmationRequired);
    const confirmationGivenEvents = events.filter(
      (e) => e.confirmationRequired && e.confirmationGiven
    );

    // Calculate failure breakdown
    const failuresByCode: Record<string, number> = {};
    events
      .filter((e) => e.status === ToolExecutionStatus.FAILED && e.error)
      .forEach((e) => {
        const code = e.error!.code;
        failuresByCode[code] = (failuresByCode[code] ?? 0) + 1;
      });

    // Calculate executions by tool
    const executionsByTool: Record<string, number> = {};
    events.forEach((e) => {
      executionsByTool[e.toolId] = (executionsByTool[e.toolId] ?? 0) + 1;
    });

    return {
      executionCount: events.length,
      successRate: completedEvents.length > 0 ? successfulEvents.length / completedEvents.length : 0,
      avgLatencyMs: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      p50LatencyMs: this.percentile(latencies, 50),
      p95LatencyMs: this.percentile(latencies, 95),
      p99LatencyMs: this.percentile(latencies, 99),
      confirmationRate:
        events.length > 0 ? confirmationRequiredEvents.length / events.length : 0,
      confirmationAcceptRate:
        confirmationRequiredEvents.length > 0
          ? confirmationGivenEvents.length / confirmationRequiredEvents.length
          : 0,
      failuresByCode,
      executionsByTool,
      periodStart,
      periodEnd,
    };
  }

  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  clear(): void {
    this.events.clear();
  }
}

// ============================================================================
// TOOL TELEMETRY TRACKER
// ============================================================================

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

export const DEFAULT_TOOL_TELEMETRY_CONFIG: ToolTelemetryConfig = {
  enabled: true,
  sampleRate: 1.0,
  maxEvents: 10000,
  sanitize: true,
  redactFields: ['password', 'token', 'secret', 'apiKey', 'authorization'],
};

export class ToolTelemetry {
  private readonly store: ToolExecutionStore;
  private readonly config: ToolTelemetryConfig;
  private readonly logger: ObservabilityLogger;
  private activeExecutions: Map<string, ToolExecutionEvent> = new Map();

  constructor(options: {
    store?: ToolExecutionStore;
    config?: Partial<ToolTelemetryConfig>;
    logger?: ObservabilityLogger;
  }) {
    this.config = { ...DEFAULT_TOOL_TELEMETRY_CONFIG, ...options.config };
    this.store =
      options.store ?? new InMemoryToolExecutionStore(this.config.maxEvents);
    this.logger = options.logger ?? console;
  }

  // ---------------------------------------------------------------------------
  // Event Recording
  // ---------------------------------------------------------------------------

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
  }): string {
    if (!this.config.enabled || !this.shouldSample()) {
      return '';
    }

    const executionId = uuidv4();
    const event: ToolExecutionEvent = {
      executionId,
      toolId: params.toolId,
      toolName: params.toolName,
      userId: params.userId,
      sessionId: params.sessionId,
      planId: params.planId,
      stepId: params.stepId,
      startedAt: new Date(),
      status: ToolExecutionStatus.PENDING,
      confirmationRequired: params.confirmationRequired,
      inputSummary: this.sanitizeAndSummarize(params.input),
      tags: params.tags,
    };

    this.activeExecutions.set(executionId, event);

    this.logger.debug('Tool execution started', {
      executionId,
      toolId: params.toolId,
      userId: params.userId,
    });

    return executionId;
  }

  /**
   * Record confirmation response
   */
  recordConfirmation(executionId: string, confirmed: boolean): void {
    const event = this.activeExecutions.get(executionId);
    if (!event) return;

    event.confirmationGiven = confirmed;
    event.status = confirmed
      ? ToolExecutionStatus.CONFIRMED
      : ToolExecutionStatus.REJECTED;

    if (!confirmed) {
      this.completeExecution(executionId, false, undefined, {
        code: 'CONFIRMATION_REJECTED',
        message: 'User rejected tool execution',
        retryable: false,
      });
    }
  }

  /**
   * Mark execution as started (after confirmation)
   */
  markExecuting(executionId: string): void {
    const event = this.activeExecutions.get(executionId);
    if (!event) return;

    event.status = ToolExecutionStatus.EXECUTING;
  }

  /**
   * Complete a tool execution
   */
  async completeExecution(
    executionId: string,
    success: boolean,
    output?: unknown,
    error?: ToolExecutionError
  ): Promise<void> {
    const event = this.activeExecutions.get(executionId);
    if (!event) return;

    event.completedAt = new Date();
    event.durationMs = event.completedAt.getTime() - event.startedAt.getTime();
    event.status = success ? ToolExecutionStatus.SUCCESS : ToolExecutionStatus.FAILED;
    event.outputSummary = success ? this.sanitizeAndSummarize(output) : undefined;
    event.error = error;

    // Remove from active and store
    this.activeExecutions.delete(executionId);
    await this.store.record(event);

    this.logger.debug('Tool execution completed', {
      executionId,
      toolId: event.toolId,
      success,
      durationMs: event.durationMs,
    });
  }

  /**
   * Record a timeout
   */
  async recordTimeout(executionId: string): Promise<void> {
    const event = this.activeExecutions.get(executionId);
    if (!event) return;

    event.completedAt = new Date();
    event.durationMs = event.completedAt.getTime() - event.startedAt.getTime();
    event.status = ToolExecutionStatus.TIMEOUT;
    event.error = {
      code: 'TIMEOUT',
      message: 'Tool execution timed out',
      retryable: true,
    };

    this.activeExecutions.delete(executionId);
    await this.store.record(event);

    this.logger.warn('Tool execution timeout', {
      executionId,
      toolId: event.toolId,
      durationMs: event.durationMs,
    });
  }

  /**
   * Record a cancellation
   */
  async recordCancellation(executionId: string): Promise<void> {
    const event = this.activeExecutions.get(executionId);
    if (!event) return;

    event.completedAt = new Date();
    event.durationMs = event.completedAt.getTime() - event.startedAt.getTime();
    event.status = ToolExecutionStatus.CANCELLED;

    this.activeExecutions.delete(executionId);
    await this.store.record(event);

    this.logger.info('Tool execution cancelled', {
      executionId,
      toolId: event.toolId,
    });
  }

  // ---------------------------------------------------------------------------
  // Query Methods
  // ---------------------------------------------------------------------------

  async getExecution(executionId: string): Promise<ToolExecutionEvent | null> {
    // Check active first
    const active = this.activeExecutions.get(executionId);
    if (active) return active;

    return this.store.getById(executionId);
  }

  async queryExecutions(query: ToolExecutionQuery): Promise<ToolExecutionEvent[]> {
    return this.store.query(query);
  }

  async getMetrics(periodStart: Date, periodEnd: Date): Promise<ToolMetrics> {
    return this.store.getMetrics(periodStart, periodEnd);
  }

  /**
   * Get metrics for the last N minutes
   */
  async getRecentMetrics(minutes: number = 60): Promise<ToolMetrics> {
    const now = new Date();
    const start = new Date(now.getTime() - minutes * 60 * 1000);
    return this.getMetrics(start, now);
  }

  /**
   * Get active execution count
   */
  getActiveExecutionCount(): number {
    return this.activeExecutions.size;
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private sanitizeAndSummarize(data: unknown): string | undefined {
    if (data === undefined || data === null) return undefined;

    try {
      let str = typeof data === 'string' ? data : JSON.stringify(data);

      if (this.config.sanitize) {
        for (const field of this.config.redactFields) {
          const regex = new RegExp(`"${field}"\\s*:\\s*"[^"]*"`, 'gi');
          str = str.replace(regex, `"${field}":"[REDACTED]"`);
        }
      }

      // Truncate if too long
      if (str.length > 500) {
        str = str.substring(0, 500) + '...[truncated]';
      }

      return str;
    } catch {
      return '[serialization failed]';
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createToolTelemetry(options?: {
  store?: ToolExecutionStore;
  config?: Partial<ToolTelemetryConfig>;
  logger?: ObservabilityLogger;
}): ToolTelemetry {
  return new ToolTelemetry(options ?? {});
}

export function createInMemoryToolExecutionStore(
  maxEvents?: number
): InMemoryToolExecutionStore {
  return new InMemoryToolExecutionStore(maxEvents);
}
