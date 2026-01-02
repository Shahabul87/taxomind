/**
 * @sam-ai/agentic - Learning Analytics Module
 * Provides progress analysis, skill assessment, and personalized recommendations
 */

// ============================================================================
// TYPES
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
} from './types';

// ============================================================================
// PROGRESS ANALYZER
// ============================================================================

export {
  ProgressAnalyzer,
  createProgressAnalyzer,
  InMemoryLearningSessionStore,
  InMemoryTopicProgressStore,
  InMemoryLearningGapStore,
  type ProgressAnalyzerConfig,
} from './progress-analyzer';

// ============================================================================
// SKILL ASSESSOR
// ============================================================================

export {
  SkillAssessor,
  createSkillAssessor,
  InMemorySkillAssessmentStore,
  type SkillAssessorConfig,
} from './skill-assessor';

// ============================================================================
// RECOMMENDATION ENGINE
// ============================================================================

export {
  RecommendationEngine,
  createRecommendationEngine,
  InMemoryRecommendationStore,
  InMemoryContentStore,
  type RecommendationEngineConfig,
  type RecommendationInput,
} from './recommendation-engine';
