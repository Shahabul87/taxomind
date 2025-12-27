/**
 * Evaluation Module
 *
 * Priority 8: Harden Assessment Reliability
 * Exports for hardened evaluation system with dual-pass scoring,
 * rules-based verification, adversarial testing, and human review
 */

// Types
export type {
  // Rubric types
  Rubric,
  RubricCriterion,
  RubricLevel,
  // Response types
  StudentResponse,
  ResponseAttachment,
  // Scoring types
  ScoringSource,
  ScoreResult,
  CriterionScore,
  // Verification types
  AgreementLevel,
  VerificationResult,
  VerifiedEvaluation,
  HumanReviewResult,
  // Adversarial types
  AdversarialVariation,
  AdversarialType,
  AdversarialTestResult,
  AnswerKeyVerification,
  AnswerKeyIssue,
  // Human review types
  HumanReviewRequest,
  HumanReviewReason,
  ReviewQueueStats,
  // Configuration types
  HardenedEvaluatorConfig,
  RulesBasedScorerConfig,
  AdversarialGeneratorConfig,
} from './types';

// Default configurations
export {
  DEFAULT_HARDENED_EVALUATOR_CONFIG,
  DEFAULT_RULES_BASED_SCORER_CONFIG,
  DEFAULT_ADVERSARIAL_GENERATOR_CONFIG,
} from './types';

// Rules-Based Scorer
export {
  RulesBasedScorer,
  createRulesBasedScorer,
  createScorerFromRubric,
  type RulesScoreBreakdown,
  type KeywordMatch,
  type LengthAnalysis,
  type StructureAnalysis,
  type CriterionMatch,
  type Penalty,
  type Bonus,
} from './rules-based-scorer';

// Dual-Pass Evaluator
export {
  DualPassEvaluator,
  MockLLMScorer,
  createDualPassEvaluator,
  createMockDualPassEvaluator,
  createRulesOnlyEvaluator,
  type LLMScoreRequest,
  type LLMScoreResponse,
  type LLMScorer,
  type DualPassEvaluatorConfig,
  type DualPassLogger,
  type DualPassResult,
} from './dual-pass-evaluator';

// Adversarial Generator
export {
  AdversarialGenerator,
  createAdversarialGenerator,
  createComprehensiveGenerator,
  createQuickGenerator,
} from './adversarial-generator';

// Human Review Flagger
export {
  HumanReviewFlagger,
  InMemoryHumanReviewStore,
  createHumanReviewFlagger,
  createStrictFlagger,
  createLenientFlagger,
  getDefaultHumanReviewStore,
  resetDefaultHumanReviewStore,
  DEFAULT_FLAGGER_CONFIG,
  type HumanReviewStore,
  type HumanReviewFlaggerConfig,
  type FlaggerLogger,
  type FlaggingResult,
} from './human-review-flagger';

// Hardened Evaluator (Main Integration)
export {
  HardenedEvaluator,
  createHardenedEvaluator,
  createStrictHardenedEvaluator,
  createLenientHardenedEvaluator,
  createRulesOnlyHardenedEvaluator,
  type FullHardenedEvaluatorConfig,
  type HardenedEvaluatorLogger,
  type HardenedEvaluationResult,
  type BatchEvaluationResult,
} from './hardened-evaluator';
