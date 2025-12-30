/**
 * Types Tests
 * Tests for SAM Engine type definitions and interfaces
 */

import { describe, it, expect } from 'vitest';
import type {
  User,
  SAMContext,
  SAMEngineConfig,
  SAMLogger,
  SAMStorage,
  Message,
  Conversation,
  SAMResponse,
  SAMAction,
  ContextInsights,
  AnalysisResult,
  MarketAnalysis,
  BloomsAnalysis,
  CourseAnalysis,
  SAMPlugin,
  SAMEngine,
  SAMEvent,
  SAMEventType,
  SAMEventHandler,
  ValidationResult,
  FeatureFlags,
  IntegrationConfig,
  SAMTypes,
} from '../types';

// ============================================================================
// TYPE INTERFACE TESTS
// ============================================================================

describe('User Type', () => {
  it('should accept minimal user object', () => {
    const user: User = {
      id: 'user-123',
    };
    expect(user.id).toBe('user-123');
  });

  it('should accept full user object', () => {
    const user: User = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      isTeacher: true,
      metadata: { preferences: { theme: 'dark' } },
    };
    expect(user.id).toBe('user-123');
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.isTeacher).toBe(true);
    expect(user.metadata).toBeDefined();
  });
});

describe('SAMContext Type', () => {
  it('should accept minimal context', () => {
    const context: SAMContext = {
      user: { id: 'user-123' },
    };
    expect(context.user.id).toBe('user-123');
  });

  it('should accept full context', () => {
    const context: SAMContext = {
      user: { id: 'user-123', isTeacher: true },
      courseId: 'course-123',
      chapterId: 'chapter-1',
      sectionId: 'section-1',
      pageType: 'learning',
      entityType: 'lesson',
      entityData: { title: 'Intro' },
      formData: { field: 'value' },
      url: '/courses/123',
      timestamp: new Date(),
    };
    expect(context.courseId).toBe('course-123');
    expect(context.chapterId).toBe('chapter-1');
    expect(context.sectionId).toBe('section-1');
    expect(context.pageType).toBe('learning');
    expect(context.entityType).toBe('lesson');
  });
});

describe('SAMEngineConfig Type', () => {
  it('should accept empty config', () => {
    const config: SAMEngineConfig = {};
    expect(config).toBeDefined();
  });

  it('should accept full config', () => {
    const config: SAMEngineConfig = {
      apiKey: 'test-key',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.7,
      maxTokens: 1000,
      baseUrl: 'https://api.example.com',
      customHeaders: { 'X-Custom': 'header' },
      cacheEnabled: true,
      cacheTTL: 300,
      rateLimitPerMinute: 60,
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
      storage: {
        get: async () => null,
        set: async () => {},
        delete: async () => {},
        clear: async () => {},
      },
    };
    expect(config.apiKey).toBe('test-key');
    expect(config.provider).toBe('anthropic');
  });

  it('should accept all provider types', () => {
    const providers: SAMEngineConfig['provider'][] = ['anthropic', 'openai', 'custom'];
    providers.forEach((provider) => {
      const config: SAMEngineConfig = { provider };
      expect(config.provider).toBe(provider);
    });
  });
});

describe('Message Type', () => {
  it('should accept minimal message', () => {
    const message: Message = {
      role: 'user',
      content: 'Hello',
    };
    expect(message.role).toBe('user');
    expect(message.content).toBe('Hello');
  });

  it('should accept full message', () => {
    const message: Message = {
      id: 'msg-123',
      role: 'assistant',
      content: 'Hello!',
      timestamp: new Date(),
      metadata: { tokens: 10 },
    };
    expect(message.id).toBe('msg-123');
    expect(message.role).toBe('assistant');
  });

  it('should accept all role types', () => {
    const roles: Message['role'][] = ['user', 'assistant', 'system'];
    roles.forEach((role) => {
      const message: Message = { role, content: 'test' };
      expect(message.role).toBe(role);
    });
  });
});

