/**
 * @sam-ai/api
 * API route handlers and middleware for SAM AI Tutor
 *
 * @packageDocumentation
 */
export type { SAMApiRequest, SAMApiResponse, SAMApiError, SAMHandlerContext, SAMHandler, SAMHandlerOptions, ChatRequest, ChatResponse, AnalyzeRequest, AnalyzeResponse, GamificationRequest, GamificationResponse, ProfileRequest, ProfileResponse, RateLimitConfig, RateLimitInfo, StreamChunk, StreamCallback, RouteHandlerFactoryOptions, RouteHandlerFactory, } from './types';
export { createRouteHandlerFactory, createErrorResponse, createSuccessResponse, generateRequestId, } from './utils';
export { createChatHandler, createStreamingChatHandler, createAnalyzeHandler, analyzeBloomsLevel, createGamificationHandler, createProfileHandler, } from './handlers';
export { createRateLimiter, rateLimitPresets, type RateLimiter, createAuthMiddleware, createTokenAuthenticator, composeAuthMiddleware, requireRoles, type AuthOptions, createValidationMiddleware, validateQuery, composeValidation, chatRequestSchema, analyzeRequestSchema, gamificationRequestSchema, profileRequestSchema, type ChatRequestData, type AnalyzeRequestData, type GamificationRequestData, type ProfileRequestData, } from './middleware';
export declare const VERSION = "0.1.0";
//# sourceMappingURL=index.d.ts.map