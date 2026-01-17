/**
 * @sam-ai/agentic - Agentic Metrics Collector
 * Unified metrics collection and aggregation for observability
 */
import type { AgenticMetrics, PlanMetrics, ProactiveMetrics, SystemHealthMetrics, Alert, AlertRule, PlanLifecycleEvent, PlanLifecycleStore, ProactiveEvent, ProactiveEventStore, ObservabilityLogger } from './types';
import { ToolTelemetry } from './tool-telemetry';
import { MemoryQualityTracker } from './memory-quality-tracker';
import { ConfidenceCalibrationTracker } from './confidence-calibration';
export declare class InMemoryPlanLifecycleStore implements PlanLifecycleStore {
    private events;
    private readonly maxEventsPerPlan;
    constructor(maxEventsPerPlan?: number);
    record(event: PlanLifecycleEvent): Promise<void>;
    getByPlanId(planId: string): Promise<PlanLifecycleEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<PlanMetrics>;
    clear(): void;
}
export declare class InMemoryProactiveEventStore implements ProactiveEventStore {
    private events;
    private readonly maxEvents;
    constructor(maxEvents?: number);
    record(event: ProactiveEvent): Promise<void>;
    getByUserId(userId: string, limit?: number): Promise<ProactiveEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<ProactiveMetrics>;
    clear(): void;
}
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
export declare const DEFAULT_METRICS_COLLECTOR_CONFIG: MetricsCollectorConfig;
export declare class AgenticMetricsCollector {
    private readonly config;
    private readonly logger;
    private readonly toolTelemetry;
    private readonly memoryQualityTracker;
    private readonly confidenceCalibration;
    private readonly planLifecycleStore;
    private readonly proactiveEventStore;
    private alertRules;
    private activeAlerts;
    private alertListeners;
    private healthCheckInterval?;
    private lastHealthCheck?;
    constructor(options: {
        config?: Partial<MetricsCollectorConfig>;
        logger?: ObservabilityLogger;
        toolTelemetry?: ToolTelemetry;
        memoryQualityTracker?: MemoryQualityTracker;
        confidenceCalibration?: ConfidenceCalibrationTracker;
        planLifecycleStore?: PlanLifecycleStore;
        proactiveEventStore?: ProactiveEventStore;
    });
    start(): void;
    stop(): void;
    getToolTelemetry(): ToolTelemetry;
    getMemoryQualityTracker(): MemoryQualityTracker;
    getConfidenceCalibration(): ConfidenceCalibrationTracker;
    getPlanLifecycleStore(): PlanLifecycleStore;
    getProactiveEventStore(): ProactiveEventStore;
    /**
     * Get complete agentic metrics snapshot
     */
    getMetrics(periodStart?: Date, periodEnd?: Date): Promise<AgenticMetrics>;
    /**
     * Get quick summary metrics for dashboard
     */
    getQuickSummary(): Promise<QuickMetricsSummary>;
    private runHealthCheck;
    getSystemHealth(): Promise<SystemHealthMetrics>;
    /**
     * Add an alert rule
     */
    addAlertRule(rule: AlertRule): void;
    /**
     * Remove an alert rule
     */
    removeAlertRule(ruleId: string): void;
    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[];
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId: string): void;
    /**
     * Subscribe to alerts
     */
    onAlert(callback: (alert: Alert) => void): () => void;
    private evaluateAlerts;
    private getMetricValue;
    private evaluateCondition;
    private emitAlert;
    recordPlanEvent(event: Omit<PlanLifecycleEvent, 'eventId' | 'timestamp'>): Promise<void>;
    recordProactiveEvent(event: Omit<ProactiveEvent, 'eventId' | 'timestamp'>): Promise<void>;
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
export declare function createAgenticMetricsCollector(options?: {
    config?: Partial<MetricsCollectorConfig>;
    logger?: ObservabilityLogger;
    toolTelemetry?: ToolTelemetry;
    memoryQualityTracker?: MemoryQualityTracker;
    confidenceCalibration?: ConfidenceCalibrationTracker;
    planLifecycleStore?: PlanLifecycleStore;
    proactiveEventStore?: ProactiveEventStore;
}): AgenticMetricsCollector;
export declare function createInMemoryPlanLifecycleStore(maxEventsPerPlan?: number): InMemoryPlanLifecycleStore;
export declare function createInMemoryProactiveEventStore(maxEvents?: number): InMemoryProactiveEventStore;
//# sourceMappingURL=metrics-collector.d.ts.map