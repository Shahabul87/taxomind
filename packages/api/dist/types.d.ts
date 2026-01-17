/**
 * @sam-ai/api - Types
 */
import type { z } from 'zod';
import type { SAMConfig, SAMContext, SAMMessage, BloomsAnalysis } from '@sam-ai/core';
export interface SAMApiRequest {
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
export interface SAMApiResponse {
    /** Response status code */
    status: number;
    /** Response body */
    body: unknown;
    /** Response headers */
    headers?: Record<string, string>;
}
export interface SAMApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    status: number;
}
export interface SAMHandlerContext {
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
export type SAMHandler = (request: SAMApiRequest, context: SAMHandlerContext) => Promise<SAMApiResponse>;
export interface SAMHandlerOptions {
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
export interface ChatRequest {
    /** User message */
    message: string;
    /** Conversation context */
    context?: Partial<SAMContext>;
    /** Conversation history */
    history?: SAMMessage[];
    /** Stream response */
    stream?: boolean;
}
export interface ChatResponse {
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
export interface AnalyzeRequest {
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
export interface AnalyzeResponse {
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
export interface GamificationRequest {
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
export interface GamificationResponse {
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
export interface ProfileRequest {
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
export interface ProfileResponse {
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
export interface RateLimitConfig {
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
export interface RateLimitInfo {
    /** Remaining requests in window */
    remaining: number;
    /** Total requests allowed */
    limit: number;
    /** Window reset time */
    resetTime: Date;
    /** Whether request is blocked */
    blocked: boolean;
}
export interface StreamChunk {
    /** Chunk type */
    type: 'text' | 'suggestion' | 'action' | 'done' | 'error';
    /** Chunk content */
    content?: string;
    /** Chunk data */
    data?: Record<string, unknown>;
}
export type StreamCallback = (chunk: StreamChunk) => void;
export interface RouteHandlerFactoryOptions {
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
export interface RouteHandlerFactory {
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
//# sourceMappingURL=types.d.ts.map