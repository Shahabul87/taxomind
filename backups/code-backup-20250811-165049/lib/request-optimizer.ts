import { aiCacheManager } from './ai-cache-manager';
import { logger } from '@/lib/logger';

interface RequestConfig {
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  retries: number;
  batchable: boolean;
  cacheStrategy: 'none' | 'memory' | 'persistent' | 'aggressive';
}

interface QueuedRequest {
  id: string;
  operation: string;
  params: any;
  config: RequestConfig;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timestamp: number;
  attempts: number;
}

interface BatchRequest {
  operation: string;
  requests: QueuedRequest[];
  timer?: NodeJS.Timeout;
}

interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
  backoffMultiplier: number;
}

export class RequestOptimizer {
  private requestQueue = new Map<string, QueuedRequest[]>();
  private batchQueue = new Map<string, BatchRequest>();
  private rateLimiters = new Map<string, {
    tokens: number;
    lastRefill: number;
    config: RateLimitConfig;
  }>();
  
  private defaultRateLimits: Record<string, RateLimitConfig> = {
    'anthropic': {
      requestsPerMinute: 50,
      burstLimit: 10,
      backoffMultiplier: 1.5
    },
    'blueprint_generation': {
      requestsPerMinute: 20,
      burstLimit: 5,
      backoffMultiplier: 2.0
    },
    'content_optimization': {
      requestsPerMinute: 60,
      burstLimit: 15,
      backoffMultiplier: 1.2
    },
    'sam_suggestions': {
      requestsPerMinute: 100,
      burstLimit: 20,
      backoffMultiplier: 1.1
    }
  };

  private stats = {
    totalRequests: 0,
    queuedRequests: 0,
    batchedRequests: 0,
    rateLimitedRequests: 0,
    averageWaitTime: 0,
    successRate: 0
  };

  constructor() {
    // Initialize rate limiters
    Object.entries(this.defaultRateLimits).forEach(([operation, config]) => {
      this.rateLimiters.set(operation, {
        tokens: config.burstLimit,
        lastRefill: Date.now(),
        config
      });
    });

    // Start processing queue
    setInterval(() => this.processQueue(), 100);
    
    // Refill rate limit tokens
    setInterval(() => this.refillTokens(), 1000);
  }

  async optimizedRequest<T>(
    operation: string,
    params: any,
    executor: () => Promise<T>,
    config: Partial<RequestConfig> = {
}
  ): Promise<T> {
    const finalConfig: RequestConfig = {
      priority: 'medium',
      timeout: 30000,
      retries: 2,
      batchable: false,
      cacheStrategy: 'memory',
      ...config
    };

    this.stats.totalRequests++;

    // Try cache first if enabled
    if (finalConfig.cacheStrategy !== 'none') {
      try {
        const cacheKey = this.generateCacheKey(operation, params);
        const cached = await this.getCachedResult(operation, params, finalConfig.cacheStrategy);
        if (cached !== null) {
          return cached;
        }
      } catch (cacheError) {
        logger.warn('Cache error, proceeding with request:', cacheError);
      }
    }

    // Check rate limits
    if (!this.checkRateLimit(operation)) {
      return this.queueRequest(operation, params, executor, finalConfig);
    }

    // Check if request can be batched
    if (finalConfig.batchable && this.shouldBatch(operation)) {
      return this.batchRequest(operation, params, executor, finalConfig);
    }

    // Execute immediately
    return this.executeWithOptimizations(operation, params, executor, finalConfig);
  }

  private generateCacheKey(operation: string, params: any): string {
    return `${operation}:${JSON.stringify(params, Object.keys(params).sort())}`;
  }

  private async getCachedResult(
    operation: string, 
    params: any, 
    strategy: RequestConfig['cacheStrategy']
  ): Promise<any> {
    switch (strategy) {
      case 'memory':
      case 'persistent':
      case 'aggressive':
        // Use the cache manager
        const cacheKey = this.generateCacheKey(operation, params);
        // This is a simplified check - in reality, you'd check the actual cache
        return null; // Return null if not cached
      default:
        return null;
    }
  }

