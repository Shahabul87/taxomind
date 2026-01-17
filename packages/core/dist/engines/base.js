/**
 * @sam-ai/core - Base Engine
 * Abstract base class for all SAM engines
 */
import { SAMError, EngineError, DependencyError, withTimeout, withRetry, } from '../errors';
// ============================================================================
// BASE ENGINE
// ============================================================================
export class BaseEngine {
    name;
    version;
    dependencies;
    config;
    logger;
    ai;
    cache;
    timeout;
    retries;
    cacheEnabled;
    cacheTTL;
    initialized = false;
    initializing = false;
    constructor(options) {
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
    async initialize() {
        if (this.initialized)
            return;
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
        }
        catch (error) {
            this.initializing = false;
            throw new EngineError(this.name, `Failed to initialize: ${error.message}`, {
                cause: error,
                recoverable: false,
            });
        }
        finally {
            this.initializing = false;
        }
    }
    /**
     * Execute the engine
     */
    async execute(input) {
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
            const cached = await this.tryGetFromCache(cacheKey);
            if (cached !== null) {
                return this.createResult(cached, startTime, true);
            }
        }
        // Execute with timeout and retry
        try {
            const result = await withRetry(() => withTimeout(this.process(input), this.timeout, this.name), {
                retries: this.retries,
                onRetry: (error, attempt) => {
                    this.logger.warn(`[${this.name}] Retry attempt ${attempt}/${this.retries}: ${error.message}`);
                },
            });
            // Cache successful result
            if (this.cacheEnabled && this.cache && result !== null) {
                const cacheKey = this.getCacheKey(input);
                await this.trySetCache(cacheKey, result);
            }
            return this.createResult(result, startTime, false);
        }
        catch (error) {
            return this.createErrorResult(error, startTime);
        }
    }
    /**
     * Check if the engine is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    // ============================================================================
    // ABSTRACT METHODS (implement in subclasses)
    // ============================================================================
    /**
     * Initialize the engine (override for custom initialization)
     */
    async onInitialize() {
        // Default: no-op
    }
    // ============================================================================
    // HELPER METHODS
    // ============================================================================
    /**
     * Validate that all dependencies have been executed
     */
    validateDependencies(previousResults) {
        for (const dep of this.dependencies) {
            const result = previousResults[dep];
            if (!result) {
                throw new DependencyError(this.name, dep);
            }
            if (!result.success) {
                throw new EngineError(this.name, `Dependency "${dep}" failed: ${result.error?.message ?? 'Unknown error'}`, { recoverable: false });
            }
        }
    }
    /**
     * Get dependency result with type safety
     */
    getDependencyResult(previousResults, engineName) {
        const result = previousResults[engineName];
        if (!result) {
            throw new DependencyError(this.name, engineName);
        }
        if (!result.success) {
            throw new EngineError(this.name, `Dependency "${engineName}" failed`, { recoverable: false });
        }
        return result.data;
    }
    /**
     * Try to get a value from cache
     */
    async tryGetFromCache(key) {
        if (!this.cache)
            return null;
        try {
            const cached = await this.cache.get(key);
            if (cached !== null) {
                this.logger.debug(`[${this.name}] Cache hit: ${key}`);
                return cached;
            }
        }
        catch (error) {
            this.logger.warn(`[${this.name}] Cache get error: ${error.message}`);
        }
        return null;
    }
    /**
     * Try to set a value in cache
     */
    async trySetCache(key, value) {
        if (!this.cache)
            return;
        try {
            await this.cache.set(key, value, this.cacheTTL);
            this.logger.debug(`[${this.name}] Cache set: ${key}`);
        }
        catch (error) {
            this.logger.warn(`[${this.name}] Cache set error: ${error.message}`);
        }
    }
    /**
     * Create a successful result
     */
    createResult(data, startTime, cached) {
        const metadata = {
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
    createErrorResult(error, startTime) {
        const samError = error instanceof SAMError
            ? error
            : new EngineError(this.name, error.message, {
                cause: error,
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
    async callAI(params) {
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
    parseJSON(content, fallback) {
        try {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
            return JSON.parse(jsonString);
        }
        catch {
            this.logger.warn(`[${this.name}] Failed to parse JSON response`);
            return fallback;
        }
    }
    /**
     * Generate a hash for cache keys
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }
}
//# sourceMappingURL=base.js.map