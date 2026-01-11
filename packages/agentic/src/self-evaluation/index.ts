/**
 * @sam-ai/agentic - Self-Evaluation Module
 * Confidence scoring, response verification, and quality tracking
 */

// Types
export type {
  // Confidence Scoring Types
  ConfidenceFactor,
  ConfidenceScore,
  ConfidenceInput,
  ResponseContext,
  SourceReference,
  // Verification Types
  VerificationResult,
  VerificationInput,
  FactCheck,
  SourceValidation,
  VerificationIssue,
  CorrectionSuggestion,
  // Quality Tracking Types
  QualityRecord,
  QualityMetric,
  StudentFeedback,
  ExpertReview,
  LearningOutcome,
  CalibrationData,
  CalibrationBucket,
  QualitySummary,
  QualityAggregate,
  // Store Interfaces
  ConfidenceScoreStore,
  VerificationResultStore,
  QualityRecordStore,
  CalibrationStore,
  SelfEvaluationLogger,
} from './types';

// Export enums/constants
export {
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
} from './types';

// Export Zod schemas
export {
  ConfidenceInputSchema,
  VerificationInputSchema,
  StudentFeedbackSchema,
} from './types';

// Confidence Scorer
export {
  ConfidenceScorer,
  createConfidenceScorer,
  InMemoryConfidenceScoreStore,
  type ConfidenceScorerConfig,
} from './confidence-scorer';

// Response Verifier
export {
  ResponseVerifier,
  createResponseVerifier,
  InMemoryVerificationResultStore,
  type ResponseVerifierConfig,
  type KnowledgeBaseEntry,
} from './response-verifier';

// Quality Tracker
export {
  QualityTracker,
  createQualityTracker,
  InMemoryQualityRecordStore,
  InMemoryCalibrationStore,
  type QualityTrackerConfig,
} from './quality-tracker';

// Self-Critique Engine
export {
  SelfCritiqueEngine,
  createSelfCritiqueEngine,
  createStrictSelfCritiqueEngine,
  createLenientSelfCritiqueEngine,
  InMemorySelfCritiqueStore,
  CritiqueDimension,
  CritiqueSeverity,
  DEFAULT_DIMENSION_WEIGHTS,
  SelfCritiqueInputSchema,
  SelfCritiqueLoopInputSchema,
  type SelfCritiqueConfig,
  type SelfCritiqueLoopConfig,
  type SelfCritiqueInput,
  type SelfCritiqueLoopInput,
  type SelfCritiqueResult,
  type SelfCritiqueLoopResult,
  type CritiqueIterationResult,
  type CritiqueFinding,
  type DimensionScore,
  type ImprovementSuggestion,
  type SelfCritiqueStore,
} from './self-critique';
