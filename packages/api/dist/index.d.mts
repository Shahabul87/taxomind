import { z } from 'zod';
import { SAMConfig, SAMContext, SAMMessage, BloomsAnalysis } from '@sam-ai/core';

/**
 * @sam-ai/api - Types
 */

interface SAMApiRequest {
    /** Request body */
    body: unknown;
    /** Request headers */
    headers: Record<string, string | string[] | undefined>;
    /** Request method */
    method: string;
    /** Request URL */
    url: string;
    /** Query parameters */
    query?: Record<string, string | string[] | undefined>;
}
interface SAMApiResponse {
    /** Response status code */
    status: number;
    /** Response body */
    body: unknown;
    /** Response headers */
    headers?: Record<string, string>;
}
interface SAMApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    status: number;
}
interface SAMHandlerContext {
    /** SAM configuration */
    config: SAMConfig;
    /** Current user context (from auth) */
    user?: {
        id: string;
        role: string;
        name?: string;
    };
    /** Request ID for tracing */
    requestId: string;
    /** Request timestamp */
    timestamp: Date;
}
type SAMHandler = (request: SAMApiRequest, context: SAMHandlerContext) => Promise<SAMApiResponse>;
interface SAMHandlerOptions {
    /** Rate limiting configuration */
    rateLimit?: RateLimitConfig;
    /** Required authentication */
    requireAuth?: boolean;
    /** Required roles */
    requiredRoles?: string[];
    /** Request validation schema */
    validateRequest?: (body: unknown) => boolean;
    /** Enable streaming response */
    streaming?: boolean;
}
interface ChatRequest {
    /** User message */
    message: string;
    /** Conversation context */
    context?: Partial<SAMContext>;
    /** Conversation history */
    history?: SAMMessage[];
    /** Stream response */
    stream?: boolean;
}
interface ChatResponse {
    /** Response message */
    message: string;
    /** Conversation ID */
    conversationId: string;
    /** Suggestions for next messages */
    suggestions: Array<{
        id: string;
        text: string;
        label: string;
    }>;
    /** Available actions */
    actions: Array<{
        id: string;
        type: string;
        label: string;
        payload?: Record<string, unknown>;
    }>;
    /** Bloom's analysis if available */
    bloomsAnalysis?: BloomsAnalysis;
    /** Token usage */
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
}
interface AnalyzeRequest {
    /** Content to analyze */
    content?: string;
    /** Page context */
    context?: Partial<SAMContext>;
    /** Analysis type */
    type?: 'blooms' | 'content' | 'assessment' | 'full';
    /** Additional options */
    options?: {
        includeRecommendations?: boolean;
        targetBloomsLevel?: string;
    };
}
interface AnalyzeResponse {
    /** Analysis results */
    analysis: {
        blooms?: BloomsAnalysis;
        content?: {
            score: number;
            metrics: Record<string, number>;
            suggestions: string[];
        };
        assessment?: {
            questionCount: number;
            distribution: Record<string, number>;
        };
    };
    /** Recommendations */
    recommendations: string[];
    /** Processing metadata */
    metadata: {
        processingTime: number;
        enginesUsed: string[];
    };
}
interface GamificationRequest {
    /** User ID */
    userId: string;
    /** Action type */
    action: 'get' | 'update' | 'award-badge' | 'update-streak';
    /** Action payload */
    payload?: {
        badgeId?: string;
        points?: number;
        activity?: string;
    };
}
interface GamificationResponse {
    /** User's gamification data */
    data: {
        points: number;
        level: number;
        badges: Array<{
            id: string;
            name: string;
            earnedAt: Date;
        }>;
        streak: {
            current: number;
            longest: number;
            lastActivity: Date;
        };
        achievements: Array<{
            id: string;
            name: string;
            progress: number;
            completed: boolean;
        }>;
    };
    /** Recent activity */
    recentActivity?: Array<{
        type: string;
        points: number;
        timestamp: Date;
    }>;
}
interface ProfileRequest {
    /** User ID */
    userId: string;
    /** Action type */
    action: 'get' | 'update' | 'get-learning-style' | 'get-progress';
    /** Update payload */
    payload?: {
        preferences?: Record<string, unknown>;
        learningStyle?: string;
    };
}
interface ProfileResponse {
    /** User profile */
    profile: {
        id: string;
        name: string;
        role: string;
        preferences: {
            learningStyle?: string;
            tone?: string;
            difficulty?: string;
        };
        progress: {
            coursesCompleted: number;
            totalTimeSpent: number;
            averageScore: number;
        };
    };
    /** Learning analytics */
    analytics?: {
        strongAreas: string[];
        weakAreas: string[];
        recommendations: string[];
    };
}
interface RateLimitConfig {
    /** Maximum requests per window */
    maxRequests: number;
    /** Window size in milliseconds */
    windowMs: number;
    /** Key generator function */
    keyGenerator?: (request: SAMApiRequest) => string;
    /** Skip function */
    skip?: (request: SAMApiRequest) => boolean;
    /** Message when rate limited */
    message?: string;
}
interface RateLimitInfo {
    /** Remaining requests in window */
    remaining: number;
    /** Total requests allowed */
    limit: number;
    /** Window reset time */
    resetTime: Date;
    /** Whether request is blocked */
    blocked: boolean;
}
interface StreamChunk {
    /** Chunk type */
    type: 'text' | 'suggestion' | 'action' | 'done' | 'error';
    /** Chunk content */
    content?: string;
    /** Chunk data */
    data?: Record<string, unknown>;
}
type StreamCallback = (chunk: StreamChunk) => void;
interface RouteHandlerFactoryOptions {
    /** SAM configuration */
    config: SAMConfig;
    /** Base path for routes */
    basePath?: string;
    /** Default rate limit config */
    defaultRateLimit?: RateLimitConfig;
    /** Authentication handler */
    authenticate?: (request: SAMApiRequest) => Promise<SAMHandlerContext['user'] | null>;
    /** Error handler */
    onError?: (error: Error, request: SAMApiRequest) => SAMApiResponse;
    /** Request logger */
    onRequest?: (request: SAMApiRequest, context: SAMHandlerContext) => void;
    /** Response logger */
    onResponse?: (response: SAMApiResponse, context: SAMHandlerContext) => void;
}
interface RouteHandlerFactory {
    /** Create a handler with options */
    createHandler: (handler: SAMHandler, options?: SAMHandlerOptions) => (request: SAMApiRequest) => Promise<SAMApiResponse>;
    /** Pre-built handlers */
    handlers: {
        chat: SAMHandler;
        analyze: SAMHandler;
        gamification: SAMHandler;
        profile: SAMHandler;
    };
    /** Middleware */
    middleware: {
        rateLimit: (config: RateLimitConfig) => (handler: SAMHandler) => SAMHandler;
        auth: (options?: {
            requiredRoles?: string[];
        }) => (handler: SAMHandler) => SAMHandler;
        validate: <T>(schema: z.ZodSchema<T>) => (handler: SAMHandler) => SAMHandler;
    };
}

