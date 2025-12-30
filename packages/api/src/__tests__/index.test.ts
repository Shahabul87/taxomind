/**
 * Index Exports Tests
 * Tests for @sam-ai/api package exports
 */

import { describe, it, expect, vi } from 'vitest';
import {
  // Factory exports
  createRouteHandlerFactory,
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,

  // Handler exports
  createChatHandler,
  createStreamingChatHandler,
  createAnalyzeHandler,
  analyzeBloomsLevel,
  createGamificationHandler,
  createProfileHandler,

  // Middleware exports
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
  VERSION,
} from '../index';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockConfig() {
  return {
    ai: {
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
    },
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
// FACTORY EXPORTS
// ============================================================================

describe('Factory Exports', () => {
  it('should export createRouteHandlerFactory', () => {
    expect(createRouteHandlerFactory).toBeDefined();
    expect(typeof createRouteHandlerFactory).toBe('function');
  });

  it('should export createErrorResponse', () => {
    expect(createErrorResponse).toBeDefined();
    expect(typeof createErrorResponse).toBe('function');

    const response = createErrorResponse(400, 'TEST', 'Test error');
    expect(response.status).toBe(400);
  });

  it('should export createSuccessResponse', () => {
    expect(createSuccessResponse).toBeDefined();
    expect(typeof createSuccessResponse).toBe('function');

    const response = createSuccessResponse({ test: true });
    expect(response.status).toBe(200);
  });

  it('should export generateRequestId', () => {
    expect(generateRequestId).toBeDefined();
    expect(typeof generateRequestId).toBe('function');

    const id = generateRequestId();
    expect(id.startsWith('req_')).toBe(true);
  });
});

// ============================================================================
// HANDLER EXPORTS
// ============================================================================

describe('Handler Exports', () => {
  it('should export createChatHandler', () => {
    expect(createChatHandler).toBeDefined();
    expect(typeof createChatHandler).toBe('function');
  });

  it('should export createStreamingChatHandler', () => {
    expect(createStreamingChatHandler).toBeDefined();
    expect(typeof createStreamingChatHandler).toBe('function');
  });

  it('should export createAnalyzeHandler', () => {
    expect(createAnalyzeHandler).toBeDefined();
    expect(typeof createAnalyzeHandler).toBe('function');
  });

  it('should export analyzeBloomsLevel', () => {
    expect(analyzeBloomsLevel).toBeDefined();
    expect(typeof analyzeBloomsLevel).toBe('function');
  });

  it('should export createGamificationHandler', () => {
    expect(createGamificationHandler).toBeDefined();
    expect(typeof createGamificationHandler).toBe('function');
  });

  it('should export createProfileHandler', () => {
    expect(createProfileHandler).toBeDefined();
    expect(typeof createProfileHandler).toBe('function');
  });
});

// ============================================================================
// RATE LIMIT EXPORTS
// ============================================================================

describe('Rate Limit Exports', () => {
  it('should export createRateLimiter', () => {
    expect(createRateLimiter).toBeDefined();
    expect(typeof createRateLimiter).toBe('function');
  });

  it('should export rateLimitPresets', () => {
    expect(rateLimitPresets).toBeDefined();
    expect(rateLimitPresets.standard).toBeDefined();
    expect(rateLimitPresets.strict).toBeDefined();
    expect(rateLimitPresets.ai).toBeDefined();
    expect(rateLimitPresets.lenient).toBeDefined();
  });

  it('should create rate limiter from presets', () => {
    const limiter = createRateLimiter(rateLimitPresets.standard);
    expect(limiter).toBeDefined();
    expect(limiter.check).toBeDefined();
    expect(limiter.reset).toBeDefined();
  });
});

// ============================================================================
// AUTH EXPORTS
// ============================================================================

describe('Auth Exports', () => {
  it('should export createAuthMiddleware', () => {
    expect(createAuthMiddleware).toBeDefined();
    expect(typeof createAuthMiddleware).toBe('function');
  });

  it('should export createTokenAuthenticator', () => {
    expect(createTokenAuthenticator).toBeDefined();
    expect(typeof createTokenAuthenticator).toBe('function');
  });

  it('should export composeAuthMiddleware', () => {
    expect(composeAuthMiddleware).toBeDefined();
    expect(typeof composeAuthMiddleware).toBe('function');
  });

  it('should export requireRoles', () => {
    expect(requireRoles).toBeDefined();
    expect(typeof requireRoles).toBe('function');
  });
});

// ============================================================================
// VALIDATION EXPORTS
// ============================================================================

describe('Validation Exports', () => {
  it('should export createValidationMiddleware', () => {
    expect(createValidationMiddleware).toBeDefined();
    expect(typeof createValidationMiddleware).toBe('function');
  });

  it('should export validateQuery', () => {
    expect(validateQuery).toBeDefined();
    expect(typeof validateQuery).toBe('function');
  });

  it('should export composeValidation', () => {
    expect(composeValidation).toBeDefined();
    expect(typeof composeValidation).toBe('function');
  });

  it('should export chatRequestSchema', () => {
    expect(chatRequestSchema).toBeDefined();
    expect(chatRequestSchema.parse).toBeDefined();
  });

  it('should export analyzeRequestSchema', () => {
    expect(analyzeRequestSchema).toBeDefined();
    expect(analyzeRequestSchema.parse).toBeDefined();
  });

  it('should export gamificationRequestSchema', () => {
    expect(gamificationRequestSchema).toBeDefined();
    expect(gamificationRequestSchema.parse).toBeDefined();
  });

  it('should export profileRequestSchema', () => {
    expect(profileRequestSchema).toBeDefined();
    expect(profileRequestSchema.parse).toBeDefined();
  });
});

// ============================================================================
// VERSION EXPORT
// ============================================================================

describe('Version Export', () => {
  it('should export VERSION constant', () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe('string');
  });

  it('should be semantic version format', () => {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    expect(VERSION).toMatch(semverRegex);
  });

  it('should be version 0.1.0', () => {
    expect(VERSION).toBe('0.1.0');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration', () => {
  it('should create factory and access handlers', () => {
    const factory = createRouteHandlerFactory({
      config: createMockConfig() as never,
    });

    expect(factory.handlers.chat).toBeDefined();
    expect(factory.handlers.analyze).toBeDefined();
    expect(factory.handlers.gamification).toBeDefined();
    expect(factory.handlers.profile).toBeDefined();
  });

  it('should create factory and access middleware', () => {
    const factory = createRouteHandlerFactory({
      config: createMockConfig() as never,
    });

    expect(factory.middleware.rateLimit).toBeDefined();
    expect(factory.middleware.auth).toBeDefined();
    expect(factory.middleware.validate).toBeDefined();
  });

  it('should compose validation and auth middleware', () => {
    const authMiddleware = createAuthMiddleware(async () => ({ id: 'user-1', role: 'admin' }));
    const validationMiddleware = createValidationMiddleware(chatRequestSchema);

    const composed = composeAuthMiddleware(authMiddleware);
    const composedValidation = composeValidation(validationMiddleware);

    expect(composed).toBeDefined();
    expect(composedValidation).toBeDefined();
  });

  it('should validate requests with schemas', () => {
    const validChat = chatRequestSchema.safeParse({
      message: 'Hello!',
    });
    expect(validChat.success).toBe(true);

    const validAnalyze = analyzeRequestSchema.safeParse({
      type: 'blooms',
    });
    expect(validAnalyze.success).toBe(true);

    const validGamification = gamificationRequestSchema.safeParse({
      userId: 'user-1',
      action: 'get',
    });
    expect(validGamification.success).toBe(true);

    const validProfile = profileRequestSchema.safeParse({
      userId: 'user-1',
      action: 'get',
    });
    expect(validProfile.success).toBe(true);
  });

  it('should create and use rate limiter', async () => {
    const limiter = createRateLimiter({
      maxRequests: 100,
      windowMs: 60000,
    });

    const result = await limiter.check({
      body: {},
      headers: { 'x-forwarded-for': '127.0.0.1' },
      method: 'GET',
      url: '/test',
    });

    expect(result.blocked).toBe(false);
    expect(result.remaining).toBe(99);
    expect(result.limit).toBe(100);
  });

  it('should use requireRoles middleware', () => {
    const middleware = requireRoles('admin', 'moderator');
    expect(typeof middleware).toBe('function');
  });
});
