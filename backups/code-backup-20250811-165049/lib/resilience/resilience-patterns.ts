/**
 * Resilience Patterns
 * Retry logic, fallback strategies, timeout handling, and other resilience patterns
 */

import { RetryOptions } from './circuit-breaker-config';
import { logger } from '@/lib/logger';

/**
 * Retry mechanism with various backoff strategies
 */
export class RetryPattern {
  private options: RetryOptions;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = {
      maxAttempts: options.maxAttempts || 3,
      backoffStrategy: options.backoffStrategy || 'exponential',
      initialDelay: options.initialDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      jitter: options.jitter !== undefined ? options.jitter : true,
    };
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    isRetryableError?: (error: any) => boolean
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        const result = await fn();
        if (attempt > 1) {
}
        return result;
      } catch (error) {
        lastError = error;
        
        logger.warn(`[RETRY] Attempt ${attempt} failed:`, error.message);
        
        // Check if error is retryable
        if (isRetryableError && !isRetryableError(error)) {
          throw error;
        }
        
        // Don't delay after the last attempt
        if (attempt === this.options.maxAttempts) {
          break;
        }
        
        // Calculate and apply delay
        const delay = this.calculateDelay(attempt);

        await this.delay(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Calculate delay based on backoff strategy
   */
  private calculateDelay(attempt: number): number {
    let delay: number;
    
    switch (this.options.backoffStrategy) {
      case 'fixed':
        delay = this.options.initialDelay;
        break;
        
      case 'linear':
        delay = this.options.initialDelay * attempt;
        break;
        
      case 'exponential':
      default:
        delay = this.options.initialDelay * Math.pow(2, attempt - 1);
        break;
    }
    
    // Apply maximum delay limit
    delay = Math.min(delay, this.options.maxDelay);
    
    // Apply jitter to avoid thundering herd
    if (this.options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.round(delay);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create retry pattern with exponential backoff
   */
  static exponential(maxAttempts: number = 3, initialDelay: number = 1000): RetryPattern {
    return new RetryPattern({
      maxAttempts,
      backoffStrategy: 'exponential',
      initialDelay,
      maxDelay: 30000,
      jitter: true,
    });
  }

  /**
   * Create retry pattern with linear backoff
   */
  static linear(maxAttempts: number = 3, initialDelay: number = 1000): RetryPattern {
    return new RetryPattern({
      maxAttempts,
      backoffStrategy: 'linear',
      initialDelay,
      maxDelay: 15000,
      jitter: false,
    });
  }

  /**
   * Create retry pattern with fixed delay
   */
  static fixed(maxAttempts: number = 3, delay: number = 1000): RetryPattern {
    return new RetryPattern({
      maxAttempts,
      backoffStrategy: 'fixed',
      initialDelay: delay,
      maxDelay: delay,
      jitter: false,
    });
  }
}

/**
 * Timeout pattern with configurable timeout duration
 */
export class TimeoutPattern {
  private timeoutMs: number;

  constructor(timeoutMs: number = 10000) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Execute function with timeout
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      this.createTimeoutPromise(),
    ]);
  }

  /**
   * Create timeout promise that rejects after specified time
   */
  private createTimeoutPromise<T>(): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Operation timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
    });
  }

  /**
   * Execute function with custom timeout
   */
  static async withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPattern = new TimeoutPattern(timeoutMs);
    return timeoutPattern.execute(fn);
  }
}

/**
 * Timeout error class
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Fallback pattern with multiple fallback strategies
 */
export class FallbackPattern<T> {
  private fallbacks: Array<() => Promise<T> | T> = [];

  /**
   * Add fallback function
   */
  addFallback(fallback: () => Promise<T> | T): this {
    this.fallbacks.push(fallback);
    return this;
  }

