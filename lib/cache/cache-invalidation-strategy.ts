/**
 * Comprehensive Cache Invalidation Strategy
 * Phase 3.3: Intelligent cache invalidation across all layers
 * Part of Enterprise Code Quality Plan Phase 3
 */

import { redisCache } from '@/lib/cache/redis-cache';
import { apiCacheMiddleware, cacheInvalidation } from '@/lib/cache/api-cache-middleware';
import { queryCache } from '@/lib/database/query-result-cache';
import { logger } from '@/lib/logger';

interface InvalidationEvent {
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

interface InvalidationRule {
  trigger: {
    entity: string;
    operations: Array<'create' | 'update' | 'delete'>;
  };
  invalidations: Array<{
    layer: 'redis' | 'database' | 'api' | 'browser' | 'all';
    pattern?: string;
    tags?: string[];
    condition?: (event: InvalidationEvent) => boolean;
  }>;
  description: string;
}

class CacheInvalidationManager {
  private static instance: CacheInvalidationManager;
  private invalidationRules: InvalidationRule[] = [];
  private eventQueue: InvalidationEvent[] = [];
  private isProcessing = false;

  private constructor() {
    this.setupDefaultRules();
    this.startEventProcessor();
  }

  static getInstance(): CacheInvalidationManager {
    if (!CacheInvalidationManager.instance) {
      CacheInvalidationManager.instance = new CacheInvalidationManager();
    }
    return CacheInvalidationManager.instance;
  }

  /**
   * Setup default invalidation rules
   */
  private setupDefaultRules(): void {
    // Course-related invalidations
    this.addRule({
      trigger: {
        entity: 'Course',
        operations: ['create', 'update', 'delete'],
      },
      invalidations: [
        {
          layer: 'all',
          tags: ['courses', 'public-data'],
        },
        {
          layer: 'database',
          pattern: 'Course.*',
        },
        {
          layer: 'api',
          pattern: '/api/courses*',
        },
      ],
      description: 'Invalidate all course-related caches when courses change',
    });

    // User progress invalidations
    this.addRule({
      trigger: {
        entity: 'UserProgress',
        operations: ['update'],
      },
      invalidations: [
        {
          layer: 'redis',
          tags: ['progress', 'user-data'],
          condition: (event) => !!event.userId,
        },
        {
          layer: 'database',
          pattern: `UserProgress.*`,
          condition: (event: InvalidationEvent) => !!event.userId,
        },
        {
          layer: 'api',
          pattern: `/api/users/*/progress*`,
          condition: (event: InvalidationEvent) => !!event.userId,
        },
      ],
      description: 'Invalidate user progress caches when progress is updated',
    });

    // Enrollment invalidations
    this.addRule({
      trigger: {
        entity: 'Enrollment',
        operations: ['create', 'delete'],
      },
      invalidations: [
        {
          layer: 'redis',
          tags: ['enrollment', 'user-data'],
        },
        {
          layer: 'database',
          pattern: 'Enrollment.*',
        },
        {
          layer: 'api',
          pattern: '/api/users/*/courses*',
        },
      ],
      description: 'Invalidate enrollment-related caches',
    });

    // Category invalidations
    this.addRule({
      trigger: {
        entity: 'Category',
        operations: ['create', 'update', 'delete'],
      },
      invalidations: [
        {
          layer: 'all',
          tags: ['categories', 'static'],
        },
        {
          layer: 'database',
          pattern: 'Category.*',
        },
      ],
      description: 'Invalidate category caches',
    });

    // User data invalidations
    this.addRule({
      trigger: {
        entity: 'User',
        operations: ['update'],
      },
      invalidations: [
        {
          layer: 'redis',
          tags: ['user-data'],
          condition: (event) => !!event.userId,
        },
        {
          layer: 'api',
          pattern: `/api/users/*`,
          condition: (event: InvalidationEvent) => !!event.userId,
        },
      ],
      description: 'Invalidate user-specific caches when user data changes',
    });

    // Analytics invalidations
    this.addRule({
      trigger: {
        entity: 'UserAnalytics',
        operations: ['create'],
      },
      invalidations: [
        {
          layer: 'redis',
          tags: ['analytics'],
        },
        {
          layer: 'database',
          pattern: 'UserAnalytics.*',
        },
        {
          layer: 'api',
          pattern: '/api/analytics*',
        },
      ],
      description: 'Invalidate analytics caches when new analytics data is created',
    });

    // Review invalidations
    this.addRule({
      trigger: {
        entity: 'CourseReview',
        operations: ['create', 'update', 'delete'],
      },
      invalidations: [
        {
          layer: 'redis',
          tags: ['reviews', 'courses'],
        },
        {
          layer: 'database',
          pattern: 'CourseReview.*',
        },
        {
          layer: 'api',
          pattern: '/api/courses/*/reviews*',
        },
      ],
      description: 'Invalidate review-related caches',
    });
  }

