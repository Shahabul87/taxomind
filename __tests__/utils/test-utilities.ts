/**
 * Test Utilities for Performance Optimization Testing
 * Provides comprehensive utilities for testing Phase 3 optimizations
 */

import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { jest } from '@jest/globals';

/**
 * Performance Measurement Utilities
 */
export class PerformanceTestUtils {
  private static measurements: Map<string, number[]> = new Map();

  /**
   * Start a performance measurement
   */
  static startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }

  /**
   * End a performance measurement and store the result
   */
  static endMeasure(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0] as PerformanceMeasure;
    const duration = measure.duration;
    
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);
    
    return duration;
  }

  /**
   * Get average duration for a measurement
   */
  static getAverageDuration(name: string): number {
    const durations = this.measurements.get(name) || [];
    if (durations.length === 0) return 0;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  /**
   * Clear all measurements
   */
  static clearMeasurements(): void {
    this.measurements.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * Assert performance improvement
   */
  static assertPerformanceImprovement(
    baseline: number,
    optimized: number,
    expectedImprovement: number = 0.2 // 20% improvement by default
  ): void {
    const improvement = (baseline - optimized) / baseline;
    expect(improvement).toBeGreaterThanOrEqual(expectedImprovement);
  }
}

/**
 * Mock Data Generators
 */
export class MockDataGenerator {
  /**
   * Generate mock database query result
   */
  static generateQueryResult(count: number = 100): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `id-${i}`,
      name: `Item ${i}`,
      description: `Description for item ${i}`,
      createdAt: new Date(Date.now() - Math.random() * 10000000),
      updatedAt: new Date(),
      metadata: {
        tags: [`tag-${i % 5}`, `tag-${i % 3}`],
        category: `category-${i % 10}`,
        priority: i % 5,
      },
    }));
  }

  /**
   * Generate large dataset for performance testing
   */
  static generateLargeDataset(size: number = 10000): any[] {
    return Array.from({ length: size }, (_, i) => ({
      id: i,
      value: Math.random() * 1000,
      timestamp: Date.now() - i * 1000,
      data: {
        field1: `value-${i}`,
        field2: Math.random(),
        field3: i % 2 === 0,
        nested: {
          level1: {
            level2: {
              value: `deep-${i}`,
            },
          },
        },
      },
    }));
  }

  /**
   * Generate mock React component props
   */
  static generateComponentProps(overrides = {}): any {
    return {
      id: 'test-id',
      className: 'test-class',
      data: this.generateQueryResult(10),
      loading: false,
      error: null,
      onUpdate: jest.fn(),
      onDelete: jest.fn(),
      ...overrides,
    };
  }
}

/**
 * Async Testing Utilities
 */
export class AsyncTestUtils {
  /**
   * Wait for async operations with timeout
   */
  static async waitForAsync(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await Promise.resolve(condition());
      if (result) return;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  }

  /**
   * Retry an operation with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 100
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, initialDelay * Math.pow(2, i))
          );
        }
      }
    }
    
    throw lastError || new Error('Retry failed');
  }

  /**
   * Test async operation performance
   */
  static async measureAsyncPerformance<T>(
    operation: () => Promise<T>,
    iterations: number = 10
  ): Promise<{ average: number; min: number; max: number; results: T[] }> {
    const durations: number[] = [];
    const results: T[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const result = await operation();
      const duration = performance.now() - start;
      
      durations.push(duration);
      results.push(result);
    }
    
    return {
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      results,
    };
  }
}

/**
 * Cache Testing Utilities
 */
export class CacheTestUtils {
  /**
   * Create mock Redis client
   */
  static createMockRedisClient() {
    const store = new Map<string, any>();
    const ttls = new Map<string, number>();
    
    return {
      get: jest.fn(async (key: string) => {
        const ttl = ttls.get(key);
        if (ttl && ttl < Date.now()) {
          store.delete(key);
          ttls.delete(key);
          return null;
        }
        return store.get(key) || null;
      }),
      set: jest.fn(async (key: string, value: any, options?: { ex?: number }) => {
        store.set(key, value);
        if (options?.ex) {
          ttls.set(key, Date.now() + options.ex * 1000);
        }
        return 'OK';
      }),
      del: jest.fn(async (key: string) => {
        const existed = store.has(key);
        store.delete(key);
        ttls.delete(key);
        return existed ? 1 : 0;
      }),
      exists: jest.fn(async (key: string) => {
        const ttl = ttls.get(key);
        if (ttl && ttl < Date.now()) {
          store.delete(key);
          ttls.delete(key);
          return 0;
        }
        return store.has(key) ? 1 : 0;
      }),
      expire: jest.fn(async (key: string, seconds: number) => {
        if (store.has(key)) {
          ttls.set(key, Date.now() + seconds * 1000);
          return 1;
        }
        return 0;
      }),
      ttl: jest.fn(async (key: string) => {
        const ttl = ttls.get(key);
        if (!ttl) return -1;
        const remaining = Math.floor((ttl - Date.now()) / 1000);
        return remaining > 0 ? remaining : -1;
      }),
      flushall: jest.fn(async () => {
        store.clear();
        ttls.clear();
        return 'OK';
      }),
      keys: jest.fn(async (pattern: string) => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(store.keys()).filter(key => regex.test(key));
      }),
    };
  }

  /**
   * Simulate cache hit/miss scenarios
   */
  static async simulateCacheScenarios(
    cacheOperation: (key: string) => Promise<any>,
    scenarios: Array<{ key: string; expectedHit: boolean }>
  ): Promise<void> {
    for (const { key, expectedHit } of scenarios) {
      const result = await cacheOperation(key);
      if (expectedHit) {
        expect(result).toBeDefined();
      } else {
        expect(result).toBeNull();
      }
    }
  }
}

