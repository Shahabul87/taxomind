/**
 * Test Setup for @sam-ai/core
 * Common mocks and utilities for testing
 */
import type { SAMConfig, SAMContext, AIAdapter, CacheAdapter, SAMLogger } from '../types';
export declare function createMockLogger(): SAMLogger;
export declare function createMockAIAdapter(overrides?: Partial<AIAdapter>): AIAdapter;
export declare function createMockCacheAdapter(overrides?: Partial<CacheAdapter>): CacheAdapter;
export declare function createMockConfig(overrides?: Partial<SAMConfig>): SAMConfig;
export declare function createMockContext(overrides?: Partial<SAMContext>): SAMContext;
/**
 * Wait for a specified time in tests
 */
export declare function wait(ms: number): Promise<void>;
/**
 * Create a deferred promise for testing async flows
 */
export declare function createDeferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
};
//# sourceMappingURL=setup.d.ts.map