  /**
   * Add invalidation rule
   */
  addRule(rule: InvalidationRule): void {
    this.invalidationRules.push(rule);
    logger.info(`Added cache invalidation rule: ${rule.description}`);
  }

  /**
   * Remove invalidation rule
   */
  removeRule(description: string): boolean {
    const index = this.invalidationRules.findIndex(rule => rule.description === description);
    if (index !== -1) {
      this.invalidationRules.splice(index, 1);
      logger.info(`Removed cache invalidation rule: ${description}`);
      return true;
    }
    return false;
  }

  /**
   * Trigger cache invalidation
   */
  async invalidate(event: InvalidationEvent): Promise<void> {
    try {
      // Add to event queue for processing
      this.eventQueue.push({
        ...event,
        timestamp: Date.now(),
      });

      logger.info(`Cache invalidation event queued:`, {
        type: event.type,
        entity: event.entity,
        entityId: event.entityId,
        userId: event.userId,
      });

      // Process immediately if not already processing
      if (!this.isProcessing) {
        this.processEventQueue();
      }
    } catch (error) {
      logger.error("Error triggering cache invalidation:", error as Error);
    }
  }

  /**
   * Process invalidation event queue
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processInvalidationEvent(event);
      }
    } catch (error) {
      logger.error("Error processing invalidation event queue:", error as Error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process single invalidation event
   */
  private async processInvalidationEvent(event: InvalidationEvent): Promise<void> {
    const matchingRules = this.invalidationRules.filter(rule =>
      rule.trigger.entity === event.entity &&
      rule.trigger.operations.includes(event.type)
    );

    for (const rule of matchingRules) {
      for (const invalidation of rule.invalidations) {
        // Check condition if provided
        if (invalidation.condition && !invalidation.condition(event)) {
          continue;
        }

        await this.executeInvalidation(invalidation, event);
      }
    }
  }

  /**
   * Execute invalidation for specific layer
   */
  private async executeInvalidation(
    invalidation: InvalidationRule['invalidations'][0],
    event: InvalidationEvent
  ): Promise<void> {
    try {
      switch (invalidation.layer) {
        case 'redis':
          await this.invalidateRedisLayer(invalidation, event);
          break;
        case 'database':
          await this.invalidateDatabaseLayer(invalidation, event);
          break;
        case 'api':
          await this.invalidateApiLayer(invalidation, event);
          break;
        case 'browser':
          await this.invalidateBrowserLayer(invalidation, event);
          break;
        case 'all':
          await this.invalidateAllLayers(invalidation, event);
          break;
      }
    } catch (error) {
      logger.error(`Error executing ${invalidation.layer} invalidation:`, error as Error);
    }
  }

