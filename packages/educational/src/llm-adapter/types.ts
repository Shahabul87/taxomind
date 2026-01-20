/**
 * Portable LLM Adapter Types
 * Enhanced Depth Analysis - January 2026
 *
 * Types for a portable, provider-agnostic LLM adapter
 * that supports the depth analysis pipeline.
 */

import type { BloomsLevel } from '@sam-ai/core';
import type { WebbDOKLevel, CourseType, BloomsDistribution, WebbDOKDistribution } from '../types/depth-analysis.types';
import type { FrameworkType, SOLOLevel, FinkLevel, MarzanoLevel } from '../frameworks/types';

// ═══════════════════════════════════════════════════════════════
// PROVIDER TYPES
// ═══════════════════════════════════════════════════════════════

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'custom';

export type LLMModelTier = 'fast' | 'balanced' | 'powerful';

export interface LLMProviderConfig {
  /** Provider name */
  provider: LLMProvider;
  /** API key (or use environment variable) */
  apiKey?: string;
  /** Environment variable name for API key */
  apiKeyEnvVar?: string;
  /** Base URL for API (for custom providers) */
  baseUrl?: string;
  /** Model to use (or auto-select based on tier) */
  model?: string;
  /** Model tier for auto-selection */
  modelTier?: LLMModelTier;
  /** Custom headers */
  headers?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════
// BASE ADAPTER INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface DepthAnalysisLLMAdapter {
  /** Adapter name */
  readonly name: string;
  /** Adapter version */
  readonly version: string;
  /** Provider being used */
  readonly provider: LLMProvider;

  /**
   * Classify text according to Bloom's Taxonomy
   */
  classifyBlooms(input: BloomsClassificationInput): Promise<BloomsClassificationResult>;

  /**
   * Classify text according to Webb's DOK
   */
  classifyDOK(input: DOKClassificationInput): Promise<DOKClassificationResult>;

  /**
   * Classify text using multiple frameworks
   */
  classifyMultiFramework(input: MultiFrameworkClassificationInput): Promise<MultiFrameworkClassificationResult>;

  /**
   * Extract educational keywords and concepts
   */
  extractKeywords(input: KeywordExtractionInput): Promise<KeywordExtractionResult>;

  /**
   * Analyze alignment between objectives, content, and assessments
   */
  analyzeAlignment(input: AlignmentAnalysisInput): Promise<AlignmentAnalysisResult>;

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(input: RecommendationInput): Promise<RecommendationResult>;

  /**
   * Check if the adapter is configured and ready
   */
  isConfigured(): boolean;

  /**
   * Get current model information
   */
  getModelInfo(): LLMModelInfo;
}

// ═══════════════════════════════════════════════════════════════
// BLOOM'S CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

export interface BloomsClassificationInput {
  /** Text to classify */
  text: string;
  /** Type of content */
  contentType: 'objective' | 'content' | 'question' | 'mixed';
  /** Additional context */
  context?: string;
  /** Course type for better accuracy */
  courseType?: CourseType;
  /** Require confidence scores */
  includeConfidence?: boolean;
  /** Include supporting evidence */
  includeEvidence?: boolean;
}

export interface BloomsClassificationResult {
  /** Primary level detected */
  level: BloomsLevel;
  /** Confidence in classification (0-1) */
  confidence: number;
  /** Distribution across all levels */
  distribution: BloomsDistribution;
  /** Evidence supporting the classification */
  evidence?: BloomsEvidence[];
  /** Alternative levels if ambiguous */
  alternatives?: BloomsAlternative[];
  /** Model used for classification */
  model: string;
  /** Processing time in ms */
  processingTimeMs: number;
}

export interface BloomsEvidence {
  /** Evidence text */
  text: string;
  /** Indicative keywords found */
  keywords: string[];
  /** Level this evidence supports */
  supportsLevel: BloomsLevel;
  /** Weight of this evidence */
  weight: number;
}

export interface BloomsAlternative {
  /** Alternative level */
  level: BloomsLevel;
  /** Confidence for this alternative */
  confidence: number;
  /** Reason for considering this level */
  reason: string;
}

// ═══════════════════════════════════════════════════════════════
// DOK CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

export interface DOKClassificationInput {
  /** Text to classify */
  text: string;
  /** Type of content */
  contentType: 'objective' | 'content' | 'question' | 'task';
  /** Additional context */
  context?: string;
  /** Course type */
  courseType?: CourseType;
  /** Include confidence */
  includeConfidence?: boolean;
  /** Include evidence */
  includeEvidence?: boolean;
}

export interface DOKClassificationResult {
  /** Primary DOK level */
  level: WebbDOKLevel;
  /** Confidence (0-1) */
  confidence: number;
  /** Distribution across levels */
  distribution: WebbDOKDistribution;
  /** Supporting evidence */
  evidence?: DOKEvidence[];
  /** Alternative levels */
  alternatives?: DOKAlternative[];
  /** Model used */
  model: string;
  /** Processing time */
  processingTimeMs: number;
}

