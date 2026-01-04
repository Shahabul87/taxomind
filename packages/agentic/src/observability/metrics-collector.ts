/**
 * @sam-ai/agentic - Agentic Metrics Collector
 * Unified metrics collection and aggregation for observability
 */

import type {
  AgenticMetrics,
  PlanMetrics,
  ProactiveMetrics,
  SystemHealthMetrics,
  ComponentHealth,
  Alert,
  AlertRule,
  PlanLifecycleEvent,
  PlanLifecycleStore,
  ProactiveEvent,
  ProactiveEventStore,
  ObservabilityLogger,
} from './types';
import {
  HealthStatus,
  PlanEventType,
  ProactiveEventType,
} from './types';
import { ToolTelemetry } from './tool-telemetry';
import { MemoryQualityTracker } from './memory-quality-tracker';
import { ConfidenceCalibrationTracker } from './confidence-calibration';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// IN-MEMORY PLAN LIFECYCLE STORE
// ============================================================================

export class InMemoryPlanLifecycleStore implements PlanLifecycleStore {
  private events: Map<string, PlanLifecycleEvent[]> = new Map();
  private readonly maxEventsPerPlan: number;

  constructor(maxEventsPerPlan: number = 100) {
    this.maxEventsPerPlan = maxEventsPerPlan;
  }

  async record(event: PlanLifecycleEvent): Promise<void> {
    const planEvents = this.events.get(event.planId) ?? [];
    if (planEvents.length >= this.maxEventsPerPlan) {
      planEvents.shift();
    }
    planEvents.push(event);
    this.events.set(event.planId, planEvents);
  }

  async getByPlanId(planId: string): Promise<PlanLifecycleEvent[]> {
    return this.events.get(planId) ?? [];
  }

  async getMetrics(periodStart: Date, periodEnd: Date): Promise<PlanMetrics> {
    const allEvents = Array.from(this.events.values()).flat();
    const periodEvents = allEvents.filter(
      (e) => e.timestamp >= periodStart && e.timestamp <= periodEnd
    );

    // Get unique plan IDs
    const planIds = new Set(periodEvents.map((e) => e.planId));

    // Calculate metrics
    let totalCreated = 0;
    let completed = 0;
    let abandoned = 0;
    const stepsPerPlan: number[] = [];
    const completionTimes: number[] = [];
    const stepCompletionByPosition: Record<number, number> = {};
    const dropoffByStep: Record<number, number> = {};
    const byStatus: Record<string, number> = {};

    for (const planId of planIds) {
      const planEvents = periodEvents.filter((e) => e.planId === planId);

      const created = planEvents.find((e) => e.eventType === PlanEventType.CREATED);
      if (created) totalCreated++;

      const completedEvent = planEvents.find(
        (e) => e.eventType === PlanEventType.COMPLETED
      );
      if (completedEvent) {
        completed++;
        if (created) {
          completionTimes.push(
            completedEvent.timestamp.getTime() - created.timestamp.getTime()
          );
        }
      }

      const abandonedEvent = planEvents.find(
        (e) => e.eventType === PlanEventType.ABANDONED
      );
      if (abandonedEvent) abandoned++;

      // Count steps
      const stepEvents = planEvents.filter(
        (e) =>
          e.eventType === PlanEventType.STEP_COMPLETED ||
          e.eventType === PlanEventType.STEP_STARTED
      );
      stepsPerPlan.push(stepEvents.length);

      // Track step completion by position
      for (const event of stepEvents) {
        if (event.eventType === PlanEventType.STEP_COMPLETED) {
          const position = event.metadata?.stepPosition as number | undefined;
          if (position !== undefined) {
            stepCompletionByPosition[position] =
              (stepCompletionByPosition[position] ?? 0) + 1;
          }
        }
      }

      // Track last status
      const lastEvent = planEvents[planEvents.length - 1];
      if (lastEvent?.newState) {
        byStatus[lastEvent.newState] = (byStatus[lastEvent.newState] ?? 0) + 1;
      }
    }

    // Calculate dropoff
    const maxStep = Math.max(...Object.keys(stepCompletionByPosition).map(Number), 0);
    for (let i = 1; i <= maxStep; i++) {
      const current = stepCompletionByPosition[i] ?? 0;
      const previous = stepCompletionByPosition[i - 1] ?? totalCreated;
      dropoffByStep[i] = previous - current;
    }

    // Calculate active plans (rough estimate)
    const activePlansCount = byStatus['in_progress'] ?? 0;

    return {
      activePlansCount,
      totalCreated,
      completionRate: totalCreated > 0 ? completed / totalCreated : 0,
      abandonmentRate: totalCreated > 0 ? abandoned / totalCreated : 0,
      avgStepsPerPlan:
        stepsPerPlan.length > 0
          ? stepsPerPlan.reduce((a, b) => a + b, 0) / stepsPerPlan.length
          : 0,
      avgCompletionTimeMs:
        completionTimes.length > 0
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : 0,
      stepCompletionByPosition,
      dropoffByStep,
      byStatus,
      periodStart,
      periodEnd,
    };
  }