  /**
   * Invalidate Redis cache layer
   */
  private async invalidateRedisLayer(
    invalidation: InvalidationRule['invalidations'][0],
    event: InvalidationEvent
  ): Promise<void> {
    if (invalidation.tags) {
      await redisCache.invalidateByTags(invalidation.tags);
      logger.info(`Invalidated Redis cache by tags:`, invalidation.tags);
    }

    if (invalidation.pattern) {
      const pattern = this.processPattern(invalidation.pattern, event);
      await redisCache.invalidatePattern(pattern);
      logger.info(`Invalidated Redis cache by pattern: ${pattern}`);
    }
  }

  /**
   * Invalidate database query cache layer
   */
  private async invalidateDatabaseLayer(
    invalidation: InvalidationRule['invalidations'][0],
    event: InvalidationEvent
  ): Promise<void> {
    if (invalidation.pattern) {
      const pattern = this.processPattern(invalidation.pattern, event);
      // Invalidate by model if pattern contains model name
      const modelMatch = pattern.match(/^(\w+)\./);
      if (modelMatch) {
        await queryCache.invalidateModel(modelMatch[1]);
        logger.info(`Invalidated database cache for model: ${modelMatch[1]}`);
      }
    }
  }

  /**
   * Invalidate API cache layer
   */
  private async invalidateApiLayer(
    invalidation: InvalidationRule['invalidations'][0],
    event: InvalidationEvent
  ): Promise<void> {
    if (invalidation.pattern) {
      const pattern = this.processPattern(invalidation.pattern, event);
      await apiCacheMiddleware.invalidateByPattern(pattern);
      logger.info(`Invalidated API cache by pattern: ${pattern}`);
    }

    if (invalidation.tags) {
      await apiCacheMiddleware.invalidateByTags(invalidation.tags);
      logger.info(`Invalidated API cache by tags:`, invalidation.tags);
    }
  }

  /**
   * Invalidate browser cache layer
   */
  private async invalidateBrowserLayer(
    invalidation: InvalidationRule['invalidations'][0],
    event: InvalidationEvent
  ): Promise<void> {
    // Browser cache invalidation would typically be handled by proper cache headers
    // This is more for logging and monitoring
    logger.info('Browser cache invalidation triggered', {
      pattern: invalidation.pattern,
      tags: invalidation.tags,
      event,
    });
  }

  /**
   * Invalidate all cache layers
   */
  private async invalidateAllLayers(
    invalidation: InvalidationRule['invalidations'][0],
    event: InvalidationEvent
  ): Promise<void> {
    await Promise.all([
      this.invalidateRedisLayer(invalidation, event),
      this.invalidateDatabaseLayer(invalidation, event),
      this.invalidateApiLayer(invalidation, event),
      this.invalidateBrowserLayer(invalidation, event),
    ]);
  }

  /**
   * Process pattern with event data
   */
  private processPattern(pattern: string, event: InvalidationEvent): string {
    let processedPattern = pattern;

    // Replace placeholders with event data
    if (event.userId) {
      processedPattern = processedPattern.replace(/\$\{userId\}/g, event.userId);
    }
    if (event.entityId) {
      processedPattern = processedPattern.replace(/\$\{entityId\}/g, event.entityId);
    }

    return processedPattern;
  }

  /**
   * Start event processor
   */
  private startEventProcessor(): void {
    // Process events every 100ms
    setInterval(() => {
      if (!this.isProcessing && this.eventQueue.length > 0) {
        this.processEventQueue();
      }
    }, 100);
  }

  /**
   * Get invalidation statistics
   */
  getStats(): {
    totalRules: number;
    queueSize: number;
    isProcessing: boolean;
    rules: Array<{ description: string; entity: string; operations: string[] }>;
  } {
    return {
      totalRules: this.invalidationRules.length,
      queueSize: this.eventQueue.length,
      isProcessing: this.isProcessing,
      rules: this.invalidationRules.map(rule => ({
        description: rule.description,
        entity: rule.trigger.entity,
        operations: rule.trigger.operations,
      })),
    };
  }

