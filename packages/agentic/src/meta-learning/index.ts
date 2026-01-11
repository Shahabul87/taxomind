/**
 * @sam-ai/agentic - Meta-Learning Module
 * Meta-level learning analytics, pattern recognition, and system optimization
 */

// Types
export type {
  LearningPattern,
  PatternContext,
  PatternOutcome,
  MetaLearningInsight,
  InsightRecommendation,
  LearningStrategy,
  StrategyCondition,
  StrategyRanking,
  MetaLearningAnalytics,
  TrendData,
  TrendPoint,
  LearningEvent,
  LearningPatternStore,
  MetaLearningInsightStore,
  LearningStrategyStore,
  LearningEventStore,
  MetaLearningLogger,
} from './types';

// Enums/Constants
export {
  PatternCategory,
  PatternConfidence,
  InsightType,
  InsightPriority,
  AnalyticsPeriod,
  LearningEventType,
} from './types';

// Zod Schemas
export {
  LearningEventSchema,
  GetInsightsSchema,
  GetAnalyticsSchema,
} from './types';

// Meta-Learning Analyzer
export {
  MetaLearningAnalyzer,
  createMetaLearningAnalyzer,
  InMemoryLearningPatternStore,
  InMemoryMetaLearningInsightStore,
  InMemoryLearningStrategyStore,
  InMemoryLearningEventStore,
  type MetaLearningAnalyzerConfig,
} from './meta-learning-analyzer';
