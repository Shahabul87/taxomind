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
  // Types
  type LearningPlanInput,
  type PlanConstraint,
  type LearningPlan,
  type WeeklyMilestone,
  type DailyTarget,
  type PlannedActivity,
  type ActivityResource,
  type DifficultyAdjustment,
  type PaceAdjustment,
  type WeeklyBreakdown,
  type DailyPractice,
  type DailyActivity,
  type ReviewItem,
  type StreakInfo,
  type ProgressUpdate,
  type PlanRecommendation,
  type ScheduledCheckIn,
  type TriggerCondition,
  type CheckInQuestion,
  type SuggestedAction,
  type TriggeredCheckIn,
  type CheckInResult,
  type CheckInResponse,
  type QuestionAnswer,
  type BehaviorEvent,
  type PageContext,
  type EmotionalSignal,
  type BehaviorPattern,
  type PatternContext,
  type BehaviorAnomaly,
  type ChurnPrediction,
  type ChurnFactor,
  type StrugglePrediction,
  type StruggleArea,
  type SupportRecommendation,
  type Intervention,
  type InterventionTiming,
  type InterventionResult,
  type LearningPlanStore,
  type CheckInStore,
  type BehaviorEventStore,
  type EventQueryOptions,
  type PatternStore,
  type InterventionStore,
  type ProactiveLogger,
  type LearningProgressReport,
  type LearningPlanFeedback,
  // Renamed exports to avoid conflicts
  LearningPlanStatus,
  LearningPlanStatus as ProactivePlanStatus,
  // Enums/Constants
  MilestoneStatus,
  ActivityType,
  ActivityStatus,
  AdjustmentTrigger,
  CheckInStatus,
  CheckInType,
  NotificationChannel,
  TriggerType,
  QuestionType,
  ActionType,
  BehaviorEventType,
  EmotionalSignalType,
  PatternType,
  AnomalyType,
  InterventionType,
  // Schemas
  LearningPlanInputSchema,
  ProgressUpdateSchema,
  CheckInResponseSchema,
  BehaviorEventSchema,
  // Classes and factories
  MultiSessionPlanTracker,
  createMultiSessionPlanTracker,
  InMemoryLearningPlanStore,
  type MultiSessionPlanTrackerConfig,
  CheckInScheduler,
  createCheckInScheduler,
  InMemoryCheckInStore,
  TriggerEvaluator,
  type CheckInSchedulerConfig,
  type UserContext,
  BehaviorMonitor,
  createBehaviorMonitor,
  InMemoryBehaviorEventStore,
  InMemoryPatternStore,
  InMemoryInterventionStore,
  type BehaviorMonitorConfig,
} from './proactive-intervention';

// ============================================================================
// SELF-EVALUATION
// ============================================================================

export {
  // Types
  type ConfidenceFactor,
  type ConfidenceScore,
  type ConfidenceInput,
  type ResponseContext,
  type SourceReference,
  type VerificationResult,
  type VerificationInput,
  type FactCheck,
  type SourceValidation,
  type VerificationIssue,
  type CorrectionSuggestion,
  type QualityRecord,
  type QualityMetric,
  type StudentFeedback,
  type ExpertReview,
  type LearningOutcome,
  type CalibrationData,
  type CalibrationBucket,
  type QualitySummary,
  type QualityAggregate,
  type ConfidenceScoreStore,
  type VerificationResultStore,
  type QualityRecordStore,
  type CalibrationStore,
  type SelfEvaluationLogger,
  // Enums/Constants
  ConfidenceLevel,
  ConfidenceFactorType,
  ResponseType,
  ComplexityLevel,
  SourceType,
  VerificationStatus,
  FactCheckStatus,
  IssueType,
  IssueSeverity,
  QualityMetricType,
  MetricSource,
  // Schemas
  ConfidenceInputSchema,
  VerificationInputSchema,
  StudentFeedbackSchema,
  // Classes and factories
  ConfidenceScorer,
  createConfidenceScorer,
  InMemoryConfidenceScoreStore,
  type ConfidenceScorerConfig,
  ResponseVerifier,
  createResponseVerifier,
  InMemoryVerificationResultStore,
  type ResponseVerifierConfig,
  type KnowledgeBaseEntry,
  QualityTracker,
  createQualityTracker,
  InMemoryQualityRecordStore,
  InMemoryCalibrationStore,
  type QualityTrackerConfig,
} from './self-evaluation';

