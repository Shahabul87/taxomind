/**
 * Test Setup for @sam-ai/core
 * Common mocks and utilities for testing
 */
import { vi } from 'vitest';
import { createDefaultContext } from '../types';
// ============================================================================
// MOCK LOGGER
// ============================================================================
export function createMockLogger() {
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
export function createMockAIAdapter(overrides) {
    return {
        name: 'mock-ai',
        version: '1.0.0',
        chat: vi.fn().mockResolvedValue({
            content: 'Mock AI response',
            model: 'mock-model',
            usage: { inputTokens: 100, outputTokens: 50 },
            finishReason: 'stop',
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
export function createMockCacheAdapter(overrides) {
    const cache = new Map();
    return {
        name: 'mock-cache',
        get: vi.fn().mockImplementation(async (key) => {
            return cache.get(key) ?? null;
        }),
        set: vi.fn().mockImplementation(async (key, value) => {
            cache.set(key, value);
        }),
        delete: vi.fn().mockImplementation(async (key) => {
            return cache.delete(key);
        }),
        has: vi.fn().mockImplementation(async (key) => {
            return cache.has(key);
        }),
        clear: vi.fn().mockImplementation(async () => {
            cache.clear();
        }),
        getMany: vi.fn().mockImplementation(async (keys) => {
            const result = new Map();
            for (const key of keys) {
                const value = cache.get(key);
                if (value !== undefined) {
                    result.set(key, value);
                }
            }
            return result;
        }),
        setMany: vi.fn().mockImplementation(async (entries) => {
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
export function createMockConfig(overrides) {
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
export function createMockContext(overrides) {
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
export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Create a deferred promise for testing async flows
 */
export function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}
//# sourceMappingURL=setup.js.map