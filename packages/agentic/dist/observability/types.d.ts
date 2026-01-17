/**
 * @sam-ai/agentic - Observability Types
 * Type definitions for telemetry, metrics, and quality tracking
 */
/**
 * Tool execution event for telemetry
 */
export interface ToolExecutionEvent {
    /** Unique execution ID */
    executionId: string;
    /** Tool identifier */
    toolId: string;
    /** Tool name */
    toolName: string;
    /** User who initiated */
    userId: string;
    /** Session context */
    sessionId?: string;
    /** Plan/goal context if applicable */
    planId?: string;
    stepId?: string;
    /** Execution timing */
    startedAt: Date;
    completedAt?: Date;
    durationMs?: number;
    /** Result status */
    status: ToolExecutionStatus;
    /** Error details if failed */
    error?: ToolExecutionError;
    /** Was confirmation required? */
    confirmationRequired: boolean;
    /** Was confirmation given? */
    confirmationGiven?: boolean;
    /** Input parameters (sanitized) */
    inputSummary?: string;
    /** Output summary (sanitized) */
    outputSummary?: string;
    /** Custom tags */
    tags?: Record<string, string>;
}
export declare const ToolExecutionStatus: {
    readonly PENDING: "pending";
    readonly CONFIRMED: "confirmed";
    readonly REJECTED: "rejected";
    readonly EXECUTING: "executing";
    readonly SUCCESS: "success";
    readonly FAILED: "failed";
    readonly TIMEOUT: "timeout";
    readonly CANCELLED: "cancelled";
};
export type ToolExecutionStatus = (typeof ToolExecutionStatus)[keyof typeof ToolExecutionStatus];
export interface ToolExecutionError {
    code: string;
    message: string;
    stack?: string;
    retryable: boolean;
}
/**
 * Aggregated tool metrics
 */
export interface ToolMetrics {
    /** Total executions */
    executionCount: number;
    /** Success rate (0-1) */
    successRate: number;
    /** Average latency in ms */
    avgLatencyMs: number;
    /** P50 latency */
    p50LatencyMs: number;
    /** P95 latency */
    p95LatencyMs: number;
    /** P99 latency */
    p99LatencyMs: number;
    /** Confirmation rate (how often confirmation was required) */
    confirmationRate: number;
    /** Confirmation acceptance rate */
    confirmationAcceptRate: number;
    /** Failures grouped by error code */
    failuresByCode: Record<string, number>;
    /** Executions by tool */
    executionsByTool: Record<string, number>;
    /** Time period */
    periodStart: Date;
    periodEnd: Date;
}
/**
 * Memory retrieval event for quality tracking
 */
export interface MemoryRetrievalEvent {
    /** Unique retrieval ID */
    retrievalId: string;
    /** User context */
    userId: string;
    sessionId?: string;
    /** Query that triggered retrieval */
    query: string;
    /** Retrieval source */
    source: MemorySource;
    /** Results returned */
    resultCount: number;
    /** Top relevance score (0-1) */
    topRelevanceScore: number;
    /** Average relevance score */
    avgRelevanceScore: number;
    /** Was cache used? */
    cacheHit: boolean;
    /** Latency in ms */
    latencyMs: number;
    /** Timestamp */
    timestamp: Date;
    /** User feedback if available */
    userFeedback?: MemoryFeedback;
    /** Custom metadata */
    metadata?: Record<string, unknown>;
}
export declare const MemorySource: {
    readonly VECTOR_SEARCH: "vector_search";
    readonly KNOWLEDGE_GRAPH: "knowledge_graph";
    readonly SESSION_CONTEXT: "session_context";
    readonly CROSS_SESSION: "cross_session";
    readonly CURRICULUM: "curriculum";
    readonly EXTERNAL: "external";
};
export type MemorySource = (typeof MemorySource)[keyof typeof MemorySource];
export interface MemoryFeedback {
    /** Was the result helpful? */
    helpful: boolean;
    /** Relevance rating (1-5) */
    relevanceRating?: number;
    /** User comment */
    comment?: string;
    /** Timestamp */
    providedAt: Date;
}
/**
 * Aggregated memory quality metrics
 */