  clear(): void {
    this.events.clear();
  }
}

// ============================================================================
// IN-MEMORY PROACTIVE EVENT STORE
// ============================================================================

export class InMemoryProactiveEventStore implements ProactiveEventStore {
  private events: ProactiveEvent[] = [];
  private readonly maxEvents: number;

  constructor(maxEvents: number = 10000) {
    this.maxEvents = maxEvents;
  }

  async record(event: ProactiveEvent): Promise<void> {
    if (this.events.length >= this.maxEvents) {
      this.events.shift();
    }
    this.events.push(event);
  }

  async getByUserId(userId: string, limit: number = 100): Promise<ProactiveEvent[]> {
    return this.events
      .filter((e) => e.userId === userId)
      .slice(-limit);
  }

  async getMetrics(periodStart: Date, periodEnd: Date): Promise<ProactiveMetrics> {
    const periodEvents = this.events.filter(
      (e) => e.timestamp >= periodStart && e.timestamp <= periodEnd
    );

    // Check-ins
    const checkInsSent = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.CHECKIN_DELIVERED
    ).length;
    const checkInsResponded = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.CHECKIN_RESPONDED
    ).length;
    const checkInResponseTimes = periodEvents
      .filter(
        (e) =>
          e.eventType === ProactiveEventType.CHECKIN_RESPONDED && e.response
      )
      .map((e) => e.response!.responseTimeMs);

    // Interventions
    const interventionsTriggered = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.INTERVENTION_TRIGGERED
    ).length;
    const interventionsAccepted = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.INTERVENTION_ACCEPTED
    ).length;

    // Nudges
    const nudgesSent = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.NUDGE_SENT
    ).length;
    const nudgesClicked = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.NUDGE_CLICKED
    ).length;

    // Recommendations
    const recommendationsShown = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.RECOMMENDATION_SHOWN
    ).length;
    const recommendationsClicked = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.RECOMMENDATION_CLICKED
    ).length;

    // By channel
    const byChannel: Record<string, { sent: number; delivered: number; responseRate: number; deliveryRate: number }> = {};
    for (const event of periodEvents) {
      if (event.channel) {
        if (!byChannel[event.channel]) {
          byChannel[event.channel] = {
            sent: 0,
            delivered: 0,
            deliveryRate: 0,
            responseRate: 0,
          };
        }
        byChannel[event.channel].sent++;
        if (event.delivered) {
          byChannel[event.channel].delivered++;
        }
      }
    }

    // Calculate rates
    for (const channel of Object.keys(byChannel)) {
      const stats = byChannel[channel];
      stats.deliveryRate = stats.sent > 0 ? stats.delivered / stats.sent : 0;
    }

    return {
      checkInsSent,
      checkInResponseRate: checkInsSent > 0 ? checkInsResponded / checkInsSent : 0,
      avgCheckInResponseTimeMs:
        checkInResponseTimes.length > 0
          ? checkInResponseTimes.reduce((a, b) => a + b, 0) / checkInResponseTimes.length
          : 0,
      interventionsTriggered,
      interventionAcceptRate:
        interventionsTriggered > 0 ? interventionsAccepted / interventionsTriggered : 0,
      nudgesSent,
      nudgeClickRate: nudgesSent > 0 ? nudgesClicked / nudgesSent : 0,
      recommendationsShown,
      recommendationClickRate:
        recommendationsShown > 0 ? recommendationsClicked / recommendationsShown : 0,
      byChannel,
      periodStart,
      periodEnd,
    };
  }

  clear(): void {
    this.events = [];
  }
}