  private checkRateLimit(operation: string): boolean {
    const limiter = this.rateLimiters.get(operation);
    if (!limiter) {
      // No rate limit configured for this operation
      return true;
    }

    if (limiter.tokens > 0) {
      limiter.tokens--;
      return true;
    }

    this.stats.rateLimitedRequests++;
    return false;
  }

  private refillTokens(): void {
    const now = Date.now();
    
    this.rateLimiters.forEach((limiter, operation) => {
      const timePassed = now - limiter.lastRefill;
      const tokensToAdd = Math.floor(
        (timePassed / 60000) * limiter.config.requestsPerMinute
      );
      
      if (tokensToAdd > 0) {
        limiter.tokens = Math.min(
          limiter.config.burstLimit,
          limiter.tokens + tokensToAdd
        );
        limiter.lastRefill = now;
      }
    });
  }

  private async queueRequest<T>(
    operation: string,
    params: any,
    executor: () => Promise<T>,
    config: RequestConfig
  ): Promise<T> {
    this.stats.queuedRequests++;
    
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operation,
        params,
        config,
        resolve,
        reject,
        timestamp: Date.now(),
        attempts: 0
      };

      if (!this.requestQueue.has(operation)) {
        this.requestQueue.set(operation, []);
      }

      const queue = this.requestQueue.get(operation)!;
      
