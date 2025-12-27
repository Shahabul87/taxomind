/**
 * Quality Gates Types
 *
 * Priority 2: Content Quality Gates
 * Validates all AI-generated content before delivery
 */

import type { BloomsLevel } from '@sam-ai/core';

// ============================================================================
// GATE RESULT TYPES
// ============================================================================

/**
 * Result from a single quality gate evaluation
 */
export interface GateResult {
  /**
   * Name of the gate that ran
   */
  gateName: string;

  /**
   * Whether the content passed this gate
   */
  passed: boolean;

  /**
   * Score from 0-100
   */
  score: number;

  /**
   * Weight of this gate in overall scoring (default: 1.0)
   */
  weight: number;

  /**
   * Specific issues found by this gate
   */
  issues: GateIssue[];

  /**
   * Suggestions for improvement
   */
  suggestions: string[];

  /**
   * Processing time in milliseconds
   */
  processingTimeMs: number;

  /**
   * Additional metadata specific to the gate
   */
  metadata?: Record<string, unknown>;
}

/**
 * Specific issue found by a gate
 */
export interface GateIssue {
  /**
   * Issue severity
   */
  severity: 'critical' | 'high' | 'medium' | 'low';

  /**
   * Human-readable description
   */
  description: string;

  /**
   * Location in content (if applicable)
   */
  location?: string;

  /**
   * Suggested fix
   */
  suggestedFix?: string;
}

// ============================================================================
// CONTENT TYPES
// ============================================================================

/**
 * Content to be validated by quality gates
 */
export interface GeneratedContent {
  /**
   * The main content text or structured data
   */
  content: string;

  /**
   * Type of content being validated
   */
  type: ContentType;

  /**
   * Target Bloom's level for educational content
   */
  targetBloomsLevel?: BloomsLevel;

  /**
   * Target difficulty level
   */
  targetDifficulty?: DifficultyLevel;

  /**
   * Expected examples in content
   */
  expectedExamples?: number;

  /**
   * Expected sections in content
   */
  expectedSections?: string[];

  /**
   * Context about the content
   */
  context?: ContentContext;

  /**
   * Original request that generated this content
   */
  originalRequest?: string;

  /**
   * Metadata about generation
   */
  generationMetadata?: {
    model?: string;
    promptVersion?: string;
    timestamp?: string;
  };
}

export type ContentType =
  | 'lesson'
  | 'explanation'
  | 'exercise'
  | 'quiz'
  | 'assessment'
  | 'summary'
  | 'tutorial'
  | 'example'
  | 'feedback'
  | 'answer';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ContentContext {
  /**
   * Course/module this content belongs to
   */
  courseId?: string;

  /**
   * Chapter/section ID
   */
  sectionId?: string;

  /**
   * Topic being covered
   */
  topic?: string;

  /**
   * Prerequisites the learner should have
   */
  prerequisites?: string[];

  /**
   * Learning objectives to cover
   */
  learningObjectives?: string[];

  /**
   * Student's current proficiency level
   */
  studentLevel?: DifficultyLevel;
}

// ============================================================================
// PIPELINE TYPES
// ============================================================================

/**
 * Configuration for the quality gate pipeline
 */
export interface QualityGatePipelineConfig {
  /**
   * Minimum score to pass (default: 75)
   */
  threshold: number;

  /**
   * Maximum enhancement iterations (default: 2)
   */
  maxIterations: number;

  /**
   * Run gates in parallel vs sequential
   */
  parallel: boolean;

  /**
   * Timeout for all gates in milliseconds
   */
  timeoutMs: number;

  /**
   * Gates to include (all by default)
   */
  enabledGates?: string[];

  /**
   * Gates to skip
   */
  disabledGates?: string[];

  /**
   * Custom weights for gates (overrides defaults)
   */
  gateWeights?: Record<string, number>;

  /**
   * Whether to attempt enhancement on failure
   */
  enableEnhancement: boolean;
}

/**
 * Result of pipeline validation
 */
export interface ValidationResult {
  /**
   * Whether content passed all gates
   */
  passed: boolean;

  /**
   * Overall weighted score (0-100)
   */
  overallScore: number;

  /**
   * The validated/enhanced content
   */
  content: GeneratedContent;

  /**
   * Results from each gate
   */
  gateResults: GateResult[];

  /**
   * Gates that failed
   */
  failedGates: string[];

  /**
   * Number of enhancement iterations performed
   */
  iterations: number;

  /**
   * Total processing time in milliseconds
   */
  totalProcessingTimeMs: number;

  /**
   * Aggregated suggestions from all gates
   */
  allSuggestions: string[];

  /**
   * Critical issues that must be addressed
   */
  criticalIssues: GateIssue[];

  /**
   * Validation metadata
   */
  metadata: ValidationMetadata;
}

export interface ValidationMetadata {
  /**
   * Timestamp of validation
   */
  timestamp: string;

  /**
   * Pipeline configuration used
   */
  config: QualityGatePipelineConfig;

  /**
   * Whether enhancement was attempted
   */
  enhancementAttempted: boolean;