export interface MemoryQualityMetrics {
    /** Total searches */
    searchCount: number;
    /** Average relevance score */
    avgRelevanceScore: number;
    /** Median relevance score */
    medianRelevanceScore: number;
    /** Cache hit rate (0-1) */
    cacheHitRate: number;
    /** Average latency */
    avgLatencyMs: number;
    /** P95 latency */
    p95LatencyMs: number;
    /** Empty result rate */
    emptyResultRate: number;
    /** User feedback positive rate */
    positiveFeedbackRate: number;
    /** Metrics by source */
    bySource: Record<MemorySource, SourceMetrics>;
    /** Reindex queue depth */
    reindexQueueDepth: number;
    /** Last reindex timestamp */
    lastReindexAt?: Date;
    /** Time period */
    periodStart: Date;
    periodEnd: Date;
}
export interface SourceMetrics {
    searchCount: number;
    avgRelevanceScore: number;
    avgLatencyMs: number;
    cacheHitRate: number;
}
/**
 * Confidence prediction event
 */
export interface ConfidencePrediction {
    /** Unique prediction ID */
    predictionId: string;
    /** User context */
    userId: string;
    sessionId?: string;
    /** Response context */
    responseId: string;
    responseType: ResponseType;
    /** Predicted confidence (0-1) */
    predictedConfidence: number;
    /** Confidence factors used */
    factors: ConfidenceFactor[];
    /** Timestamp */
    predictedAt: Date;
    /** Actual outcome (if known) */
    actualOutcome?: ConfidenceOutcome;
}
export declare const ResponseType: {
    readonly EXPLANATION: "explanation";
    readonly ANSWER: "answer";
    readonly RECOMMENDATION: "recommendation";
    readonly ASSESSMENT: "assessment";
    readonly INTERVENTION: "intervention";
    readonly TOOL_RESULT: "tool_result";
};
export type ResponseType = (typeof ResponseType)[keyof typeof ResponseType];
export interface ConfidenceFactor {
    type: string;
    name: string;
    weight: number;
    score: number;
    contribution: number;
}
export interface ConfidenceOutcome {
    /** Was the response accurate? */
    accurate: boolean;
    /** User verified (explicit feedback) */
    userVerified: boolean;
    /** Verification method */
    verificationMethod: VerificationMethod;
    /** Actual quality score if measurable (0-1) */
    qualityScore?: number;
    /** Outcome recorded at */
    recordedAt: Date;
    /** Notes */
    notes?: string;
}
export declare const VerificationMethod: {
    readonly USER_FEEDBACK: "user_feedback";
    readonly EXPERT_REVIEW: "expert_review";
    readonly AUTOMATED_CHECK: "automated_check";
    readonly OUTCOME_TRACKING: "outcome_tracking";
    readonly SELF_VERIFICATION: "self_verification";
};
export type VerificationMethod = (typeof VerificationMethod)[keyof typeof VerificationMethod];
/**
 * Calibration metrics
 */
export interface CalibrationMetrics {
    /** Total predictions */
    predictionCount: number;
    /** Predictions with outcomes */
    outcomesRecorded: number;
    /** Average predicted confidence */
    avgPredictedConfidence: number;
    /** Average actual accuracy */
    avgActualAccuracy: number;
    /** Calibration error (difference between predicted and actual) */
    calibrationError: number;
    /** Brier score (mean squared error of predictions) */
    brierScore: number;
    /** Calibration buckets */
    calibrationBuckets: CalibrationBucket[];
    /** Verification override rate */
    verificationOverrideRate: number;
    /** Metrics by response type */
    byResponseType: Record<ResponseType, TypeCalibration>;
    /** Time period */
    periodStart: Date;
    periodEnd: Date;
}
export interface CalibrationBucket {
    /** Bucket range (e.g., 0.8-0.9) */
    rangeStart: number;
    rangeEnd: number;
    /** Number of predictions in bucket */
    count: number;
    /** Average predicted confidence */
    avgPredicted: number;
    /** Actual accuracy rate */
    actualAccuracy: number;
    /** Calibration error for bucket */
    error: number;
}
export interface TypeCalibration {
    predictionCount: number;
    avgPredictedConfidence: number;
    avgActualAccuracy: number;
    calibrationError: number;
}
/**
 * Plan lifecycle event
 */