/**
 * Database Testing Utilities
 */
export class DatabaseTestUtils {
  /**
   * Create mock Prisma client
   */
  static createMockPrismaClient() {
    const mockClient = {
      $transaction: jest.fn(async (operations: any[]) => {
        const results = [];
        for (const op of operations) {
          results.push(await op);
        }
        return results;
      }),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn(),
      // Add model-specific mocks
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      course: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    
    return mockClient;
  }

  /**
   * Simulate database connection pool scenarios
   */
  static simulateConnectionPool(maxConnections: number = 10) {
    const connections: any[] = [];
    let activeCount = 0;
    
    return {
      acquire: jest.fn(async () => {
        if (activeCount >= maxConnections) {
          throw new Error('Connection pool exhausted');
        }
        activeCount++;
        const connection = { id: `conn-${Date.now()}`, active: true };
        connections.push(connection);
        return connection;
      }),
      release: jest.fn(async (connection: any) => {
        const index = connections.indexOf(connection);
        if (index !== -1) {
          connections[index].active = false;
          activeCount--;
        }
      }),
      getActiveCount: () => activeCount,
      getPoolSize: () => connections.length,
      drain: jest.fn(async () => {
        connections.length = 0;
        activeCount = 0;
      }),
    };
  }
}

/**
 * React Component Testing Utilities
 */
export class ReactTestUtils {
  /**
   * Custom render with providers
   */
  static renderWithProviders(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
  ) {
    // Add any necessary providers here
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(React.Fragment, null, children);
    };

    return render(ui, { wrapper: Wrapper, ...options });
  }

  /**
   * Test component re-render count
   */
  static measureRenderCount(Component: React.ComponentType<any>, props: any) {
    let renderCount = 0;
    
    const WrappedComponent = (wrappedProps: any) => {
      renderCount++;
      return React.createElement(Component, wrappedProps);
    };
    
    const { rerender } = render(React.createElement(WrappedComponent, props));
    
    return {
      getRenderCount: () => renderCount,
      rerender: (newProps: any) => rerender(React.createElement(WrappedComponent, newProps)),
    };
  }

  /**
   * Test memo optimization effectiveness
   */
  static testMemoization(
    Component: React.ComponentType<any>,
    props: any,
    updatedProps: any
  ): { initialRenders: number; afterUpdateRenders: number } {
    const { getRenderCount, rerender } = this.measureRenderCount(Component, props);
    const initialRenders = getRenderCount();
    
    // Re-render with same props (should not trigger re-render if memoized)
    rerender(props);
    const afterSamePropsRenders = getRenderCount();
    
    // Re-render with different props (should trigger re-render)
    rerender(updatedProps);
    const afterUpdateRenders = getRenderCount();
    
    return {
      initialRenders: afterSamePropsRenders - initialRenders,
      afterUpdateRenders: afterUpdateRenders - afterSamePropsRenders,
    };
  }
}

/**
 * Memory Testing Utilities
 */
export class MemoryTestUtils {
  /**
   * Measure memory usage
   */
  static measureMemory(): { heapUsed: number; external: number; rss: number } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        external: usage.external,
        rss: usage.rss,
      };
    }
    return { heapUsed: 0, external: 0, rss: 0 };
  }

  /**
   * Detect memory leaks
   */
  static async detectMemoryLeak(
    operation: () => Promise<void>,
    iterations: number = 100,
    threshold: number = 10 * 1024 * 1024 // 10MB
  ): Promise<boolean> {
    // Force garbage collection if available
    if (global.gc) global.gc();
    
    const initialMemory = this.measureMemory().heapUsed;
    
    for (let i = 0; i < iterations; i++) {
      await operation();
    }
    
    // Force garbage collection if available
    if (global.gc) global.gc();
    
    const finalMemory = this.measureMemory().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    return memoryIncrease > threshold;
  }
}

/**
 * Network Testing Utilities
 */
