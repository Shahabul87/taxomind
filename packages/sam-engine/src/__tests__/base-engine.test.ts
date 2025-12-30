/**
 * Base Engine Tests
 * Tests for the abstract BaseEngine class
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BaseEngine } from '../base-engine';
import type { SAMContext, SAMEngineConfig, SAMLogger, SAMStorage, ValidationResult } from '../types';

// ============================================================================
// TEST CONCRETE IMPLEMENTATION
// ============================================================================

class TestEngine extends BaseEngine {
  public name = 'TestEngine';
  private initializeCallback?: () => Promise<void>;
  private processCallback?: (context: SAMContext, input: unknown) => Promise<unknown>;

  constructor(config: SAMEngineConfig = {}) {
    super(config);
  }

  setInitializeCallback(callback: () => Promise<void>): void {
    this.initializeCallback = callback;
  }

  setProcessCallback(callback: (context: SAMContext, input: unknown) => Promise<unknown>): void {
    this.processCallback = callback;
  }

  protected async performInitialization(): Promise<void> {
    if (this.initializeCallback) {
      await this.initializeCallback();
    }
  }

  async process(context: SAMContext, input: unknown): Promise<unknown> {
    if (this.processCallback) {
      return this.processCallback(context, input);
    }
    return { success: true, context, input };
  }

  // Expose protected methods for testing
  public testValidate<T>(data: unknown, validator: (data: unknown) => ValidationResult): T {
    return this.validate<T>(data, validator);
  }

  public async testWithCache<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    return this.withCache<T>(key, factory, ttlSeconds);
  }

  public async testMeasurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.measurePerformance<T>(operation, fn);
  }

  public async testCheckRateLimit(
    key: string,
    maxRequests?: number,
    windowMs?: number
  ): Promise<boolean> {
    return this.checkRateLimit(key, maxRequests, windowMs);
  }

  public testSanitizeString(input: string, maxLength?: number): string {
    return this.sanitizeString(input, maxLength);
  }

  public testSanitizeNumber(
    input: unknown,
    min: number,
    max: number,
    defaultValue: number
  ): number {
    return this.sanitizeNumber(input, min, max, defaultValue);
  }

  public testPaginate<T>(items: T[], page?: number, limit?: number) {
    return this.paginate<T>(items, page, limit);
  }

  public async testProcessBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize?: number
  ): Promise<R[]> {
    return this.processBatch<T, R>(items, processor, batchSize);
  }

  public async testRetry<T>(
    operation: () => Promise<T>,
    maxAttempts?: number,
    delayMs?: number
  ): Promise<T> {
    return this.retry<T>(operation, maxAttempts, delayMs);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getCache(): Map<string, { data: unknown; expiry: number }> {
    return this.cache;
  }
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createTestContext(overrides: Partial<SAMContext> = {}): SAMContext {
  return {
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    },
    courseId: 'course-123',
    ...overrides,
  };
}

function createMockLogger(): SAMLogger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function createMockStorage(): SAMStorage {
  const store = new Map<string, unknown>();
  return {
    get: vi.fn(async (key: string) => store.get(key)),
    set: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(async () => {
      store.clear();
    }),
  };
}

// ============================================================================
// BASE ENGINE TESTS
// ============================================================================

describe('BaseEngine', () => {
  let engine: TestEngine;
  let mockLogger: SAMLogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
    engine = new TestEngine({ logger: mockLogger });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create engine with default config', () => {
      const e = new TestEngine();
      expect(e.name).toBe('TestEngine');
    });

    it('should create engine with custom config', () => {
      const config: SAMEngineConfig = {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.5,
      };
      const e = new TestEngine(config);
      expect(e).toBeDefined();
    });

    it('should use custom logger when provided', () => {
      const customLogger = createMockLogger();
      const e = new TestEngine({ logger: customLogger });
      expect(e).toBeDefined();
    });

    it('should use custom storage when provided', () => {
      const customStorage = createMockStorage();
      const e = new TestEngine({ storage: customStorage });
      expect(e).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should initialize engine successfully', async () => {
      await engine.initialize();
      expect(engine.isInitialized()).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('TestEngine initialized successfully');
    });

    it('should warn when already initialized', async () => {
      await engine.initialize();
      await engine.initialize();
      expect(mockLogger.warn).toHaveBeenCalledWith('TestEngine is already initialized');
    });

    it('should merge config on initialization', async () => {
      await engine.initialize({ temperature: 0.8 });
      expect(engine.isInitialized()).toBe(true);
    });

    it('should handle initialization errors', async () => {
      const errorEngine = new TestEngine({ logger: mockLogger });
      errorEngine.setInitializeCallback(async () => {
        throw new Error('Init failed');
      });

      await expect(errorEngine.initialize()).rejects.toThrow(
        'Engine initialization failed: TestEngine'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should destroy engine and clear cache', async () => {
      await engine.initialize();
      await engine.testWithCache('key', async () => 'value');

      await engine.destroy();

      expect(engine.isInitialized()).toBe(false);
      expect(engine.getCache().size).toBe(0);
      expect(mockLogger.info).toHaveBeenCalledWith('TestEngine destroyed');
    });
  });

  describe('process', () => {
    it('should process input and return result', async () => {
      const context = createTestContext();
      const result = await engine.process(context, { message: 'Hello' });

      expect(result).toEqual({
        success: true,
        context,
        input: { message: 'Hello' },
      });
    });

    it('should use custom process callback', async () => {
      engine.setProcessCallback(async (ctx, input) => ({
        processed: true,
        userId: ctx.user.id,
        data: input,
      }));

      const context = createTestContext();
      const result = await engine.process(context, 'test');

      expect(result).toEqual({
        processed: true,
        userId: 'user-123',
        data: 'test',
      });
    });
  });

  describe('validate', () => {
    it('should return data when validation passes', () => {
      const validator = (): ValidationResult => ({ valid: true });
      const data = { name: 'test' };

      const result = engine.testValidate(data, validator);

      expect(result).toEqual(data);
    });

    it('should throw error when validation fails', () => {
      const validator = (): ValidationResult => ({
        valid: false,
        errors: ['Name is required', 'Email is invalid'],
      });

      expect(() => engine.testValidate({}, validator)).toThrow(
        'Validation error in TestEngine: Name is required, Email is invalid'
      );
    });

    it('should throw generic error when no error messages', () => {
      const validator = (): ValidationResult => ({ valid: false });

      expect(() => engine.testValidate({}, validator)).toThrow(
        'Validation error in TestEngine: Validation failed'
      );
    });
  });

  describe('withCache', () => {
    it('should cache result and return on subsequent calls', async () => {
      let callCount = 0;
      const factory = async () => {
        callCount++;
        return `result-${callCount}`;
      };

      const result1 = await engine.testWithCache('key', factory);
      const result2 = await engine.testWithCache('key', factory);

      expect(result1).toBe('result-1');
      expect(result2).toBe('result-1');
      expect(callCount).toBe(1);
    });

    it('should use storage when available', async () => {
      const mockStorage = createMockStorage();
      const storageEngine = new TestEngine({ storage: mockStorage, logger: mockLogger });

      const result = await storageEngine.testWithCache('key', async () => 'value');

      expect(result).toBe('value');
      expect(mockStorage.set).toHaveBeenCalled();
    });

    it('should return from storage if available', async () => {
      const mockStorage = createMockStorage();
      await mockStorage.set('key', 'stored-value');
      const storageEngine = new TestEngine({ storage: mockStorage, logger: mockLogger });

      const result = await storageEngine.testWithCache('key', async () => 'new-value');

      expect(result).toBe('stored-value');
    });

    it('should respect TTL', async () => {
      const result1 = await engine.testWithCache('key', async () => 'value1', 1);

      // Immediately should return cached
      const result2 = await engine.testWithCache('key', async () => 'value2', 1);
      expect(result2).toBe('value1');

      // After expiry, should get new value
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const result3 = await engine.testWithCache('key', async () => 'value3', 1);
      expect(result3).toBe('value3');
    });

    it('should handle storage read errors gracefully', async () => {
      const mockStorage = createMockStorage();
      (mockStorage.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Read error'));
      const storageEngine = new TestEngine({ storage: mockStorage, logger: mockLogger });

      const result = await storageEngine.testWithCache('key', async () => 'fallback');

      expect(result).toBe('fallback');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle storage write errors gracefully', async () => {
      const mockStorage = createMockStorage();
      (mockStorage.set as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Write error'));
      const storageEngine = new TestEngine({ storage: mockStorage, logger: mockLogger });

      const result = await storageEngine.testWithCache('key', async () => 'value');

      expect(result).toBe('value');
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('measurePerformance', () => {
    it('should measure and log operation time', async () => {
      const result = await engine.testMeasurePerformance('testOp', async () => 'result');

      expect(result).toBe('result');
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should warn on slow operations', async () => {
      const slowOperation = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        return 'slow result';
      };

      const result = await engine.testMeasurePerformance('slowOp', slowOperation);

      expect(result).toBe('slow result');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should log error and rethrow on failure', async () => {
      const failingOperation = async () => {
        throw new Error('Operation failed');
      };

      await expect(engine.testMeasurePerformance('failOp', failingOperation)).rejects.toThrow(
        'Operation failed'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const allowed1 = await engine.testCheckRateLimit('user-1', 5);
      const allowed2 = await engine.testCheckRateLimit('user-1', 5);
      const allowed3 = await engine.testCheckRateLimit('user-1', 5);

      expect(allowed1).toBe(true);
      expect(allowed2).toBe(true);
      expect(allowed3).toBe(true);
    });

    it('should deny requests exceeding limit', async () => {
      for (let i = 0; i < 3; i++) {
        await engine.testCheckRateLimit('user-2', 3);
      }

      const denied = await engine.testCheckRateLimit('user-2', 3);

      expect(denied).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('Rate limit exceeded for user-2');
    });

    it('should reset after window expires', async () => {
      // Fill up the limit
      for (let i = 0; i < 3; i++) {
        await engine.testCheckRateLimit('user-3', 3, 100);
      }

      const denied = await engine.testCheckRateLimit('user-3', 3, 100);
      expect(denied).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const allowed = await engine.testCheckRateLimit('user-3', 3, 100);
      expect(allowed).toBe(true);
    });

    it('should track different keys separately', async () => {
      for (let i = 0; i < 3; i++) {
        await engine.testCheckRateLimit('user-a', 3);
      }

      const deniedA = await engine.testCheckRateLimit('user-a', 3);
      const allowedB = await engine.testCheckRateLimit('user-b', 3);

      expect(deniedA).toBe(false);
      expect(allowedB).toBe(true);
    });
  });

  describe('sanitizeString', () => {
    it('should trim and limit string length', () => {
      // Implementation slices first, then trims
      // '  hello world  '.slice(0,5) = '  hel' -> trim() = 'hel'
      const input = '  hello world  ';
      const result = engine.testSanitizeString(input, 5);

      expect(result).toBe('hel');
    });

    it('should handle string without leading spaces', () => {
      const input = 'hello world';
      const result = engine.testSanitizeString(input, 5);

      expect(result).toBe('hello');
    });

    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = engine.testSanitizeString(input);

      expect(result).toBe('Hello  World');
    });

    it('should remove HTML tags', () => {
      const input = '<div>Hello <b>World</b></div>';
      const result = engine.testSanitizeString(input);

      expect(result).toBe('Hello World');
    });

    it('should return empty string for non-string input', () => {
      const result = engine.testSanitizeString(123 as unknown as string);

      expect(result).toBe('');
    });

    it('should handle complex XSS attempts', () => {
      const input = '<script type="text/javascript">document.cookie</script>';
      const result = engine.testSanitizeString(input);

      expect(result).not.toContain('script');
      expect(result).not.toContain('document.cookie');
    });
  });

  describe('sanitizeNumber', () => {
    it('should return number within range', () => {
      const result = engine.testSanitizeNumber(50, 0, 100, 0);

      expect(result).toBe(50);
    });

    it('should clamp to minimum', () => {
      const result = engine.testSanitizeNumber(-10, 0, 100, 50);

      expect(result).toBe(0);
    });

    it('should clamp to maximum', () => {
      const result = engine.testSanitizeNumber(200, 0, 100, 50);

      expect(result).toBe(100);
    });

    it('should return default for NaN', () => {
      const result = engine.testSanitizeNumber('invalid', 0, 100, 50);

      expect(result).toBe(50);
    });

    it('should convert string numbers', () => {
      const result = engine.testSanitizeNumber('75', 0, 100, 50);

      expect(result).toBe(75);
    });

    it('should handle null/undefined', () => {
      // Number(null) = 0, which is within range [0, 100]
      const result1 = engine.testSanitizeNumber(null, 0, 100, 25);
      // Number(undefined) = NaN, so returns default
      const result2 = engine.testSanitizeNumber(undefined, 0, 100, 25);

      expect(result1).toBe(0); // null converts to 0
      expect(result2).toBe(25); // undefined converts to NaN, returns default
    });
  });

  describe('paginate', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it('should return first page by default', () => {
      const result = engine.testPaginate(items, 1, 3);

      expect(result.items).toEqual([1, 2, 3]);
      expect(result.page).toBe(1);
      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(4);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('should return middle page', () => {
      const result = engine.testPaginate(items, 2, 3);

      expect(result.items).toEqual([4, 5, 6]);
      expect(result.page).toBe(2);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('should return last page', () => {
      const result = engine.testPaginate(items, 4, 3);

      expect(result.items).toEqual([10]);
      expect(result.page).toBe(4);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it('should clamp page to valid range', () => {
      const resultLow = engine.testPaginate(items, 0, 3);
      const resultHigh = engine.testPaginate(items, 100, 3);

      expect(resultLow.page).toBe(1);
      expect(resultHigh.page).toBe(4);
    });

    it('should use default values', () => {
      const result = engine.testPaginate(items);

      expect(result.page).toBe(1);
      expect(result.items.length).toBe(10);
    });

    it('should handle empty array', () => {
      const result = engine.testPaginate([], 1, 5);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });
  });

  describe('processBatch', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = async (item: number) => item * 2;

      const results = await engine.testProcessBatch(items, processor, 2);

      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should filter out failed items', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = async (item: number) => {
        if (item === 3) throw new Error('Failed');
        return item * 2;
      };

      const results = await engine.testProcessBatch(items, processor, 2);

      expect(results).toEqual([2, 4, 8, 10]);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should process with default batch size', async () => {
      const items = Array.from({ length: 25 }, (_, i) => i + 1);
      const processor = async (item: number) => item * 2;

      const results = await engine.testProcessBatch(items, processor);

      expect(results.length).toBe(25);
    });

    it('should handle empty array', async () => {
      const processor = async (item: number) => item * 2;

      const results = await engine.testProcessBatch([], processor);

      expect(results).toEqual([]);
    });
  });

  describe('retry', () => {
    it('should return result on first success', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await engine.testRetry(operation, 3, 10);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Retry');
        return 'success';
      });

      const result = await engine.testRetry(operation, 5, 10);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(engine.testRetry(operation, 3, 10)).rejects.toThrow('Always fails');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      const startTime = Date.now();
      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Retry');
        return 'success';
      });

      await engine.testRetry(operation, 3, 50);

      const elapsed = Date.now() - startTime;
      // First retry: 50ms, Second retry: 100ms, Total: ~150ms
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    it('should log warnings for failed attempts', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) throw new Error('Retry needed');
        return 'success';
      });

      await engine.testRetry(operation, 3, 10);

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('analyze', () => {
    it('should return analysis result', async () => {
      const result = await engine.analyze?.({ test: 'data' });

      expect(result).toEqual({
        engineName: 'TestEngine',
        timestamp: expect.any(Date),
        data: { test: 'data' },
        confidence: 1.0,
        recommendations: [],
      });
    });
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  it('should handle undefined config gracefully', () => {
    const engine = new TestEngine();
    expect(engine).toBeDefined();
  });

  it('should handle empty config gracefully', () => {
    const engine = new TestEngine({});
    expect(engine).toBeDefined();
  });

  it('should create default logger in non-development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const engine = new TestEngine();
    await engine.initialize();

    process.env.NODE_ENV = originalEnv;
  });
});
