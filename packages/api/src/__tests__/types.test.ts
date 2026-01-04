/**
 * Types Tests
 * Tests for type definitions and interfaces
 */

import { describe, it, expect } from 'vitest';
import type {
  SAMApiRequest,
  SAMApiResponse,
  SAMApiError,
  SAMHandlerContext,
  SAMHandler,
  SAMHandlerOptions,
  ChatRequest,
  ChatResponse,
  AnalyzeRequest,
  AnalyzeResponse,
  GamificationRequest,
  GamificationResponse,
  ProfileRequest,
  ProfileResponse,
  RateLimitConfig,
  RateLimitInfo,
  StreamChunk,
  StreamCallback,
  RouteHandlerFactoryOptions,
  RouteHandlerFactory,
} from '../types';

// ============================================================================
// TYPE TESTS
// These tests verify type interfaces work correctly at runtime
// ============================================================================

describe('SAMApiRequest', () => {
  it('should have required properties', () => {
    const request: SAMApiRequest = {
      body: { message: 'Hello' },
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      url: '/api/chat',
    };

    expect(request.body).toBeDefined();
    expect(request.headers).toBeDefined();
    expect(request.method).toBe('POST');
    expect(request.url).toBe('/api/chat');
  });

  it('should allow optional query parameters', () => {
    const request: SAMApiRequest = {
      body: {},
      headers: {},
      method: 'GET',
      url: '/api/test',
      query: { page: '1', limit: '10' },
    };

    expect(request.query).toEqual({ page: '1', limit: '10' });
  });

  it('should handle array headers', () => {
    const request: SAMApiRequest = {
      body: {},
      headers: { 'Accept': ['application/json', 'text/plain'] },
      method: 'GET',
      url: '/api/test',
    };

    expect(Array.isArray(request.headers['Accept'])).toBe(true);
  });
});

describe('SAMApiResponse', () => {
  it('should have required properties', () => {
    const response: SAMApiResponse = {
      status: 200,
      body: { success: true, data: {} },
    };

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  it('should allow optional headers', () => {
    const response: SAMApiResponse = {
      status: 200,
      body: { success: true },
      headers: { 'Content-Type': 'application/json' },
    };

    expect(response.headers).toEqual({ 'Content-Type': 'application/json' });
  });
});

describe('SAMApiError', () => {
  it('should have required error fields', () => {
    const error: SAMApiError = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      status: 400,
    };

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
    expect(error.status).toBe(400);
  });

  it('should allow optional details', () => {
    const error: SAMApiError = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      status: 400,
      details: { field: 'email', reason: 'Invalid format' },
    };

    expect(error.details).toEqual({ field: 'email', reason: 'Invalid format' });
  });
});

describe('SAMHandlerContext', () => {
  it('should have required context fields', () => {
    const context: SAMHandlerContext = {
      config: {} as SAMHandlerContext['config'],
      requestId: 'req-123',
      timestamp: new Date(),
    };

    expect(context.config).toBeDefined();
    expect(context.requestId).toBe('req-123');
    expect(context.timestamp).toBeInstanceOf(Date);
  });

  it('should allow optional user', () => {
    const context: SAMHandlerContext = {
      config: {} as SAMHandlerContext['config'],
      requestId: 'req-123',
      timestamp: new Date(),
      user: { id: 'user-1', role: 'admin', name: 'Admin User' },
    };

    expect(context.user).toBeDefined();
    expect(context.user?.id).toBe('user-1');
    expect(context.user?.role).toBe('admin');
  });
});

describe('SAMHandler', () => {
  it('should be a function type', () => {
    const handler: SAMHandler = async (request, context) => {
      return {
        status: 200,
        body: { success: true, message: request.url, id: context.requestId },
      };
    };

    expect(typeof handler).toBe('function');
  });
});

describe('SAMHandlerOptions', () => {
  it('should have optional configuration', () => {
    const options: SAMHandlerOptions = {
      rateLimit: { maxRequests: 100, windowMs: 60000 },
      requireAuth: true,
      requiredRoles: ['admin'],
      streaming: false,
    };

    expect(options.rateLimit).toBeDefined();
    expect(options.requireAuth).toBe(true);
    expect(options.requiredRoles).toEqual(['admin']);
  });

  it('should allow custom validation function', () => {
    const options: SAMHandlerOptions = {
      validateRequest: (body) => typeof body === 'object' && body !== null,
    };

    expect(options.validateRequest?.({ test: true })).toBe(true);
    expect(options.validateRequest?.(null)).toBe(false);
  });
});

