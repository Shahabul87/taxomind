/**
 * Pedagogical Evaluators Module
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Exports for educational effectiveness validation
 */

// Types
export type {
  // Bloom's types
  BloomsLevel,
  BloomsDistribution,
  // Sub-level types (Phase 1)
  BloomsSubLevel,
  SubLevelIndicatorType,
  SubLevelIndicator,
  EnhancedBloomsResult,
  // Difficulty types
  DifficultyLevel,
  // Student profile types
  StudentCognitiveProfile,
  MasteryLevel,
  LearningVelocity,
  KnowledgeGap,
  PerformanceMetrics,
  // Content types
  PedagogicalContent,
  PriorContentSummary,
  // Base evaluation types
  PedagogicalEvaluationResult,
  PedagogicalIssue,
  PedagogicalEvaluator,
  // Bloom's Aligner types
  BloomsAlignerResult,
  VerbAnalysis,
  ActivityAnalysis,
  // Scaffolding Evaluator types
  ScaffoldingEvaluatorResult,
  ComplexityProgression,
  ComplexityJump,
  PrerequisiteCoverage,
  SupportStructure,
  GradualReleaseAnalysis,
  GradualReleasePhase,
  // ZPD Evaluator types
  ZPDEvaluatorResult,
  ZPDZone,
  ChallengeLevel,
  ChallengeFactor,
  SupportAdequacy,
  EngagementPrediction,
  PersonalizationFit,
  PersonalizationOpportunity,
  // Pipeline types
  PedagogicalPipelineConfig,
  PedagogicalPipelineResult,
} from './types';

// Constants
export {
  BLOOMS_LEVEL_ORDER,
  getBloomsLevelIndex,
  // Sub-level constants and functions (Phase 1)
  BLOOMS_SUB_LEVEL_ORDER,
  getBloomsSubLevelIndex,
  calculateBloomsNumericScore,
  determineSubLevelFromIndicators,
  createBloomsLabel,
  DIFFICULTY_LEVEL_ORDER,
  getDifficultyLevelIndex,
  DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG,
} from './types';

// Bloom's Aligner
export {
  BloomsAligner,
  createBloomsAligner,
  createStrictBloomsAligner,
  createLenientBloomsAligner,
  BLOOMS_VERBS,
  BLOOMS_ACTIVITIES,
  DEFAULT_BLOOMS_ALIGNER_CONFIG,
  type BloomsAlignerConfig,
  // Sub-level analyzer (Phase 1)
  SubLevelAnalyzer,
  createSubLevelAnalyzer,
  SUB_LEVEL_COMPLEXITY_INDICATORS,
  SUB_LEVEL_ABSTRACTION_INDICATORS,
  SUB_LEVEL_TRANSFER_INDICATORS,
  SUB_LEVEL_NOVELTY_INDICATORS,
} from './blooms-aligner';

// Scaffolding Evaluator
export {
  ScaffoldingEvaluator,
  createScaffoldingEvaluator,
  createStrictScaffoldingEvaluator,
  createLenientScaffoldingEvaluator,
  SUPPORT_INDICATORS,
  GRADUAL_RELEASE_INDICATORS,
  COMPLEXITY_INDICATORS,
  DEFAULT_SCAFFOLDING_CONFIG,
  type ScaffoldingEvaluatorConfig,
} from './scaffolding-evaluator';

// ZPD Evaluator
export {
  ZPDEvaluator,
  createZPDEvaluator,
  createStrictZPDEvaluator,
  createLenientZPDEvaluator,
  ZPD_ZONE_RANGES,
  ZONE_ENGAGEMENT_MAP,
  SUPPORT_TYPES,
  DEFAULT_ZPD_CONFIG,
  type ZPDEvaluatorConfig,
} from './zpd-evaluator';

// Cognitive Load Analyzer (Phase 3)
export {
  CognitiveLoadAnalyzer,
  createCognitiveLoadAnalyzer,
  INTRINSIC_LOAD_INDICATORS,
  EXTRANEOUS_LOAD_INDICATORS,
  GERMANE_LOAD_INDICATORS,
  type CognitiveLoadType,
  type CognitiveLoadMeasurement,
  type CognitiveLoadFactor,
  type CognitiveLoadResult,
  type CognitiveLoadBalance,
  type CognitiveLoadRecommendation,
  type BloomsCompatibility,
} from './cognitive-load-analyzer';

// Pipeline
export {
  PedagogicalPipeline,
  createPedagogicalPipeline,
  createBloomsPipeline,
  createScaffoldingPipeline,
  createZPDPipeline,
  createStrictPedagogicalPipeline,
  evaluatePedagogically,
  type PedagogicalPipelineFullConfig,
} from './pipeline';
