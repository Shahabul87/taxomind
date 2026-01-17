/**
 * @sam-ai/api - Validation Middleware
 */
import { z } from 'zod';
/**
 * Create error response for validation failures
 */
function createValidationErrorResponse(message, details) {
    return {
        status: 400,
        body: {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message,
                details,
            },
        },
        headers: {
            'Content-Type': 'application/json',
        },
    };
}
/**
 * Create validation middleware using a Zod schema
 */
export function createValidationMiddleware(schema) {
    return (handler) => {
        return async (request, context) => {
            try {
                // Validate request body
                const result = schema.safeParse(request.body);
                if (!result.success) {
                    const errors = result.error.errors.map((err) => ({
                        path: err.path.join('.'),
                        message: err.message,
                    }));
                    return createValidationErrorResponse('Validation failed', {
                        errors,
                    });
                }
                // Replace body with validated data
                const validatedRequest = {
                    ...request,
                    body: result.data,
                };
                return handler(validatedRequest, context);
            }
            catch (error) {
                console.error('[SAM Validation] Error:', error);
                return createValidationErrorResponse('Invalid request format');
            }
        };
    };
}
/**
 * Validate query parameters
 */
export function validateQuery(schema) {
    return (handler) => {
        return async (request, context) => {
            try {
                const result = schema.safeParse(request.query ?? {});
                if (!result.success) {
                    const errors = result.error.errors.map((err) => ({
                        path: err.path.join('.'),
                        message: err.message,
                    }));
                    return createValidationErrorResponse('Invalid query parameters', {
                        errors,
                    });
                }
                const validatedRequest = {
                    ...request,
                    query: result.data,
                };
                return handler(validatedRequest, context);
            }
            catch (error) {
                console.error('[SAM Query Validation] Error:', error);
                return createValidationErrorResponse('Invalid query format');
            }
        };
    };
}
/**
 * Compose multiple validation middlewares
 */
export function composeValidation(...validators) {
    return (handler) => {
        return validators.reduceRight((acc, validator) => validator(acc), handler);
    };
}
// ============================================================================
// PRE-BUILT VALIDATION SCHEMAS
// ============================================================================
/**
 * Chat request validation schema
 */
export const chatRequestSchema = z.object({
    message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
    context: z.record(z.unknown()).optional(),
    history: z
        .array(z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
        timestamp: z.string().or(z.date()).optional(),
    }))
        .optional(),
    stream: z.boolean().optional(),
});
/**
 * Analyze request validation schema
 */
export const analyzeRequestSchema = z.object({
    content: z.string().optional(),
    context: z.record(z.unknown()).optional(),
    type: z.enum(['blooms', 'content', 'assessment', 'full']).optional(),
    options: z
        .object({
        includeRecommendations: z.boolean().optional(),
        targetBloomsLevel: z.string().optional(),
    })
        .optional(),
});
/**
 * Gamification request validation schema
 */
export const gamificationRequestSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    action: z.enum(['get', 'update', 'award-badge', 'update-streak']),
    payload: z
        .object({
        badgeId: z.string().optional(),
        points: z.number().optional(),
        activity: z.string().optional(),
    })
        .optional(),
});
/**
 * Profile request validation schema
 */
export const profileRequestSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    action: z.enum(['get', 'update', 'get-learning-style', 'get-progress']),
    payload: z
        .object({
        preferences: z.record(z.unknown()).optional(),
        learningStyle: z.string().optional(),
    })
        .optional(),
});
