/**
 * @sam-ai/core - Engine Tests
 * Tests for BaseEngine and ContextEngine
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseEngine } from '../engines/base';
import { ContextEngine, createContextEngine } from '../engines/context';
import { DependencyError, EngineError } from '../errors';
import type { EngineInput, EngineResult, SAMConfig } from '../types';
import { createMockConfig, createMockContext, createMockCacheAdapter } from './setup';

// ============================================================================
// MOCK ENGINE FOR TESTING BASE ENGINE
// ============================================================================

interface TestOutput {
  processed: boolean;
  input: string | undefined;
}

class TestEngine extends BaseEngine<unknown, TestOutput> {
  public processCount = 0;
  public shouldFail = false;
  public failMessage = 'Test failure';
  public mockOutput: Partial<TestOutput> = {};
  public onInitializeCalled = false;

  constructor(
    config: SAMConfig,
    options?: {
      name?: string;
      dependencies?: string[];
      cacheEnabled?: boolean;
    }
  ) {
    super({
      config,
      name: options?.name ?? 'test-engine',
      version: '1.0.0',
      dependencies: options?.dependencies ?? [],
      timeout: 5000,
      retries: 0,
      cacheEnabled: options?.cacheEnabled ?? false,
      cacheTTL: 60,
    });
  }

  protected async onInitialize(): Promise<void> {
    this.onInitializeCalled = true;
  }

  protected async process(input: EngineInput): Promise<TestOutput> {
    this.processCount++;

    if (this.shouldFail) {
      throw new Error(this.failMessage);
    }

    return {
      processed: true,
      input: input.query,
      ...this.mockOutput,
    };
  }

  protected getCacheKey(input: EngineInput): string {
    return `test:${input.context.page.path}:${input.query ?? 'no-query'}`;
  }
}

// ============================================================================
// BASE ENGINE TESTS
// ============================================================================

describe('BaseEngine', () => {
  let config: SAMConfig;
  let engine: TestEngine;

  beforeEach(() => {
    config = createMockConfig();
    engine = new TestEngine(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe('initialization', () => {
    it('should have correct name and version', () => {
      expect(engine.name).toBe('test-engine');
      expect(engine.version).toBe('1.0.0');
    });

    it('should not be initialized initially', () => {
      expect(engine.isInitialized()).toBe(false);
    });

    it('should initialize on first execute', async () => {
      const context = createMockContext();
      await engine.execute({ context });

      expect(engine.isInitialized()).toBe(true);
      expect(engine.onInitializeCalled).toBe(true);
    });

    it('should call onInitialize only once', async () => {
      const context = createMockContext();

      await engine.execute({ context });
      await engine.execute({ context });

      expect(engine.onInitializeCalled).toBe(true);
      expect(engine.processCount).toBe(2);
    });

    it('should allow explicit initialization', async () => {
      await engine.initialize();

      expect(engine.isInitialized()).toBe(true);
      expect(engine.onInitializeCalled).toBe(true);
    });

    it('should handle initialization errors', async () => {
      class FailingEngine extends TestEngine {
        protected async onInitialize(): Promise<void> {
          throw new Error('Init failed');
        }
      }

      const failingEngine = new FailingEngine(config);
      const context = createMockContext();

      // Initialization errors are thrown, not returned as results
      await expect(failingEngine.execute({ context })).rejects.toThrow('Init failed');
    });
  });

  // ============================================================================
  // EXECUTION TESTS
  // ============================================================================

  describe('execute', () => {
    it('should return successful result', async () => {
      const context = createMockContext();
      const result = await engine.execute({ context, query: 'test query' });

      expect(result.success).toBe(true);
      expect(result.engineName).toBe('test-engine');
      expect(result.data?.processed).toBe(true);
      expect(result.data?.input).toBe('test query');
    });

    it('should include metadata in result', async () => {
      const context = createMockContext();
      const result = await engine.execute({ context });

      expect(result.metadata).toBeDefined();
      expect(result.metadata.version).toBe('1.0.0');
      expect(result.metadata.cached).toBe(false);
      expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle processing errors', async () => {
      engine.shouldFail = true;
      engine.failMessage = 'Processing failed';

      const context = createMockContext();
      const result = await engine.execute({ context });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Processing failed');
    });
  });

  // ============================================================================
  // DEPENDENCY TESTS
  // ============================================================================

  describe('dependencies', () => {
    it('should have empty dependencies by default', () => {
      expect(engine.dependencies).toEqual([]);
    });

    it('should store dependencies', () => {
      const engineWithDeps = new TestEngine(config, {
        name: 'with-deps',
        dependencies: ['context', 'blooms'],
      });

      expect(engineWithDeps.dependencies).toEqual(['context', 'blooms']);
    });

    it('should validate dependencies are present', async () => {
      const engineWithDeps = new TestEngine(config, {
        dependencies: ['context'],
      });

      const context = createMockContext();

      // Dependency errors are thrown before try-catch in execute
      await expect(
        engineWithDeps.execute({
          context,
          previousResults: {},
        })
      ).rejects.toThrow('missing required dependency: context');
    });

    it('should validate dependencies are successful', async () => {
      const engineWithDeps = new TestEngine(config, {
        dependencies: ['context'],
      });

      const failedResult: EngineResult = {
        engineName: 'context',
        success: false,
        data: null,
        metadata: { executionTime: 0, cached: false, version: '1.0.0' },
        error: { code: 'ENGINE_ERROR', message: 'Failed', recoverable: true },
      };

      const context = createMockContext();

      // Dependency validation throws when dependency failed
      await expect(
        engineWithDeps.execute({
          context,
          previousResults: { context: failedResult },
        })
      ).rejects.toThrow('Dependency "context" failed');
    });

    it('should execute when dependencies are satisfied', async () => {
      const engineWithDeps = new TestEngine(config, {
        dependencies: ['context'],
      });

      const successResult: EngineResult = {
        engineName: 'context',
        success: true,
        data: { analyzed: true },
        metadata: { executionTime: 10, cached: false, version: '1.0.0' },
      };

      const context = createMockContext();
      const result = await engineWithDeps.execute({
        context,
        previousResults: { context: successResult },
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // CACHING TESTS
  // ============================================================================

  describe('caching', () => {
    it('should not cache when cacheEnabled is false', async () => {
      const mockCache = createMockCacheAdapter();
      const configWithCache = createMockConfig({ cache: mockCache });
      const engineNoCache = new TestEngine(configWithCache, { cacheEnabled: false });

      const context = createMockContext();
      await engineNoCache.execute({ context, query: 'test' });

      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should check cache when cacheEnabled is true', async () => {
      const mockCache = createMockCacheAdapter();
      const configWithCache = createMockConfig({ cache: mockCache });
      const engineWithCache = new TestEngine(configWithCache, { cacheEnabled: true });

      const context = createMockContext();
      await engineWithCache.execute({ context, query: 'test' });

      expect(mockCache.get).toHaveBeenCalled();
    });

    it('should return cached result when available', async () => {
      const cachedData = { processed: true, input: 'cached' };
      const mockCache = createMockCacheAdapter({
        get: vi.fn().mockResolvedValue(cachedData),
      });
      const configWithCache = createMockConfig({ cache: mockCache });
      const engineWithCache = new TestEngine(configWithCache, { cacheEnabled: true });

      const context = createMockContext();
      const result = await engineWithCache.execute({ context, query: 'test' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedData);
      expect(result.metadata.cached).toBe(true);
      expect(engineWithCache.processCount).toBe(0); // Process not called
    });

    it('should cache successful results', async () => {
      const mockCache = createMockCacheAdapter();
      const configWithCache = createMockConfig({ cache: mockCache });
      const engineWithCache = new TestEngine(configWithCache, { cacheEnabled: true });

      const context = createMockContext();
      await engineWithCache.execute({ context, query: 'test' });

      expect(mockCache.set).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// CONTEXT ENGINE TESTS
// ============================================================================

describe('ContextEngine', () => {
  let config: SAMConfig;
  let engine: ContextEngine;

  beforeEach(() => {
    config = createMockConfig();
    engine = new ContextEngine(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(engine.name).toBe('context');
    });

    it('should have no dependencies', () => {
      expect(engine.dependencies).toEqual([]);
    });
  });

  describe('page context analysis', () => {
    it('should analyze dashboard page', async () => {
      const context = createMockContext({
        page: { type: 'dashboard', path: '/dashboard', capabilities: [], breadcrumb: [] },
      });

      const result = await engine.execute({ context });

      expect(result.success).toBe(true);
      expect(result.data?.enrichedContext.pageType).toBe('dashboard');
      expect(result.data?.enrichedContext.entityType).toBe('user');
      expect(result.data?.enrichedContext.capabilities).toContain('view-overview');
    });

    it('should analyze course-detail page', async () => {
      const context = createMockContext({
        page: {
          type: 'course-detail',
          path: '/courses/123',
          entityId: '123',
          capabilities: [],
          breadcrumb: [],
        },
      });

      const result = await engine.execute({ context });

      expect(result.success).toBe(true);
      expect(result.data?.enrichedContext.pageType).toBe('course-detail');
      expect(result.data?.enrichedContext.entityType).toBe('course');
      expect(result.data?.enrichedContext.entityId).toBe('123');
    });

    it('should provide suggested actions', async () => {
      const context = createMockContext({
        page: { type: 'course-create', path: '/create', capabilities: [], breadcrumb: [] },
      });

      const result = await engine.execute({ context });

      expect(result.success).toBe(true);
      expect(result.data?.enrichedContext.suggestedActions.length).toBeGreaterThan(0);
    });
  });

  describe('query analysis', () => {
    it('should not analyze when no query provided', async () => {
      const context = createMockContext();
      const result = await engine.execute({ context });

      expect(result.success).toBe(true);
      expect(result.data?.queryAnalysis).toBeNull();
    });

    it('should detect question intent', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'What is the best way to structure a course?',
      });

      expect(result.data?.queryAnalysis?.intent).toBe('question');
    });

    it('should detect generation intent', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'Generate a quiz for chapter 2',
      });

      expect(result.data?.queryAnalysis?.intent).toBe('generation');
    });

    it('should detect analysis intent', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'Analyze the bloom taxonomy distribution',
      });

      expect(result.data?.queryAnalysis?.intent).toBe('analysis');
    });

    it('should detect command intent', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'Add a new section to chapter 1',
      });

      expect(result.data?.queryAnalysis?.intent).toBe('command');
    });

    it('should detect help intent', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'Help me understand how to use this feature',
      });

      expect(result.data?.queryAnalysis?.intent).toBe('help');
    });

    it('should detect navigation intent', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'Go to the analytics page',
      });

      expect(result.data?.queryAnalysis?.intent).toBe('navigation');
    });

    it('should detect feedback intent', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'This is great, thank you!',
      });

      expect(result.data?.queryAnalysis?.intent).toBe('feedback');
    });

    it('should extract keywords', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'Create a comprehensive quiz about machine learning algorithms',
      });

      expect(result.data?.queryAnalysis?.keywords).toContain('comprehensive');
      expect(result.data?.queryAnalysis?.keywords).toContain('quiz');
      expect(result.data?.queryAnalysis?.keywords).toContain('machine');
      expect(result.data?.queryAnalysis?.keywords).toContain('learning');
      expect(result.data?.queryAnalysis?.keywords).toContain('algorithms');
    });

    it('should analyze positive sentiment', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'This is great and excellent work!',
      });

      expect(result.data?.queryAnalysis?.sentiment).toBe('positive');
    });

    it('should analyze negative sentiment', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'This is terrible and has many problems',
      });

      expect(result.data?.queryAnalysis?.sentiment).toBe('negative');
    });

    it('should analyze neutral sentiment', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'Generate a quiz',
      });

      expect(result.data?.queryAnalysis?.sentiment).toBe('neutral');
    });

    it('should determine simple complexity', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'Create a quiz',
      });

      expect(result.data?.queryAnalysis?.complexity).toBe('simple');
    });

    it('should determine moderate complexity', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'Create a quiz and then add it to the chapter section',
      });

      expect(result.data?.queryAnalysis?.complexity).toBe('moderate');
    });

    it('should determine complex complexity', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query:
          'Create a comprehensive quiz that covers all the topics from chapters 1 through 5, ' +
          'including multiple choice questions, short answer questions, and essay questions, ' +
          'while ensuring appropriate difficulty progression and bloom taxonomy coverage',
      });

      expect(result.data?.queryAnalysis?.complexity).toBe('complex');
    });

    it('should extract quoted entities', async () => {
      const context = createMockContext();
      const result = await engine.execute({
        context,
        query: 'Create a course called "Introduction to Machine Learning"',
      });

      // Query is lowercased during analysis, so entities are lowercase
      expect(result.data?.queryAnalysis?.entities).toContain('introduction to machine learning');
    });
  });

  describe('factory function', () => {
    it('should create ContextEngine instance', () => {
      const contextEngine = createContextEngine(config);
      expect(contextEngine).toBeInstanceOf(ContextEngine);
      expect(contextEngine.name).toBe('context');
    });
  });
});
