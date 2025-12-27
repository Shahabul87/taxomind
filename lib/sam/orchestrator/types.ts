/**
 * Enhanced Orchestrator Types
 *
 * Priority 4: Wire Engines into Orchestrator
 * Types for quality gate integration and Bloom's alignment validation
 */

import type {
  GeneratedContent,
  ValidationResult,
  GateResult,
  QualityGatePipelineConfig,
  DifficultyLevel,
} from '../quality-gates';

// ============================================================================
// BLOOM'S TAXONOMY TYPES
// ============================================================================

/**
 * Bloom's taxonomy levels
 */
export type BloomsLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

/**
 * Bloom's distribution across levels
 */
export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

/**
 * Bloom's analysis result
 */
export interface BloomsAnalysis {
  /**
   * Dominant cognitive level
   */
  dominantLevel: BloomsLevel;

  /**
   * Distribution across all levels (should sum to 100)
   */
  distribution: BloomsDistribution;

  /**
   * Confidence in the analysis (0-1)
   */
  confidence: number;

  /**
   * Overall cognitive depth score (0-100)
   */
  cognitiveDepth: number;

  /**
   * Balance assessment
   */
  balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';

  /**
   * Levels with insufficient coverage
   */
  gaps: BloomsLevel[];
}

// ============================================================================
// ORCHESTRATION REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Content types that require validation
 */
export type ValidatableContentType =
  | 'lesson'
  | 'explanation'
  | 'example'
  | 'assessment'
  | 'quiz'
  | 'summary'
  | 'feedback';

/**
 * Request for orchestrated content generation
 */
export interface OrchestratedRequest {
  /**
   * Unique request ID for tracking
   */
  requestId?: string;

  /**
   * Type of content being generated
   */
  contentType: ValidatableContentType;

  /**
   * The prompt or query
   */
  prompt: string;

  /**
   * Target Bloom's level (if applicable)
   */
  targetBloomsLevel?: BloomsLevel;

  /**
   * Target difficulty level
   */
  targetDifficulty?: DifficultyLevel;

  /**
   * Topic or subject area
   */
  topic?: string;

  /**
   * Additional context
   */
  context?: Record<string, unknown>;

  /**
   * Whether to require quality gate validation
   */
  requireQualityValidation?: boolean;

  /**
   * Whether to require Bloom's alignment
   */
  requireBloomsAlignment?: boolean;

  /**
   * Custom quality gate configuration
   */
  qualityGateConfig?: Partial<QualityGatePipelineConfig>;

  /**
   * Session ID for tracking
   */
  sessionId?: string;

  /**
   * User ID for personalization
   */
  userId?: string;
}

/**
 * Response from orchestrated content generation
 */
export interface OrchestratedResponse {
  /**
   * Whether the request was successful
   */
  success: boolean;

  /**
   * Generated content
   */
  content: GeneratedContent;

  /**
   * Quality validation result (if enabled)
   */
  qualityValidation?: ValidationResult;

  /**
   * Bloom's analysis (if enabled)
   */
  bloomsAnalysis?: BloomsAnalysis;

  /**
   * Bloom's alignment result (if alignment was required)
   */
  bloomsAlignment?: BloomsAlignmentResult;

  /**
   * Processing metadata
   */
  metadata: OrchestratedMetadata;

  /**
   * Errors if any
   */
  errors?: OrchestratedError[];
}

/**
 * Bloom's alignment result
 */
export interface BloomsAlignmentResult {
  /**
   * Whether content is aligned with target level
   */
  aligned: boolean;

  /**
   * Current dominant level in content
   */
  currentLevel: BloomsLevel;

  /**
   * Target level that was requested
   */
  targetLevel: BloomsLevel;

  /**
   * Distance from target (-5 to +5, 0 = exact match)
   */
  levelDistance: number;

  /**
   * Whether the variance is acceptable
   */
  acceptableVariance: boolean;

  /**
   * Suggested adjustment if not aligned
   */
  adjustment?: BloomsAdjustment;
}

/**
 * Suggested adjustment for Bloom's level
 */
export interface BloomsAdjustment {
  /**
   * Direction of adjustment needed
   */
  direction: 'increase' | 'decrease';

  /**
   * Specific suggestions
   */
  suggestions: string[];

  /**
   * Elements to add
   */
  elementsToAdd?: string[];

  /**
   * Elements to remove or simplify
   */
  elementsToRemove?: string[];
}

/**
 * Orchestration metadata
 */
export interface OrchestratedMetadata {
  /**
   * Request ID
   */
  requestId: string;

  /**
   * Total processing time in ms
   */
  totalProcessingTimeMs: number;

  /**
   * Content generation time in ms
   */
  generationTimeMs: number;

  /**
   * Quality validation time in ms
   */
  validationTimeMs?: number;

  /**
   * Bloom's analysis time in ms
   */
  bloomsAnalysisTimeMs?: number;

  /**
   * Number of enhancement iterations
   */
  enhancementIterations: number;

  /**
   * Whether content was enhanced
   */
  contentEnhanced: boolean;

  /**
   * Model used for generation
   */
  modelId?: string;

  /**
   * Timestamp
   */
  timestamp: string;
}

