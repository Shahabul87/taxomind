/**
 * Route Handler Factory Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createRouteHandlerFactory,
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,
} from '../utils/factory';
import type { SAMApiRequest, SAMHandler, RateLimitConfig } from '../types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createMockRequest(overrides?: Partial<SAMApiRequest>): SAMApiRequest {
  return {
    body: {},
    headers: {},
    method: 'POST',
    url: '/api/test',
    ...overrides,
  };
}

function createMockAIAdapter() {
  return {
    name: 'mock-adapter',
    version: '1.0.0',
    chat: vi.fn().mockResolvedValue({
      content: 'Mock response',
      model: 'mock',
      usage: { inputTokens: 10, outputTokens: 20 },
      finishReason: 'stop' as const,
    }),
    isConfigured: () => true,
    getModel: () => 'mock-model',
  };
}

function createMockConfig() {
  return {
    ai: createMockAIAdapter(),
    features: {
      gamification: true,
      formSync: true,
      autoContext: true,
      emotionDetection: true,
      learningStyleDetection: true,
      streaming: true,
      analytics: true,
    },
    model: {
      name: 'mock-model',
      temperature: 0.7,
      maxTokens: 4000,
    },
    engine: {
      timeout: 30000,
      retries: 2,
      concurrency: 3,
      cacheEnabled: false,
      cacheTTL: 300,
    },
    maxConversationHistory: 50,
  };
}

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('generateRequestId', () => {
  it('should generate unique request IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).not.toBe(id2);
  });

  it('should start with req_ prefix', () => {
    const id = generateRequestId();

    expect(id.startsWith('req_')).toBe(true);
  });

  it('should contain timestamp', () => {
    const before = Date.now();
    const id = generateRequestId();
    const after = Date.now();

    const parts = id.split('_');
    const timestamp = parseInt(parts[1], 10);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('should have random suffix', () => {
    const id = generateRequestId();
    const parts = id.split('_');

    expect(parts[2]).toBeDefined();
    expect(parts[2].length).toBe(7);
  });
});

describe('createErrorResponse', () => {
  it('should create error response with correct structure', () => {
    const response = createErrorResponse(400, 'BAD_REQUEST', 'Invalid input');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid input',
      },
    });
    expect(response.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('should include details when provided', () => {
    const response = createErrorResponse(400, 'VALIDATION_ERROR', 'Invalid input', {
      field: 'email',
      reason: 'Invalid format',
    });

    expect((response.body as { error: { details: unknown } }).error.details).toEqual({
      field: 'email',
      reason: 'Invalid format',
    });
  });

  it('should handle different status codes', () => {
    expect(createErrorResponse(401, 'UNAUTHORIZED', 'Not authenticated').status).toBe(401);
    expect(createErrorResponse(403, 'FORBIDDEN', 'Access denied').status).toBe(403);
    expect(createErrorResponse(404, 'NOT_FOUND', 'Resource not found').status).toBe(404);
    expect(createErrorResponse(500, 'INTERNAL_ERROR', 'Server error').status).toBe(500);
  });
});

describe('createSuccessResponse', () => {
  it('should create success response with correct structure', () => {
    const data = { user: { id: '1', name: 'John' } };
    const response = createSuccessResponse(data);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data,
    });
    expect(response.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('should accept custom status code', () => {
    const response = createSuccessResponse({ created: true }, 201);

    expect(response.status).toBe(201);
  });

  it('should handle various data types', () => {
    expect(createSuccessResponse([1, 2, 3]).body).toEqual({
      success: true,
      data: [1, 2, 3],
    });

    expect(createSuccessResponse('string data').body).toEqual({
      success: true,
      data: 'string data',
    });

    expect(createSuccessResponse(null).body).toEqual({
      success: true,
      data: null,
    });
  });
});

// ============================================================================
// createRouteHandlerFactory TESTS
// ============================================================================

describe('createRouteHandlerFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create factory with handlers', () => {
    const factory = createRouteHandlerFactory({
      config: createMockConfig() as never,
    });

    expect(factory.handlers).toBeDefined();
    expect(factory.handlers.chat).toBeDefined();
    expect(factory.handlers.analyze).toBeDefined();
    expect(factory.handlers.gamification).toBeDefined();
    expect(factory.handlers.profile).toBeDefined();
  });

  it('should create factory with middleware', () => {
    const factory = createRouteHandlerFactory({
      config: createMockConfig() as never,
    });

    expect(factory.middleware).toBeDefined();
    expect(factory.middleware.rateLimit).toBeDefined();
    expect(factory.middleware.auth).toBeDefined();
    expect(factory.middleware.validate).toBeDefined();
  });

  it('should create factory with createHandler function', () => {
    const factory = createRouteHandlerFactory({
      config: createMockConfig() as never,
    });

    expect(factory.createHandler).toBeDefined();
    expect(typeof factory.createHandler).toBe('function');
  });

  describe('createHandler', () => {
    it('should wrap handler with error handling', async () => {
      const factory = createRouteHandlerFactory({
        config: createMockConfig() as never,
      });

      const errorHandler: SAMHandler = vi.fn().mockRejectedValue(new Error('Test error'));
      const wrappedHandler = factory.createHandler(errorHandler);

      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(500);
      expect((response.body as { error: { code: string } }).error.code).toBe('INTERNAL_ERROR');
    });

    it('should call onRequest callback', async () => {
      const onRequest = vi.fn();
      const factory = createRouteHandlerFactory({
        config: createMockConfig() as never,
        onRequest,
      });

      const handler: SAMHandler = vi.fn().mockResolvedValue({
        status: 200,
        body: { success: true },
      });
      const wrappedHandler = factory.createHandler(handler);

      const request = createMockRequest();
      await wrappedHandler(request);

      expect(onRequest).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          requestId: expect.stringMatching(/^req_/),
          timestamp: expect.any(Date),
        })
      );
    });

    it('should call onResponse callback', async () => {
      const onResponse = vi.fn();
      const factory = createRouteHandlerFactory({
        config: createMockConfig() as never,
        onResponse,
      });

      const response = { status: 200, body: { success: true } };
      const handler: SAMHandler = vi.fn().mockResolvedValue(response);
      const wrappedHandler = factory.createHandler(handler);

      const request = createMockRequest();
      await wrappedHandler(request);

      expect(onResponse).toHaveBeenCalledWith(
        response,
        expect.objectContaining({ requestId: expect.stringMatching(/^req_/) })
      );
    });

    it('should use custom error handler', async () => {
      const customResponse = { status: 500, body: { custom: 'error' } };
      const onError = vi.fn().mockReturnValue(customResponse);
      const factory = createRouteHandlerFactory({
        config: createMockConfig() as never,
        onError,
      });

      const error = new Error('Test error');
      const handler: SAMHandler = vi.fn().mockRejectedValue(error);
      const wrappedHandler = factory.createHandler(handler);

      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(onError).toHaveBeenCalledWith(error, request);
      expect(response).toBe(customResponse);
    });

    it('should handle authentication when requireAuth is true', async () => {
      const authenticate = vi.fn().mockResolvedValue(null);
      const factory = createRouteHandlerFactory({
        config: createMockConfig() as never,
        authenticate,
      });

      const handler: SAMHandler = vi.fn().mockResolvedValue({
        status: 200,
        body: { success: true },
      });
      const wrappedHandler = factory.createHandler(handler, { requireAuth: true });

      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should add user to context when authenticated', async () => {
      const user = { id: 'user-1', role: 'admin' };
      const authenticate = vi.fn().mockResolvedValue(user);
      const factory = createRouteHandlerFactory({
        config: createMockConfig() as never,
        authenticate,
      });

      const handler: SAMHandler = vi.fn().mockResolvedValue({
        status: 200,
        body: { success: true },
      });
      const wrappedHandler = factory.createHandler(handler);

      const request = createMockRequest();
      await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({ user })
      );
    });

    it('should check required roles', async () => {
      const user = { id: 'user-1', role: 'user' };
      const authenticate = vi.fn().mockResolvedValue(user);
      const factory = createRouteHandlerFactory({
        config: createMockConfig() as never,
        authenticate,
      });

      const handler: SAMHandler = vi.fn().mockResolvedValue({
        status: 200,
        body: { success: true },
      });
      const wrappedHandler = factory.createHandler(handler, {
        requireAuth: true,
        requiredRoles: ['admin'],
      });

      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should apply request validation', async () => {
      const factory = createRouteHandlerFactory({
        config: createMockConfig() as never,
      });

      const handler: SAMHandler = vi.fn().mockResolvedValue({
        status: 200,
        body: { success: true },
      });
      const wrappedHandler = factory.createHandler(handler, {
        validateRequest: (body) => typeof body === 'object' && body !== null && 'message' in body,
      });

      const invalidRequest = createMockRequest({ body: {} });
      const response = await wrappedHandler(invalidRequest);

      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should apply default rate limit', async () => {
      const defaultRateLimit: RateLimitConfig = {
        maxRequests: 2,
        windowMs: 60000,
      };
      const factory = createRouteHandlerFactory({
        config: createMockConfig() as never,
        defaultRateLimit,
      });

      const handler: SAMHandler = vi.fn().mockResolvedValue({
        status: 200,
        body: { success: true },
      });
      const wrappedHandler = factory.createHandler(handler);

      const request = createMockRequest();

      await wrappedHandler(request);
      await wrappedHandler(request);
      const response = await wrappedHandler(request);

      expect(response.status).toBe(429);
      expect((response.body as { error: { code: string } }).error.code).toBe('RATE_LIMITED');
    });

    it('should not apply rate limit when no defaultRateLimit is set', async () => {
      const factory = createRouteHandlerFactory({
        config: createMockConfig() as never,
        // No defaultRateLimit set
      });

      const handler: SAMHandler = vi.fn().mockResolvedValue({
        status: 200,
        body: { success: true },
      });
      const wrappedHandler = factory.createHandler(handler);

      const request = createMockRequest();

      // Should not be rate limited even after many requests
      await wrappedHandler(request);
      await wrappedHandler(request);
      const response = await wrappedHandler(request);

      expect(response.status).toBe(200);
    });
  });

  describe('middleware factories', () => {
    it('should create rate limit middleware', async () => {
      const factory = createRouteHandlerFactory({
        config: createMockConfig() as never,
      });

      const middleware = factory.middleware.rateLimit({
        maxRequests: 1,
        windowMs: 60000,
      });

      const handler: SAMHandler = vi.fn().mockResolvedValue({
        status: 200,
        body: { success: true },
      });

      const wrappedHandler = middleware(handler);

      const request = createMockRequest();
      const context = {
        config: createMockConfig() as never,
        requestId: 'test',
        timestamp: new Date(),
      };

      await wrappedHandler(request, context);
      const response = await wrappedHandler(request, context);

      expect(response.status).toBe(429);
    });

    it('should create auth middleware', async () => {
      const authenticate = vi.fn().mockResolvedValue(null);
      const factory = createRouteHandlerFactory({
        config: createMockConfig() as never,
        authenticate,
      });

      const middleware = factory.middleware.auth({ requiredRoles: ['admin'] });

      const handler: SAMHandler = vi.fn().mockResolvedValue({
        status: 200,
        body: { success: true },
      });

      const wrappedHandler = middleware(handler);

      const request = createMockRequest();
      const context = {
        config: createMockConfig() as never,
        requestId: 'test',
        timestamp: new Date(),
      };

      const response = await wrappedHandler(request, context);

      expect(response.status).toBe(401);
    });
  });
});
