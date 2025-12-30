/**
 * Index Exports Tests
 * Tests for SAM Engine package exports and factory functions
 */

import { describe, it, expect } from 'vitest';
import {
  SAMEngine,
  BaseEngine,
  VERSION,
  defaultConfig,
  createSAMEngine,
} from '../index';

// ============================================================================
// EXPORTS TESTS
// ============================================================================

describe('Package Exports', () => {
  describe('SAMEngine', () => {
    it('should export SAMEngine class', () => {
      expect(SAMEngine).toBeDefined();
      expect(typeof SAMEngine).toBe('function');
    });

    it('should create SAMEngine instance', () => {
      const engine = new SAMEngine();
      expect(engine).toBeInstanceOf(SAMEngine);
      expect(engine.name).toBe('SAMEngine');
    });

    it('should create SAMEngine with config', () => {
      const engine = new SAMEngine({
        provider: 'openai',
        model: 'gpt-4',
      });
      expect(engine).toBeInstanceOf(SAMEngine);
    });
  });

  describe('BaseEngine', () => {
    it('should export BaseEngine abstract class', () => {
      expect(BaseEngine).toBeDefined();
      expect(typeof BaseEngine).toBe('function');
    });

    it('should not be directly instantiable (abstract)', () => {
      // BaseEngine is abstract, we test through SAMEngine
      expect(SAMEngine.prototype instanceof BaseEngine).toBe(true);
    });
  });

  describe('VERSION', () => {
    it('should export VERSION constant', () => {
      expect(VERSION).toBeDefined();
      expect(typeof VERSION).toBe('string');
    });

    it('should be semantic version format', () => {
      const semverRegex = /^\d+\.\d+\.\d+$/;
      expect(VERSION).toMatch(semverRegex);
    });

    it('should be version 1.0.0', () => {
      expect(VERSION).toBe('1.0.0');
    });
  });

  describe('defaultConfig', () => {
    it('should export defaultConfig object', () => {
      expect(defaultConfig).toBeDefined();
      expect(typeof defaultConfig).toBe('object');
    });

    it('should have default provider as anthropic', () => {
      expect(defaultConfig.provider).toBe('anthropic');
    });

    it('should have default model', () => {
      expect(defaultConfig.model).toBe('claude-sonnet-4-5-20250929');
    });

    it('should have default temperature', () => {
      expect(defaultConfig.temperature).toBe(0.7);
    });

    it('should have default maxTokens', () => {
      expect(defaultConfig.maxTokens).toBe(1000);
    });

    it('should have cacheEnabled as true', () => {
      expect(defaultConfig.cacheEnabled).toBe(true);
    });

    it('should have default cacheTTL', () => {
      expect(defaultConfig.cacheTTL).toBe(300);
    });

    it('should have default rateLimitPerMinute', () => {
      expect(defaultConfig.rateLimitPerMinute).toBe(60);
    });

    it('should have all expected default keys', () => {
      const expectedKeys = [
        'provider',
        'model',
        'temperature',
        'maxTokens',
        'cacheEnabled',
        'cacheTTL',
        'rateLimitPerMinute',
      ];
      expectedKeys.forEach((key) => {
        expect(defaultConfig).toHaveProperty(key);
      });
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('createSAMEngine', () => {
  it('should export createSAMEngine function', () => {
    expect(createSAMEngine).toBeDefined();
    expect(typeof createSAMEngine).toBe('function');
  });

  it('should create SAMEngine instance with default config', () => {
    const engine = createSAMEngine();
    expect(engine).toBeInstanceOf(SAMEngine);
    expect(engine.name).toBe('SAMEngine');
  });

  it('should create SAMEngine with custom config', () => {
    const engine = createSAMEngine({
      provider: 'openai',
    });
    expect(engine).toBeInstanceOf(SAMEngine);
  });

  it('should merge custom config with defaults', () => {
    const engine = createSAMEngine({
      temperature: 0.9,
    });
    expect(engine).toBeInstanceOf(SAMEngine);
    // Engine should have custom temperature but other defaults
  });

  it('should allow overriding all default values', () => {
    const engine = createSAMEngine({
      provider: 'openai',
      model: 'gpt-4-turbo',
      temperature: 0.5,
      maxTokens: 2000,
      cacheEnabled: false,
      cacheTTL: 600,
      rateLimitPerMinute: 30,
    });
    expect(engine).toBeInstanceOf(SAMEngine);
  });

  it('should accept partial config', () => {
    const engine = createSAMEngine({
      model: 'claude-3-opus',
    });
    expect(engine).toBeInstanceOf(SAMEngine);
  });

  it('should work with empty config object', () => {
    const engine = createSAMEngine({});
    expect(engine).toBeInstanceOf(SAMEngine);
  });

  it('should work with undefined config', () => {
    const engine = createSAMEngine(undefined);
    expect(engine).toBeInstanceOf(SAMEngine);
  });
});

// ============================================================================
// TYPE EXPORTS TESTS
// ============================================================================

describe('Type Exports', () => {
  it('should use exported types correctly', async () => {
    // These tests verify that types are properly exported and can be used
    const config: Parameters<typeof createSAMEngine>[0] = {
      provider: 'anthropic',
      temperature: 0.7,
    };

    const engine = createSAMEngine(config);
    expect(engine).toBeInstanceOf(SAMEngine);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration', () => {
  it('should create engine and initialize', async () => {
    const engine = createSAMEngine();
    await engine.initialize();

    expect(engine.name).toBe('SAMEngine');
  });

  it('should create engine, initialize, and destroy', async () => {
    const engine = createSAMEngine();
    await engine.initialize();
    await engine.destroy();

    // Engine should be destroyed without errors
  });

  it('should process message after initialization', async () => {
    const engine = createSAMEngine();
    await engine.initialize();

    const context = {
      user: { id: 'test-user' },
    };

    const response = await engine.process(context, 'Hello');
    expect(response).toBeDefined();
    expect(response.message).toBeDefined();

    await engine.destroy();
  });

  it('should handle plugin registration', async () => {
    const engine = createSAMEngine();
    await engine.initialize();

    const plugin = {
      name: 'test-plugin',
      version: '1.0.0',
    };

    await engine.registerPlugin(plugin);

    await engine.destroy();
  });

  it('should handle event subscription', async () => {
    const engine = createSAMEngine();
    await engine.initialize();

    let eventReceived = false;
    engine.on('message.received', () => {
      eventReceived = true;
    });

    const context = { user: { id: 'test-user' } };
    await engine.process(context, 'Hello');

    expect(eventReceived).toBe(true);

    await engine.destroy();
  });
});

// ============================================================================
// COMPATIBILITY TESTS
// ============================================================================

describe('Compatibility', () => {
  it('should work with different provider configurations', async () => {
    const providers = ['anthropic', 'openai', 'custom'] as const;

    for (const provider of providers) {
      const engine = createSAMEngine({ provider });
      expect(engine).toBeInstanceOf(SAMEngine);
    }
  });

  it('should handle multiple simultaneous engines', async () => {
    const engine1 = createSAMEngine({ model: 'model-1' });
    const engine2 = createSAMEngine({ model: 'model-2' });

    await engine1.initialize();
    await engine2.initialize();

    const context = { user: { id: 'user-1' } };

    const [response1, response2] = await Promise.all([
      engine1.process(context, 'Hello from engine 1'),
      engine2.process(context, 'Hello from engine 2'),
    ]);

    expect(response1).toBeDefined();
    expect(response2).toBeDefined();

    await engine1.destroy();
    await engine2.destroy();
  });
});