describe('Conversation Type', () => {
  it('should accept conversation object', () => {
    const conversation: Conversation = {
      id: 'conv-123',
      userId: 'user-123',
      messages: [{ role: 'user', content: 'Hello' }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(conversation.id).toBe('conv-123');
    expect(conversation.userId).toBe('user-123');
    expect(conversation.messages.length).toBe(1);
  });

  it('should accept conversation with context and metadata', () => {
    const conversation: Conversation = {
      id: 'conv-123',
      userId: 'user-123',
      messages: [],
      context: { user: { id: 'user-123' }, courseId: 'course-123' },
      metadata: { source: 'web' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(conversation.context?.courseId).toBe('course-123');
    expect(conversation.metadata?.source).toBe('web');
  });
});

describe('SAMResponse Type', () => {
  it('should accept minimal response', () => {
    const response: SAMResponse = {
      message: 'Hello!',
    };
    expect(response.message).toBe('Hello!');
  });

  it('should accept full response', () => {
    const response: SAMResponse = {
      message: 'Hello!',
      suggestions: ['Option 1', 'Option 2'],
      actions: [{ type: 'navigate', label: 'Go' }],
      contextInsights: {
        observation: 'User is new',
        recommendation: 'Show tutorial',
        warnings: ['Limited access'],
        opportunities: ['Complete profile'],
      },
      metadata: { responseTime: 100 },
      error: undefined,
    };
    expect(response.suggestions?.length).toBe(2);
    expect(response.actions?.length).toBe(1);
    expect(response.contextInsights?.observation).toBe('User is new');
  });
});

describe('SAMAction Type', () => {
  it('should accept minimal action', () => {
    const action: SAMAction = {
      type: 'navigate',
      label: 'Go to dashboard',
    };
    expect(action.type).toBe('navigate');
    expect(action.label).toBe('Go to dashboard');
  });

  it('should accept full action', () => {
    const action: SAMAction = {
      type: 'submit',
      label: 'Submit form',
      data: { formId: 'form-123' },
      priority: 'high',
    };
    expect(action.priority).toBe('high');
    expect(action.data).toBeDefined();
  });

  it('should accept all priority levels', () => {
    const priorities: SAMAction['priority'][] = ['high', 'medium', 'low'];
    priorities.forEach((priority) => {
      const action: SAMAction = { type: 'test', label: 'Test', priority };
      expect(action.priority).toBe(priority);
    });
  });
});

describe('ContextInsights Type', () => {
  it('should accept empty insights', () => {
    const insights: ContextInsights = {};
    expect(insights).toBeDefined();
  });

  it('should accept full insights', () => {
    const insights: ContextInsights = {
      observation: 'User struggling',
      recommendation: 'Show hints',
      warnings: ['Low score', 'Time running out'],
      opportunities: ['Offer practice', 'Suggest review'],
    };
    expect(insights.observation).toBe('User struggling');
    expect(insights.warnings?.length).toBe(2);
    expect(insights.opportunities?.length).toBe(2);
  });
});

describe('AnalysisResult Type', () => {
  it('should accept minimal result', () => {
    const result: AnalysisResult = {
      engineName: 'TestEngine',
      timestamp: new Date(),
      data: { score: 85 },
    };
    expect(result.engineName).toBe('TestEngine');
    expect(result.data.score).toBe(85);
  });

  it('should accept full result', () => {
    const result: AnalysisResult = {
      engineName: 'TestEngine',
      timestamp: new Date(),
      data: { analyzed: true },
      confidence: 0.95,
      recommendations: ['Improve X', 'Add Y'],
    };
    expect(result.confidence).toBe(0.95);
    expect(result.recommendations?.length).toBe(2);
  });
});

describe('MarketAnalysis Type', () => {
  it('should accept market analysis', () => {
    const analysis: MarketAnalysis = {
      engineName: 'MarketEngine',
      timestamp: new Date(),
      data: {},
      marketValue: 1000000,
      demandScore: 85,
      competitionLevel: 'medium',
      growthPotential: 0.75,
      trends: ['AI', 'Machine Learning', 'Cloud'],
    };
    expect(analysis.marketValue).toBe(1000000);
    expect(analysis.competitionLevel).toBe('medium');
    expect(analysis.trends?.length).toBe(3);
  });
});

describe('BloomsAnalysis Type', () => {
  it('should accept Blooms analysis', () => {
    const analysis: BloomsAnalysis = {
      engineName: 'BloomsEngine',
      timestamp: new Date(),
      data: {},
      level: 'analyze',
      distribution: {
        remember: 20,
        understand: 30,
        apply: 25,
        analyze: 15,
        evaluate: 5,
        create: 5,
      },
      recommendations: ['Add more application exercises'],
      gaps: ['Missing evaluation activities'],
    };
    expect(analysis.level).toBe('analyze');
    expect(analysis.distribution?.remember).toBe(20);
    expect(analysis.gaps?.length).toBe(1);
  });
});

describe('CourseAnalysis Type', () => {
  it('should accept course analysis', () => {
    const analysis: CourseAnalysis = {
      engineName: 'CourseEngine',
      timestamp: new Date(),
      data: {},
      quality: 85,
      completeness: 90,
      engagement: 75,
      difficulty: 'intermediate',
      improvements: ['Add more examples', 'Include practice exercises'],
    };
    expect(analysis.quality).toBe(85);
    expect(analysis.difficulty).toBe('intermediate');
    expect(analysis.improvements?.length).toBe(2);
  });
});

describe('SAMPlugin Type', () => {
  it('should accept minimal plugin', () => {
    const plugin: SAMPlugin = {
      name: 'my-plugin',
      version: '1.0.0',
    };
    expect(plugin.name).toBe('my-plugin');
    expect(plugin.version).toBe('1.0.0');
  });

  it('should accept full plugin', () => {
    const plugin: SAMPlugin = {
      name: 'my-plugin',
      version: '1.0.0',
      initialize: async () => {},
      process: async () => ({ result: 'processed' }),
      destroy: async () => {},
    };
    expect(plugin.initialize).toBeDefined();
    expect(plugin.process).toBeDefined();
    expect(plugin.destroy).toBeDefined();
  });
});

describe('SAMEngine Interface', () => {
  it('should match engine interface', () => {
    const engine: SAMEngine = {
      name: 'TestEngine',
      initialize: async () => {},
      process: async () => ({}),
      destroy: async () => {},
    };
    expect(engine.name).toBe('TestEngine');
    expect(typeof engine.initialize).toBe('function');
    expect(typeof engine.process).toBe('function');
    expect(typeof engine.destroy).toBe('function');
  });

  it('should accept engine with analyze method', () => {
    const engine: SAMEngine = {
      name: 'AnalyzeEngine',
      initialize: async () => {},
      process: async () => ({}),
      analyze: async (data) => ({
        engineName: 'AnalyzeEngine',
        timestamp: new Date(),
        data,
      }),
      destroy: async () => {},
    };
    expect(engine.analyze).toBeDefined();
  });
});

describe('SAMEvent Types', () => {
  it('should accept all event types', () => {
    const eventTypes: SAMEventType[] = [
      'message.sent',
      'message.received',
      'analysis.complete',
      'error.occurred',
      'context.changed',
      'engine.initialized',
      'engine.destroyed',
    ];
    eventTypes.forEach((type) => {
      const event: SAMEvent = { type, timestamp: new Date() };
      expect(event.type).toBe(type);
    });
  });

  it('should accept event with data and error', () => {
    const event: SAMEvent = {
      type: 'error.occurred',
      timestamp: new Date(),
      data: { context: 'test' },
      error: new Error('Test error'),
    };
    expect(event.data).toBeDefined();
    expect(event.error).toBeDefined();
  });

  it('should accept event handler function', () => {
    const handler: SAMEventHandler = (event) => {
      expect(event.type).toBeDefined();
    };
    handler({ type: 'message.sent', timestamp: new Date() });
  });

  it('should accept async event handler', async () => {
    const handler: SAMEventHandler = async (event) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return event;
    };
    await handler({ type: 'message.sent', timestamp: new Date() });
  });
});

describe('ValidationResult Type', () => {
  it('should accept valid result', () => {
    const result: ValidationResult = { valid: true };
    expect(result.valid).toBe(true);
  });

  it('should accept invalid result with errors', () => {
    const result: ValidationResult = {
      valid: false,
      errors: ['Field required', 'Invalid format'],
      warnings: ['Value too long'],
    };
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBe(2);
    expect(result.warnings?.length).toBe(1);
  });
});

describe('FeatureFlags Type', () => {
  it('should accept empty flags', () => {
    const flags: FeatureFlags = {};
    expect(flags).toBeDefined();
  });

  it('should accept all feature flags', () => {
    const flags: FeatureFlags = {
      enableMarketAnalysis: true,
      enableBloomsTracking: true,
      enableAdaptiveLearning: true,
      enableCourseGuide: true,
      enableTrendsAnalysis: true,
      enableNewsIntegration: true,
      enableResearchAccess: true,
      enableGamification: true,
      enableCollaboration: true,
      enablePredictiveAnalytics: true,
    };
    expect(Object.keys(flags).length).toBe(10);
    expect(flags.enableMarketAnalysis).toBe(true);
  });
});

describe('IntegrationConfig Type', () => {
  it('should accept webhook integration', () => {
    const config: IntegrationConfig = {
      type: 'webhook',
      url: 'https://webhook.example.com',
      headers: { 'X-API-Key': 'key' },
    };
    expect(config.type).toBe('webhook');
    expect(config.url).toBe('https://webhook.example.com');
  });

  it('should accept api integration with auth', () => {
    const config: IntegrationConfig = {
      type: 'api',
      url: 'https://api.example.com',
      authentication: {
        type: 'bearer',
        credentials: { token: 'abc123' },
      },
    };
    expect(config.authentication?.type).toBe('bearer');
  });

  it('should accept all auth types', () => {
    const authTypes: IntegrationConfig['authentication'][] = [
      { type: 'bearer' },
      { type: 'basic' },
      { type: 'apikey' },
      { type: 'oauth2' },
    ];
    authTypes.forEach((auth) => {
      const config: IntegrationConfig = { type: 'api', authentication: auth };
      expect(config.authentication?.type).toBe(auth?.type);
    });
  });

  it('should accept all integration types', () => {
    const types: IntegrationConfig['type'][] = ['webhook', 'api', 'websocket'];
    types.forEach((type) => {
      const config: IntegrationConfig = { type };
      expect(config.type).toBe(type);
    });
  });
});

describe('SAMTypes Namespace', () => {
  it('should export all types through namespace', () => {
    // Test that namespace exports work as type aliases
    const user: SAMTypes.IUser = { id: 'user-123' };
    const context: SAMTypes.IContext = { user };
    const config: SAMTypes.IConfig = { provider: 'anthropic' };
    const message: SAMTypes.IMessage = { role: 'user', content: 'Hello' };
    const conversation: SAMTypes.IConversation = {
      id: 'conv-1',
      userId: 'user-1',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const response: SAMTypes.IResponse = { message: 'Hi' };
    const action: SAMTypes.IAction = { type: 'test', label: 'Test' };
    const insights: SAMTypes.IContextInsights = {};
    const analysis: SAMTypes.IAnalysisResult = {
      engineName: 'Test',
      timestamp: new Date(),
      data: {},
    };
    const marketAnalysis: SAMTypes.IMarketAnalysis = {
      engineName: 'Market',
      timestamp: new Date(),
      data: {},
    };
    const bloomsAnalysis: SAMTypes.IBloomsAnalysis = {
      engineName: 'Blooms',
      timestamp: new Date(),
      data: {},
    };
    const courseAnalysis: SAMTypes.ICourseAnalysis = {
      engineName: 'Course',
      timestamp: new Date(),
      data: {},
    };
    const plugin: SAMTypes.IPlugin = { name: 'test', version: '1.0.0' };
    const event: SAMTypes.IEvent = { type: 'message.sent', timestamp: new Date() };
    const validation: SAMTypes.IValidationResult = { valid: true };
    const flags: SAMTypes.IFeatureFlags = {};
    const integration: SAMTypes.IIntegrationConfig = { type: 'webhook' };

    expect(user.id).toBe('user-123');
    expect(context.user).toBeDefined();
    expect(config.provider).toBe('anthropic');
    expect(message.role).toBe('user');
    expect(conversation.id).toBe('conv-1');
    expect(response.message).toBe('Hi');
    expect(action.type).toBe('test');
    expect(insights).toBeDefined();
    expect(analysis.engineName).toBe('Test');
    expect(marketAnalysis.engineName).toBe('Market');
    expect(bloomsAnalysis.engineName).toBe('Blooms');
    expect(courseAnalysis.engineName).toBe('Course');
    expect(plugin.name).toBe('test');
    expect(event.type).toBe('message.sent');
    expect(validation.valid).toBe(true);
    expect(flags).toBeDefined();
    expect(integration.type).toBe('webhook');
  });
});

describe('SAMLogger Type', () => {
  it('should accept logger implementation', () => {
    const logger: SAMLogger = {
      debug: (message: string, ...args: unknown[]) => console.debug(message, ...args),
      info: (message: string, ...args: unknown[]) => console.info(message, ...args),
      warn: (message: string, ...args: unknown[]) => console.warn(message, ...args),
      error: (message: string, error?: unknown, ...args: unknown[]) =>
        console.error(message, error, ...args),
    };
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
});

describe('SAMStorage Type', () => {
  it('should accept storage implementation', () => {
    const store = new Map<string, unknown>();
    const storage: SAMStorage = {
      get: async (key: string) => store.get(key),
      set: async (key: string, value: unknown) => {
        store.set(key, value);
      },
      delete: async (key: string) => {
        store.delete(key);
      },
      clear: async () => {
        store.clear();
      },
    };
    expect(typeof storage.get).toBe('function');
    expect(typeof storage.set).toBe('function');
    expect(typeof storage.delete).toBe('function');
    expect(typeof storage.clear).toBe('function');
  });

  it('should work with async operations', async () => {
    const store = new Map<string, unknown>();
    const storage: SAMStorage = {
      get: async (key: string) => store.get(key),
      set: async (key: string, value: unknown, _ttl?: number) => {
        store.set(key, value);
      },
      delete: async (key: string) => {
        store.delete(key);
      },
      clear: async () => {
        store.clear();
      },
    };

    await storage.set('key', 'value');
    const result = await storage.get('key');
    expect(result).toBe('value');

    await storage.delete('key');
    const deleted = await storage.get('key');
    expect(deleted).toBeUndefined();

    await storage.set('key2', 'value2');
    await storage.clear();
    const cleared = await storage.get('key2');
    expect(cleared).toBeUndefined();
  });
});