/**
 * Orchestration error
 */
export interface OrchestratedError {
  /**
   * Error code
   */
  code: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Stage where error occurred
   */
  stage: 'generation' | 'validation' | 'blooms_analysis' | 'enhancement';

  /**
   * Whether error is recoverable
   */
  recoverable: boolean;

  /**
   * Additional details
   */
  details?: Record<string, unknown>;
}

// ============================================================================
// HOOKS AND CALLBACKS
// ============================================================================

/**
 * Hook called before content generation
 */
export type PreGenerationHook = (
  request: OrchestratedRequest
) => Promise<OrchestratedRequest | null>;

/**
 * Hook called after content generation, before validation
 */
export type PostGenerationHook = (
  content: GeneratedContent,
  request: OrchestratedRequest
) => Promise<GeneratedContent>;

/**
 * Hook called after quality validation
 */
export type PostValidationHook = (
  result: ValidationResult,
  request: OrchestratedRequest
) => Promise<void>;

/**
 * Hook called when content fails validation
 */
export type ValidationFailureHook = (
  result: ValidationResult,
  request: OrchestratedRequest
) => Promise<GeneratedContent | null>;

/**
 * Hook called when Bloom's alignment fails
 */
export type BloomsAlignmentFailureHook = (
  result: BloomsAlignmentResult,
  content: GeneratedContent,
  request: OrchestratedRequest
) => Promise<GeneratedContent | null>;

/**
 * Content enhancement function
 */
export type ContentEnhancer = (
  content: GeneratedContent,
  failedGates: GateResult[],
  request: OrchestratedRequest
) => Promise<GeneratedContent>;

/**
 * Bloom's analyzer function
 */
export type BloomsAnalyzer = (
  content: string,
  context?: Record<string, unknown>
) => Promise<BloomsAnalysis>;

// ============================================================================
// ORCHESTRATOR CONFIGURATION
// ============================================================================

/**
 * Enhanced orchestrator configuration
 */
export interface EnhancedOrchestratorConfig {
  /**
   * Quality gate pipeline configuration
   */
  qualityGateConfig?: Partial<QualityGatePipelineConfig>;

  /**
   * Whether to enable quality validation by default
   */
  enableQualityValidation?: boolean;

  /**
   * Whether to enable Bloom's analysis by default
   */
  enableBloomsAnalysis?: boolean;

  /**
   * Whether to enable Bloom's alignment checking
   */
  enableBloomsAlignment?: boolean;

  /**
   * Maximum enhancement iterations
   */
  maxEnhancementIterations?: number;

  /**
   * Acceptable Bloom's level variance (0 = exact match, 1 = one level off)
   */
  acceptableBloomsVariance?: number;

  /**
   * Content enhancer function
   */
  contentEnhancer?: ContentEnhancer;

  /**
   * Bloom's analyzer function
   */
  bloomsAnalyzer?: BloomsAnalyzer;

  /**
   * Pre-generation hooks
   */
  preGenerationHooks?: PreGenerationHook[];

  /**
   * Post-generation hooks
   */
  postGenerationHooks?: PostGenerationHook[];

  /**
   * Post-validation hooks
   */
  postValidationHooks?: PostValidationHook[];

  /**
   * Validation failure hooks
   */
  validationFailureHooks?: ValidationFailureHook[];

  /**
   * Bloom's alignment failure hooks
   */
  bloomsAlignmentFailureHooks?: BloomsAlignmentFailureHook[];

  /**
   * Logger
   */
  logger?: {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
}

/**
 * Default orchestrator configuration
 */
export const DEFAULT_ORCHESTRATOR_CONFIG: Required<
  Omit<
    EnhancedOrchestratorConfig,
    | 'contentEnhancer'
    | 'bloomsAnalyzer'
    | 'preGenerationHooks'
    | 'postGenerationHooks'
    | 'postValidationHooks'
    | 'validationFailureHooks'
    | 'bloomsAlignmentFailureHooks'
    | 'logger'
  >
> = {
  qualityGateConfig: {},
  enableQualityValidation: true,
  enableBloomsAnalysis: true,
  enableBloomsAlignment: false,
  maxEnhancementIterations: 2,
  acceptableBloomsVariance: 1,
};

// ============================================================================
// BLOOM'S LEVEL UTILITIES
// ============================================================================

/**
 * Bloom's level order (lowest to highest)
 */
export const BLOOMS_LEVEL_ORDER: BloomsLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

/**
 * Get numeric index of a Bloom's level
 */
export function getBloomsLevelIndex(level: BloomsLevel): number {
  return BLOOMS_LEVEL_ORDER.indexOf(level);
}

/**
 * Calculate distance between two Bloom's levels
 */
export function calculateBloomsDistance(
  current: BloomsLevel,
  target: BloomsLevel
): number {
  return getBloomsLevelIndex(current) - getBloomsLevelIndex(target);
}

/**
 * Check if Bloom's levels are within acceptable variance
 */
export function isBloomsAligned(
  current: BloomsLevel,
  target: BloomsLevel,
  acceptableVariance: number = 1
): boolean {
  const distance = Math.abs(calculateBloomsDistance(current, target));
  return distance <= acceptableVariance;
}
