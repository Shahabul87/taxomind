/**
 * @sam-ai/core
 * Core engine orchestration, state machine, and types for SAM AI Tutor
 *
 * @packageDocumentation
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Context types
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

  // Engine types
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

  // Config types
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
} from './types';

// Type constants
export { BLOOMS_LEVELS, BLOOMS_LEVEL_ORDER } from './types';

// Context factories
export {
  createDefaultUserContext,
  createDefaultPageContext,
  createDefaultConversationContext,
  createDefaultGamificationContext,
  createDefaultUIContext,
  createDefaultContext,
  createSAMConfig,
} from './types';

// ============================================================================
// STATE MACHINE
// ============================================================================

export {
  SAMStateMachine,
  createStateMachine,
} from './state-machine';

export type {
  SAMState,
  SAMEventType,
  SAMEvent,
  SAMStateListener,
  SendMessageEvent,
  ReceiveResponseEvent,
  StreamChunkEvent,
  UpdateContextEvent,
  UpdatePageEvent,
  UpdateFormEvent,
  UpdateGamificationEvent,
  ExecuteActionEvent,
  AnalyzeEvent,
  ErrorEvent,
} from './state-machine';

// ============================================================================
// ORCHESTRATOR
// ============================================================================

export {
  SAMAgentOrchestrator,
  createOrchestrator,
} from './orchestrator';

// ============================================================================
// ENGINES
// ============================================================================

export {
  // Base
  BaseEngine,
  // Core engines
  ContextEngine,
  createContextEngine,
  BloomsEngine,
  createBloomsEngine,
  ResponseEngine,
  createResponseEngine,
  // Content & Assessment engines
  ContentEngine,
  createContentEngine,
  AssessmentEngine,
  createAssessmentEngine,
  // Personalization engine
  PersonalizationEngine,
  createPersonalizationEngine,
} from './engines';

export type {
  // Base
  BaseEngineOptions,
  // Context engine
  ContextEngineOutput,
  QueryIntent,
  // Blooms engine
  BloomsEngineInput,
  BloomsEngineOutput,
  // Response engine
  ResponseEngineOutput,
  // Content engine
  ContentEngineOutput,
  ContentMetrics,
  ContentSuggestion,
  GeneratedContent,
  // Assessment engine
  AssessmentEngineOutput,
  AssessmentConfig,
  AssessmentAnalysis,
  GeneratedQuestion,
  StudyGuide,
  // Personalization engine
  PersonalizationEngineOutput,
  LearningStyleProfile,
  EmotionalProfile,
  EmotionalState,
  CognitiveLoadProfile,
  CognitiveLoad,
  MotivationProfile,
  ContentAdaptation,
  PersonalizedLearningPath,
  LearningPathNode,
} from './engines';

// ============================================================================
// ADAPTERS
// ============================================================================

export {
  AnthropicAdapter,
  createAnthropicAdapter,
  MemoryCacheAdapter,
  createMemoryCache,
} from './adapters';

export type {
  AnthropicAdapterOptions,
  MemoryCacheOptions,
} from './adapters';

// ============================================================================
// ERRORS
// ============================================================================

export {
  SAMError,
  ConfigurationError,
  InitializationError,
  EngineError,
  OrchestrationError,
  AIError,
  StorageError,
  CacheError,
  ValidationError,
  TimeoutError,
  RateLimitError,
  DependencyError,
  isSAMError,
  wrapError,
  createTimeoutPromise,
  withTimeout,
  withRetry,
} from './errors';

export type { SAMErrorCode, SAMErrorDetails } from './errors';

// ============================================================================
// VERSION
// ============================================================================

export const VERSION = '0.1.0';
