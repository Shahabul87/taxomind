/**
 * SAM Base Engine
 * Abstract base class for all SAM engines with no database dependencies
 */
export class BaseEngine {
    config;
    logger;
    storage;
    initialized = false;
    cache = new Map();
    constructor(config = {}) {
        this.config = config;
        this.logger = config.logger || this.createDefaultLogger();
        this.storage = config.storage || null;
    }
    /**
     * Initialize the engine
     */
    async initialize(config) {
        if (this.initialized) {
            this.logger.warn(`${this.name} is already initialized`);
            return;
        }
        if (config) {
            this.config = { ...this.config, ...config };
        }
        try {
            await this.performInitialization();
            this.initialized = true;
            this.logger.info(`${this.name} initialized successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to initialize ${this.name}`, error);
            throw new Error(`Engine initialization failed: ${this.name}`);
        }
    }
    /**
     * Optional analysis method
     */
    async analyze(data) {
        return {
            engineName: this.name,
            timestamp: new Date(),
            data,
            confidence: 1.0,
            recommendations: []
        };
    }
    /**
     * Cleanup and destroy engine
     */
    async destroy() {
        this.cache.clear();
        this.initialized = false;
        this.logger.info(`${this.name} destroyed`);
    }
    /**
     * Validate input data
     */
    validate(data, validator) {
        const result = validator(data);
        if (!result.valid) {
            const errors = result.errors?.join(', ') || 'Validation failed';
            throw new Error(`Validation error in ${this.name}: ${errors}`);
        }
        return data;
    }
    /**
     * Cache management with TTL
     */
    async withCache(key, factory, ttlSeconds = 300) {
        // Check in-memory cache first
        const now = Date.now();
        const cached = this.cache.get(key);
        if (cached && cached.expiry > now) {
            this.logger.debug(`Cache hit for key: ${key}`);
            return cached.data;
        }
        // Check persistent storage if available
        if (this.storage) {
            try {
                const stored = await this.storage.get(key);
                if (stored) {
                    this.logger.debug(`Storage hit for key: ${key}`);
                    // Update in-memory cache
                    this.cache.set(key, {
                        data: stored,
                        expiry: now + ttlSeconds * 1000
                    });
                    return stored;
                }
            }
            catch (error) {
                this.logger.warn(`Storage read failed for key: ${key}`, error);
            }
        }
        // Generate new data
        this.logger.debug(`Cache miss for key: ${key}, generating new data`);
        const data = await factory();
        // Store in cache
        this.cache.set(key, {
            data,
            expiry: now + ttlSeconds * 1000
        });
        // Store in persistent storage if available
        if (this.storage) {
            try {
                await this.storage.set(key, data, ttlSeconds);
            }
            catch (error) {
                this.logger.warn(`Storage write failed for key: ${key}`, error);
            }
        }
        // Cleanup expired cache entries periodically
        if (Math.random() < 0.1) {
            this.cleanupCache();
        }
        return data;
    }
    /**
     * Clean up expired cache entries
     */
    cleanupCache() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, value] of this.cache.entries()) {
            if (value.expiry < now) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            this.logger.debug(`Cleaned ${cleaned} expired cache entries`);
        }
    }
    /**
     * Performance monitoring wrapper
     */
    async measurePerformance(operation, fn) {
        const start = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - start;
            if (duration > 1000) {
                this.logger.warn(`Slow operation in ${this.name}: ${operation} took ${duration}ms`);
            }
            else {
                this.logger.debug(`${operation} completed in ${duration}ms`);
            }
            return result;
        }
        catch (error) {
            const duration = Date.now() - start;
            this.logger.error(`Operation failed in ${this.name}: ${operation} after ${duration}ms`, error);
            throw error;
        }
    }
    /**
     * Rate limiting helper
     */
    rateLimitMap = new Map();
    async checkRateLimit(key, maxRequests = 60, windowMs = 60000) {
        const now = Date.now();
        const limit = this.rateLimitMap.get(key);
        if (!limit || limit.resetTime < now) {
            // Reset or create new limit
            this.rateLimitMap.set(key, {
                count: 1,
                resetTime: now + windowMs
            });
            return true;
        }
        if (limit.count >= maxRequests) {
            this.logger.warn(`Rate limit exceeded for ${key}`);
            return false;
        }
        limit.count++;
        return true;
    }
    /**
     * Sanitization helpers
     */
    sanitizeString(input, maxLength = 1000) {
        if (typeof input !== 'string') {
            return '';
        }
        return input
            .slice(0, maxLength)
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .trim();
    }
    sanitizeNumber(input, min, max, defaultValue) {
        const num = Number(input);
        if (isNaN(num)) {
            return defaultValue;
        }
        return Math.max(min, Math.min(max, num));
    }
    /**
     * Pagination helper
     */
    paginate(items, page = 1, limit = 20) {
        const total = items.length;
        const totalPages = Math.ceil(total / limit);
        const currentPage = Math.max(1, Math.min(page, totalPages));
        const start = (currentPage - 1) * limit;
        const end = start + limit;
        return {
            items: items.slice(start, end),
            total,
            page: currentPage,
            totalPages,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1
        };
    }
    /**
     * Batch processing helper
     */
    async processBatch(items, processor, batchSize = 10) {
        const results = [];
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(item => processor(item).catch(error => {
                this.logger.error(`Batch processing error`, error);
                return null;
            })));
            results.push(...batchResults.filter(r => r !== null));
        }
        return results;
    }
    /**
     * Retry mechanism for operations
     */
    async retry(operation, maxAttempts = 3, delayMs = 1000) {
        let lastError = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                this.logger.warn(`Attempt ${attempt}/${maxAttempts} failed: ${error.message}`);
                if (attempt < maxAttempts) {
                    await this.delay(delayMs * attempt); // Exponential backoff
                }
            }
        }
        throw lastError || new Error('Retry failed');
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Create default logger
     */
    createDefaultLogger() {
        return {
            debug: (message, ...args) => {
                if (process.env.NODE_ENV === 'development') {
                    console.debug(`[${this.name}] ${message}`, ...args);
                }
            },
            info: (message, ...args) => {
                console.info(`[${this.name}] ${message}`, ...args);
            },
            warn: (message, ...args) => {
                console.warn(`[${this.name}] ${message}`, ...args);
            },
            error: (message, error, ...args) => {
                console.error(`[${this.name}] ${message}`, error, ...args);
            }
        };
    }
}
//# sourceMappingURL=base-engine.js.map