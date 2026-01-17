/**
 * @sam-ai/api - Validation Middleware
 */
import type { SAMHandler } from '../types';
import { z } from 'zod';
/**
 * Create validation middleware using a Zod schema
 */
export declare function createValidationMiddleware<T>(schema: z.ZodSchema<T>): (handler: SAMHandler) => SAMHandler;
/**
 * Validate query parameters
 */
export declare function validateQuery<T>(schema: z.ZodSchema<T>): (handler: SAMHandler) => SAMHandler;
/**
 * Compose multiple validation middlewares
 */
export declare function composeValidation(...validators: Array<(handler: SAMHandler) => SAMHandler>): (handler: SAMHandler) => SAMHandler;
/**
 * Chat request validation schema
 */
export declare const chatRequestSchema: z.ZodObject<{
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
export declare const analyzeRequestSchema: z.ZodObject<{
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
export declare const gamificationRequestSchema: z.ZodObject<{
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
export declare const profileRequestSchema: z.ZodObject<{
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
export type ChatRequestData = z.infer<typeof chatRequestSchema>;
export type AnalyzeRequestData = z.infer<typeof analyzeRequestSchema>;
export type GamificationRequestData = z.infer<typeof gamificationRequestSchema>;
export type ProfileRequestData = z.infer<typeof profileRequestSchema>;
//# sourceMappingURL=validation.d.ts.map