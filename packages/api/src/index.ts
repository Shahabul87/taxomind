/**
 * @sam-ai/api
 * API route handlers and middleware for SAM AI Tutor
 *
 * @packageDocumentation
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Request/Response types
  SAMApiRequest,
  SAMApiResponse,
  SAMApiError,

  // Handler types
  SAMHandlerContext,
  SAMHandler,
  SAMHandlerOptions,

  // Chat types
  ChatRequest,
  ChatResponse,

  // Analyze types
  AnalyzeRequest,
  AnalyzeResponse,

  // Gamification types
  GamificationRequest,
  GamificationResponse,

  // Profile types
  ProfileRequest,
  ProfileResponse,

  // Rate limiting types
  RateLimitConfig,
  RateLimitInfo,

  // Streaming types
  StreamChunk,
  StreamCallback,

  // Factory types
  RouteHandlerFactoryOptions,
  RouteHandlerFactory,
} from './types';

// ============================================================================
// FACTORY
// ============================================================================

export {
  createRouteHandlerFactory,
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,
} from './utils';

// ============================================================================
// HANDLERS
// ============================================================================

export {
  createChatHandler,
  createStreamingChatHandler,
  createAnalyzeHandler,
  analyzeBloomsLevel,
  createGamificationHandler,
  createProfileHandler,
} from './handlers';

// ============================================================================
// MIDDLEWARE
// ============================================================================

export {
  // Rate limiting
  createRateLimiter,
  rateLimitPresets,
  type RateLimiter,

  // Authentication
  createAuthMiddleware,
  createTokenAuthenticator,
  composeAuthMiddleware,
  requireRoles,
  type AuthOptions,

  // Validation
  createValidationMiddleware,
  validateQuery,
  composeValidation,
  chatRequestSchema,
  analyzeRequestSchema,
  gamificationRequestSchema,
  profileRequestSchema,
  type ChatRequestData,
  type AnalyzeRequestData,
  type GamificationRequestData,
  type ProfileRequestData,
} from './middleware';

// ============================================================================
// VERSION
// ============================================================================

export const VERSION = '0.1.0';