export interface DOKEvidence {
  text: string;
  indicators: string[];
  supportsLevel: WebbDOKLevel;
  weight: number;
}

export interface DOKAlternative {
  level: WebbDOKLevel;
  confidence: number;
  reason: string;
}

// ═══════════════════════════════════════════════════════════════
// MULTI-FRAMEWORK CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

export interface MultiFrameworkClassificationInput {
  /** Text to classify */
  text: string;
  /** Type of content */
  contentType: 'objective' | 'content' | 'question' | 'task' | 'mixed';
  /** Frameworks to use */
  frameworks: FrameworkType[];
  /** Course type */
  courseType?: CourseType;
  /** Additional context */
  context?: string;
  /** Include cross-framework alignment */
  includeCrossFrameworkAlignment?: boolean;
}

export interface MultiFrameworkClassificationResult {
  /** Results per framework */
  frameworks: FrameworkClassificationDetail[];
  /** Cross-framework alignment score (0-1) */
  crossFrameworkAlignment?: number;
  /** Composite cognitive complexity score */
  compositeScore: number;
  /** Model used */
  model: string;
  /** Processing time */
  processingTimeMs: number;
}

export interface FrameworkClassificationDetail {
  /** Framework type */
  framework: FrameworkType;
  /** Primary level */
  level: string;
  /** Confidence */
  confidence: number;
  /** Level distribution */
  distribution: Record<string, number>;
  /** Evidence */
  evidence?: FrameworkEvidence[];
}

export interface FrameworkEvidence {
  text: string;
  indicators: string[];
  level: string;
  weight: number;
}

// ═══════════════════════════════════════════════════════════════
// KEYWORD EXTRACTION
// ═══════════════════════════════════════════════════════════════

export interface KeywordExtractionInput {
  /** Text to analyze */
  text: string;
  /** Type of keywords to extract */
  keywordTypes: KeywordType[];
  /** Maximum keywords per type */
  maxPerType?: number;
  /** Course/subject context */
  context?: string;
  /** Include relevance scores */
  includeRelevance?: boolean;
}

export type KeywordType =
  | 'action_verbs'
  | 'concepts'
  | 'bloom_indicators'
  | 'dok_indicators'
  | 'technical_terms'
  | 'learning_objectives';

export interface KeywordExtractionResult {
  /** Extracted keywords by type */
  keywords: ExtractedKeywordGroup[];
  /** Total keywords found */
  totalCount: number;
  /** Model used */
  model: string;
  /** Processing time */
  processingTimeMs: number;
}

export interface ExtractedKeywordGroup {
  /** Keyword type */
  type: KeywordType;
  /** Keywords in this group */
  keywords: ExtractedKeyword[];
}

export interface ExtractedKeyword {
  /** The keyword/phrase */
  text: string;
  /** Relevance score (0-1) */
  relevance: number;
  /** Position in original text */
  position?: {
    start: number;
    end: number;
  };
  /** Associated level (for Bloom's/DOK indicators) */
  associatedLevel?: string;
  /** Context where found */
  context?: string;
}

// ═══════════════════════════════════════════════════════════════
// ALIGNMENT ANALYSIS
// ═══════════════════════════════════════════════════════════════

export interface AlignmentAnalysisInput {
  /** Learning objectives */
  objectives: ObjectiveForAnalysis[];
  /** Content sections */
  sections: SectionForAnalysis[];
  /** Assessments */
  assessments: AssessmentForAnalysis[];
  /** Course type */
  courseType?: CourseType;
  /** Analysis depth */
  depth?: 'quick' | 'standard' | 'thorough';
}

export interface ObjectiveForAnalysis {
  id: string;
  text: string;
  bloomsLevel?: BloomsLevel;
}

export interface SectionForAnalysis {
  id: string;
  title: string;
  content: string;
  bloomsLevel?: BloomsLevel;
}

export interface AssessmentForAnalysis {
  id: string;
  title?: string;
  questions: QuestionForAnalysis[];
}

export interface QuestionForAnalysis {
  id: string;
  text: string;
  type: string;
  bloomsLevel?: BloomsLevel;
}

export interface AlignmentAnalysisResult {
  /** Objective-to-section alignments */
  objectiveAlignments: ObjectiveAlignmentDetail[];
  /** Section-to-assessment alignments */
  assessmentAlignments: AssessmentAlignmentDetail[];
  /** Identified gaps */
  gaps: AlignmentGapDetail[];
  /** Overall alignment score (0-1) */
  overallScore: number;
  /** Summary statistics */
  summary: AlignmentSummaryStats;
  /** Model used */
  model: string;
  /** Processing time */
  processingTimeMs: number;
}

export interface ObjectiveAlignmentDetail {
  objectiveId: string;
  alignedSections: AlignedItemDetail[];
  alignmentStrength: number;
  missingCoverage?: string;
}

export interface AssessmentAlignmentDetail {
  assessmentId: string;
  alignedSections: AlignedItemDetail[];
  alignedObjectives: AlignedItemDetail[];
  alignmentStrength: number;
}

