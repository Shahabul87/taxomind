/**
 * @sam-ai/agentic - Observability Types
 * Type definitions for telemetry, metrics, and quality tracking
 */
export const ToolExecutionStatus = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    REJECTED: 'rejected',
    EXECUTING: 'executing',
    SUCCESS: 'success',
    FAILED: 'failed',
    TIMEOUT: 'timeout',
    CANCELLED: 'cancelled',
};
export const MemorySource = {
    VECTOR_SEARCH: 'vector_search',
    KNOWLEDGE_GRAPH: 'knowledge_graph',
    SESSION_CONTEXT: 'session_context',
    CROSS_SESSION: 'cross_session',
    CURRICULUM: 'curriculum',
    EXTERNAL: 'external',
};
export const ResponseType = {
    EXPLANATION: 'explanation',
    ANSWER: 'answer',
    RECOMMENDATION: 'recommendation',
    ASSESSMENT: 'assessment',
    INTERVENTION: 'intervention',
    TOOL_RESULT: 'tool_result',
};
export const VerificationMethod = {
    USER_FEEDBACK: 'user_feedback',
    EXPERT_REVIEW: 'expert_review',
    AUTOMATED_CHECK: 'automated_check',
    OUTCOME_TRACKING: 'outcome_tracking',
    SELF_VERIFICATION: 'self_verification',
};
export const PlanEventType = {
    CREATED: 'created',
    ACTIVATED: 'activated',
    STEP_STARTED: 'step_started',
    STEP_COMPLETED: 'step_completed',
    STEP_FAILED: 'step_failed',
    STEP_SKIPPED: 'step_skipped',
    PAUSED: 'paused',
    RESUMED: 'resumed',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned',
    MODIFIED: 'modified',
};
export const ProactiveEventType = {
    CHECKIN_SCHEDULED: 'checkin_scheduled',
    CHECKIN_TRIGGERED: 'checkin_triggered',
    CHECKIN_DELIVERED: 'checkin_delivered',
    CHECKIN_RESPONDED: 'checkin_responded',
    CHECKIN_DISMISSED: 'checkin_dismissed',
    CHECKIN_EXPIRED: 'checkin_expired',
    INTERVENTION_TRIGGERED: 'intervention_triggered',
    INTERVENTION_DELIVERED: 'intervention_delivered',
    INTERVENTION_ACCEPTED: 'intervention_accepted',
    INTERVENTION_DISMISSED: 'intervention_dismissed',
    NUDGE_SENT: 'nudge_sent',
    NUDGE_CLICKED: 'nudge_clicked',
    RECOMMENDATION_SHOWN: 'recommendation_shown',
    RECOMMENDATION_CLICKED: 'recommendation_clicked',
};
export const HealthStatus = {
    HEALTHY: 'healthy',
    DEGRADED: 'degraded',
    UNHEALTHY: 'unhealthy',
    UNKNOWN: 'unknown',
};
export const AlertSeverity = {
    INFO: 'info',
    WARNING: 'warning',
    CRITICAL: 'critical',
};
//# sourceMappingURL=types.js.map