export interface PlanLifecycleEvent {
    /** Event ID */
    eventId: string;
    /** Plan ID */
    planId: string;
    /** User ID */
    userId: string;
    /** Event type */
    eventType: PlanEventType;
    /** Step ID if applicable */
    stepId?: string;
    /** Previous state */
    previousState?: string;
    /** New state */
    newState?: string;
    /** Timestamp */
    timestamp: Date;
    /** Additional data */
    metadata?: Record<string, unknown>;
}
export declare const PlanEventType: {
    readonly CREATED: "created";
    readonly ACTIVATED: "activated";
    readonly STEP_STARTED: "step_started";
    readonly STEP_COMPLETED: "step_completed";
    readonly STEP_FAILED: "step_failed";
    readonly STEP_SKIPPED: "step_skipped";
    readonly PAUSED: "paused";
    readonly RESUMED: "resumed";
    readonly COMPLETED: "completed";
    readonly ABANDONED: "abandoned";
    readonly MODIFIED: "modified";
};
export type PlanEventType = (typeof PlanEventType)[keyof typeof PlanEventType];
/**
 * Plan metrics
 */
export interface PlanMetrics {
    /** Active plans count */
    activePlansCount: number;
    /** Total plans created */
    totalCreated: number;
    /** Completion rate (0-1) */
    completionRate: number;
    /** Abandonment rate (0-1) */
    abandonmentRate: number;
    /** Average steps per plan */
    avgStepsPerPlan: number;
    /** Average completion time (ms) */
    avgCompletionTimeMs: number;
    /** Step completion rate by position */
    stepCompletionByPosition: Record<number, number>;
    /** Dropoff analysis */
    dropoffByStep: Record<number, number>;
    /** Plans by status */
    byStatus: Record<string, number>;
    /** Time period */
    periodStart: Date;
    periodEnd: Date;
}
/**
 * Proactive event tracking
 */
export interface ProactiveEvent {
    /** Event ID */
    eventId: string;
    /** User ID */
    userId: string;
    /** Event type */
    eventType: ProactiveEventType;
    /** Intervention/check-in ID */
    itemId: string;
    /** Was it delivered? */
    delivered: boolean;
    /** Delivery channel */
    channel?: string;
    /** User response */
    response?: ProactiveResponse;
    /** Timestamp */
    timestamp: Date;
}
export declare const ProactiveEventType: {
    readonly CHECKIN_SCHEDULED: "checkin_scheduled";
    readonly CHECKIN_TRIGGERED: "checkin_triggered";
    readonly CHECKIN_DELIVERED: "checkin_delivered";
    readonly CHECKIN_RESPONDED: "checkin_responded";
    readonly CHECKIN_DISMISSED: "checkin_dismissed";
    readonly CHECKIN_EXPIRED: "checkin_expired";
    readonly INTERVENTION_TRIGGERED: "intervention_triggered";
    readonly INTERVENTION_DELIVERED: "intervention_delivered";
    readonly INTERVENTION_ACCEPTED: "intervention_accepted";
    readonly INTERVENTION_DISMISSED: "intervention_dismissed";
    readonly NUDGE_SENT: "nudge_sent";
    readonly NUDGE_CLICKED: "nudge_clicked";
    readonly RECOMMENDATION_SHOWN: "recommendation_shown";
    readonly RECOMMENDATION_CLICKED: "recommendation_clicked";
};
export type ProactiveEventType = (typeof ProactiveEventType)[keyof typeof ProactiveEventType];
export interface ProactiveResponse {
    action: 'accepted' | 'dismissed' | 'deferred' | 'clicked';
    responseTimeMs: number;
    feedback?: string;
}
/**
 * Proactive metrics
 */
export interface ProactiveMetrics {
    /** Check-ins sent */
    checkInsSent: number;
    /** Check-in response rate */
    checkInResponseRate: number;
    /** Average check-in response time */
    avgCheckInResponseTimeMs: number;
    /** Interventions triggered */
    interventionsTriggered: number;
    /** Intervention acceptance rate */
    interventionAcceptRate: number;
    /** Nudges sent */
    nudgesSent: number;
    /** Nudge click rate */
    nudgeClickRate: number;
    /** Recommendations shown */
    recommendationsShown: number;
    /** Recommendation click rate */
    recommendationClickRate: number;
    /** By channel delivery stats */
    byChannel: Record<string, ChannelMetrics>;
    /** Time period */
    periodStart: Date;
    periodEnd: Date;
}
export interface ChannelMetrics {
    sent: number;
    delivered: number;
    deliveryRate: number;
    responseRate: number;
}
/**
 * Complete agentic metrics snapshot
 */
