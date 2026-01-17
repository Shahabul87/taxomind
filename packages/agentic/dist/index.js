/**
 * @sam-ai/agentic
 * Autonomous agentic capabilities for SAM AI mentor
 *
 * This package provides:
 * - Goal Planning: Autonomous goal tracking, decomposition, and planning
 * - Tool Registry: Permissioned action execution with audit logging
 * - Proactive Interventions: Context-aware mentor triggers
 * - Self-Evaluation: Confidence scoring and verification
 * - Learning Analytics: Progress analysis, skill assessment, and recommendations
 */
// ============================================================================
// GOAL PLANNING
// ============================================================================
export * from './goal-planning';
// ============================================================================
// TOOL REGISTRY
// ============================================================================
export * from './tool-registry';
// ============================================================================
// MENTOR TOOLS
// ============================================================================
export * from './mentor-tools';
// ============================================================================
// ADAPTERS
// ============================================================================
export * from './adapters';
// ============================================================================
// MEMORY SYSTEM
// ============================================================================
export * from './memory';
// ============================================================================
// PROACTIVE INTERVENTION
// ============================================================================
// Export everything except PlanStatus to avoid conflict with goal-planning
export { 
// Renamed exports to avoid conflicts
LearningPlanStatus, LearningPlanStatus as ProactivePlanStatus, 
// Enums/Constants
MilestoneStatus, ActivityType, ActivityStatus, AdjustmentTrigger, CheckInStatus, CheckInType, NotificationChannel, TriggerType, QuestionType, ActionType, BehaviorEventType, EmotionalSignalType, PatternType, AnomalyType, InterventionType, 
// Schemas
LearningPlanInputSchema, ProgressUpdateSchema, CheckInResponseSchema, BehaviorEventSchema, 
// Classes and factories
MultiSessionPlanTracker, createMultiSessionPlanTracker, InMemoryLearningPlanStore, CheckInScheduler, createCheckInScheduler, InMemoryCheckInStore, TriggerEvaluator, BehaviorMonitor, createBehaviorMonitor, InMemoryBehaviorEventStore, InMemoryPatternStore, InMemoryInterventionStore, } from './proactive-intervention';
// ============================================================================
// SELF-EVALUATION
// ============================================================================
export { 
// Enums/Constants
ConfidenceLevel, ConfidenceFactorType, ResponseType, ComplexityLevel, SourceType, VerificationStatus, FactCheckStatus, IssueType, IssueSeverity, QualityMetricType, MetricSource, 
// Schemas
ConfidenceInputSchema, VerificationInputSchema, StudentFeedbackSchema, 
// Classes and factories
ConfidenceScorer, createConfidenceScorer, InMemoryConfidenceScoreStore, ResponseVerifier, createResponseVerifier, InMemoryVerificationResultStore, QualityTracker, createQualityTracker, InMemoryQualityRecordStore, InMemoryCalibrationStore, 
// Self-Critique
SelfCritiqueEngine, createSelfCritiqueEngine, createStrictSelfCritiqueEngine, createLenientSelfCritiqueEngine, InMemorySelfCritiqueStore, CritiqueDimension, CritiqueSeverity, DEFAULT_DIMENSION_WEIGHTS, SelfCritiqueInputSchema, SelfCritiqueLoopInputSchema, } from './self-evaluation';
// ============================================================================
// LEARNING ANALYTICS
// ============================================================================
export { 
// Enums
TrendDirection, MasteryLevel, LearningStyle, ContentType, RecommendationPriority, RecommendationReason, TimePeriod, AssessmentSource, 
// Schemas
LearningSessionInputSchema, SkillAssessmentInputSchema, RecommendationFeedbackSchema, 
// Progress Analyzer
ProgressAnalyzer, createProgressAnalyzer, InMemoryLearningSessionStore, InMemoryTopicProgressStore, InMemoryLearningGapStore, 
// Skill Assessor
SkillAssessor, createSkillAssessor, InMemorySkillAssessmentStore, 
// Recommendation Engine
RecommendationEngine, createRecommendationEngine, InMemoryRecommendationStore, InMemoryContentStore, } from './learning-analytics';
// ============================================================================
// ORCHESTRATION (Plan-Driven Tutoring)
// ============================================================================
export * from './orchestration';
// ============================================================================
// LEARNING PATH (Skill Tracking & Recommendations)
// ============================================================================
export { 
// Skill Tracker
SkillTracker, createSkillTracker, 
// Learning Path Recommender
LearningPathRecommender, createPathRecommender, } from './learning-path';
// ============================================================================
// REAL-TIME (WebSocket, Presence, Push)
// ============================================================================
export * from './realtime';
// ============================================================================
// OBSERVABILITY (Telemetry, Metrics, Quality Tracking)
// ============================================================================
export * from './observability';
// ============================================================================
// META-LEARNING (Pattern Recognition, System Optimization)
// ============================================================================
export * from './meta-learning';
// ============================================================================
// PACKAGE INFO
// ============================================================================
export const PACKAGE_NAME = '@sam-ai/agentic';
export const PACKAGE_VERSION = '0.1.0';
/**
 * Package capabilities
 */
export const CAPABILITIES = {
    GOAL_PLANNING: 'goal-planning',
    TOOL_REGISTRY: 'tool-registry',
    MENTOR_TOOLS: 'mentor-tools',
    MEMORY_SYSTEM: 'memory-system',
    PROACTIVE_INTERVENTIONS: 'proactive-interventions',
    SELF_EVALUATION: 'self-evaluation',
    LEARNING_ANALYTICS: 'learning-analytics',
    LEARNING_PATH: 'learning-path',
    ORCHESTRATION: 'orchestration',
    OBSERVABILITY: 'observability',
    META_LEARNING: 'meta-learning',
};
/**
 * Check if a capability is available
 */
export function hasCapability(capability) {
    switch (capability) {
        case CAPABILITIES.GOAL_PLANNING:
            return true;
        case CAPABILITIES.TOOL_REGISTRY:
            return true;
        case CAPABILITIES.MENTOR_TOOLS:
            return true;
        case CAPABILITIES.MEMORY_SYSTEM:
            return true;
        case CAPABILITIES.PROACTIVE_INTERVENTIONS:
            return true; // Phase D implemented
        case CAPABILITIES.SELF_EVALUATION:
            return true; // Phase E implemented
        case CAPABILITIES.LEARNING_ANALYTICS:
            return true; // Phase F implemented
        case CAPABILITIES.LEARNING_PATH:
            return true; // Phase G - Knowledge Graph Integration
        case CAPABILITIES.ORCHESTRATION:
            return true; // Phase 2 - Plan-Driven Tutoring
        case CAPABILITIES.OBSERVABILITY:
            return true; // Phase 5 - Observability & Operations
        case CAPABILITIES.META_LEARNING:
            return true; // Phase 3 - Meta-learning analytics
        default:
            return false;
    }
}
//# sourceMappingURL=index.js.map