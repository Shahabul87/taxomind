/**
 * SAM AI Integration Layer for Taxomind
 *
 * This module provides a unified integration layer for SAM AI packages
 * within the Taxomind application. It re-exports all @sam-ai packages
 * and adds Taxomind-specific configuration and adapters.
 *
 * Usage:
 * ```typescript
 * import { createOrchestrator, getTaxomindSAMConfig } from '@/lib/sam-integration';
 * ```
 */

// ============================================================================
// RE-EXPORT @SAM-AI/CORE
// ============================================================================

export {
  // Orchestrator
  SAMAgentOrchestrator,
  createOrchestrator,

  // State Machine
  SAMStateMachine,
  createStateMachine,

  // Engines
  BaseEngine,
  ContextEngine,
  createContextEngine,
  BloomsEngine,
  createBloomsEngine,
  ResponseEngine,
  createResponseEngine,
  ContentEngine,
  createContentEngine,
  AssessmentEngine,
  createAssessmentEngine,
  PersonalizationEngine,
  createPersonalizationEngine,

  // Adapters
  AnthropicAdapter,
  createAnthropicAdapter,
  MemoryCacheAdapter,
  createMemoryCache,
  NoopDatabaseAdapter,
  createNoopDatabaseAdapter,
  InMemoryDatabaseAdapter,
  createInMemoryDatabase,

  // Context factories
  createDefaultUserContext,
  createDefaultPageContext,
  createDefaultConversationContext,
  createDefaultGamificationContext,
  createDefaultUIContext,
  createDefaultContext,
  createSAMConfig,

  // Constants
  BLOOMS_LEVELS,
  BLOOMS_LEVEL_ORDER,
  VERSION as CORE_VERSION,

  // Errors
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
} from '@sam-ai/core';

// Core types
export type {
  SAMContext,
  SAMConfig,
  SAMConfigInput,
  SAMUserContext,
  SAMPageContext,
  SAMPageType,
  SAMFormContext,
  SAMConversationContext,
  SAMGamificationContext,
  SAMUIContext,
  SAMMessage,
  SAMAction,
  SAMSuggestion,
  OrchestrationResult,
  OrchestrationOptions,
  BloomsLevel,
  BloomsAnalysis,
  BloomsDistribution,
  EngineInput,
  EngineResult,
  EngineConfig,
  AIAdapter,
  AIMessage,
  AIChatResponse,
  StorageAdapter,
  CacheAdapter,
  AnalyticsAdapter,
  SAMDatabaseAdapter,
  SAMErrorCode,
  SAMErrorDetails,
} from '@sam-ai/core';

// ============================================================================
// RE-EXPORT @SAM-AI/EDUCATIONAL
// ============================================================================

export {
  // Unified Blooms Engine
  createUnifiedBloomsEngine,
  createUnifiedBloomsAdapterEngine,

  // Core educational engines
  createExamEngine,
  createEvaluationEngine,
  createBloomsAnalysisEngine,
  createPersonalizationEngine as createEducationalPersonalizationEngine,
  createContentGenerationEngine,
  createResourceEngine,
  createMultimediaEngine,
  createFinancialEngine,
  createPredictiveEngine,
  createAnalyticsEngine,
  createMemoryEngine,
  createResearchEngine,
  createTrendsEngine,
  createAchievementEngine,
  createIntegrityEngine,
  createCourseGuideEngine,
  createCollaborationEngine,
  createSocialEngine,
  createInnovationEngine,
  createMarketEngine,

  // Validation
  extractJson,
  parseAndValidate,
  validateSchema,
  safeParseWithDefaults,
  createRetryPrompt,
  executeWithRetry,
  BloomsLevelSchema,
  SubjectiveEvaluationResponseSchema,
} from '@sam-ai/educational';

// Educational types
export type {
  UnifiedBloomsConfig,
  UnifiedBloomsResult,
  ExamEngineConfig,
  EvaluationEngineConfig,
  SubjectiveEvaluationResult,
  BloomsAnalysisConfig,
  BloomsDistribution as EduBloomsDistribution,
  ContentGenerationEngineConfig,
  QuestionBankEntry,
  QuestionType,
  QuestionDifficulty,
} from '@sam-ai/educational';

// ============================================================================
// RE-EXPORT @SAM-AI/API
// ============================================================================

export {
  // Handlers
  createChatHandler,
  createStreamingChatHandler,
  createAnalyzeHandler,
  analyzeBloomsLevel,
  createGamificationHandler,
  createProfileHandler,

  // Factory
  createRouteHandlerFactory,
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,

  // Middleware
  createRateLimiter,
  rateLimitPresets,
  createAuthMiddleware,
  createTokenAuthenticator,
  composeAuthMiddleware,
  requireRoles,
  createValidationMiddleware,
  validateQuery,
  composeValidation,
  chatRequestSchema,
  analyzeRequestSchema,
  gamificationRequestSchema,
  profileRequestSchema,

  // Version
  VERSION as API_VERSION,
} from '@sam-ai/api';

// API types
export type {
  SAMApiRequest,
  SAMApiResponse,
  SAMApiError,
  SAMHandler,
  SAMHandlerContext,
  SAMHandlerOptions,
  ChatRequest,
  ChatResponse,
  AnalyzeRequest,
  AnalyzeResponse,
  GamificationRequest,
  GamificationResponse,
  ProfileRequest,
  ProfileResponse,
  RateLimitConfig,
  RateLimitInfo,
  StreamChunk,
  StreamCallback,
  RouteHandlerFactoryOptions,
  AuthOptions,
  ChatRequestData,
  AnalyzeRequestData,
  GamificationRequestData,
  ProfileRequestData,
} from '@sam-ai/api';

// ============================================================================
// RE-EXPORT @SAM-AI/REACT (types only for server context)
// ============================================================================

// React hooks and providers should be imported directly from @sam-ai/react
// in client components. We only re-export types here for server-side use.
export type {
  SAMProviderConfig,
  SAMProviderState,
  UseSAMReturn,
  UseSAMContextReturn,
  UseSAMChatReturn,
  UseSAMActionsReturn,
  UseSAMFormReturn,
  UseSAMAnalysisReturn,
  PageContextDetection,
  ContextDetectorOptions,
  FormSyncOptions,
  FormAutoFillOptions,
} from '@sam-ai/react';

// ============================================================================
// TAXOMIND-SPECIFIC EXPORTS
// ============================================================================

// Configuration
export {
  getTaxomindSAMConfig,
  getDefaultAIModel,
  isSAMConfigured,
  getDefaultTaxomindConfig,
  resetDefaultTaxomindConfig,
  type TaxomindSAMConfigOptions,
} from './config';

// Database adapter
export {
  createTaxomindDatabaseAdapter,
  getTaxomindDatabaseAdapter,
  resetTaxomindDatabaseAdapter,
  isDatabaseConnected,
  getRawPrismaClient,
} from './prisma-adapter';

// Entity context
export {
  buildTaxomindEntityContext,
  fetchCourseContext,
  fetchChapterContext,
  fetchSectionContext,
  buildFormSummary,
  type EntityContext,
  type CourseContext,
  type ChapterContext,
  type SectionContext,
  type PageFormData,
} from './entity-context';

// ============================================================================
// VERSION
// ============================================================================

export const VERSION = '0.1.0';
export const PACKAGE_NAME = '@sam-ai/integration';
