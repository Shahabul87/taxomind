/**
 * @sam-ai/core - Orchestrator Tests
 * Tests for SAMAgentOrchestrator
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SAMAgentOrchestrator, createOrchestrator } from '../orchestrator';
import { BaseEngine } from '../engines/base';
import { OrchestrationError } from '../errors';
import type { EngineInput, EngineResult, SAMContext } from '../types';
import {
  createMockConfig,
  createMockContext,
  createMockLogger,
} from './setup';

// ============================================================================
// MOCK ENGINE IMPLEMENTATION
// ============================================================================

class MockEngine extends BaseEngine<unknown, { processed: boolean; name: string }> {
  public processCount = 0;
  public shouldFail = false;
  public delay = 0;

  constructor(
    name: string,
    dependencies: string[] = [],
    version = '1.0.0'
  ) {
    super({
      config: createMockConfig(),
      name,
      version,
      dependencies,
      timeout: 5000,
      retries: 0,
      cacheEnabled: false,
    });
  }

  protected async process(
    input: EngineInput
  ): Promise<{ processed: boolean; name: string }> {
    this.processCount++;

    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      throw new Error(`Engine ${this.name} failed intentionally`);
    }

    return { processed: true, name: this.name };
  }

  protected getCacheKey(input: EngineInput): string {
    return `${this.name}:${input.query ?? 'no-query'}`;
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('SAMAgentOrchestrator', () => {
  let orchestrator: SAMAgentOrchestrator;
  let mockConfig: ReturnType<typeof createMockConfig>;
  let mockContext: SAMContext;

  beforeEach(() => {
    mockConfig = createMockConfig();
    mockContext = createMockContext();
    orchestrator = new SAMAgentOrchestrator(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should create an orchestrator with config', () => {
      expect(orchestrator).toBeInstanceOf(SAMAgentOrchestrator);
    });

    it('should use console as default logger if not provided', () => {
      const configWithoutLogger = { ...mockConfig, logger: undefined };
      const orch = new SAMAgentOrchestrator(configWithoutLogger);
      expect(orch).toBeInstanceOf(SAMAgentOrchestrator);
    });
  });

  // ============================================================================
  // ENGINE REGISTRATION TESTS
  // ============================================================================

  describe('registerEngine', () => {
    it('should register an engine successfully', () => {
      const engine = new MockEngine('test-engine');
      orchestrator.registerEngine(engine);

      expect(orchestrator.getRegisteredEngines()).toContain('test-engine');
    });

    it('should register multiple engines', () => {
      const engine1 = new MockEngine('engine-1');
      const engine2 = new MockEngine('engine-2');

      orchestrator.registerEngine(engine1);
      orchestrator.registerEngine(engine2);

      const registered = orchestrator.getRegisteredEngines();
      expect(registered).toContain('engine-1');
      expect(registered).toContain('engine-2');
      expect(registered).toHaveLength(2);
    });

    it('should replace existing engine with same name', () => {
      const engine1 = new MockEngine('duplicate');
      const engine2 = new MockEngine('duplicate');

      orchestrator.registerEngine(engine1);
      orchestrator.registerEngine(engine2);

      const registered = orchestrator.getRegisteredEngines();
      expect(registered.filter((e) => e === 'duplicate')).toHaveLength(1);
    });

    it('should register engine as enabled by default', () => {
      const engine = new MockEngine('test-engine');
      orchestrator.registerEngine(engine);

      expect(orchestrator.getEnabledEngines()).toContain('test-engine');
    });

    it('should register engine as disabled when specified', () => {
      const engine = new MockEngine('test-engine');
      orchestrator.registerEngine(engine, false);

      expect(orchestrator.getRegisteredEngines()).toContain('test-engine');
      expect(orchestrator.getEnabledEngines()).not.toContain('test-engine');
    });
  });

  // ============================================================================
  // ENGINE UNREGISTRATION TESTS
  // ============================================================================

  describe('unregisterEngine', () => {
    it('should unregister an existing engine', () => {
      const engine = new MockEngine('test-engine');
      orchestrator.registerEngine(engine);

      const result = orchestrator.unregisterEngine('test-engine');

      expect(result).toBe(true);
      expect(orchestrator.getRegisteredEngines()).not.toContain('test-engine');
    });

    it('should return false when unregistering non-existent engine', () => {
      const result = orchestrator.unregisterEngine('non-existent');
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // ENGINE ENABLE/DISABLE TESTS
  // ============================================================================

  describe('setEngineEnabled', () => {
    it('should disable an enabled engine', () => {
      const engine = new MockEngine('test-engine');
      orchestrator.registerEngine(engine);

      orchestrator.setEngineEnabled('test-engine', false);

      expect(orchestrator.getEnabledEngines()).not.toContain('test-engine');
    });

    it('should enable a disabled engine', () => {
      const engine = new MockEngine('test-engine');
      orchestrator.registerEngine(engine, false);

      orchestrator.setEngineEnabled('test-engine', true);

      expect(orchestrator.getEnabledEngines()).toContain('test-engine');
    });

    it('should do nothing for non-existent engine', () => {
      // Should not throw
      expect(() => {
        orchestrator.setEngineEnabled('non-existent', true);
      }).not.toThrow();
    });
  });

  // ============================================================================
  // ORCHESTRATION TESTS
  // ============================================================================

  describe('orchestrate', () => {
    it('should execute all enabled engines', async () => {
      const engine1 = new MockEngine('engine-1');
      const engine2 = new MockEngine('engine-2');

      orchestrator.registerEngine(engine1);
      orchestrator.registerEngine(engine2);

      const result = await orchestrator.orchestrate(mockContext, 'test query');

      expect(result.success).toBe(true);
      expect(result.metadata.enginesExecuted).toContain('engine-1');
      expect(result.metadata.enginesExecuted).toContain('engine-2');
      expect(engine1.processCount).toBe(1);
      expect(engine2.processCount).toBe(1);
    });

    it('should not execute disabled engines', async () => {
      const engine1 = new MockEngine('engine-1');
      const engine2 = new MockEngine('engine-2');

      orchestrator.registerEngine(engine1);
      orchestrator.registerEngine(engine2, false);

      const result = await orchestrator.orchestrate(mockContext);

      expect(result.metadata.enginesExecuted).toContain('engine-1');
      expect(result.metadata.enginesExecuted).not.toContain('engine-2');
      expect(engine1.processCount).toBe(1);
      expect(engine2.processCount).toBe(0);
    });

    it('should execute only requested engines when specified', async () => {
      const engine1 = new MockEngine('engine-1');
      const engine2 = new MockEngine('engine-2');
      const engine3 = new MockEngine('engine-3');

      orchestrator.registerEngine(engine1);
      orchestrator.registerEngine(engine2);
      orchestrator.registerEngine(engine3);

      const result = await orchestrator.orchestrate(mockContext, 'query', {
        engines: ['engine-1', 'engine-3'],
      });

      expect(result.metadata.enginesExecuted).toContain('engine-1');
      expect(result.metadata.enginesExecuted).not.toContain('engine-2');
      expect(result.metadata.enginesExecuted).toContain('engine-3');
    });

    it('should handle engine failures gracefully', async () => {
      const engine1 = new MockEngine('engine-1');
      const engine2 = new MockEngine('engine-2');
      engine2.shouldFail = true;

      orchestrator.registerEngine(engine1);
      orchestrator.registerEngine(engine2);

      const result = await orchestrator.orchestrate(mockContext);

      expect(result.success).toBe(false);
      expect(result.metadata.enginesFailed).toContain('engine-2');
      expect(result.results['engine-2'].success).toBe(false);
      expect(result.results['engine-2'].error).toBeDefined();
    });

    it('should return metadata with execution time', async () => {
      const engine = new MockEngine('engine-1');
      engine.delay = 50;

      orchestrator.registerEngine(engine);

      const result = await orchestrator.orchestrate(mockContext);

      expect(result.metadata.totalExecutionTime).toBeGreaterThanOrEqual(50);
    });

    it('should return empty results when no engines registered', async () => {
      const result = await orchestrator.orchestrate(mockContext);

      expect(result.success).toBe(true);
      expect(result.metadata.enginesExecuted).toHaveLength(0);
      expect(Object.keys(result.results)).toHaveLength(0);
    });
  });

  // ============================================================================
  // DEPENDENCY ORDERING TESTS
  // ============================================================================

  describe('dependency ordering', () => {
    it('should execute engines in dependency order', async () => {
      const executionOrder: string[] = [];

      class OrderTrackingEngine extends MockEngine {
        protected async process(input: EngineInput) {
          executionOrder.push(this.name);
          return super.process(input);
        }
      }

      const engine1 = new OrderTrackingEngine('engine-1', []);
      const engine2 = new OrderTrackingEngine('engine-2', ['engine-1']);
      const engine3 = new OrderTrackingEngine('engine-3', ['engine-2']);

      // Register in reverse order to test sorting
      orchestrator.registerEngine(engine3);
      orchestrator.registerEngine(engine1);
      orchestrator.registerEngine(engine2);

      await orchestrator.orchestrate(mockContext);

      expect(executionOrder.indexOf('engine-1')).toBeLessThan(
        executionOrder.indexOf('engine-2')
      );
      expect(executionOrder.indexOf('engine-2')).toBeLessThan(
        executionOrder.indexOf('engine-3')
      );
    });

    it('should detect circular dependencies', () => {
      const engine1 = new MockEngine('engine-1', ['engine-2']);
      const engine2 = new MockEngine('engine-2', ['engine-1']);

      expect(() => {
        orchestrator.registerEngine(engine1);
        orchestrator.registerEngine(engine2);
      }).toThrow(OrchestrationError);
    });

    it('should execute independent engines in parallel', async () => {
      const startTimes: Record<string, number> = {};

      class TimingEngine extends MockEngine {
        protected async process(input: EngineInput) {
          startTimes[this.name] = Date.now();
          await new Promise((resolve) => setTimeout(resolve, 50));
          return super.process(input);
        }
      }

      const engine1 = new TimingEngine('engine-1', []);
      const engine2 = new TimingEngine('engine-2', []);

      orchestrator.registerEngine(engine1);
      orchestrator.registerEngine(engine2);

      await orchestrator.orchestrate(mockContext);

      // Both should start within a small window (parallel execution)
      const timeDiff = Math.abs(startTimes['engine-1'] - startTimes['engine-2']);
      expect(timeDiff).toBeLessThan(30); // Allow small variance
    });
  });

  // ============================================================================
  // RUN SINGLE ENGINE TESTS
  // ============================================================================

  describe('runEngine', () => {
    it('should run a single engine by name', async () => {
      const engine = new MockEngine('test-engine');
      orchestrator.registerEngine(engine);

      const result = await orchestrator.runEngine('test-engine', mockContext);

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.engineName).toBe('test-engine');
    });

    it('should return null for non-existent engine', async () => {
      const result = await orchestrator.runEngine('non-existent', mockContext);
      expect(result).toBeNull();
    });

    it('should return null for disabled engine', async () => {
      const engine = new MockEngine('test-engine');
      orchestrator.registerEngine(engine, false);

      const result = await orchestrator.runEngine('test-engine', mockContext);
      expect(result).toBeNull();
    });

    it('should pass previous results to the engine', async () => {
      const previousResults: Record<string, EngineResult> = {
        'previous-engine': {
          engineName: 'previous-engine',
          success: true,
          data: { value: 'test' },
          metadata: { executionTime: 100, cached: false, version: '1.0.0' },
        },
      };

      const engine = new MockEngine('test-engine');
      orchestrator.registerEngine(engine);

      const result = await orchestrator.runEngine(
        'test-engine',
        mockContext,
        'query',
        previousResults
      );

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
    });
  });

  // ============================================================================
  // AGGREGATION TESTS
  // ============================================================================

  describe('result aggregation', () => {
    it('should generate default message for dashboard context', async () => {
      const result = await orchestrator.orchestrate(
        createMockContext({ page: { type: 'dashboard', path: '/', capabilities: [], breadcrumb: [] } })
      );

      expect(result.response.message).toContain('Welcome');
    });

    it('should generate default message for course-create context', async () => {
      const result = await orchestrator.orchestrate(
        createMockContext({ page: { type: 'course-create', path: '/', capabilities: [], breadcrumb: [] } })
      );

      expect(result.response.message).toContain('create');
    });

    it('should return page-specific actions', async () => {
      const result = await orchestrator.orchestrate(
        createMockContext({ page: { type: 'dashboard', path: '/', capabilities: [], breadcrumb: [] } })
      );

      expect(result.response.actions).toBeDefined();
      expect(result.response.actions.length).toBeGreaterThan(0);
    });

    it('should include query acknowledgment in message when query provided', async () => {
      const result = await orchestrator.orchestrate(mockContext, 'analyze my course');

      expect(result.response.message).toBeTruthy();
    });
  });

  // ============================================================================
  // FACTORY FUNCTION TESTS
  // ============================================================================

  describe('createOrchestrator', () => {
    it('should create an orchestrator instance', () => {
      const orch = createOrchestrator(mockConfig);
      expect(orch).toBeInstanceOf(SAMAgentOrchestrator);
    });
  });
});
