/**
 * @sam-ai/core - Type Exports
 */

// Context types
export type {
  SAMUserRole,
  SAMLearningStyle,
  SAMTone,
  SAMTeachingMethod,
  SAMUserPreferences,
  SAMUserContext,
  SAMPageType,
  SAMPageContext,
  SAMFormField,
  SAMFormContext,
  SAMMessageRole,
  SAMEmotion,
  SAMSuggestion,
  SAMAction,
  SAMMessageMetadata,
  SAMMessage,
  SAMConversationContext,
  SAMBadgeLevel,
  SAMBadge,
  SAMAchievement,
  SAMStreak,
  SAMGamificationContext,
  SAMPosition,
  SAMTheme,
  SAMSize,
  SAMUIContext,
  SAMContextMetadata,
  SAMContext,
} from './context';

export {
  createDefaultUserContext,
  createDefaultPageContext,
  createDefaultConversationContext,
  createDefaultGamificationContext,
  createDefaultUIContext,
  createDefaultContext,
} from './context';

// Engine types
export type {
  BloomsLevel,
  BloomsDistribution,
  BloomsAnalysis,
  EngineInput,
  EngineResultData,
  EngineResultMetadata,
  EngineResult,
  EngineErrorInfo,
  EngineConfig,
  EngineRegistration,
  OrchestrationOptions,
  AggregatedResponse,
  OrchestrationMetadata,
  OrchestrationResult,
  AnalysisType,
  AnalysisRequest,
  AnalysisResponse,
  ContentType,
  GenerationRequest,
  GenerationResponse,
  QuestionType,
  QuestionOption,
  Question,
  AssessmentRequest,
  AssessmentResponse,
} from './engine';

export { BLOOMS_LEVELS, BLOOMS_LEVEL_ORDER } from './engine';

// Config types
export type {
  AIAdapter,
  AIChatParams,
  AIMessage,
  AIChatResponse,
  AIChatStreamChunk,
  StorageAdapter,
  ConversationData,
  GamificationData,
  BadgeData,
  InteractionData,
  LearningProfileData,
  CacheAdapter,
  AnalyticsAdapter,
  AnalyticsEvent,
  SAMLogger,
  SAMRoutePatterns,
  SAMFeatureFlags,
  SAMModelConfig,
  SAMRateLimitConfig,
  SAMEngineSettings,
  SAMConfig,
  SAMConfigInput,
} from './config';

export { createSAMConfig } from './config';