  /**
   * Execute with fallbacks
   */
  async execute(primary: () => Promise<T>): Promise<T> {
    try {
      return await primary();
    } catch (primaryError) {
      logger.warn('[FALLBACK] Primary function failed, trying fallbacks:', primaryError.message);
      
      for (let i = 0; i < this.fallbacks.length; i++) {
        try {
          const result = await Promise.resolve(this.fallbacks[i]());

          return result;
        } catch (fallbackError) {
          logger.warn(`[FALLBACK] Fallback ${i + 1} failed:`, fallbackError.message);
          
          // If this is the last fallback, throw the original primary error
          if (i === this.fallbacks.length - 1) {
            throw primaryError;
          }
        }
      }
      
      // This should never be reached, but throw primary error as fallback
      throw primaryError;
    }
  }

  /**
   * Create fallback pattern with static value
   */
  static withValue<T>(value: T): FallbackPattern<T> {
    const pattern = new FallbackPattern<T>();
    pattern.addFallback(() => value);
    return pattern;
  }

  /**
   * Create fallback pattern with function
   */
  static withFunction<T>(fallbackFn: () => Promise<T> | T): FallbackPattern<T> {
    const pattern = new FallbackPattern<T>();
    pattern.addFallback(fallbackFn);
    return pattern;
  }
}

/**
 * Bulkhead pattern for resource isolation
 */
export class BulkheadPattern {
  private semaphores: Map<string, Semaphore> = new Map();

  /**
   * Execute function within resource pool
   */
  async execute<T>(
    poolName: string,
    maxConcurrent: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const semaphore = this.getSemaphore(poolName, maxConcurrent);
    return semaphore.acquire(fn);
  }

  /**
   * Get or create semaphore for pool
   */
  private getSemaphore(poolName: string, maxConcurrent: number): Semaphore {
    if (!this.semaphores.has(poolName)) {
      this.semaphores.set(poolName, new Semaphore(maxConcurrent));
    }
    return this.semaphores.get(poolName)!;
  }

  /**
   * Get pool statistics
   */
  getPoolStats(poolName: string): { available: number; waiting: number; total: number } | null {
    const semaphore = this.semaphores.get(poolName);
    if (!semaphore) return null;
    
    return {
      available: semaphore.available,
      waiting: semaphore.waiting,
      total: semaphore.total,
    };
  }

  /**
   * Get all pool statistics
   */
  getAllPoolStats(): Record<string, { available: number; waiting: number; total: number }> {
    const stats: Record<string, any> = {};
    
    for (const [poolName, semaphore] of this.semaphores.entries()) {
      stats[poolName] = {
        available: semaphore.available,
        waiting: semaphore.waiting,
        total: semaphore.total,
      };
    }
    
    return stats;
  }
}

/**
 * Semaphore for resource limiting
 */
