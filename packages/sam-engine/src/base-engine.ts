/**
 * SAM Base Engine
 * Abstract base class for all SAM engines with no database dependencies
 */

import type { 
  SAMEngine, 
  SAMEngineConfig, 
  SAMContext, 
  AnalysisResult,
  SAMLogger,
  SAMStorage,
  ValidationResult
} from './types';

export abstract class BaseEngine implements SAMEngine {
  protected config: SAMEngineConfig;
  protected logger: SAMLogger;
  protected storage: SAMStorage | null;
  protected initialized: boolean = false;
  protected cache: Map<string, { data: any; expiry: number }> = new Map();
  
  public abstract name: string;

  constructor(config: SAMEngineConfig = {}) {
    this.config = config;
    this.logger = config.logger || this.createDefaultLogger();
    this.storage = config.storage || null;
  }

  /**
   * Initialize the engine
   */
  async initialize(config?: SAMEngineConfig): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to initialize ${this.name}`, error);
      throw new Error(`Engine initialization failed: ${this.name}`);
    }
  }

  /**
   * Abstract method for engine-specific initialization
   */
  protected abstract performInitialization(): Promise<void>;

  /**
   * Process input with context
   */
  abstract process(context: SAMContext, input: any): Promise<any>;

  /**
   * Optional analysis method
   */
  async analyze?(data: any): Promise<AnalysisResult> {
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
  async destroy(): Promise<void> {
    this.cache.clear();
    this.initialized = false;
    this.logger.info(`${this.name} destroyed`);
  }

  /**
   * Validate input data
   */
  protected validate<T>(data: any, validator: (data: any) => ValidationResult): T {
    const result = validator(data);
    if (!result.valid) {
      const errors = result.errors?.join(', ') || 'Validation failed';
      throw new Error(`Validation error in ${this.name}: ${errors}`);
    }
    return data as T;
  }

  /**
   * Cache management with TTL
   */
  protected async withCache<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Check in-memory cache first
    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached && cached.expiry > now) {
      this.logger.debug(`Cache hit for key: ${key}`);
      return cached.data as T;
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
          return stored as T;
        }
      } catch (error) {
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
      } catch (error) {
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
  private cleanupCache(): void {
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
  protected async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        this.logger.warn(`Slow operation in ${this.name}: ${operation} took ${duration}ms`);
      } else {
        this.logger.debug(`${operation} completed in ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(`Operation failed in ${this.name}: ${operation} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Rate limiting helper
   */
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  protected async checkRateLimit(
    key: string,
    maxRequests: number = 60,
    windowMs: number = 60000
  ): Promise<boolean> {
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
  protected sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .slice(0, maxLength)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  protected sanitizeNumber(
    input: any,
    min: number,
    max: number,
    defaultValue: number
  ): number {
    const num = Number(input);
    if (isNaN(num)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, num));
  }

  /**
   * Pagination helper
   */
  protected paginate<T>(
    items: T[],
    page: number = 1,
    limit: number = 20
  ): {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
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
  protected async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item).catch(error => {
          this.logger.error(`Batch processing error`, error);
          return null;
        }))
      );
      results.push(...batchResults.filter(r => r !== null) as R[]);
    }
    
    return results;
  }

  /**
   * Retry mechanism for operations
   */
  protected async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
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
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): SAMLogger {
    return {
      debug: (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[${this.name}] ${message}`, ...args);
        }
      },
      info: (message: string, ...args: any[]) => {
        console.info(`[${this.name}] ${message}`, ...args);
      },
      warn: (message: string, ...args: any[]) => {
        console.warn(`[${this.name}] ${message}`, ...args);
      },
      error: (message: string, error?: any, ...args: any[]) => {
        console.error(`[${this.name}] ${message}`, error, ...args);
      }
    };
  }
}