// ============================================================================
// LEARNING ANALYTICS
// ============================================================================

export {
  // Enums
  TrendDirection,
  MasteryLevel,
  LearningStyle,
  ContentType,
  RecommendationPriority,
  RecommendationReason,
  TimePeriod,
  AssessmentSource,
  // Progress Analytics Types
  type LearningSession,
  type TopicProgress,
  type LearningGap,
  type GapEvidence,
  type ProgressSnapshot,
  type ProgressTrend,
  type TrendDataPoint,
  type ProgressReport,
  type ProgressSummary,
  type Achievement,
  // Skill Assessment Types
  type Skill,
  type SkillAssessment,
  type AssessmentEvidence,
  type SkillMap,
  type SkillNode,
  type SkillDecay,
  type SkillComparison,
  // Recommendation Types
  type Recommendation,
  type RecommendationBatch,
  type RecommendationContext,
  type LearningPath,
  type LearningPathStep,
  type ContentItem,
  type ContentFilters,
  // Store Interfaces
  type LearningSessionStore,
  type TopicProgressStore,
  type LearningGapStore,
  type SkillAssessmentStore,
  type RecommendationStore,
  type ContentStore,
  // Logger
  type AnalyticsLogger,
  // Schemas
  LearningSessionInputSchema,
  SkillAssessmentInputSchema,
  RecommendationFeedbackSchema,
  type LearningSessionInput,
  type SkillAssessmentInput,
  type RecommendationFeedback,
  // Progress Analyzer
  ProgressAnalyzer,
  createProgressAnalyzer,
  InMemoryLearningSessionStore,
  InMemoryTopicProgressStore,
  InMemoryLearningGapStore,
  type ProgressAnalyzerConfig,
  // Skill Assessor
  SkillAssessor,
  createSkillAssessor,
  InMemorySkillAssessmentStore,
  type SkillAssessorConfig,
  // Recommendation Engine
  RecommendationEngine,
  createRecommendationEngine,
  InMemoryRecommendationStore,
  InMemoryContentStore,
  type RecommendationEngineConfig,
  type RecommendationInput,
} from './learning-analytics';

// ============================================================================
// LEARNING PATH (Skill Tracking & Recommendations)
// ============================================================================

export {
  // Types (with prefixes to avoid conflicts with learning-analytics)
  type CourseNode,
  type ConceptNode,
  type DifficultyLevel,
  type PrerequisiteRelation,
  type PrerequisiteImportance,
  type CourseGraph,
  type UserSkillProfile,
  type UserSkill,
  type SkillTrend,
  type ConceptPerformance,
  type SkillUpdateResult,
  type LearningPath as PersonalizedLearningPath,
  type PathStep,
  type LearningAction,
  type StepPriority,
  type LearningResource,
  type ResourceType,
  type LearningPathOptions,
  type LearningStyle as PathLearningStyle,
  type SpacedRepetitionSchedule,
  type ReviewQuality,
  type SkillStore,
  type LearningPathStore,
  type CourseGraphStore,
  type LearningAnalytics as PathLearningAnalytics,
  type ProgressSnapshot as PathProgressSnapshot,
  // Skill Tracker
  SkillTracker,
  createSkillTracker,
  type SkillTrackerConfig,
  // Learning Path Recommender
  LearningPathRecommender,
  createPathRecommender,
  type PathRecommenderConfig,
} from './learning-path';

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
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

/**
 * Check if a capability is available
 */
export function hasCapability(capability: Capability): boolean {
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
    default:
      return false;
  }
}