describe('ChatRequest', () => {
  it('should have required message field', () => {
    const request: ChatRequest = {
      message: 'Hello, SAM!',
    };

    expect(request.message).toBe('Hello, SAM!');
  });

  it('should allow optional context and history', () => {
    const request: ChatRequest = {
      message: 'Hello',
      context: { page: { type: 'dashboard', path: '/dashboard', capabilities: [], breadcrumb: [] } },
      history: [
        { id: '1', role: 'user', content: 'Hi', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'Hello!', timestamp: new Date() },
      ],
      stream: true,
    };

    expect(request.context).toBeDefined();
    expect(request.history?.length).toBe(2);
    expect(request.stream).toBe(true);
  });
});

describe('ChatResponse', () => {
  it('should have required response fields', () => {
    const response: ChatResponse = {
      message: 'Hello! How can I help you today?',
      conversationId: 'conv-123',
      suggestions: [],
      actions: [],
    };

    expect(response.message).toBeDefined();
    expect(response.conversationId).toBe('conv-123');
    expect(response.suggestions).toEqual([]);
    expect(response.actions).toEqual([]);
  });

  it('should allow optional blooms analysis', () => {
    const response: ChatResponse = {
      message: 'Response',
      conversationId: 'conv-123',
      suggestions: [],
      actions: [],
      bloomsAnalysis: {
        dominantLevel: 'ANALYZE',
        distribution: {
          REMEMBER: 0.1,
          UNDERSTAND: 0.2,
          APPLY: 0.2,
          ANALYZE: 0.3,
          EVALUATE: 0.1,
          CREATE: 0.1,
        },
        cognitiveDepth: 65,
        balance: 'well-balanced',
        gaps: [],
        recommendations: [],
        confidence: 0.9,
        method: 'ai',
      },
    };

    expect(response.bloomsAnalysis?.dominantLevel).toBe('ANALYZE');
  });
});

describe('AnalyzeRequest', () => {
  it('should allow optional fields', () => {
    const request: AnalyzeRequest = {};
    expect(request.content).toBeUndefined();
    expect(request.type).toBeUndefined();
  });

  it('should accept analysis types', () => {
    const types: AnalyzeRequest['type'][] = ['blooms', 'content', 'assessment', 'full'];

    types.forEach((type) => {
      const request: AnalyzeRequest = { type };
      expect(request.type).toBe(type);
    });
  });
});

describe('AnalyzeResponse', () => {
  it('should have required response fields', () => {
    const response: AnalyzeResponse = {
      analysis: {},
      recommendations: [],
      metadata: {
        processingTime: 150,
        enginesUsed: ['blooms', 'content'],
      },
    };

    expect(response.analysis).toBeDefined();
    expect(response.recommendations).toEqual([]);
    expect(response.metadata.processingTime).toBe(150);
  });
});

describe('GamificationRequest', () => {
  it('should have required fields', () => {
    const request: GamificationRequest = {
      userId: 'user-123',
      action: 'get',
    };

    expect(request.userId).toBe('user-123');
    expect(request.action).toBe('get');
  });

  it('should accept all action types', () => {
    const actions: GamificationRequest['action'][] = ['get', 'update', 'award-badge', 'update-streak'];

    actions.forEach((action) => {
      const request: GamificationRequest = { userId: 'user-1', action };
      expect(request.action).toBe(action);
    });
  });
});

describe('GamificationResponse', () => {
  it('should have required data structure', () => {
    const response: GamificationResponse = {
      data: {
        points: 100,
        level: 5,
        badges: [{ id: 'badge-1', name: 'First Steps', earnedAt: new Date() }],
        streak: {
          current: 7,
          longest: 14,
          lastActivity: new Date(),
        },
        achievements: [],
      },
    };

    expect(response.data.points).toBe(100);
    expect(response.data.level).toBe(5);
    expect(response.data.streak.current).toBe(7);
  });
});

describe('ProfileRequest', () => {
  it('should have required fields', () => {
    const request: ProfileRequest = {
      userId: 'user-123',
      action: 'get',
    };

    expect(request.userId).toBe('user-123');
    expect(request.action).toBe('get');
  });

  it('should accept all action types', () => {
    const actions: ProfileRequest['action'][] = ['get', 'update', 'get-learning-style', 'get-progress'];

    actions.forEach((action) => {
      const request: ProfileRequest = { userId: 'user-1', action };
      expect(request.action).toBe(action);
    });
  });
});

