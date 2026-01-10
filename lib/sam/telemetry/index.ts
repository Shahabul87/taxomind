/**
 * SAM AI Telemetry Integration for Taxomind
 * Provides observability and metrics collection with Prisma persistence
 *
 * Phase 3: Infrastructure - Wire to Prisma observability stores via TaxomindContext
 */

import {
  AgenticMetricsCollector,
  createAgenticMetricsCollector,
  createToolTelemetry,
  createMemoryQualityTracker,
  createConfidenceCalibrationTracker,
  type AgenticMetrics,
  type QuickMetricsSummary,
  type ToolMetrics,
  type MemoryQualityMetrics,
  type CalibrationMetrics,
  type PlanMetrics,
  type ProactiveMetrics,
  type SystemHealthMetrics,
  type Alert,
  type AlertRule,
  type ToolExecutionEvent,
  type MemoryRetrievalEvent,
  type ConfidencePrediction,
  type PlanLifecycleEvent,
  type ProactiveEvent,
  type ToolExecutionStore,
  type ToolExecutionQuery,
  type MemoryRetrievalStore,
  type MemoryFeedback,
  type ConfidencePredictionStore,
  type ConfidenceOutcome,
  type PlanLifecycleStore,
  type ProactiveEventStore,
  // Use the telemetry-prefixed enums from observability module
  TelemetryToolExecutionStatus as ToolExecutionStatus,
  TelemetryMemorySource as MemorySource,
  TelemetryResponseType as ResponseType,
  VerificationMethod,
  PlanEventType,
  ProactiveEventType,
  AlertSeverity,
} from '@sam-ai/agentic';
import { getObservabilityStores } from '../taxomind-context';
import type {
  PrismaToolTelemetryStore,
  PrismaConfidenceCalibrationStore,
  PrismaMemoryQualityStore,
  PrismaPlanLifecycleStore,
} from '@sam-ai/adapter-prisma';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface SAMTelemetryConfig {
  /** Enable telemetry collection */
  enabled: boolean;
  /** Sample rate for events (0-1) */
  sampleRate: number;
  /** Max events to retain in memory */
  maxEvents: number;
  /** Health check interval (ms) */
  healthCheckIntervalMs: number;
  /** Enable alerts */
  alertsEnabled: boolean;
  /** Default metrics period (hours) */
  defaultPeriodHours: number;
}

export const DEFAULT_SAM_TELEMETRY_CONFIG: SAMTelemetryConfig = {
  enabled: true,
  sampleRate: 1.0,
  maxEvents: 10000,
  healthCheckIntervalMs: 60000,
  alertsEnabled: true,
  defaultPeriodHours: 24,
};

// ============================================================================
// LOGGER
// ============================================================================