/**
 * @sam-ai/api - Route Handler Factory
 * Creates standardized API route handlers with middleware support
 */

/**
 * Generate a unique request ID
 */
declare function generateRequestId(): string;
/**
 * Create an error response
 */
declare function createErrorResponse(status: number, code: string, message: string, details?: Record<string, unknown>): SAMApiResponse;
/**
 * Create a success response
 */
declare function createSuccessResponse<T>(data: T, status?: number): SAMApiResponse;
/**
 * Create the route handler factory
 */
declare function createRouteHandlerFactory(options: RouteHandlerFactoryOptions): RouteHandlerFactory;

/**
 * @sam-ai/api - Chat Handler
 * Handles chat/conversation requests with SAM AI
 *
 * UPDATED: Now uses Unified Blooms Engine from @sam-ai/educational
 * for AI-powered cognitive level analysis instead of keyword-only
 */

/**
 * Create chat handler
 */
declare function createChatHandler(config: SAMConfig): SAMHandler;
/**
 * Create streaming chat handler (for future use)
 */
declare function createStreamingChatHandler(config: SAMConfig): (request: SAMApiRequest, context: SAMHandlerContext, onChunk: (chunk: string) => void) => Promise<void>;

/**
 * @sam-ai/api - Analyze Handler
 * Handles content analysis requests
 *
 * UPDATED: Now uses Unified Blooms Engine from @sam-ai/educational
 * for AI-powered cognitive level analysis instead of keyword-only
 */

/**
 * Create analyze handler
 */
declare function createAnalyzeHandler(config: SAMConfig): SAMHandler;
/**
 * Quick Bloom's analysis utility using unified engine
 */
declare function analyzeBloomsLevel(config: SAMConfig, content: string): Promise<BloomsAnalysis | null>;

/**
 * @sam-ai/api - Gamification Handler
 * Handles gamification-related requests (points, badges, streaks)
 */