describe('ProfileResponse', () => {
  it('should have required profile structure', () => {
    const response: ProfileResponse = {
      profile: {
        id: 'user-123',
        name: 'John Doe',
        role: 'student',
        preferences: {
          learningStyle: 'visual',
          tone: 'friendly',
          difficulty: 'medium',
        },
        progress: {
          coursesCompleted: 5,
          totalTimeSpent: 3600,
          averageScore: 85,
        },
      },
    };

    expect(response.profile.id).toBe('user-123');
    expect(response.profile.preferences.learningStyle).toBe('visual');
    expect(response.profile.progress.coursesCompleted).toBe(5);
  });

  it('should allow optional analytics', () => {
    const response: ProfileResponse = {
      profile: {
        id: 'user-123',
        name: 'John',
        role: 'student',
        preferences: {},
        progress: {
          coursesCompleted: 0,
          totalTimeSpent: 0,
          averageScore: 0,
        },
      },
      analytics: {
        strongAreas: ['Math', 'Science'],
        weakAreas: ['History'],
        recommendations: ['Focus on reading comprehension'],
      },
    };

    expect(response.analytics?.strongAreas).toContain('Math');
  });
});

describe('RateLimitConfig', () => {
  it('should have required fields', () => {
    const config: RateLimitConfig = {
      maxRequests: 100,
      windowMs: 60000,
    };

    expect(config.maxRequests).toBe(100);
    expect(config.windowMs).toBe(60000);
  });

  it('should allow optional fields', () => {
    const config: RateLimitConfig = {
      maxRequests: 100,
      windowMs: 60000,
      keyGenerator: (req) => req.headers['x-user-id'] as string,
      skip: (req) => req.method === 'OPTIONS',
      message: 'Rate limit exceeded',
    };

    expect(config.keyGenerator).toBeDefined();
    expect(config.skip).toBeDefined();
    expect(config.message).toBe('Rate limit exceeded');
  });
});

describe('RateLimitInfo', () => {
  it('should have required fields', () => {
    const info: RateLimitInfo = {
      remaining: 95,
      limit: 100,
      resetTime: new Date(),
      blocked: false,
    };

    expect(info.remaining).toBe(95);
    expect(info.limit).toBe(100);
    expect(info.blocked).toBe(false);
  });
});

describe('StreamChunk', () => {
  it('should have valid chunk types', () => {
    const chunks: StreamChunk[] = [
      { type: 'text', content: 'Hello' },
      { type: 'suggestion', data: { id: '1', text: 'Follow up' } },
      { type: 'action', data: { id: '1', type: 'navigate' } },
      { type: 'done' },
      { type: 'error', content: 'Something went wrong' },
    ];

    expect(chunks.every((c) => ['text', 'suggestion', 'action', 'done', 'error'].includes(c.type))).toBe(true);
  });
});

describe('StreamCallback', () => {
  it('should be a function type', () => {
    const callback: StreamCallback = (chunk) => {
      console.log(chunk.type);
    };

    expect(typeof callback).toBe('function');
  });
});

describe('RouteHandlerFactoryOptions', () => {
  it('should have required config', () => {
    const options: RouteHandlerFactoryOptions = {
      config: {} as RouteHandlerFactoryOptions['config'],
    };

    expect(options.config).toBeDefined();
  });

  it('should allow optional callbacks', () => {
    const options: RouteHandlerFactoryOptions = {
      config: {} as RouteHandlerFactoryOptions['config'],
      basePath: '/api',
      authenticate: async () => null,
      onError: () => ({ status: 500, body: {} }),
      onRequest: () => {},
      onResponse: () => {},
    };

    expect(options.basePath).toBe('/api');
    expect(options.authenticate).toBeDefined();
    expect(options.onError).toBeDefined();
  });
});

describe('RouteHandlerFactory', () => {
  it('should have required properties', () => {
    const factory: RouteHandlerFactory = {
      createHandler: () => async () => ({ status: 200, body: {} }),
      handlers: {
        chat: async () => ({ status: 200, body: {} }),
        analyze: async () => ({ status: 200, body: {} }),
        gamification: async () => ({ status: 200, body: {} }),
        profile: async () => ({ status: 200, body: {} }),
      },
      middleware: {
        rateLimit: () => (handler) => handler,
        auth: () => (handler) => handler,
        validate: () => (handler) => handler,
      },
    };

    expect(factory.createHandler).toBeDefined();
    expect(factory.handlers.chat).toBeDefined();
    expect(factory.middleware.rateLimit).toBeDefined();
  });
});