      // Insert based on priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const insertIndex = queue.findIndex(req => 
        priorityOrder[req.config.priority] > priorityOrder[config.priority]
      );
      
      if (insertIndex === -1) {
        queue.push(request);
      } else {
        queue.splice(insertIndex, 0, request);
      }
    });
  }

  private shouldBatch(operation: string): boolean {
    // Simple batching logic - batch if there are multiple requests pending
    const existingBatch = this.batchQueue.get(operation);
    return existingBatch ? existingBatch.requests.length < 5 : false;
  }

  private async batchRequest<T>(
    operation: string,
    params: any,
    executor: () => Promise<T>,
    config: RequestConfig
  ): Promise<T> {
    this.stats.batchedRequests++;
    
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has(operation)) {
        this.batchQueue.set(operation, {
          operation,
          requests: [],
          timer: undefined
        });
      }

      const batch = this.batchQueue.get(operation)!;
      
      const request: QueuedRequest = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operation,
        params,
        config,
        resolve,
        reject,
        timestamp: Date.now(),
        attempts: 0
      };

      batch.requests.push(request);

      // Set timer for batch execution if not already set
      if (!batch.timer) {
        batch.timer = setTimeout(() => {
          this.executeBatch(operation);
        }, 200); // Wait 200ms for more requests
      }

      // Execute immediately if batch is full
      if (batch.requests.length >= 5) {
        if (batch.timer) {
          clearTimeout(batch.timer);
        }
        this.executeBatch(operation);
      }
    });
  }

  private async executeBatch(operation: string): Promise<void> {
    const batch = this.batchQueue.get(operation);
    if (!batch || batch.requests.length === 0) {
      return;
    }

    // Remove batch from queue
    this.batchQueue.delete(operation);

    try {
      // Execute all requests in the batch
      // For now, execute them individually - in practice, you might want to
      // optimize this further for operations that can be truly batched
      const results = await Promise.allSettled(
        batch.requests.map(async (request) => {
          try {
            const result = await this.executeWithOptimizations(
              request.operation,
              request.params,
              () => this.createExecutor(request),
              request.config
            );
            request.resolve(result);
            return result;
          } catch (error) {
            request.reject(error);
            throw error;
          }
        })
      );

    } catch (error) {
      logger.error(`Batch execution failed for ${operation}:`, error);
    }
  }

  private createExecutor(request: QueuedRequest): () => Promise<any> {
    // This is a placeholder - in practice, you'd need to recreate the original executor
    return async () => {
      throw new Error('Executor recreation not implemented');
    };
  }

  private async executeWithOptimizations<T>(
    operation: string,
    params: any,
    executor: () => Promise<T>,
    config: RequestConfig
  ): Promise<T> {
    const startTime = Date.now();
    let lastError: Error;

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), config.timeout);
        });

        // Race between the actual request and timeout
        const result = await Promise.race([
          executor(),
          timeoutPromise
        ]);

        // Cache the successful result if caching is enabled
        if (config.cacheStrategy !== 'none') {
          this.cacheResult(operation, params, result, config.cacheStrategy);
        }

        // Update stats
        const duration = Date.now() - startTime;
        this.updateStats(true, duration);

        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break;
        }

        // Wait before retry with exponential backoff
        if (attempt < config.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Update stats for failure
    this.updateStats(false, Date.now() - startTime);
    throw lastError;
  }

  private isNonRetryableError(error: any): boolean {
    if (error && error.status) {
      // Don't retry on client errors (4xx)
      return error.status >= 400 && error.status < 500;
    }
    return false;
  }

  private async cacheResult(
    operation: string,
    params: any,
    result: any,
    strategy: RequestConfig['cacheStrategy']
  ): Promise<void> {
    try {
      switch (strategy) {
        case 'memory':
          await aiCacheManager.get(operation, params, async () => result, 30 * 60 * 1000);
          break;
        case 'persistent':
          await aiCacheManager.get(operation, params, async () => result, 24 * 60 * 60 * 1000);
          break;
        case 'aggressive':
          await aiCacheManager.get(operation, params, async () => result, 7 * 24 * 60 * 60 * 1000);
          break;
      }
    } catch (cacheError) {
      logger.warn('Failed to cache result:', cacheError);
    }
  }

  private updateStats(success: boolean, duration: number): void {
    if (success) {
      this.stats.successRate = (this.stats.successRate * (this.stats.totalRequests - 1) + 100) / this.stats.totalRequests;
    } else {
      this.stats.successRate = (this.stats.successRate * (this.stats.totalRequests - 1)) / this.stats.totalRequests;
    }
    
    this.stats.averageWaitTime = (this.stats.averageWaitTime * (this.stats.totalRequests - 1) + duration) / this.stats.totalRequests;
  }

  private processQueue(): void {
    this.requestQueue.forEach((queue, operation) => {
      if (queue.length === 0) return;

      // Check if we can process requests for this operation
      if (!this.checkRateLimit(operation)) return;

      // Process the highest priority request
      const request = queue.shift();
      if (!request) return;

      // Check for timeout
      if (Date.now() - request.timestamp > request.config.timeout) {
        request.reject(new Error('Request timeout in queue'));
        return;
      }

      // Execute the request
      this.executeWithOptimizations(
        request.operation,
        request.params,
        () => this.createExecutor(request),
        request.config
      ).then(request.resolve).catch(request.reject);
    });
  }

  getStats() {
    return {
      ...this.stats,
      queueLengths: Object.fromEntries(
        Array.from(this.requestQueue.entries()).map(([op, queue]) => [op, queue.length])
      ),
      rateLimitStatus: Object.fromEntries(
        Array.from(this.rateLimiters.entries()).map(([op, limiter]) => [op, {
          tokens: limiter.tokens,
          maxTokens: limiter.config.burstLimit
        }])
      )
    };
  }

  clearQueue(operation?: string): void {
    if (operation) {
      this.requestQueue.delete(operation);
      this.batchQueue.delete(operation);
    } else {
      this.requestQueue.clear();
      this.batchQueue.clear();
    }
  }
}

// Export singleton instance
export const requestOptimizer = new RequestOptimizer();

// Helper functions for common operations
export const optimizeAnthropicRequest = async <T>(
  operation: string,
  params: any,
  executor: () => Promise<T>,
  config?: Partial<RequestConfig>
): Promise<T> => {
  return requestOptimizer.optimizedRequest(`anthropic_${operation}`, params, executor, {
    priority: 'high',
    cacheStrategy: 'persistent',
    ...config
  });
};

export const optimizeBlueprintRequest = async <T>(
  params: any,
  executor: () => Promise<T>
): Promise<T> => {
  return requestOptimizer.optimizedRequest('blueprint_generation', params, executor, {
    priority: 'high',
    timeout: 60000,
    cacheStrategy: 'aggressive',
    retries: 1
  });
};

export const optimizeContentOptimization = async <T>(
  params: any,
  executor: () => Promise<T>
): Promise<T> => {
  return requestOptimizer.optimizedRequest('content_optimization', params, executor, {
    priority: 'medium',
    cacheStrategy: 'memory',
    batchable: true
  });
};