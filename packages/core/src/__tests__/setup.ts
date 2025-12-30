/**
 * Test Setup for @sam-ai/core
 * Common mocks and utilities for testing
 */

import { vi } from 'vitest';
import type {
  SAMConfig,
  SAMContext,
  AIAdapter,
  CacheAdapter,
  SAMLogger,
} from '../types';
import { createDefaultContext } from '../types';

// ============================================================================
// MOCK LOGGER
// ============================================================================

export function createMockLogger(): SAMLogger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

// ============================================================================
// MOCK AI ADAPTER
// ============================================================================

export function createMockAIAdapter(overrides?: Partial<AIAdapter>): AIAdapter {
  return {
    name: 'mock-ai',
    version: '1.0.0',
    chat: vi.fn().mockResolvedValue({
      content: 'Mock AI response',
      model: 'mock-model',
      usage: { inputTokens: 100, outputTokens: 50 },
      finishReason: 'stop' as const,
    }),
    chatStream: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
    getModel: vi.fn().mockReturnValue('mock-model'),
    ...overrides,
  };
}

// ============================================================================
// MOCK CACHE ADAPTER
// ============================================================================

export function createMockCacheAdapter(
  overrides?: Partial<CacheAdapter>
): CacheAdapter {
  const cache = new Map<string, unknown>();

  return {
    name: 'mock-cache',
    get: vi.fn().mockImplementation(async <T>(key: string): Promise<T | null> => {
      return (cache.get(key) as T) ?? null;
    }),
    set: vi.fn().mockImplementation(async <T>(key: string, value: T): Promise<void> => {
      cache.set(key, value);
    }),
    delete: vi.fn().mockImplementation(async (key: string): Promise<boolean> => {
      return cache.delete(key);
    }),
    has: vi.fn().mockImplementation(async (key: string): Promise<boolean> => {
      return cache.has(key);
    }),
    clear: vi.fn().mockImplementation(async (): Promise<void> => {
      cache.clear();
    }),
    getMany: vi.fn().mockImplementation(async <T>(keys: string[]): Promise<Map<string, T>> => {
      const result = new Map<string, T>();
      for (const key of keys) {
        const value = cache.get(key);
        if (value !== undefined) {
          result.set(key, value as T);
        }
      }
      return result;
    }),
    setMany: vi.fn().mockImplementation(async <T>(entries: Map<string, T>): Promise<void> => {
      for (const [key, value] of entries) {
        cache.set(key, value);
      }
    }),
    ...overrides,
  };
}

// ============================================================================
// MOCK CONFIG
// ============================================================================

export function createMockConfig(overrides?: Partial<SAMConfig>): SAMConfig {
  return {
    ai: createMockAIAdapter(),
    logger: createMockLogger(),
    model: {
      name: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      maxTokens: 1000,
    },
    engine: {
      timeout: 30000,
      retries: 2,
      concurrency: 3,
      cacheEnabled: false,
      cacheTTL: 300,
    },
    features: {
      gamification: true,
      streaming: true,
      analytics: false,
    },
    routes: {
      coursesList: '/courses',
      courseDetail: '/courses/:id',
    },
    maxConversationHistory: 50,
    ...overrides,
  };
}

// ============================================================================
// MOCK CONTEXT
// ============================================================================

export function createMockContext(overrides?: Partial<SAMContext>): SAMContext {
  return createDefaultContext({
    user: {
      id: 'test-user-123',
      role: 'teacher',
      name: 'Test User',
      email: 'test@example.com',
      preferences: {
        learningStyle: 'visual',
        preferredTone: 'encouraging',
      },
      capabilities: ['create-course', 'edit-course'],
    },
    page: {
      type: 'dashboard',
      path: '/dashboard',
      capabilities: ['view', 'edit'],
      breadcrumb: ['Home', 'Dashboard'],
    },
    ...overrides,
  });
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Wait for a specified time in tests
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a deferred promise for testing async flows
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
