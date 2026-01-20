/**
 * LLM Adapter Module Exports
 * Enhanced Depth Analysis - January 2026
 *
 * Portable LLM adapter for depth analysis operations.
 */

// ═══════════════════════════════════════════════════════════════
// ADAPTER EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
  PortableDepthAnalysisLLMAdapter,
  createDepthAnalysisLLMAdapter,
  createQuickAdapter,
  ADAPTER_VERSION,
} from './depth-analysis-llm-adapter';

// ═══════════════════════════════════════════════════════════════
// PROMPTS (for customization)
// ═══════════════════════════════════════════════════════════════

export {
  BLOOMS_CLASSIFICATION_PROMPT,
  DOK_CLASSIFICATION_PROMPT,
  MULTI_FRAMEWORK_PROMPT,
  KEYWORD_EXTRACTION_PROMPT,
  ALIGNMENT_ANALYSIS_PROMPT,
  RECOMMENDATION_PROMPT,
} from './prompts';

// ═══════════════════════════════════════════════════════════════
// PARSERS (for custom implementations)
// ═══════════════════════════════════════════════════════════════

export {
  parseBloomsResult,
  parseDOKResult,
  parseMultiFrameworkResult,
  parseKeywordResult,
  parseAlignmentResult,
  parseRecommendationResult,
} from './parsers';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type {
  // Provider types
  LLMProvider,
  LLMModelTier,
  LLMProviderConfig,

  // Adapter interface
  DepthAnalysisLLMAdapter,
  DepthAnalysisLLMAdapterOptions,
  LLMModelInfo,
  LLMAdapterLogger,

  // Configuration types
  RateLimitConfig,
  RetryConfig,
  SystemPromptOverrides,

  // Bloom's classification
  BloomsClassificationInput,
  BloomsClassificationResult,
  BloomsEvidence,
  BloomsAlternative,

  // DOK classification
  DOKClassificationInput,
  DOKClassificationResult,
  DOKEvidence,
  DOKAlternative,

  // Multi-framework
  MultiFrameworkClassificationInput,
  MultiFrameworkClassificationResult,
  FrameworkClassificationDetail,
  FrameworkEvidence,

  // Keyword extraction
  KeywordExtractionInput,
  KeywordExtractionResult,
  KeywordType,
  ExtractedKeywordGroup,
  ExtractedKeyword,

  // Alignment analysis
  AlignmentAnalysisInput,
  AlignmentAnalysisResult,
  ObjectiveForAnalysis,
  SectionForAnalysis,
  AssessmentForAnalysis,
  QuestionForAnalysis,
  ObjectiveAlignmentDetail,
  AssessmentAlignmentDetail,
  AlignedItemDetail,
  AlignmentGapDetail,
  AlignmentSummaryStats,

  // Recommendations
  RecommendationInput,
  RecommendationResult,
  RecommendationFocusArea,
  GeneratedRecommendation,
  RecommendationCategory,

  // Structured output
  StructuredOutputSchema,

  // Provider-specific
  OpenAIModelConfig,
  AnthropicModelConfig,
  DeepSeekModelConfig,
} from './types';

// Model tier mapping constant
export { MODEL_TIER_MAPPING } from './types';
