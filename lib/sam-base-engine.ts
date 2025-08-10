import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Base class for all SAM engines
export abstract class SAMBaseEngine {
  protected name: string;
  protected initialized: boolean = false;

  constructor(name: string) {
    this.name = name;
  }

  // Initialize the engine with error handling
  protected async initialize(): Promise<void> {
    try {
      if (!this.initialized) {
        await this.performInitialization();
        this.initialized = true;
      }
    } catch (error) {
      logger.error(`Failed to initialize ${this.name}:`, error);
      throw new Error(`Engine initialization failed: ${this.name}`);
    }
  }

  // Abstract method to be implemented by child classes
  protected abstract performInitialization(): Promise<void>;

  // Safe database interaction wrapper
  protected async safeDbOperation<T>(
    operation: () => Promise<T>,
    fallback?: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      logger.error(`Database operation failed in ${this.name}:`, error);
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  }

  // Generic interaction recording with error handling
  protected async recordInteraction(
    userId: string,
    action: string,
    context: any
  ): Promise<void> {
    try {
      await db.sAMInteraction.create({
        data: {
          userId,
          interactionType: 'CONTENT_GENERATED',
          context: {
            engine: this.name.toLowerCase(),
            action,
            ...context,
            timestamp: new Date()
          },
          result: {
            success: true
          }
        }
      });
    } catch (error) {
      // Log error but don't throw - interaction recording shouldn't break main flow
      logger.error(`Failed to record interaction in ${this.name}:`, error);
    }
  }

  // Input validation helper
  protected validateInput<T>(
    input: any,
    validator: (input: any) => T | null
  ): T {
    const validated = validator(input);
    if (!validated) {
      throw new Error('Invalid input provided');
    }
    return validated;
  }

  // Safe array operations
  protected safeArrayOperation<T, R>(
    array: T[],
    operation: (items: T[]) => R,
    fallback: R
  ): R {
    try {
      if (!Array.isArray(array) || array.length === 0) {
        return fallback;
      }
      return operation(array);
    } catch (error) {
      logger.error(`Array operation failed in ${this.name}:`, error);
      return fallback;
    }
  }

  // Pagination helper
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
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: items.slice(start, end),
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  // Cache management (simple in-memory cache)
  private cache = new Map<string, { data: any; expiry: number }>();

  protected async withCache<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = 300 // 5 minutes default
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached && cached.expiry > now) {
      return cached.data as T;
    }

    const data = await factory();
    this.cache.set(key, {
      data,
      expiry: now + ttlSeconds * 1000
    });

    // Clean up expired entries periodically
    if (Math.random() < 0.1) {
      this.cleanupCache();
    }

    return data;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  // Performance monitoring
  protected async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      if (duration > 1000) {
        logger.warn(`Slow operation in ${this.name}: ${operation} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`Operation failed in ${this.name}: ${operation} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  // Sanitization helpers
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

  protected sanitizeNumber(input: any, min: number, max: number, defaultValue: number): number {
    const num = Number(input);
    if (isNaN(num)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, num));
  }

  // Error types for better error handling
  protected createError(type: 'NOT_FOUND' | 'VALIDATION' | 'PERMISSION' | 'INTERNAL', message: string): Error {
    const error = new Error(message);
    error.name = type;
    return error;
  }
}