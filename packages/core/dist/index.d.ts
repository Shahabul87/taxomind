/**
 * @sam-ai/core
 * Core engine orchestration, state machine, and types for SAM AI Tutor
 *
 * @packageDocumentation
 */
export type { SAMUserRole, SAMLearningStyle, SAMTone, SAMTeachingMethod, SAMUserPreferences, SAMUserContext, SAMPageType, SAMPageContext, SAMFormField, SAMFormContext, SAMMessageRole, SAMEmotion, SAMSuggestion, SAMAction, SAMMessageMetadata, SAMMessage, SAMConversationContext, SAMBadgeLevel, SAMBadge, SAMAchievement, SAMStreak, SAMGamificationContext, SAMPosition, SAMTheme, SAMSize, SAMUIContext, SAMContextMetadata, SAMContext, BloomsLevel, BloomsDistribution, BloomsAnalysis, EngineInput, EngineResultData, EngineResultMetadata, EngineResult, EngineErrorInfo, EngineConfig, EngineRegistration, OrchestrationOptions, AggregatedResponse, OrchestrationMetadata, OrchestrationResult, AnalysisType, AnalysisRequest, AnalysisResponse, ContentType, GenerationRequest, GenerationResponse, QuestionType, QuestionOption, Question, AssessmentRequest, AssessmentResponse, AIAdapter, AIChatParams, AIMessage, AIChatResponse, AIChatStreamChunk, StorageAdapter, ConversationData, GamificationData, BadgeData, InteractionData, LearningProfileData, CacheAdapter, AnalyticsAdapter, AnalyticsEvent, SAMLogger, SAMRoutePatterns, SAMFeatureFlags, SAMModelConfig, SAMRateLimitConfig, SAMEngineSettings, SAMConfig, SAMConfigInput, } from './types';
export { BLOOMS_LEVELS, BLOOMS_LEVEL_ORDER } from './types';
export { createDefaultUserContext, createDefaultPageContext, createDefaultConversationContext, createDefaultGamificationContext, createDefaultUIContext, createDefaultContext, createSAMConfig, } from './types';
export { SAMStateMachine, createStateMachine, } from './state-machine';
export type { SAMState, SAMEventType, SAMEvent, SAMStateListener, SendMessageEvent, ReceiveResponseEvent, StreamChunkEvent, UpdateContextEvent, UpdatePageEvent, UpdateFormEvent, UpdateGamificationEvent, ExecuteActionEvent, AnalyzeEvent, ErrorEvent, } from './state-machine';
export { SAMAgentOrchestrator, createOrchestrator, } from './orchestrator';
export { BaseEngine, ContextEngine, createContextEngine, BloomsEngine, createBloomsEngine, ResponseEngine, createResponseEngine, ContentEngine, createContentEngine, AssessmentEngine, createAssessmentEngine, PersonalizationEngine, createPersonalizationEngine, } from './engines';
export type { BaseEngineOptions, ContextEngineOutput, QueryIntent, BloomsEngineInput, BloomsEngineOutput, ResponseEngineOutput, ContentEngineOutput, ContentMetrics, ContentSuggestion, GeneratedContent, AssessmentEngineOutput, AssessmentConfig, AssessmentAnalysis, GeneratedQuestion, StudyGuide, PersonalizationEngineOutput, LearningStyleProfile, EmotionalProfile, EmotionalState, CognitiveLoadProfile, CognitiveLoad, MotivationProfile, ContentAdaptation, PersonalizedLearningPath, LearningPathNode, } from './engines';
export { AnthropicAdapter, createAnthropicAdapter, DeepSeekAdapter, createDeepSeekAdapter, OpenAIAdapter, createOpenAIAdapter, MemoryCacheAdapter, createMemoryCache, } from './adapters';
export type { AnthropicAdapterOptions, DeepSeekAdapterOptions, OpenAIAdapterOptions, MemoryCacheOptions, } from './adapters';
export { NoopDatabaseAdapter, createNoopDatabaseAdapter, InMemoryDatabaseAdapter, createInMemoryDatabase, } from './adapters';
export type { SAMDatabaseAdapter, DatabaseAdapterOptions, QueryOptions, CountResult, TransactionContext, InMemoryDatabaseOptions, SAMUser, SAMCourse, SAMChapter, SAMSection, SAMQuestion, SAMBloomsProgress, SAMCognitiveProgress, SAMInteractionLog, SAMCourseAnalysis, } from './adapters';
export { SAMError, ConfigurationError, InitializationError, EngineError, OrchestrationError, AIError, StorageError, CacheError, ValidationError, TimeoutError, RateLimitError, DependencyError, isSAMError, wrapError, createTimeoutPromise, withTimeout, withRetry, } from './errors';
export type { SAMErrorCode, SAMErrorDetails } from './errors';
export declare const VERSION = "0.1.0";
//# sourceMappingURL=index.d.ts.map