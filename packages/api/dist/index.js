/**
 * @sam-ai/api
 * API route handlers and middleware for SAM AI Tutor
 *
 * @packageDocumentation
 */
// ============================================================================
// FACTORY
// ============================================================================
export { createRouteHandlerFactory, createErrorResponse, createSuccessResponse, generateRequestId, } from './utils';
// ============================================================================
// HANDLERS
// ============================================================================
export { createChatHandler, createStreamingChatHandler, createAnalyzeHandler, analyzeBloomsLevel, createGamificationHandler, createProfileHandler, } from './handlers';
// ============================================================================
// MIDDLEWARE
// ============================================================================
export { 
// Rate limiting
createRateLimiter, rateLimitPresets, 
// Authentication
createAuthMiddleware, createTokenAuthenticator, composeAuthMiddleware, requireRoles, 
// Validation
createValidationMiddleware, validateQuery, composeValidation, chatRequestSchema, analyzeRequestSchema, gamificationRequestSchema, profileRequestSchema, } from './middleware';
// ============================================================================
// VERSION
// ============================================================================
export const VERSION = '0.1.0';