/**
 * Create gamification handler
 */
declare function createGamificationHandler(config: SAMConfig): SAMHandler;

/**
 * @sam-ai/api - Profile Handler
 * Handles user profile and learning preference requests
 */

/**
 * Create profile handler
 */
declare function createProfileHandler(config: SAMConfig): SAMHandler;

/**
 * @sam-ai/api - Rate Limiting Middleware
 */

interface RateLimitStore {
    get(key: string): Promise<RateLimitEntry | null>;
    set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
    increment(key: string): Promise<number>;
}
interface RateLimitEntry {
    count: number;
    resetTime: number;
}
interface RateLimiter {
    check(request: SAMApiRequest): Promise<RateLimitInfo>;
    reset(key: string): Promise<void>;
}
/**
 * Create a rate limiter with the given configuration
 */
declare function createRateLimiter(config: RateLimitConfig, store?: RateLimitStore): RateLimiter;
/**
 * Rate limit presets for common use cases
 */
declare const rateLimitPresets: {
    /** Standard API rate limit: 100 requests per minute */
    standard: {
        maxRequests: number;
        windowMs: number;
        message: string;
    };
    /** Strict rate limit: 10 requests per minute */
    strict: {
        maxRequests: number;
        windowMs: number;
        message: string;
    };
    /** AI endpoints: 20 requests per minute */
    ai: {
        maxRequests: number;
        windowMs: number;
        message: string;
    };
    /** Lenient: 1000 requests per minute */
    lenient: {
        maxRequests: number;
        windowMs: number;
        message: string;
    };
};

/**
 * @sam-ai/api - Authentication Middleware
 */

interface AuthOptions {
    /** Required roles for access */
    requiredRoles?: string[];
    /** Custom unauthorized response */
    onUnauthorized?: () => SAMApiResponse;
    /** Custom forbidden response */
    onForbidden?: () => SAMApiResponse;
}
/**
 * Create authentication middleware
 */
declare function createAuthMiddleware(authenticate?: (request: SAMApiRequest) => Promise<SAMHandlerContext['user'] | null>, options?: AuthOptions): (handler: SAMHandler) => SAMHandler;
/**
 * Create a simple token-based authenticator
 */
declare function createTokenAuthenticator(validateToken: (token: string) => Promise<SAMHandlerContext['user'] | null>): (request: SAMApiRequest) => Promise<SAMHandlerContext['user'] | null>;
/**
 * Compose multiple auth middlewares
 */
declare function composeAuthMiddleware(...middlewares: Array<(handler: SAMHandler) => SAMHandler>): (handler: SAMHandler) => SAMHandler;
/**
 * Create role-based access control middleware
 */
declare function requireRoles(...roles: string[]): (handler: SAMHandler) => SAMHandler;

/**
 * @sam-ai/api - Validation Middleware
 */

/**
 * Create validation middleware using a Zod schema
 */
declare function createValidationMiddleware<T>(schema: z.ZodSchema<T>): (handler: SAMHandler) => SAMHandler;
/**
 * Validate query parameters
 */
declare function validateQuery<T>(schema: z.ZodSchema<T>): (handler: SAMHandler) => SAMHandler;
/**
 * Compose multiple validation middlewares
 */
declare function composeValidation(...validators: Array<(handler: SAMHandler) => SAMHandler>): (handler: SAMHandler) => SAMHandler;
/**
 * Chat request validation schema
 */
declare const chatRequestSchema: z.ZodObject<{
    message: z.ZodString;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    history: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        role: z.ZodEnum<["user", "assistant", "system"]>;
        content: z.ZodString;
        timestamp: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        id: string;
        role: "user" | "assistant" | "system";
        timestamp?: string | Date | undefined;
    }, {
        content: string;
        id: string;
        role: "user" | "assistant" | "system";
        timestamp?: string | Date | undefined;
    }>, "many">>;
    stream: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    message: string;
    context?: Record<string, unknown> | undefined;
    history?: {
        content: string;
        id: string;
        role: "user" | "assistant" | "system";
        timestamp?: string | Date | undefined;
    }[] | undefined;
    stream?: boolean | undefined;
}, {
    message: string;
    context?: Record<string, unknown> | undefined;
    history?: {
        content: string;
        id: string;
        role: "user" | "assistant" | "system";
        timestamp?: string | Date | undefined;
    }[] | undefined;
    stream?: boolean | undefined;
}>;
/**
 * Analyze request validation schema
 */