export interface AlignedItemDetail {
  id: string;
  strength: number;
  evidence: string;
}

export interface AlignmentGapDetail {
  type: 'uncovered_objective' | 'unassessed_content' | 'level_mismatch' | 'missing_assessment';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedItems: string[];
  recommendation: string;
}

export interface AlignmentSummaryStats {
  totalObjectives: number;
  coveredObjectives: number;
  totalSections: number;
  assessedSections: number;
  averageAlignment: number;
  gapsCount: number;
}

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════

export interface RecommendationInput {
  /** Current Bloom's distribution */
  bloomsDistribution?: BloomsDistribution;
  /** Current DOK distribution */
  dokDistribution?: WebbDOKDistribution;
  /** Alignment gaps */
  alignmentGaps?: AlignmentGapDetail[];
  /** Course type */
  courseType?: CourseType;
  /** Specific areas to focus on */
  focusAreas?: RecommendationFocusArea[];
  /** Maximum recommendations */
  maxRecommendations?: number;
}

export type RecommendationFocusArea =
  | 'blooms_balance'
  | 'dok_depth'
  | 'alignment_gaps'
  | 'assessment_coverage'
  | 'content_complexity';

export interface RecommendationResult {
  /** Prioritized recommendations */
  recommendations: GeneratedRecommendation[];
  /** Summary of current state */
  currentStateSummary: string;
  /** Model used */
  model: string;
  /** Processing time */
  processingTimeMs: number;
}

export interface GeneratedRecommendation {
  /** Recommendation ID */
  id: string;
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
  /** Category */
  category: RecommendationCategory;
  /** Title */
  title: string;
  /** Detailed description */
  description: string;
  /** Specific action items */
  actionItems: string[];
  /** Expected impact */
  expectedImpact: string;
  /** Affected areas */
  affectedAreas: string[];
}

export type RecommendationCategory =
  | 'add_content'
  | 'revise_content'
  | 'add_assessment'
  | 'modify_assessment'
  | 'rebalance_levels'
  | 'improve_alignment';

// ═══════════════════════════════════════════════════════════════
// ADAPTER OPTIONS AND UTILITIES
// ═══════════════════════════════════════════════════════════════

export interface DepthAnalysisLLMAdapterOptions {
  /** Provider configuration */
  provider: LLMProviderConfig;
  /** Enable caching */
  cacheEnabled?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
  /** Rate limiting */
  rateLimit?: RateLimitConfig;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Custom system prompts */
  systemPrompts?: SystemPromptOverrides;
  /** Logger */
  logger?: LLMAdapterLogger;
}

export interface RateLimitConfig {
  /** Max requests per window */
  maxRequests: number;
  /** Window size in ms */
  windowMs: number;
  /** Delay between requests in ms */
  delayMs?: number;
}

export interface RetryConfig {
  /** Max retry attempts */
  maxRetries: number;
  /** Initial delay in ms */
  initialDelayMs: number;
  /** Delay multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Max delay in ms */
  maxDelayMs: number;
  /** Retry on these error codes */
  retryOnCodes?: number[];
}

export interface SystemPromptOverrides {
  bloomsClassification?: string;
  dokClassification?: string;
  multiFramework?: string;
  keywordExtraction?: string;
  alignmentAnalysis?: string;
  recommendations?: string;
}

export interface LLMAdapterLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export interface LLMModelInfo {
  provider: LLMProvider;
  model: string;
  tier: LLMModelTier;
  maxTokens: number;
  contextWindow: number;
}

// ═══════════════════════════════════════════════════════════════
// STRUCTURED OUTPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════

/**
 * Schema definitions for structured LLM outputs
 * Used for validation and type safety
 */
export interface StructuredOutputSchema<T> {
  /** Schema name */
  name: string;
  /** JSON Schema definition */
  schema: Record<string, unknown>;
  /** Parse and validate raw output */
  parse: (raw: string) => T;
  /** Default value if parsing fails */
  defaultValue?: T;
}

// ═══════════════════════════════════════════════════════════════
// PROVIDER-SPECIFIC TYPES
// ═══════════════════════════════════════════════════════════════

export interface OpenAIModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
}

export interface AnthropicModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface DeepSeekModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// Model tier mappings
export const MODEL_TIER_MAPPING: Record<LLMProvider, Record<LLMModelTier, string>> = {
  openai: {
    fast: 'gpt-4o-mini',
    balanced: 'gpt-4o',
    powerful: 'gpt-4-turbo',
  },
  anthropic: {
    fast: 'claude-3-5-haiku-latest',
    balanced: 'claude-sonnet-4-20250514',
    powerful: 'claude-opus-4-20250514',
  },
  deepseek: {
    fast: 'deepseek-chat',
    balanced: 'deepseek-chat',
    powerful: 'deepseek-reasoner',
  },
  custom: {
    fast: 'default',
    balanced: 'default',
    powerful: 'default',
  },
};
