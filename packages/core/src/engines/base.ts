/**
 * @sam-ai/core - Base Engine
 * Abstract base class for all SAM engines
 */

import type {
  SAMConfig,
  SAMLogger,
  CacheAdapter,
  AIAdapter,
  EngineInput,
  EngineResult,
  EngineResultMetadata,
} from '../types';
import {
  SAMError,
  EngineError,
  DependencyError,
  withTimeout,
  withRetry,
} from '../errors';

// ============================================================================
// ENGINE OPTIONS
// ============================================================================

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

// ============================================================================
// BASE ENGINE
// ============================================================================

export abstract class BaseEngine<TInput = unknown, TOutput = unknown> {
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

  private initialized = false;
  private initializing = false;

  constructor(options: BaseEngineOptions) {
    this.name = options.name;
    this.version = options.version;
    this.dependencies = options.dependencies ?? [];
    this.config = options.config;
    this.logger = options.config.logger ?? console;
    this.ai = options.config.ai;
    this.cache = options.config.cache;

    this.timeout = options.timeout ?? options.config.engine.timeout;
    this.retries = options.retries ?? options.config.engine.retries;
    this.cacheEnabled = options.cacheEnabled ?? options.config.engine.cacheEnabled;
    this.cacheTTL = options.cacheTTL ?? options.config.engine.cacheTTL;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Initialize the engine (called once before first execution)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) {
      // Wait for ongoing initialization
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.initialize();
    }

    this.initializing = true;

    try {
      this.logger.debug(`[${this.name}] Initializing engine v${this.version}`);
      await this.onInitialize();
      this.initialized = true;
      this.logger.debug(`[${this.name}] Engine initialized successfully`);
    } catch (error) {
      this.initializing = false;
      throw new EngineError(this.name, `Failed to initialize: ${(error as Error).message}`, {
        cause: error as Error,
        recoverable: false,
      });
    } finally {
      this.initializing = false;
    }
  }

  /**
   * Execute the engine
   */
  async execute(input: EngineInput & TInput): Promise<EngineResult<TOutput>> {
    const startTime = Date.now();

    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // Validate dependencies
    this.validateDependencies(input.previousResults ?? {});

    // Check cache
    if (this.cacheEnabled && this.cache) {
      const cacheKey = this.getCacheKey(input);
      const cached = await this.tryGetFromCache<TOutput>(cacheKey);

      if (cached !== null) {
        return this.createResult(cached, startTime, true);
      }
    }

    // Execute with timeout and retry
    try {
      const result = await withRetry(
        () =>
          withTimeout(
            this.process(input),
            this.timeout,
            this.name
          ),
        {
          retries: this.retries,
          onRetry: (error, attempt) => {
            this.logger.warn(
              `[${this.name}] Retry attempt ${attempt}/${this.retries}: ${error.message}`
            );
          },
        }
      );

      // Cache successful result
      if (this.cacheEnabled && this.cache && result !== null) {
        const cacheKey = this.getCacheKey(input);
        await this.trySetCache(cacheKey, result);
      }

      return this.createResult(result, startTime, false);
    } catch (error) {
      return this.createErrorResult(error, startTime);
    }
  }

  /**
   * Check if the engine is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ============================================================================
  // ABSTRACT METHODS (implement in subclasses)
  // ============================================================================

  /**
   * Initialize the engine (override for custom initialization)
   */
  protected async onInitialize(): Promise<void> {
    // Default: no-op
  }

  /**
   * Process the input and return output
   */
  protected abstract process(input: EngineInput & TInput): Promise<TOutput>;

  /**
   * Generate a cache key for the input
   */
  protected abstract getCacheKey(input: EngineInput & TInput): string;

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Validate that all dependencies have been executed
   */
  protected validateDependencies(previousResults: Record<string, EngineResult>): void {
    for (const dep of this.dependencies) {
      const result = previousResults[dep];

      if (!result) {
        throw new DependencyError(this.name, dep);
      }

      if (!result.success) {
        throw new EngineError(
          this.name,
          `Dependency "${dep}" failed: ${result.error?.message ?? 'Unknown error'}`,
          { recoverable: false }
        );
      }
    }
  }

  /**
   * Get dependency result with type safety
   */
  protected getDependencyResult<T>(
    previousResults: Record<string, EngineResult>,
    engineName: string
  ): T {
    const result = previousResults[engineName];

    if (!result) {
      throw new DependencyError(this.name, engineName);
    }

    if (!result.success) {
      throw new EngineError(
        this.name,
        `Dependency "${engineName}" failed`,
        { recoverable: false }
      );
    }

    return result.data as T;
  }

  /**
   * Try to get a value from cache
   */
  protected async tryGetFromCache<T>(key: string): Promise<T | null> {
    if (!this.cache) return null;

    try {
      const cached = await this.cache.get<T>(key);
      if (cached !== null) {
        this.logger.debug(`[${this.name}] Cache hit: ${key}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn(`[${this.name}] Cache get error: ${(error as Error).message}`);
    }

    return null;
  }

  /**
   * Try to set a value in cache
   */
  protected async trySetCache<T>(key: string, value: T): Promise<void> {
    if (!this.cache) return;

    try {
      await this.cache.set(key, value, this.cacheTTL);
      this.logger.debug(`[${this.name}] Cache set: ${key}`);
    } catch (error) {
      this.logger.warn(`[${this.name}] Cache set error: ${(error as Error).message}`);
    }
  }

  /**
   * Create a successful result
   */
  protected createResult(
    data: TOutput,
    startTime: number,
    cached: boolean
  ): EngineResult<TOutput> {
    const metadata: EngineResultMetadata = {
      executionTime: Date.now() - startTime,
      cached,
      version: this.version,
    };

    return {
      engineName: this.name,
      success: true,
      data,
      metadata,
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(error: unknown, startTime: number): EngineResult<TOutput> {
    const samError: SAMError =
      error instanceof SAMError
        ? error
        : new EngineError(this.name, (error as Error).message, {
            cause: error as Error,
          });

    this.logger.error(`[${this.name}] Execution failed: ${samError.message}`);

    return {
      engineName: this.name,
      success: false,
      data: null,
      metadata: {
        executionTime: Date.now() - startTime,
        cached: false,
        version: this.version,
      },
      error: {
        code: samError.code,
        message: samError.message,
        details: samError.details,
        recoverable: samError.recoverable,
      },
    };
  }

  /**
   * Call the AI adapter for chat completion
   */
  protected async callAI(params: {
    systemPrompt?: string;
    userMessage: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ content: string; tokens: { input: number; output: number } }> {
    const response = await this.ai.chat({
      messages: [{ role: 'user', content: params.userMessage }],
      systemPrompt: params.systemPrompt,
      temperature: params.temperature ?? this.config.model.temperature,
      maxTokens: params.maxTokens ?? this.config.model.maxTokens,
    });

    return {
      content: response.content,
      tokens: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    };
  }

  /**
   * Parse JSON from AI response safely
   */
  protected parseJSON<T>(content: string, fallback: T): T {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      return JSON.parse(jsonString) as T;
    } catch {
      this.logger.warn(`[${this.name}] Failed to parse JSON response`);
      return fallback;
    }
  }

  /**
   * Generate a hash for cache keys
   */
  protected hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