export interface AgenticMetrics {
    /** Tool execution metrics */
    tools: ToolMetrics;
    /** Memory quality metrics */
    memory: MemoryQualityMetrics;
    /** Confidence calibration metrics */
    confidence: CalibrationMetrics;
    /** Plan/goal metrics */
    plans: PlanMetrics;
    /** Proactive engagement metrics */
    proactive: ProactiveMetrics;
    /** System health */
    system: SystemHealthMetrics;
    /** Generated at */
    generatedAt: Date;
    /** Time period */
    periodStart: Date;
    periodEnd: Date;
}
export interface SystemHealthMetrics {
    /** Overall health score (0-1) */
    healthScore: number;
    /** Component health */
    components: Record<string, ComponentHealth>;
    /** Active connections */
    activeConnections: number;
    /** Memory usage */
    memoryUsageMb: number;
    /** Queue depths */
    queueDepths: Record<string, number>;
    /** Error rate (last hour) */
    errorRate: number;
    /** Latency percentiles */
    latencyP50Ms: number;
    latencyP95Ms: number;
    latencyP99Ms: number;
}
export interface ComponentHealth {
    name: string;
    status: HealthStatus;
    lastCheckAt: Date;
    latencyMs?: number;
    errorCount?: number;
    message?: string;
}
export declare const HealthStatus: {
    readonly HEALTHY: "healthy";
    readonly DEGRADED: "degraded";
    readonly UNHEALTHY: "unhealthy";
    readonly UNKNOWN: "unknown";
};
export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];
/**
 * Tool execution event store
 */
export interface ToolExecutionStore {
    record(event: ToolExecutionEvent): Promise<void>;
    getById(executionId: string): Promise<ToolExecutionEvent | null>;
    query(options: ToolExecutionQuery): Promise<ToolExecutionEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<ToolMetrics>;
}
export interface ToolExecutionQuery {
    userId?: string;
    toolId?: string;
    status?: ToolExecutionStatus | ToolExecutionStatus[];
    planId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    offset?: number;
}
/**
 * Memory retrieval event store
 */
export interface MemoryRetrievalStore {
    record(event: MemoryRetrievalEvent): Promise<void>;
    getById(retrievalId: string): Promise<MemoryRetrievalEvent | null>;
    recordFeedback(retrievalId: string, feedback: MemoryFeedback): Promise<void>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<MemoryQualityMetrics>;
}
/**
 * Confidence prediction store
 */
export interface ConfidencePredictionStore {
    record(prediction: ConfidencePrediction): Promise<void>;
    getById(predictionId: string): Promise<ConfidencePrediction | null>;
    recordOutcome(predictionId: string, outcome: ConfidenceOutcome): Promise<void>;
    getCalibrationMetrics(periodStart: Date, periodEnd: Date): Promise<CalibrationMetrics>;
}
/**
 * Plan lifecycle event store
 */
export interface PlanLifecycleStore {
    record(event: PlanLifecycleEvent): Promise<void>;
    getByPlanId(planId: string): Promise<PlanLifecycleEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<PlanMetrics>;
}
/**
 * Proactive event store
 */
export interface ProactiveEventStore {
    record(event: ProactiveEvent): Promise<void>;
    getByUserId(userId: string, limit?: number): Promise<ProactiveEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<ProactiveMetrics>;
}
export interface ObservabilityLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    windowMinutes: number;
    severity: AlertSeverity;
    enabled: boolean;
}
export declare const AlertSeverity: {
    readonly INFO: "info";
    readonly WARNING: "warning";
    readonly CRITICAL: "critical";
};
export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];
export interface Alert {
    id: string;
    ruleId: string;
    ruleName: string;
    severity: AlertSeverity;
    message: string;
    currentValue: number;
    threshold: number;
    triggeredAt: Date;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=types.d.ts.map