  /**
   * Clear event queue
   */
  clearEventQueue(): void {
    this.eventQueue = [];
    logger.info('Cleared cache invalidation event queue');
  }
}

// Singleton instance
export const cacheInvalidationManager = CacheInvalidationManager.getInstance();

/**
 * Helper functions for common invalidation scenarios
 */
export const invalidationHelpers = {
  // Invalidate when course is created/updated/deleted
  invalidateCourse: (courseId: string, type: 'create' | 'update' | 'delete') => {
    return cacheInvalidationManager.invalidate({
      type,
      entity: 'Course',
      entityId: courseId,
      timestamp: Date.now(),
    });
  },

  // Invalidate when user progress is updated
  invalidateUserProgress: (userId: string, courseId: string) => {
    return cacheInvalidationManager.invalidate({
      type: 'update',
      entity: 'UserProgress',
      entityId: `${userId}-${courseId}`,
      userId,
      metadata: { courseId },
      timestamp: Date.now(),
    });
  },

  // Invalidate when user enrolls in course
  invalidateEnrollment: (userId: string, courseId: string, type: 'create' | 'delete') => {
    return cacheInvalidationManager.invalidate({
      type,
      entity: 'Enrollment',
      entityId: `${userId}-${courseId}`,
      userId,
      metadata: { courseId },
      timestamp: Date.now(),
    });
  },

  // Invalidate when category changes
  invalidateCategory: (categoryId: string, type: 'create' | 'update' | 'delete') => {
    return cacheInvalidationManager.invalidate({
      type,
      entity: 'Category',
      entityId: categoryId,
      timestamp: Date.now(),
    });
  },

  // Invalidate when user data changes
  invalidateUser: (userId: string) => {
    return cacheInvalidationManager.invalidate({
      type: 'update',
      entity: 'User',
      entityId: userId,
      userId,
      timestamp: Date.now(),
    });
  },

  // Invalidate when analytics data is created
  invalidateAnalytics: (userId: string, analyticsId: string) => {
    return cacheInvalidationManager.invalidate({
      type: 'create',
      entity: 'UserAnalytics',
      entityId: analyticsId,
      userId,
      timestamp: Date.now(),
    });
  },

  // Invalidate when review is created/updated/deleted
  invalidateReview: (courseId: string, reviewId: string, type: 'create' | 'update' | 'delete') => {
    return cacheInvalidationManager.invalidate({
      type,
      entity: 'CourseReview',
      entityId: reviewId,
      metadata: { courseId },
      timestamp: Date.now(),
    });
  },

  // Force invalidate all caches (emergency use)
  invalidateAll: async () => {
    await Promise.all([
      redisCache.flush(),
      cacheInvalidation.invalidateAll(),
      queryCache.clearMetrics(),
    ]);
    logger.warn('Emergency: All caches invalidated');
  },
};

/**
 * Monitoring for cache invalidation performance
 */
export class CacheInvalidationMonitor {
  private static events: Array<{
    timestamp: number;
    entity: string;
    type: string;
    processingTime: number;
  }> = [];

  static trackEvent(entity: string, type: string, processingTime: number): void {
    this.events.push({
      timestamp: Date.now(),
      entity,
      type,
      processingTime,
    });

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  static getMetrics(): {
    totalEvents: number;
    averageProcessingTime: number;
    eventsByEntity: Record<string, number>;
    recentEvents: number;
  } {
    const now = Date.now();
    const recentEvents = this.events.filter(event => now - event.timestamp < 60000).length; // Last minute

    const eventsByEntity: Record<string, number> = {};
    let totalProcessingTime = 0;

    this.events.forEach(event => {
      eventsByEntity[event.entity] = (eventsByEntity[event.entity] || 0) + 1;
      totalProcessingTime += event.processingTime;
    });

    return {
      totalEvents: this.events.length,
      averageProcessingTime: this.events.length > 0 ? totalProcessingTime / this.events.length : 0,
      eventsByEntity,
      recentEvents,
    };
  }

  static clearMetrics(): void {
    this.events = [];
  }
}

export type { InvalidationEvent, InvalidationRule };