// ============================================================================
// AGENTIC METRICS COLLECTOR
// ============================================================================

export interface MetricsCollectorConfig {
  /** Enable metrics collection */
  enabled: boolean;
  /** Default period for metrics (hours) */
  defaultPeriodHours: number;
  /** Health check interval (ms) */
  healthCheckIntervalMs: number;
  /** Enable alert evaluation */
  alertsEnabled: boolean;
}

export const DEFAULT_METRICS_COLLECTOR_CONFIG: MetricsCollectorConfig = {
  enabled: true,
  defaultPeriodHours: 24,
  healthCheckIntervalMs: 60000,
  alertsEnabled: true,
};

export class AgenticMetricsCollector {
  private readonly config: MetricsCollectorConfig;
  private readonly logger: ObservabilityLogger;

  // Sub-collectors
  private readonly toolTelemetry: ToolTelemetry;
  private readonly memoryQualityTracker: MemoryQualityTracker;
  private readonly confidenceCalibration: ConfidenceCalibrationTracker;
  private readonly planLifecycleStore: PlanLifecycleStore;
  private readonly proactiveEventStore: ProactiveEventStore;

  // Alerts
  private alertRules: AlertRule[] = [];
  private activeAlerts: Alert[] = [];
  private alertListeners: Set<(alert: Alert) => void> = new Set();

  // Health check
  private healthCheckInterval?: ReturnType<typeof setInterval>;
  private lastHealthCheck?: SystemHealthMetrics;

  constructor(options: {
    config?: Partial<MetricsCollectorConfig>;
    logger?: ObservabilityLogger;
    toolTelemetry?: ToolTelemetry;
    memoryQualityTracker?: MemoryQualityTracker;
    confidenceCalibration?: ConfidenceCalibrationTracker;
    planLifecycleStore?: PlanLifecycleStore;
    proactiveEventStore?: ProactiveEventStore;
  }) {
    this.config = { ...DEFAULT_METRICS_COLLECTOR_CONFIG, ...options.config };
    this.logger = options.logger ?? console;

    // Initialize sub-collectors
    this.toolTelemetry = options.toolTelemetry ?? new ToolTelemetry({ logger: this.logger });
    this.memoryQualityTracker =
      options.memoryQualityTracker ?? new MemoryQualityTracker({ logger: this.logger });
    this.confidenceCalibration =
      options.confidenceCalibration ??
      new ConfidenceCalibrationTracker({ logger: this.logger });
    this.planLifecycleStore =
      options.planLifecycleStore ?? new InMemoryPlanLifecycleStore();
    this.proactiveEventStore =
      options.proactiveEventStore ?? new InMemoryProactiveEventStore();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  start(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(() => {
      this.runHealthCheck().catch((err) => {
        this.logger.error('Health check failed', {
          error: err instanceof Error ? err.message : 'Unknown',
        });
      });
    }, this.config.healthCheckIntervalMs);

    this.logger.info('Agentic metrics collector started');
  }

  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    this.logger.info('Agentic metrics collector stopped');
  }

  // ---------------------------------------------------------------------------
  // Sub-Collector Access
  // ---------------------------------------------------------------------------

  getToolTelemetry(): ToolTelemetry {
    return this.toolTelemetry;
  }

  getMemoryQualityTracker(): MemoryQualityTracker {
    return this.memoryQualityTracker;
  }

  getConfidenceCalibration(): ConfidenceCalibrationTracker {
    return this.confidenceCalibration;
  }

  getPlanLifecycleStore(): PlanLifecycleStore {
    return this.planLifecycleStore;
  }

  getProactiveEventStore(): ProactiveEventStore {
    return this.proactiveEventStore;
  }

  // ---------------------------------------------------------------------------
  // Unified Metrics
  // ---------------------------------------------------------------------------