export class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];
  public readonly total: number;

  constructor(permits: number) {
    this.permits = permits;
    this.total = permits;
  }

  /**
   * Get available permits
   */
  get available(): number {
    return this.permits;
  }

  /**
   * Get waiting queue length
   */
  get waiting(): number {
    return this.waitQueue.length;
  }

  /**
   * Acquire permit and execute function
   */
  async acquire<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquirePermit();
    
    try {
      return await fn();
    } finally {
      this.releasePermit();
    }
  }

  /**
   * Acquire permit
   */
  private async acquirePermit(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    
    return new Promise(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Release permit
   */
  private releasePermit(): void {
    this.permits++;
    
    const waiter = this.waitQueue.shift();
    if (waiter) {
      this.permits--;
      waiter();
    }
  }
}

/**
 * Rate limiter pattern
 */
export class RateLimiterPattern {
  private tokens: number;
  private capacity: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // tokens per second
    this.lastRefill = Date.now();
  }

  /**
   * Try to acquire token
   */
  async tryAcquire(): Promise<boolean> {
    this.refillTokens();
    
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    
    return false;
  }

  /**
   * Execute function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const acquired = await this.tryAcquire();
    
    if (!acquired) {
      throw new RateLimitError('Rate limit exceeded');
    }
    
    return fn();
  }

  /**
   * Wait and execute function
   */
  async waitAndExecute<T>(fn: () => Promise<T>, maxWaitMs: number = 5000): Promise<T> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      const acquired = await this.tryAcquire();
      
      if (acquired) {
        return fn();
      }
      
      // Wait a bit before trying again
      await this.delay(100);
    }
    
    throw new RateLimitError('Rate limit exceeded - max wait time reached');
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(elapsed * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Get current token count
   */
  get availableTokens(): number {
    this.refillTokens();
    return this.tokens;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Composite resilience pattern that combines multiple patterns
 */
export class ResilienceComposer<T> {
  private patterns: Array<(fn: () => Promise<T>) => Promise<T>> = [];

  /**
   * Add retry pattern
   */
  withRetry(options?: Partial<RetryOptions>): this {
    const retryPattern = new RetryPattern(options);
    this.patterns.push((fn) => retryPattern.execute(fn));
    return this;
  }

  /**
   * Add timeout pattern
   */
  withTimeout(timeoutMs: number): this {
    this.patterns.push((fn) => TimeoutPattern.withTimeout(fn, timeoutMs));
    return this;
  }

  /**
   * Add fallback pattern
   */
  withFallback(fallback: () => Promise<T> | T): this {
    const fallbackPattern = FallbackPattern.withFunction(fallback);
    this.patterns.push((fn) => fallbackPattern.execute(fn));
    return this;
  }

  /**
   * Add rate limiting
   */
  withRateLimit(capacity: number, refillRate: number): this {
    const rateLimiter = new RateLimiterPattern(capacity, refillRate);
    this.patterns.push((fn) => rateLimiter.execute(fn));
    return this;
  }

  /**
   * Execute with all configured patterns
   */
  async execute(fn: () => Promise<T>): Promise<T> {
    return this.patterns.reduce(
      (composedFn, pattern) => () => pattern(composedFn),
      fn
    )();
  }

  /**
   * Create common resilience pattern for external API calls
   */
  static forExternalAPI<T>(): ResilienceComposer<T> {
    return new ResilienceComposer<T>()
      .withTimeout(10000)
      .withRetry({
        maxAttempts: 3,
        backoffStrategy: 'exponential',
        initialDelay: 1000,
      });
  }

  /**
   * Create common resilience pattern for database calls
   */
  static forDatabase<T>(): ResilienceComposer<T> {
    return new ResilienceComposer<T>()
      .withTimeout(5000)
      .withRetry({
        maxAttempts: 2,
        backoffStrategy: 'fixed',
        initialDelay: 500,
      });
  }

  /**
   * Create common resilience pattern for AI services
   */
  static forAI<T>(): ResilienceComposer<T> {
    return new ResilienceComposer<T>()
      .withTimeout(30000)
      .withRateLimit(5, 1) // 5 requests per second max
      .withRetry({
        maxAttempts: 2,
        backoffStrategy: 'exponential',
        initialDelay: 2000,
      });
  }
}

/**
 * Common retryable error checker
 */
export class ErrorClassifier {
  /**
   * Check if error is retryable
   */
  static isRetryable(error: any): boolean {
    // Network errors are usually retryable
    if (error.code === 'ECONNRESET' || 
        error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT') {
      return true;
    }

    // HTTP status codes that are retryable
    if (error.status) {
      const retryableStatuses = [408, 429, 502, 503, 504];
      return retryableStatuses.includes(error.status);
    }

    // Timeout errors are retryable
    if (error instanceof TimeoutError) {
      return true;
    }

    // Default to not retryable for safety
    return false;
  }

  /**
   * Check if error is circuit breaker eligible
   */
  static isCircuitBreakerEligible(error: any): boolean {
    // Don't open circuit for client errors (4xx)
    if (error.status && error.status >= 400 && error.status < 500) {
      return false;
    }

    return true;
  }
}

const ResiliencePatterns = {
  RetryPattern,
  TimeoutPattern,
  FallbackPattern,
  BulkheadPattern,
  RateLimiterPattern,
  ResilienceComposer,
  ErrorClassifier,
  TimeoutError,
  RateLimitError,
};

export default ResiliencePatterns;