  /**
   * Reason for pass/fail
   */
  reason: string;
}

// ============================================================================
// GATE INTERFACE
// ============================================================================

/**
 * Base interface for all quality gates
 */
export interface QualityGate {
  /**
   * Unique name of the gate
   */
  readonly name: string;

  /**
   * Description of what this gate checks
   */
  readonly description: string;

  /**
   * Default weight for this gate (1.0 = normal, 2.0 = double weight)
   */
  readonly defaultWeight: number;

  /**
   * Content types this gate applies to
   */
  readonly applicableTypes: ContentType[];

  /**
   * Evaluate content against this gate's criteria
   */
  evaluate(content: GeneratedContent): Promise<GateResult>;

  /**
   * Attempt to enhance content to pass this gate
   */
  enhance?(content: GeneratedContent, issues: GateIssue[]): Promise<GeneratedContent>;
}

// ============================================================================
// GATE-SPECIFIC TYPES
// ============================================================================

/**
 * Configuration for CompletenessGate
 */
export interface CompletenessGateConfig {
  /**
   * Minimum word count for content
   */
  minWordCount?: number;

  /**
   * Minimum sections expected
   */
  minSections?: number;

  /**
   * Required sections by name
   */
  requiredSections?: string[];

  /**
   * Whether introduction is required
   */
  requireIntroduction?: boolean;

  /**
   * Whether conclusion is required
   */
  requireConclusion?: boolean;

  /**
   * Minimum coverage of learning objectives (0-1)
   */
  objectiveCoverageThreshold?: number;
}

/**
 * Configuration for ExampleQualityGate
 */
export interface ExampleQualityGateConfig {
  /**
   * Minimum number of examples
   */
  minExamples?: number;

  /**
   * Maximum number of examples
   */
  maxExamples?: number;

  /**
   * Require code examples for programming content
   */
  requireCodeExamples?: boolean;

  /**
   * Require real-world examples
   */
  requireRealWorldExamples?: boolean;

  /**
   * Minimum example word count
   */
  minExampleLength?: number;
}

/**
 * Configuration for DifficultyMatchGate
 */
export interface DifficultyMatchGateConfig {
  /**
   * Tolerance for difficulty mismatch (0-1)
   * 0 = exact match required, 1 = any difficulty accepted
   */
  tolerance?: number;

  /**
   * Whether to check vocabulary complexity
   */
  checkVocabulary?: boolean;

  /**
   * Whether to check concept complexity
   */
  checkConceptComplexity?: boolean;

  /**
   * Whether to check sentence complexity
   */
  checkSentenceComplexity?: boolean;
}

/**
 * Configuration for StructureGate
 */
export interface StructureGateConfig {
  /**
   * Minimum heading depth (h1, h2, etc.)
   */
  minHeadingDepth?: number;

  /**
   * Maximum heading depth
   */
  maxHeadingDepth?: number;

  /**
   * Require bullet points/lists
   */
  requireLists?: boolean;

  /**
   * Maximum paragraph length in sentences
   */
  maxParagraphLength?: number;

  /**
   * Require proper markdown formatting
   */
  requireMarkdown?: boolean;
}

/**
 * Configuration for DepthGate
 */
export interface DepthGateConfig {
  /**
   * Minimum cognitive depth score (0-100)
   */
  minDepthScore?: number;

  /**
   * Whether to check for explanation depth
   */
  checkExplanationDepth?: boolean;

  /**
   * Whether to check for concept connections
   */
  checkConceptConnections?: boolean;

  /**
   * Whether to check for critical thinking prompts
   */
  checkCriticalThinking?: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_PIPELINE_CONFIG: QualityGatePipelineConfig = {
  threshold: 75,
  maxIterations: 2,
  parallel: true,
  timeoutMs: 10000,
  enableEnhancement: true,
};

export const DEFAULT_COMPLETENESS_CONFIG: CompletenessGateConfig = {
  minWordCount: 100,
  minSections: 2,
  requireIntroduction: true,
  requireConclusion: false,
  objectiveCoverageThreshold: 0.7,
};

export const DEFAULT_EXAMPLE_QUALITY_CONFIG: ExampleQualityGateConfig = {
  minExamples: 1,
  maxExamples: 5,
  requireCodeExamples: false,
  requireRealWorldExamples: false,
  minExampleLength: 20,
};

export const DEFAULT_DIFFICULTY_MATCH_CONFIG: DifficultyMatchGateConfig = {
  tolerance: 0.2,
  checkVocabulary: true,
  checkConceptComplexity: true,
  checkSentenceComplexity: true,
};

export const DEFAULT_STRUCTURE_CONFIG: StructureGateConfig = {
  minHeadingDepth: 1,
  maxHeadingDepth: 4,
  requireLists: false,
  maxParagraphLength: 8,
  requireMarkdown: true,
};

export const DEFAULT_DEPTH_CONFIG: DepthGateConfig = {
  minDepthScore: 60,
  checkExplanationDepth: true,
  checkConceptConnections: true,
  checkCriticalThinking: true,
};
