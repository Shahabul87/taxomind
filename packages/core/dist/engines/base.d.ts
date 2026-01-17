/**
 * @sam-ai/core - Base Engine
 * Abstract base class for all SAM engines
 */
import type { SAMConfig, SAMLogger, CacheAdapter, AIAdapter, EngineInput, EngineResult } from '../types';
export interface BaseEngineOptions {
    config: SAMConfig;
    name: string;
    version: string;
    dependencies?: string[];
    timeout?: number;
    retries?: number;
    cacheEnabled?: boolean;
    cacheTTL?: number;
}
export declare abstract class BaseEngine<TInput = unknown, TOutput = unknown> {
    readonly name: string;
    readonly version: string;
    readonly dependencies: string[];
    protected readonly config: SAMConfig;
    protected readonly logger: SAMLogger;
    protected readonly ai: AIAdapter;
    protected readonly cache?: CacheAdapter;
    protected readonly timeout: number;
    protected readonly retries: number;
    protected readonly cacheEnabled: boolean;
    protected readonly cacheTTL: number;
    private initialized;
    private initializing;
    constructor(options: BaseEngineOptions);
    /**
     * Initialize the engine (called once before first execution)
     */
    initialize(): Promise<void>;
    /**
     * Execute the engine
     */
    execute(input: EngineInput & TInput): Promise<EngineResult<TOutput>>;
    /**
     * Check if the engine is initialized
     */
    isInitialized(): boolean;
    /**
     * Initialize the engine (override for custom initialization)
     */
    protected onInitialize(): Promise<void>;
    /**
     * Process the input and return output
     */
    protected abstract process(input: EngineInput & TInput): Promise<TOutput>;
    /**
     * Generate a cache key for the input
     */
    protected abstract getCacheKey(input: EngineInput & TInput): string;
    /**
     * Validate that all dependencies have been executed
     */
    protected validateDependencies(previousResults: Record<string, EngineResult>): void;
    /**
     * Get dependency result with type safety
     */
    protected getDependencyResult<T>(previousResults: Record<string, EngineResult>, engineName: string): T;
    /**
     * Try to get a value from cache
     */
    protected tryGetFromCache<T>(key: string): Promise<T | null>;
    /**
     * Try to set a value in cache
     */
    protected trySetCache<T>(key: string, value: T): Promise<void>;
    /**
     * Create a successful result
     */
    protected createResult(data: TOutput, startTime: number, cached: boolean): EngineResult<TOutput>;
    /**
     * Create an error result
     */
    protected createErrorResult(error: unknown, startTime: number): EngineResult<TOutput>;
    /**
     * Call the AI adapter for chat completion
     */
    protected callAI(params: {
        systemPrompt?: string;
        userMessage: string;
        temperature?: number;
        maxTokens?: number;
    }): Promise<{
        content: string;
        tokens: {
            input: number;
            output: number;
        };
    }>;
    /**
     * Parse JSON from AI response safely
     */
    protected parseJSON<T>(content: string, fallback: T): T;
    /**
     * Generate a hash for cache keys
     */
    protected hashString(str: string): string;
}
//# sourceMappingURL=base.d.ts.map