declare const analyzeRequestSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    type: z.ZodOptional<z.ZodEnum<["blooms", "content", "assessment", "full"]>>;
    options: z.ZodOptional<z.ZodObject<{
        includeRecommendations: z.ZodOptional<z.ZodBoolean>;
        targetBloomsLevel: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        includeRecommendations?: boolean | undefined;
        targetBloomsLevel?: string | undefined;
    }, {
        includeRecommendations?: boolean | undefined;
        targetBloomsLevel?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    content?: string | undefined;
    type?: "blooms" | "content" | "assessment" | "full" | undefined;
    context?: Record<string, unknown> | undefined;
    options?: {
        includeRecommendations?: boolean | undefined;
        targetBloomsLevel?: string | undefined;
    } | undefined;
}, {
    content?: string | undefined;
    type?: "blooms" | "content" | "assessment" | "full" | undefined;
    context?: Record<string, unknown> | undefined;
    options?: {
        includeRecommendations?: boolean | undefined;
        targetBloomsLevel?: string | undefined;
    } | undefined;
}>;
/**
 * Gamification request validation schema
 */
declare const gamificationRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    action: z.ZodEnum<["get", "update", "award-badge", "update-streak"]>;
    payload: z.ZodOptional<z.ZodObject<{
        badgeId: z.ZodOptional<z.ZodString>;
        points: z.ZodOptional<z.ZodNumber>;
        activity: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        points?: number | undefined;
        badgeId?: string | undefined;
        activity?: string | undefined;
    }, {
        points?: number | undefined;
        badgeId?: string | undefined;
        activity?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    action: "get" | "update" | "award-badge" | "update-streak";
    userId: string;
    payload?: {
        points?: number | undefined;
        badgeId?: string | undefined;
        activity?: string | undefined;
    } | undefined;
}, {
    action: "get" | "update" | "award-badge" | "update-streak";
    userId: string;
    payload?: {
        points?: number | undefined;
        badgeId?: string | undefined;
        activity?: string | undefined;
    } | undefined;
}>;
/**
 * Profile request validation schema
 */
declare const profileRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    action: z.ZodEnum<["get", "update", "get-learning-style", "get-progress"]>;
    payload: z.ZodOptional<z.ZodObject<{
        preferences: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        learningStyle: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        preferences?: Record<string, unknown> | undefined;
        learningStyle?: string | undefined;
    }, {
        preferences?: Record<string, unknown> | undefined;
        learningStyle?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    action: "get" | "update" | "get-learning-style" | "get-progress";
    userId: string;
    payload?: {
        preferences?: Record<string, unknown> | undefined;
        learningStyle?: string | undefined;
    } | undefined;
}, {
    action: "get" | "update" | "get-learning-style" | "get-progress";
    userId: string;
    payload?: {
        preferences?: Record<string, unknown> | undefined;
        learningStyle?: string | undefined;
    } | undefined;
}>;
type ChatRequestData = z.infer<typeof chatRequestSchema>;
type AnalyzeRequestData = z.infer<typeof analyzeRequestSchema>;
type GamificationRequestData = z.infer<typeof gamificationRequestSchema>;
type ProfileRequestData = z.infer<typeof profileRequestSchema>;

/**
 * @sam-ai/api
 * API route handlers and middleware for SAM AI Tutor
 *
 * @packageDocumentation
 */

declare const VERSION = "0.1.0";

export { type AnalyzeRequest, type AnalyzeRequestData, type AnalyzeResponse, type AuthOptions, type ChatRequest, type ChatRequestData, type ChatResponse, type GamificationRequest, type GamificationRequestData, type GamificationResponse, type ProfileRequest, type ProfileRequestData, type ProfileResponse, type RateLimitConfig, type RateLimitInfo, type RateLimiter, type RouteHandlerFactory, type RouteHandlerFactoryOptions, type SAMApiError, type SAMApiRequest, type SAMApiResponse, type SAMHandler, type SAMHandlerContext, type SAMHandlerOptions, type StreamCallback, type StreamChunk, VERSION, analyzeBloomsLevel, analyzeRequestSchema, chatRequestSchema, composeAuthMiddleware, composeValidation, createAnalyzeHandler, createAuthMiddleware, createChatHandler, createErrorResponse, createGamificationHandler, createProfileHandler, createRateLimiter, createRouteHandlerFactory, createStreamingChatHandler, createSuccessResponse, createTokenAuthenticator, createValidationMiddleware, gamificationRequestSchema, generateRequestId, profileRequestSchema, rateLimitPresets, requireRoles, validateQuery };
