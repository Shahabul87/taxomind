/**
 * Validation Middleware Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { createValidationMiddleware, validateQuery, composeValidation, chatRequestSchema, analyzeRequestSchema, gamificationRequestSchema, profileRequestSchema, } from '../middleware/validation';
// ============================================================================
// TEST FIXTURES
// ============================================================================
function createMockRequest(overrides) {
    return {
        body: {},
        headers: {},
        method: 'POST',
        url: '/api/test',
        ...overrides,
    };
}
function createMockContext() {
    return {
        config: {},
        requestId: 'test-request-id',
        timestamp: new Date(),
    };
}
function createMockHandler() {
    return vi.fn().mockResolvedValue({
        status: 200,
        body: { success: true },
        headers: { 'Content-Type': 'application/json' },
    });
}
// ============================================================================
// createValidationMiddleware TESTS
// ============================================================================
describe('createValidationMiddleware', () => {
    const testSchema = z.object({
        name: z.string().min(1),
        age: z.number().min(0),
    });
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('should pass valid request body to handler', async () => {
        const handler = createMockHandler();
        const middleware = createValidationMiddleware(testSchema);
        const wrappedHandler = middleware(handler);
        const request = createMockRequest({
            body: { name: 'John', age: 25 },
        });
        const context = createMockContext();
        await wrappedHandler(request, context);
        expect(handler).toHaveBeenCalledWith(expect.objectContaining({ body: { name: 'John', age: 25 } }), context);
    });
    it('should return 400 for invalid request body', async () => {
        const handler = createMockHandler();
        const middleware = createValidationMiddleware(testSchema);
        const wrappedHandler = middleware(handler);
        const request = createMockRequest({
            body: { name: '', age: -5 },
        });
        const context = createMockContext();
        const response = await wrappedHandler(request, context);
        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(handler).not.toHaveBeenCalled();
    });
    it('should include validation error details', async () => {
        const handler = createMockHandler();
        const middleware = createValidationMiddleware(testSchema);
        const wrappedHandler = middleware(handler);
        const request = createMockRequest({
            body: { name: 123, age: 'not a number' },
        });
        const context = createMockContext();
        const response = await wrappedHandler(request, context);
        const body = response.body;
        expect(body.error.details.errors).toBeDefined();
        expect(body.error.details.errors.length).toBeGreaterThan(0);
    });
    it('should handle missing fields', async () => {
        const handler = createMockHandler();
        const middleware = createValidationMiddleware(testSchema);
        const wrappedHandler = middleware(handler);
        const request = createMockRequest({
            body: {},
        });
        const context = createMockContext();
        const response = await wrappedHandler(request, context);
        expect(response.status).toBe(400);
    });
    it('should handle null/undefined body', async () => {
        const handler = createMockHandler();
        const middleware = createValidationMiddleware(testSchema);
        const wrappedHandler = middleware(handler);
        const request = createMockRequest({
            body: null,
        });
        const context = createMockContext();
        const response = await wrappedHandler(request, context);
        expect(response.status).toBe(400);
    });
    it('should handle optional fields', async () => {
        const optionalSchema = z.object({
            required: z.string(),
            optional: z.string().optional(),
        });
        const handler = createMockHandler();
        const middleware = createValidationMiddleware(optionalSchema);
        const wrappedHandler = middleware(handler);
        const request = createMockRequest({
            body: { required: 'value' },
        });
        const context = createMockContext();
        await wrappedHandler(request, context);
        expect(handler).toHaveBeenCalled();
    });
    it('should transform data if schema includes transformations', async () => {
        const transformSchema = z.object({
            email: z.string().email().toLowerCase(),
        });
        const handler = createMockHandler();
        const middleware = createValidationMiddleware(transformSchema);
        const wrappedHandler = middleware(handler);
        const request = createMockRequest({
            body: { email: 'TEST@EXAMPLE.COM' },
        });
        const context = createMockContext();
        await wrappedHandler(request, context);
        expect(handler).toHaveBeenCalledWith(expect.objectContaining({ body: { email: 'test@example.com' } }), context);
    });
});
// ============================================================================
// validateQuery TESTS
// ============================================================================
describe('validateQuery', () => {
    const querySchema = z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
    });
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('should validate query parameters', async () => {
        const handler = createMockHandler();
        const middleware = validateQuery(querySchema);
        const wrappedHandler = middleware(handler);
        const request = createMockRequest({
            query: { page: '1', limit: '10' },
        });
        const context = createMockContext();
        await wrappedHandler(request, context);
        expect(handler).toHaveBeenCalled();
    });
    it('should return 400 for invalid query parameters', async () => {
        const strictSchema = z.object({
            page: z.string().regex(/^\d+$/),
        });
        const handler = createMockHandler();
        const middleware = validateQuery(strictSchema);
        const wrappedHandler = middleware(handler);
        const request = createMockRequest({
            query: { page: 'invalid' },
        });
        const context = createMockContext();
        const response = await wrappedHandler(request, context);
        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('query');
    });
    it('should handle missing query parameters', async () => {
        const handler = createMockHandler();
        const middleware = validateQuery(querySchema);
        const wrappedHandler = middleware(handler);
        const request = createMockRequest({
            query: undefined,
        });
        const context = createMockContext();
        await wrappedHandler(request, context);
        expect(handler).toHaveBeenCalled();
    });
});
// ============================================================================
// composeValidation TESTS
// ============================================================================
describe('composeValidation', () => {
    it('should compose multiple validators', async () => {
        const validator1 = vi.fn((handler) => handler);
        const validator2 = vi.fn((handler) => handler);
        const composed = composeValidation(validator1, validator2);
        const handler = createMockHandler();
        composed(handler);
        expect(validator1).toHaveBeenCalled();
        expect(validator2).toHaveBeenCalled();
    });
    it('should execute validators in correct order (right to left)', async () => {
        const order = [];
        const validator1 = (handler) => {
            order.push(1);
            return handler;
        };
        const validator2 = (handler) => {
            order.push(2);
            return handler;
        };
        const composed = composeValidation(validator1, validator2);
        const handler = createMockHandler();
        composed(handler);
        expect(order).toEqual([2, 1]);
    });
});
// ============================================================================
// PRE-BUILT SCHEMA TESTS
// ============================================================================
describe('chatRequestSchema', () => {
    it('should validate valid chat request', () => {
        const validRequest = {
            message: 'Hello, SAM!',
            context: { courseId: '123' },
            history: [
                { id: 'msg-1', role: 'user', content: 'Hi' },
                { id: 'msg-2', role: 'assistant', content: 'Hello!' },
            ],
            stream: false,
        };
        const result = chatRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
    });
    it('should require message field', () => {
        const invalidRequest = {
            context: {},
        };
        const result = chatRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
    });
    it('should enforce message length limits', () => {
        const tooLong = {
            message: 'a'.repeat(10001),
        };
        const result = chatRequestSchema.safeParse(tooLong);
        expect(result.success).toBe(false);
    });
    it('should allow minimal message', () => {
        const minimal = {
            message: 'Hi',
        };
        const result = chatRequestSchema.safeParse(minimal);
        expect(result.success).toBe(true);
    });
    it('should reject empty message', () => {
        const empty = {
            message: '',
        };
        const result = chatRequestSchema.safeParse(empty);
        expect(result.success).toBe(false);
    });
});
describe('analyzeRequestSchema', () => {
    it('should validate valid analyze request', () => {
        const validRequest = {
            content: 'What is photosynthesis?',
            type: 'blooms',
            options: {
                includeRecommendations: true,
                targetBloomsLevel: 'ANALYZE',
            },
        };
        const result = analyzeRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
    });
    it('should accept all analysis types', () => {
        const types = ['blooms', 'content', 'assessment', 'full'];
        for (const type of types) {
            const request = { type };
            const result = analyzeRequestSchema.safeParse(request);
            expect(result.success).toBe(true);
        }
    });
    it('should reject invalid analysis type', () => {
        const invalidRequest = {
            type: 'invalid',
        };
        const result = analyzeRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
    });
    it('should allow empty request', () => {
        const result = analyzeRequestSchema.safeParse({});
        expect(result.success).toBe(true);
    });
});
describe('gamificationRequestSchema', () => {
    it('should validate valid gamification request', () => {
        const validRequest = {
            userId: 'user-123',
            action: 'get',
        };
        const result = gamificationRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
    });
    it('should require userId', () => {
        const invalidRequest = {
            action: 'get',
        };
        const result = gamificationRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
    });
    it('should accept all action types', () => {
        const actions = ['get', 'update', 'award-badge', 'update-streak'];
        for (const action of actions) {
            const request = { userId: 'user-1', action };
            const result = gamificationRequestSchema.safeParse(request);
            expect(result.success).toBe(true);
        }
    });
    it('should validate payload fields', () => {
        const validRequest = {
            userId: 'user-123',
            action: 'award-badge',
            payload: {
                badgeId: 'badge-1',
                points: 100,
                activity: 'completed-quiz',
            },
        };
        const result = gamificationRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
    });
});
describe('profileRequestSchema', () => {
    it('should validate valid profile request', () => {
        const validRequest = {
            userId: 'user-123',
            action: 'get',
        };
        const result = profileRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
    });
    it('should require userId', () => {
        const invalidRequest = {
            action: 'get',
        };
        const result = profileRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
    });
    it('should accept all action types', () => {
        const actions = ['get', 'update', 'get-learning-style', 'get-progress'];
        for (const action of actions) {
            const request = { userId: 'user-1', action };
            const result = profileRequestSchema.safeParse(request);
            expect(result.success).toBe(true);
        }
    });
    it('should validate payload fields', () => {
        const validRequest = {
            userId: 'user-123',
            action: 'update',
            payload: {
                preferences: { theme: 'dark' },
                learningStyle: 'visual',
            },
        };
        const result = profileRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
    });
    it('should reject empty userId', () => {
        const invalidRequest = {
            userId: '',
            action: 'get',
        };
        const result = profileRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
    });
});
