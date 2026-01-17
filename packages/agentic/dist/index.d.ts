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
export * from './goal-planning';
export * from './tool-registry';
export * from './mentor-tools';
export * from './adapters';
export * from './memory';
export { type LearningPlanInput, type PlanConstraint, type LearningPlan, type WeeklyMilestone, type DailyTarget, type PlannedActivity, type ActivityResource, type DifficultyAdjustment, type PaceAdjustment, type WeeklyBreakdown, type DailyPractice, type DailyActivity, type ReviewItem, type StreakInfo, type ProgressUpdate, type PlanRecommendation, type ScheduledCheckIn, type TriggerCondition, type CheckInQuestion, type SuggestedAction, type TriggeredCheckIn, type CheckInResult, type CheckInResponse, type QuestionAnswer, type BehaviorEvent, type PageContext, type EmotionalSignal, type BehaviorPattern, type PatternContext, type BehaviorAnomaly, type ChurnPrediction, type ChurnFactor, type StrugglePrediction, type StruggleArea, type SupportRecommendation, type Intervention, type InterventionTiming, type InterventionResult, type InterventionCheckResult, type LearningPlanStore, type CheckInStore, type BehaviorEventStore, type EventQueryOptions, type PatternStore, type InterventionStore, type ProactiveLogger, type LearningProgressReport, type LearningPlanFeedback, LearningPlanStatus, LearningPlanStatus as ProactivePlanStatus, MilestoneStatus, ActivityType, ActivityStatus, AdjustmentTrigger, CheckInStatus, CheckInType, NotificationChannel, TriggerType, QuestionType, ActionType, BehaviorEventType, EmotionalSignalType, PatternType, AnomalyType, InterventionType, LearningPlanInputSchema, ProgressUpdateSchema, CheckInResponseSchema, BehaviorEventSchema, MultiSessionPlanTracker, createMultiSessionPlanTracker, InMemoryLearningPlanStore, type MultiSessionPlanTrackerConfig, CheckInScheduler, createCheckInScheduler, InMemoryCheckInStore, TriggerEvaluator, type CheckInSchedulerConfig, type UserContext, BehaviorMonitor, createBehaviorMonitor, InMemoryBehaviorEventStore, InMemoryPatternStore, InMemoryInterventionStore, type BehaviorMonitorConfig, } from './proactive-intervention';
export { type ConfidenceFactor, type ConfidenceScore, type ConfidenceInput, type ResponseContext, type SourceReference, type VerificationResult, type VerificationInput, type FactCheck, type SourceValidation, type VerificationIssue, type CorrectionSuggestion, type QualityRecord, type QualityMetric, type StudentFeedback, type ExpertReview, type LearningOutcome, type CalibrationData, type CalibrationBucket, type QualitySummary, type QualityAggregate, type ConfidenceScoreStore, type VerificationResultStore, type QualityRecordStore, type CalibrationStore, type SelfEvaluationLogger, ConfidenceLevel, ConfidenceFactorType, ResponseType, ComplexityLevel, SourceType, VerificationStatus, FactCheckStatus, IssueType, IssueSeverity, QualityMetricType, MetricSource, ConfidenceInputSchema, VerificationInputSchema, StudentFeedbackSchema, ConfidenceScorer, createConfidenceScorer, InMemoryConfidenceScoreStore, type ConfidenceScorerConfig, ResponseVerifier, createResponseVerifier, InMemoryVerificationResultStore, type ResponseVerifierConfig, type KnowledgeBaseEntry, QualityTracker, createQualityTracker, InMemoryQualityRecordStore, InMemoryCalibrationStore, type QualityTrackerConfig, SelfCritiqueEngine, createSelfCritiqueEngine, createStrictSelfCritiqueEngine, createLenientSelfCritiqueEngine, InMemorySelfCritiqueStore, CritiqueDimension, CritiqueSeverity, DEFAULT_DIMENSION_WEIGHTS, SelfCritiqueInputSchema, SelfCritiqueLoopInputSchema, type SelfCritiqueConfig, type SelfCritiqueLoopConfig, type SelfCritiqueInput, type SelfCritiqueLoopInput, type SelfCritiqueResult, type SelfCritiqueLoopResult, type CritiqueIterationResult, type CritiqueFinding, type DimensionScore, type ImprovementSuggestion, type SelfCritiqueStore, } from './self-evaluation';
export { TrendDirection, MasteryLevel, LearningStyle, ContentType, RecommendationPriority, RecommendationReason, TimePeriod, AssessmentSource, type LearningSession, type TopicProgress, type LearningGap, type GapEvidence, type ProgressSnapshot, type ProgressTrend, type TrendDataPoint, type ProgressReport, type ProgressSummary, type Achievement, type Skill, type SkillAssessment, type AssessmentEvidence, type SkillMap, type SkillNode, type SkillDecay, type SkillComparison, type Recommendation, type RecommendationBatch, type RecommendationContext, type LearningPath, type LearningPathStep, type ContentItem, type ContentFilters, type LearningSessionStore, type TopicProgressStore, type LearningGapStore, type SkillAssessmentStore, type RecommendationStore, type ContentStore, type AnalyticsLogger, LearningSessionInputSchema, SkillAssessmentInputSchema, RecommendationFeedbackSchema, type LearningSessionInput, type SkillAssessmentInput, type RecommendationFeedback, ProgressAnalyzer, createProgressAnalyzer, InMemoryLearningSessionStore, InMemoryTopicProgressStore, InMemoryLearningGapStore, type ProgressAnalyzerConfig, SkillAssessor, createSkillAssessor, InMemorySkillAssessmentStore, type SkillAssessorConfig, RecommendationEngine, createRecommendationEngine, InMemoryRecommendationStore, InMemoryContentStore, type RecommendationEngineConfig, type RecommendationInput, } from './learning-analytics';
export * from './orchestration';
export { type CourseNode, type ConceptNode, type DifficultyLevel, type PrerequisiteRelation, type PrerequisiteImportance, type CourseGraph, type UserSkillProfile, type UserSkill, type SkillTrend, type ConceptPerformance, type SkillUpdateResult, type LearningPath as PersonalizedLearningPath, type PathStep, type LearningAction, type StepPriority, type LearningResource, type ResourceType, type LearningPathOptions, type LearningStyle as PathLearningStyle, type SpacedRepetitionSchedule, type ReviewQuality, type SkillStore, type LearningPathStore, type CourseGraphStore, type LearningAnalytics as PathLearningAnalytics, type ProgressSnapshot as PathProgressSnapshot, SkillTracker, createSkillTracker, type SkillTrackerConfig, LearningPathRecommender, createPathRecommender, type PathRecommenderConfig, } from './learning-path';
export * from './realtime';
export * from './observability';
export * from './meta-learning';
export declare const PACKAGE_NAME = "@sam-ai/agentic";
export declare const PACKAGE_VERSION = "0.1.0";
/**
 * Package capabilities
 */
export declare const CAPABILITIES: {
    readonly GOAL_PLANNING: "goal-planning";
    readonly TOOL_REGISTRY: "tool-registry";
    readonly MENTOR_TOOLS: "mentor-tools";
    readonly MEMORY_SYSTEM: "memory-system";
    readonly PROACTIVE_INTERVENTIONS: "proactive-interventions";
    readonly SELF_EVALUATION: "self-evaluation";
    readonly LEARNING_ANALYTICS: "learning-analytics";
    readonly LEARNING_PATH: "learning-path";
    readonly ORCHESTRATION: "orchestration";
    readonly OBSERVABILITY: "observability";
    readonly META_LEARNING: "meta-learning";
};
export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];
/**
 * Check if a capability is available
 */
export declare function hasCapability(capability: Capability): boolean;
//# sourceMappingURL=index.d.ts.map