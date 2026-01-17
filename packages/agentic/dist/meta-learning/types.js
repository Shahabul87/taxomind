/**
 * @sam-ai/agentic - Meta-Learning Types
 * Types for meta-learning analytics, pattern recognition, and system optimization
 */
import { z } from 'zod';
// ============================================================================
// LEARNING PATTERN TYPES
// ============================================================================
/**
 * Learning pattern categories
 */
export const PatternCategory = {
    TEACHING_STRATEGY: 'teaching_strategy',
    STUDENT_BEHAVIOR: 'student_behavior',
    CONTENT_EFFECTIVENESS: 'content_effectiveness',
    ENGAGEMENT_PATTERN: 'engagement_pattern',
    ERROR_PATTERN: 'error_pattern',
    SUCCESS_PATTERN: 'success_pattern',
    INTERACTION_STYLE: 'interaction_style',
};
/**
 * Pattern confidence levels
 */
export const PatternConfidence = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    EMERGING: 'emerging',
};
// ============================================================================
// INSIGHT TYPES
// ============================================================================
/**
 * Insight types
 */
export const InsightType = {
    OPTIMIZATION: 'optimization',
    WARNING: 'warning',
    RECOMMENDATION: 'recommendation',
    TREND: 'trend',
    ANOMALY: 'anomaly',
    CORRELATION: 'correlation',
    PREDICTION: 'prediction',
};
/**
 * Insight priority
 */
export const InsightPriority = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    INFO: 'info',
};
// ============================================================================
// ANALYTICS TYPES
// ============================================================================
/**
 * Time period for analytics
 */
export const AnalyticsPeriod = {
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    QUARTER: 'quarter',
    ALL_TIME: 'all_time',
};
/**
 * Learning event types
 */
export const LearningEventType = {
    QUESTION_ASKED: 'question_asked',
    EXPLANATION_PROVIDED: 'explanation_provided',
    HINT_GIVEN: 'hint_given',
    FEEDBACK_DELIVERED: 'feedback_delivered',
    ASSESSMENT_COMPLETED: 'assessment_completed',
    CONCEPT_INTRODUCED: 'concept_introduced',
    PRACTICE_SESSION: 'practice_session',
    REVIEW_SESSION: 'review_session',
    ERROR_CORRECTION: 'error_correction',
    STRATEGY_APPLIED: 'strategy_applied',
};
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
export const LearningEventSchema = z.object({
    userId: z.string().min(1),
    sessionId: z.string().min(1),
    eventType: z.enum([
        'question_asked',
        'explanation_provided',
        'hint_given',
        'feedback_delivered',
        'assessment_completed',
        'concept_introduced',
        'practice_session',
        'review_session',
        'error_correction',
        'strategy_applied',
    ]),
    courseId: z.string().optional(),
    sectionId: z.string().optional(),
    topic: z.string().optional(),
    duration: z.number().optional(),
    outcome: z.enum(['success', 'partial', 'failure']).optional(),
    confidence: z.number().min(0).max(1).optional(),
    strategyId: z.string().optional(),
    strategyApplied: z.string().optional(),
    responseQuality: z.number().min(0).max(100).optional(),
    studentSatisfaction: z.number().min(1).max(5).optional(),
    metadata: z.record(z.unknown()).optional().default({}),
});
export const GetInsightsSchema = z.object({
    userId: z.string().optional(),
    type: z.enum([
        'optimization',
        'warning',
        'recommendation',
        'trend',
        'anomaly',
        'correlation',
        'prediction',
    ]).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
    limit: z.number().int().min(1).max(100).optional().default(20),
    activeOnly: z.boolean().optional().default(true),
});
export const GetAnalyticsSchema = z.object({
    userId: z.string().optional(),
    period: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'all_time']).optional().default('week'),
    includePatterns: z.boolean().optional().default(true),
    includeStrategies: z.boolean().optional().default(true),
    includeTrends: z.boolean().optional().default(true),
});
//# sourceMappingURL=types.js.map