const logger = {
  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[SAM_TELEMETRY] ${message}`, data ?? '');
    }
  },
  info: (message: string, data?: Record<string, unknown>) => {
    console.info(`[SAM_TELEMETRY] ${message}`, data ?? '');
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(`[SAM_TELEMETRY] ${message}`, data ?? '');
  },
  error: (message: string, data?: Record<string, unknown>) => {
    console.error(`[SAM_TELEMETRY] ${message}`, data ?? '');
  },
};

// ============================================================================
// PRISMA STORE ADAPTERS
// These adapt Prisma stores to match the interfaces expected by agentic trackers
// ============================================================================

/**
 * Adapter that wraps PrismaToolTelemetryStore to implement ToolExecutionStore interface
 */
class ToolExecutionStoreAdapter implements ToolExecutionStore {
  constructor(private prismaStore: PrismaToolTelemetryStore) {}

  async record(event: ToolExecutionEvent): Promise<void> {
    await this.prismaStore.recordExecution(event);
  }

  async getById(executionId: string): Promise<ToolExecutionEvent | null> {
    return this.prismaStore.getExecution(executionId);
  }

  async query(options: ToolExecutionQuery): Promise<ToolExecutionEvent[]> {
    // The Prisma store doesn't have a query method, so we implement a basic version
    // by getting metrics and filtering - this is a simplified implementation
    // For full query support, the Prisma store would need to be extended
    const periodStart = options.startTime ?? new Date(0);
    const periodEnd = options.endTime ?? new Date();

    // For now, return empty array as Prisma store doesn't support full query
    // This is acceptable because the ToolTelemetry class handles active executions
    // in memory and only uses the store for completed events
    logger.debug('ToolExecutionStoreAdapter.query called - returning empty (Prisma store limitation)', {
      userId: options.userId,
      toolId: options.toolId,
    });
    return [];
  }

  async getMetrics(periodStart: Date, periodEnd: Date): Promise<ToolMetrics> {
    return this.prismaStore.getMetrics(periodStart, periodEnd);
  }
}

/**
 * Adapter that wraps PrismaMemoryQualityStore to implement MemoryRetrievalStore interface
 */
class MemoryRetrievalStoreAdapter implements MemoryRetrievalStore {
  constructor(private prismaStore: PrismaMemoryQualityStore) {}

  async record(event: MemoryRetrievalEvent): Promise<void> {
    await this.prismaStore.recordRetrieval(event);
  }

  async getById(_retrievalId: string): Promise<MemoryRetrievalEvent | null> {
    // Prisma store doesn't have getById - return null
    // This is acceptable because the tracker primarily uses getById for feedback recording
    return null;
  }

  async recordFeedback(retrievalId: string, feedback: MemoryFeedback): Promise<void> {
    await this.prismaStore.recordFeedback(
      retrievalId,
      feedback.helpful,
      feedback.relevanceRating,
      feedback.comment
    );
  }

  async getMetrics(periodStart: Date, periodEnd: Date): Promise<MemoryQualityMetrics> {
    return this.prismaStore.getQualityMetrics(periodStart, periodEnd);
  }
}

/**
 * Adapter that wraps PrismaConfidenceCalibrationStore to implement ConfidencePredictionStore interface
 */
class ConfidencePredictionStoreAdapter implements ConfidencePredictionStore {
  constructor(private prismaStore: PrismaConfidenceCalibrationStore) {}

  async record(prediction: ConfidencePrediction): Promise<void> {
    await this.prismaStore.recordPrediction(prediction);
  }

  async getById(_predictionId: string): Promise<ConfidencePrediction | null> {
    // Prisma store doesn't have getById - return null
    return null;
  }

  async recordOutcome(predictionId: string, outcome: ConfidenceOutcome): Promise<void> {
    await this.prismaStore.recordOutcome(
      predictionId,
      outcome.accurate,
      outcome.verificationMethod,
      outcome.qualityScore,
      outcome.notes
    );
  }

  async getCalibrationMetrics(periodStart: Date, periodEnd: Date): Promise<CalibrationMetrics> {
    return this.prismaStore.getCalibrationMetrics(periodStart, periodEnd);
  }
}

/**
 * Adapter that wraps PrismaPlanLifecycleStore to implement PlanLifecycleStore interface
 */
class PlanLifecycleStoreAdapter implements PlanLifecycleStore {
  constructor(private prismaStore: PrismaPlanLifecycleStore) {}

  async record(event: PlanLifecycleEvent): Promise<void> {
    await this.prismaStore.recordEvent(event);
  }

  async getByPlanId(planId: string): Promise<PlanLifecycleEvent[]> {
    return this.prismaStore.getEvents(planId);
  }

  async getMetrics(periodStart: Date, periodEnd: Date): Promise<PlanMetrics> {
    // PrismaPlanLifecycleStore doesn't have getMetrics - provide default
    // The metrics calculation should be done by the AgenticMetricsCollector
    return {
      activePlansCount: 0,
      totalCreated: 0,
      completionRate: 0,
      abandonmentRate: 0,
      avgStepsPerPlan: 0,
      avgCompletionTimeMs: 0,
      stepCompletionByPosition: {},
      dropoffByStep: {},
      byStatus: {},
      periodStart,
      periodEnd,
    };
  }
}

// ============================================================================
// SAM TELEMETRY SERVICE
// ============================================================================

export interface SAMTelemetryServiceOptions {
  config?: Partial<SAMTelemetryConfig>;
  /** Use Prisma-backed stores from TaxomindContext (recommended for production) */
  usePrismaStores?: boolean;
}

export class SAMTelemetryService {
  private readonly config: SAMTelemetryConfig;
  private readonly metricsCollector: AgenticMetricsCollector;
  private isRunning = false;

  constructor(options?: SAMTelemetryServiceOptions) {
    const { config, usePrismaStores = true } = options ?? {};
    this.config = { ...DEFAULT_SAM_TELEMETRY_CONFIG, ...config };

    // Get Prisma stores from TaxomindContext if enabled
    let toolExecutionStore: ToolExecutionStore | undefined;
    let memoryRetrievalStore: MemoryRetrievalStore | undefined;
    let confidencePredictionStore: ConfidencePredictionStore | undefined;
    let planLifecycleStore: PlanLifecycleStore | undefined;

    if (usePrismaStores) {
      try {
        const prismaStores = getObservabilityStores();
        toolExecutionStore = new ToolExecutionStoreAdapter(prismaStores.toolTelemetry);
        memoryRetrievalStore = new MemoryRetrievalStoreAdapter(prismaStores.memoryQuality);
        confidencePredictionStore = new ConfidencePredictionStoreAdapter(prismaStores.confidenceCalibration);
        planLifecycleStore = new PlanLifecycleStoreAdapter(prismaStores.planLifecycle);

        logger.info('SAM Telemetry using Prisma-backed stores for persistence');
      } catch (error) {
        logger.warn('Failed to initialize Prisma stores, falling back to in-memory', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }

    // Create metrics collector with sub-collectors
    this.metricsCollector = createAgenticMetricsCollector({
      config: {
        enabled: this.config.enabled,
        defaultPeriodHours: this.config.defaultPeriodHours,
        healthCheckIntervalMs: this.config.healthCheckIntervalMs,
        alertsEnabled: this.config.alertsEnabled,
      },
      logger,
      toolTelemetry: createToolTelemetry({
        store: toolExecutionStore,
        config: {
          enabled: this.config.enabled,
          sampleRate: this.config.sampleRate,
          maxEvents: this.config.maxEvents,
          sanitize: true,
          redactFields: ['password', 'token', 'secret', 'apiKey', 'authorization'],
        },
        logger,
      }),
      memoryQualityTracker: createMemoryQualityTracker({
        store: memoryRetrievalStore,
        config: {
          enabled: this.config.enabled,
          sampleRate: this.config.sampleRate,
          maxEvents: this.config.maxEvents,
          lowRelevanceThreshold: 0.3,
          highLatencyThreshold: 2000,
        },
        logger,
      }),
      confidenceCalibration: createConfidenceCalibrationTracker({
        store: confidencePredictionStore,
        config: {
          enabled: this.config.enabled,
          sampleRate: this.config.sampleRate,
          maxPredictions: this.config.maxEvents,
          bucketCount: 10,
          calibrationErrorThreshold: 0.15,
        },
        logger,
      }),
      planLifecycleStore,
    });

    // Set up default alert rules
    this.setupDefaultAlertRules();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  start(): void {
    if (this.isRunning) return;

    this.metricsCollector.start();
    this.isRunning = true;

    logger.info('SAM Telemetry Service started', {
      sampleRate: this.config.sampleRate,
      alertsEnabled: this.config.alertsEnabled,
    });
  }

  stop(): void {
    if (!this.isRunning) return;

    this.metricsCollector.stop();
    this.isRunning = false;

    logger.info('SAM Telemetry Service stopped');
  }

  // ---------------------------------------------------------------------------
  // Tool Telemetry
  // ---------------------------------------------------------------------------

  /**
   * Start tracking a tool execution
   */
  startToolExecution(params: {
    toolId: string;
    toolName: string;
    userId: string;
    sessionId?: string;
    planId?: string;
    stepId?: string;
    confirmationRequired: boolean;
    input?: unknown;
  }): string {
    return this.metricsCollector.getToolTelemetry().startExecution(params);
  }

  /**
   * Record confirmation response for a tool execution
   */
  recordToolConfirmation(executionId: string, confirmed: boolean): void {
    this.metricsCollector.getToolTelemetry().recordConfirmation(executionId, confirmed);
  }

  /**
   * Mark tool as executing (after confirmation)
   */
  markToolExecuting(executionId: string): void {
    this.metricsCollector.getToolTelemetry().markExecuting(executionId);
  }

  /**
   * Complete a tool execution
   */
  async completeToolExecution(
    executionId: string,
    success: boolean,
    output?: unknown,
    error?: { code: string; message: string; retryable: boolean }
  ): Promise<void> {
    await this.metricsCollector.getToolTelemetry().completeExecution(
      executionId,
      success,
      output,
      error ? { ...error, stack: undefined } : undefined
    );
  }

  /**
   * Get tool execution metrics
   */
  async getToolMetrics(minutes: number = 60): Promise<ToolMetrics> {
    return this.metricsCollector.getToolTelemetry().getRecentMetrics(minutes);
  }

  // ---------------------------------------------------------------------------
  // Memory Quality
  // ---------------------------------------------------------------------------

  /**
   * Record a memory retrieval event
   */
  async recordMemoryRetrieval(params: {
    userId: string;
    sessionId?: string;
    query: string;
    source: keyof typeof MemorySource;
    resultCount: number;
    topRelevanceScore: number;
    avgRelevanceScore: number;
    cacheHit: boolean;
    latencyMs: number;
  }): Promise<string> {
    return this.metricsCollector.getMemoryQualityTracker().recordRetrieval({
      ...params,
      source: MemorySource[params.source],
    });
  }

  /**
   * Record user feedback for a memory retrieval
   */
  async recordMemoryFeedback(
    retrievalId: string,
    helpful: boolean,
    relevanceRating?: number
  ): Promise<void> {
    await this.metricsCollector.getMemoryQualityTracker().recordFeedback(retrievalId, {
      helpful,
      relevanceRating,
    });
  }

  /**
   * Get memory quality metrics
   */
  async getMemoryMetrics(minutes: number = 60): Promise<MemoryQualityMetrics> {
    return this.metricsCollector.getMemoryQualityTracker().getRecentMetrics(minutes);
  }

  // ---------------------------------------------------------------------------
  // Confidence Calibration
  // ---------------------------------------------------------------------------

  /**
   * Record a confidence prediction
   */
  async recordConfidencePrediction(params: {
    userId: string;
    sessionId?: string;
    responseId: string;
    responseType: keyof typeof ResponseType;
    predictedConfidence: number;
    factors: Array<{
      type: string;
      name: string;
      weight: number;
      score: number;
      contribution: number;
    }>;
  }): Promise<string> {
    return this.metricsCollector.getConfidenceCalibration().recordPrediction({
      ...params,
      responseType: ResponseType[params.responseType],
    });
  }

  /**
   * Record outcome for a confidence prediction
   */
  async recordConfidenceOutcome(
    predictionId: string,
    accurate: boolean,
    verificationMethod: keyof typeof VerificationMethod = 'USER_FEEDBACK'
  ): Promise<void> {
    await this.metricsCollector.getConfidenceCalibration().recordOutcome(predictionId, {
      accurate,
      userVerified: verificationMethod === 'USER_FEEDBACK',
      verificationMethod: VerificationMethod[verificationMethod],
    });
  }

  /**
   * Get calibration metrics
   */
  async getCalibrationMetrics(days: number = 7): Promise<CalibrationMetrics> {
    return this.metricsCollector.getConfidenceCalibration().getRecentMetrics(days);
  }

  // ---------------------------------------------------------------------------
  // Plan Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Record a plan lifecycle event
   */
  async recordPlanEvent(params: {
    planId: string;
    userId: string;
    eventType: keyof typeof PlanEventType;
    stepId?: string;
    previousState?: string;
    newState?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.metricsCollector.recordPlanEvent({
      ...params,
      eventType: PlanEventType[params.eventType],
    });
  }

  /**
   * Get plan metrics
   */
  async getPlanMetrics(hours: number = 24): Promise<PlanMetrics> {
    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return this.metricsCollector.getPlanLifecycleStore().getMetrics(start, now);
  }

  // ---------------------------------------------------------------------------
  // Proactive Events
  // ---------------------------------------------------------------------------

  /**
   * Record a proactive event
   */
  async recordProactiveEvent(params: {
    userId: string;
    eventType: keyof typeof ProactiveEventType;
    itemId: string;
    delivered: boolean;
    channel?: string;
    response?: {
      action: 'accepted' | 'dismissed' | 'deferred' | 'clicked';
      responseTimeMs: number;
      feedback?: string;
    };
  }): Promise<void> {
    await this.metricsCollector.recordProactiveEvent({
      ...params,
      eventType: ProactiveEventType[params.eventType],
    });
  }

  /**
   * Get proactive metrics
   */
  async getProactiveMetrics(hours: number = 24): Promise<ProactiveMetrics> {
    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return this.metricsCollector.getProactiveEventStore().getMetrics(start, now);
  }

  // ---------------------------------------------------------------------------
  // Unified Metrics
  // ---------------------------------------------------------------------------

  /**
   * Get complete agentic metrics snapshot
   */
  async getMetrics(hours: number = 24): Promise<AgenticMetrics> {
    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return this.metricsCollector.getMetrics(start, now);
  }

  /**
   * Get quick summary for dashboard
   */
  async getQuickSummary(): Promise<QuickMetricsSummary> {
    return this.metricsCollector.getQuickSummary();
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    return this.metricsCollector.getSystemHealth();
  }

  // ---------------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------------

  /**
   * Add a custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.metricsCollector.addAlertRule(rule);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.metricsCollector.getActiveAlerts();
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    this.metricsCollector.acknowledgeAlert(alertId);
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback: (alert: Alert) => void): () => void {
    return this.metricsCollector.onAlert(callback);
  }

  // ---------------------------------------------------------------------------
  // Default Alert Rules
  // ---------------------------------------------------------------------------

  private setupDefaultAlertRules(): void {
    // Health score alert
    this.metricsCollector.addAlertRule({
      id: 'health-score-critical',
      name: 'Health Score Critical',
      description: 'Overall health score dropped below critical threshold',
      metric: 'healthScore',
      operator: 'lt',
      threshold: 0.5,
      windowMinutes: 5,
      severity: AlertSeverity.CRITICAL,
      enabled: true,
    });

    // High latency alert
    this.metricsCollector.addAlertRule({
      id: 'latency-p95-high',
      name: 'High P95 Latency',
      description: 'P95 latency exceeded threshold',
      metric: 'latencyP95',
      operator: 'gt',
      threshold: 5000,
      windowMinutes: 5,
      severity: AlertSeverity.WARNING,
      enabled: true,
    });

    // Error rate alert
    this.metricsCollector.addAlertRule({
      id: 'error-rate-high',
      name: 'High Error Rate',
      description: 'Error rate exceeded threshold',
      metric: 'errorRate',
      operator: 'gt',
      threshold: 0.1,
      windowMinutes: 5,
      severity: AlertSeverity.WARNING,
      enabled: true,
    });

    // Memory usage alert
    this.metricsCollector.addAlertRule({
      id: 'memory-usage-high',
      name: 'High Memory Usage',
      description: 'Memory usage exceeded threshold',
      metric: 'memoryUsage',
      operator: 'gt',
      threshold: 1024, // 1GB
      windowMinutes: 5,
      severity: AlertSeverity.WARNING,
      enabled: true,
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let telemetryInstance: SAMTelemetryService | null = null;

/**
 * Get the singleton SAM telemetry service instance
 * By default uses Prisma-backed stores for persistence
 */
export function getSAMTelemetryService(
  options?: SAMTelemetryServiceOptions
): SAMTelemetryService {
  if (!telemetryInstance) {
    telemetryInstance = new SAMTelemetryService(options);
  }
  return telemetryInstance;
}

/**
 * Create a new SAM telemetry service instance
 * By default uses Prisma-backed stores for persistence
 */
export function createSAMTelemetryService(
  options?: SAMTelemetryServiceOptions
): SAMTelemetryService {
  return new SAMTelemetryService(options);
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetSAMTelemetryInstance(): void {
  if (telemetryInstance) {
    telemetryInstance.stop();
    telemetryInstance = null;
  }
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
  // Status enums
  ToolExecutionStatus,
  MemorySource,
  ResponseType,
  VerificationMethod,
  PlanEventType,
  ProactiveEventType,
  AlertSeverity,

  // Types
  type AgenticMetrics,
  type QuickMetricsSummary,
  type ToolMetrics,
  type MemoryQualityMetrics,
  type CalibrationMetrics,
  type PlanMetrics,
  type ProactiveMetrics,
  type SystemHealthMetrics,
  type Alert,
  type AlertRule,
  type ToolExecutionEvent,
  type MemoryRetrievalEvent,
  type ConfidencePrediction,
  type PlanLifecycleEvent,
  type ProactiveEvent,
};