  /**
   * Get complete agentic metrics snapshot
   */
  async getMetrics(periodStart?: Date, periodEnd?: Date): Promise<AgenticMetrics> {
    const end = periodEnd ?? new Date();
    const start =
      periodStart ?? new Date(end.getTime() - this.config.defaultPeriodHours * 60 * 60 * 1000);

    const [tools, memory, confidence, plans, proactive] = await Promise.all([
      this.toolTelemetry.getMetrics(start, end),
      this.memoryQualityTracker.getMetrics(start, end),
      this.confidenceCalibration.getCalibrationMetrics(start, end),
      this.planLifecycleStore.getMetrics(start, end),
      this.proactiveEventStore.getMetrics(start, end),
    ]);

    const system = await this.getSystemHealth();

    return {
      tools,
      memory,
      confidence,
      plans,
      proactive,
      system,
      generatedAt: new Date(),
      periodStart: start,
      periodEnd: end,
    };
  }

  /**
   * Get quick summary metrics for dashboard
   */
  async getQuickSummary(): Promise<QuickMetricsSummary> {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [tools, memory, confidence] = await Promise.all([
      this.toolTelemetry.getMetrics(hourAgo, now),
      this.memoryQualityTracker.getMetrics(hourAgo, now),
      this.confidenceCalibration.getCalibrationMetrics(hourAgo, now),
    ]);

    return {
      toolSuccessRate: tools.successRate,
      avgToolLatencyMs: tools.avgLatencyMs,
      memoryRelevanceScore: memory.avgRelevanceScore,
      memoryCacheHitRate: memory.cacheHitRate,
      confidenceCalibrationError: confidence.calibrationError,
      activeToolExecutions: this.toolTelemetry.getActiveExecutionCount(),
      healthScore: this.lastHealthCheck?.healthScore ?? 1.0,
      activeAlerts: this.activeAlerts.length,
      timestamp: now,
    };
  }

  // ---------------------------------------------------------------------------
  // System Health
  // ---------------------------------------------------------------------------

  private async runHealthCheck(): Promise<void> {
    const health = await this.getSystemHealth();
    this.lastHealthCheck = health;

    // Evaluate alert rules
    if (this.config.alertsEnabled) {
      await this.evaluateAlerts(health);
    }
  }

