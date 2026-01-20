/**
 * Frameworks Module Exports
 * Enhanced Depth Analysis - January 2026
 *
 * Exports for multi-framework taxonomy evaluation:
 * - Framework definitions
 * - Multi-framework evaluator
 * - Types and interfaces
 */

// ═══════════════════════════════════════════════════════════════
// FRAMEWORK DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export {
  BLOOMS_FRAMEWORK,
  DOK_FRAMEWORK,
  SOLO_FRAMEWORK,
  FINK_FRAMEWORK,
  MARZANO_FRAMEWORK,
  FRAMEWORKS,
  COURSE_TYPE_FRAMEWORK_WEIGHTS,
  getFramework,
  getAllFrameworks,
  getFrameworkWeights,
  getIdealDistribution,
  getFrameworkLevel,
  getFrameworkMappings,
} from './framework-definitions';

// ═══════════════════════════════════════════════════════════════
// MULTI-FRAMEWORK EVALUATOR
// ═══════════════════════════════════════════════════════════════

export {
  MultiFrameworkEvaluator,
  createMultiFrameworkEvaluator,
  EVALUATOR_VERSION,
} from './multi-framework-evaluator';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type {
  // Framework types
  FrameworkType,
  SOLOLevel,
  FinkLevel,
  MarzanoLevel,

  // Taxonomy definitions
  TaxonomyLevel,
  TaxonomyFramework,
  FrameworkMapping,
  CrossFrameworkMapping,

  // Distributions
  SOLODistribution,
  FinkDistribution,
  MarzanoDistribution,
  FrameworkDistribution,
  FrameworkWeights,

  // Evaluator options and results
  MultiFrameworkEvaluatorOptions,
  FrameworkLogger,
  FrameworkAnalysis,
  LevelAnalysisDetail,
  FrameworkRecommendation,
  MultiFrameworkResult,

  // Content for analysis
  AnalyzableContent,
  ContentForMultiFrameworkAnalysis,
} from './types';