export class NetworkTestUtils {
  /**
   * Mock fetch with custom responses
   */
  static mockFetch(responses: Map<string, any>) {
    global.fetch = jest.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      const response = responses.get(urlString);
      
      if (!response) {
        return Promise.reject(new Error(`No mock response for ${urlString}`));
      }
      
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => response,
        text: async () => JSON.stringify(response),
        headers: new Headers(),
      } as Response);
    });
  }

  /**
   * Simulate network latency
   */
  static async simulateLatency(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test API rate limiting
   */
  static async testRateLimit(
    apiCall: () => Promise<any>,
    limit: number,
    windowMs: number
  ): Promise<{ successful: number; rateLimited: number }> {
    let successful = 0;
    let rateLimited = 0;
    
    const promises = Array.from({ length: limit + 5 }, async () => {
      try {
        await apiCall();
        successful++;
      } catch (error: any) {
        if (error.status === 429 || error.message.includes('rate limit')) {
          rateLimited++;
        }
      }
    });
    
    await Promise.all(promises);
    
    return { successful, rateLimited };
  }
}

/**
 * Benchmark Testing Utilities
 */
export class BenchmarkTestUtils {
  /**
   * Run performance benchmark
   */
  static async runBenchmark(
    name: string,
    operation: () => void | Promise<void>,
    options: {
      iterations?: number;
      warmup?: number;
      async?: boolean;
    } = {}
  ): Promise<{
    name: string;
    average: number;
    min: number;
    max: number;
    median: number;
    stdDev: number;
  }> {
    const { iterations = 1000, warmup = 10, async = false } = options;
    
    // Warmup runs
    for (let i = 0; i < warmup; i++) {
      if (async) {
        await operation();
      } else {
        operation();
      }
    }
    
    // Actual benchmark runs
    const durations: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      if (async) {
        await operation();
      } else {
        operation();
      }
      const duration = performance.now() - start;
      durations.push(duration);
    }
    
    // Calculate statistics
    durations.sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);
    const average = sum / durations.length;
    const median = durations[Math.floor(durations.length / 2)];
    const variance = durations.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      name,
      average,
      min: durations[0],
      max: durations[durations.length - 1],
      median,
      stdDev,
    };
  }

  /**
   * Compare performance between implementations
   */
  static async compareBenchmarks(
    benchmarks: Array<{ name: string; operation: () => void | Promise<void> }>,
    options?: Parameters<typeof this.runBenchmark>[2]
  ): Promise<void> {
    const results = await Promise.all(
      benchmarks.map(({ name, operation }) => 
        this.runBenchmark(name, operation, options)
      )
    );
    
    // Sort by average performance
    results.sort((a, b) => a.average - b.average);
    
    console.table(results.map(r => ({
      Name: r.name,
      'Avg (ms)': r.average.toFixed(3),
      'Min (ms)': r.min.toFixed(3),
      'Max (ms)': r.max.toFixed(3),
      'Median (ms)': r.median.toFixed(3),
      'Std Dev': r.stdDev.toFixed(3),
    })));
    
    // Assert that the first (fastest) is significantly faster than the last
    if (results.length > 1) {
      const fastest = results[0];
      const slowest = results[results.length - 1];
      const improvement = ((slowest.average - fastest.average) / slowest.average) * 100;
      
      console.log(`\n${fastest.name} is ${improvement.toFixed(1)}% faster than ${slowest.name}`);
    }
  }
}

/**
 * Test Fixture Management
 */
export class TestFixtures {
  private static fixtures: Map<string, any> = new Map();

  /**
   * Register a test fixture
   */
  static register(name: string, fixture: any): void {
    this.fixtures.set(name, fixture);
  }

  /**
   * Get a test fixture
   */
  static get<T>(name: string): T {
    if (!this.fixtures.has(name)) {
      throw new Error(`Fixture '${name}' not found`);
    }
    return this.fixtures.get(name) as T;
  }

  /**
   * Clear all fixtures
   */
  static clear(): void {
    this.fixtures.clear();
  }

  /**
   * Create standard fixtures
   */
  static createStandardFixtures(): void {
    this.register('mockUser', {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER',
    });

    this.register('mockCourse', {
      id: 'course-123',
      title: 'Test Course',
      description: 'Test Description',
      userId: 'user-123',
      isPublished: true,
    });

    this.register('mockApiResponse', {
      success: true,
      data: [],
      message: 'Operation successful',
    });
  }
}

// Export all utilities
export {
  PerformanceTestUtils as Performance,
  MockDataGenerator as MockData,
  AsyncTestUtils as Async,
  CacheTestUtils as Cache,
  DatabaseTestUtils as Database,
  ReactTestUtils as ReactTest,
  MemoryTestUtils as Memory,
  NetworkTestUtils as Network,
  BenchmarkTestUtils as Benchmark,
  TestFixtures as Fixtures,
};