  async getSystemHealth(): Promise<SystemHealthMetrics> {
    const components: Record<string, ComponentHealth> = {};

    // Check tool telemetry
    components['tool_telemetry'] = {
      name: 'Tool Telemetry',
      status: HealthStatus.HEALTHY,
      lastCheckAt: new Date(),
    };

    // Check memory quality
    const recentMemory = await this.memoryQualityTracker.getRecentMetrics(5);
    components['memory_quality'] = {
      name: 'Memory Quality',
      status:
        recentMemory.avgRelevanceScore > 0.5
          ? HealthStatus.HEALTHY
          : recentMemory.avgRelevanceScore > 0.3
            ? HealthStatus.DEGRADED
            : HealthStatus.UNHEALTHY,
      lastCheckAt: new Date(),
      latencyMs: recentMemory.avgLatencyMs,
    };

    // Check confidence calibration
    const calibration = await this.confidenceCalibration.getRecentMetrics(1);
    components['confidence_calibration'] = {
      name: 'Confidence Calibration',
      status:
        calibration.calibrationError < 0.1
          ? HealthStatus.HEALTHY
          : calibration.calibrationError < 0.2
            ? HealthStatus.DEGRADED
            : HealthStatus.UNHEALTHY,
      lastCheckAt: new Date(),
    };

    // Calculate overall health score
    const healthScores: number[] = Object.values(components).map((c) =>
      c.status === HealthStatus.HEALTHY
        ? 1
        : c.status === HealthStatus.DEGRADED
          ? 0.5
          : 0
    );
    const healthScore =
      healthScores.length > 0
        ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length
        : 1;

    return {
      healthScore,
      components,
      activeConnections: 0, // Would be populated by realtime module
      memoryUsageMb: process.memoryUsage().heapUsed / 1024 / 1024,
      queueDepths: {},
      errorRate: 0,
      latencyP50Ms: recentMemory.avgLatencyMs,
      latencyP95Ms: recentMemory.p95LatencyMs,
      latencyP99Ms: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------------

  /**
   * Add an alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  /**
   * Remove an alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules = this.alertRules.filter((r) => r.id !== ruleId);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return [...this.activeAlerts];
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.activeAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledgedAt = new Date();
    }
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback: (alert: Alert) => void): () => void {
    this.alertListeners.add(callback);
    return () => {
      this.alertListeners.delete(callback);
    };
  }

  private async evaluateAlerts(health: SystemHealthMetrics): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const value = this.getMetricValue(rule.metric, health);
      if (value === null) continue;

      const triggered = this.evaluateCondition(value, rule.operator, rule.threshold);

      if (triggered) {
        const existingAlert = this.activeAlerts.find((a) => a.ruleId === rule.id);
        if (!existingAlert) {
          const alert: Alert = {
            id: uuidv4(),
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: `${rule.name}: ${value} ${rule.operator} ${rule.threshold}`,
            currentValue: value,
            threshold: rule.threshold,
            triggeredAt: new Date(),
          };

          this.activeAlerts.push(alert);
          this.emitAlert(alert);
        }
      } else {
        // Resolve existing alert
        const alertIndex = this.activeAlerts.findIndex((a) => a.ruleId === rule.id);
        if (alertIndex >= 0) {
          this.activeAlerts[alertIndex].resolvedAt = new Date();
          this.activeAlerts.splice(alertIndex, 1);
        }
      }
    }
  }

  private getMetricValue(metric: string, health: SystemHealthMetrics): number | null {
    switch (metric) {
      case 'healthScore':
        return health.healthScore;
      case 'errorRate':
        return health.errorRate;
      case 'latencyP95':
        return health.latencyP95Ms;
      case 'latencyP99':
        return health.latencyP99Ms;
      case 'memoryUsage':
        return health.memoryUsageMb;
      default:
        return null;
    }
  }

  private evaluateCondition(
    value: number,
    operator: AlertRule['operator'],
    threshold: number
  ): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      default:
        return false;
    }
  }

  private emitAlert(alert: Alert): void {
    this.logger.warn('Alert triggered', {
      alertId: alert.id,
      ruleName: alert.ruleName,
      severity: alert.severity,
      message: alert.message,
    });

    for (const listener of this.alertListeners) {
      try {
        listener(alert);
      } catch (err) {
        this.logger.error('Error in alert listener', {
          error: err instanceof Error ? err.message : 'Unknown',
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Plan Lifecycle Recording
  // ---------------------------------------------------------------------------

  async recordPlanEvent(event: Omit<PlanLifecycleEvent, 'eventId' | 'timestamp'>): Promise<void> {
    const fullEvent: PlanLifecycleEvent = {
      ...event,
      eventId: uuidv4(),
      timestamp: new Date(),
    };

    await this.planLifecycleStore.record(fullEvent);

    this.logger.debug('Plan lifecycle event recorded', {
      planId: event.planId,
      eventType: event.eventType,
    });
  }

  // ---------------------------------------------------------------------------
  // Proactive Event Recording
  // ---------------------------------------------------------------------------

  async recordProactiveEvent(
    event: Omit<ProactiveEvent, 'eventId' | 'timestamp'>
  ): Promise<void> {
    const fullEvent: ProactiveEvent = {
      ...event,
      eventId: uuidv4(),
      timestamp: new Date(),
    };

    await this.proactiveEventStore.record(fullEvent);

    this.logger.debug('Proactive event recorded', {
      userId: event.userId,
      eventType: event.eventType,
    });
  }
}

export interface QuickMetricsSummary {
  toolSuccessRate: number;
  avgToolLatencyMs: number;
  memoryRelevanceScore: number;
  memoryCacheHitRate: number;
  confidenceCalibrationError: number;
  activeToolExecutions: number;
  healthScore: number;
  activeAlerts: number;
  timestamp: Date;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createAgenticMetricsCollector(options?: {
  config?: Partial<MetricsCollectorConfig>;
  logger?: ObservabilityLogger;
  toolTelemetry?: ToolTelemetry;
  memoryQualityTracker?: MemoryQualityTracker;
  confidenceCalibration?: ConfidenceCalibrationTracker;
  planLifecycleStore?: PlanLifecycleStore;
  proactiveEventStore?: ProactiveEventStore;
}): AgenticMetricsCollector {
  return new AgenticMetricsCollector(options ?? {});
}

export function createInMemoryPlanLifecycleStore(
  maxEventsPerPlan?: number
): InMemoryPlanLifecycleStore {
  return new InMemoryPlanLifecycleStore(maxEventsPerPlan);
}

export function createInMemoryProactiveEventStore(
  maxEvents?: number
): InMemoryProactiveEventStore {
  return new InMemoryProactiveEventStore(maxEvents);
}
