import { ServerActionCache, invalidateByTags, invalidateKey } from './server-action-cache';
import { REDIS_KEYS } from './config';

/**
 * Cache Invalidation Strategies
 * Handles cache invalidation when data changes
 */

export class CacheInvalidation {
  /**
   * Invalidate course-related caches when course is updated
   */
  static async invalidateCourse(courseId: string, userId?: string): Promise<void> {
    const tags = [
      `Course:${courseId}`,
      'courses',
      'course-list'
    ];

    if (userId) {
      tags.push(`user:${userId}`);
    }

    await invalidateByTags(tags);

    // Also invalidate specific keys
    await invalidateKey(REDIS_KEYS.COURSE_DETAILS(courseId));

  }

  /**
   * Invalidate user progress caches when progress is updated
   */
  static async invalidateUserProgress(userId: string, courseId?: string): Promise<void> {
    const tags = [
      `user:${userId}`,
      'progress',
      'dashboard'
    ];

    if (courseId) {
      tags.push(`Course:${courseId}`);
      await invalidateKey(REDIS_KEYS.COURSE_PROGRESS(userId, courseId));
    }

    await invalidateByTags(tags);
    await invalidateKey(REDIS_KEYS.DASHBOARD_DATA(userId));
    await invalidateKey(REDIS_KEYS.USER_COURSES(userId));

    console.log(`Cache invalidated for user progress: ${userId}${courseId ? ` (Course: ${courseId})` : ''}`);
  }

  /**
   * Invalidate analytics caches when analytics data changes
   */
  static async invalidateAnalytics(userId?: string, courseId?: string): Promise<void> {
    const tags = ['analytics'];

    if (userId) {
      tags.push(`user:${userId}`);
      await invalidateKey(REDIS_KEYS.USER_ANALYTICS(userId));
    }

    if (courseId) {
      tags.push(`Course:${courseId}`);
    }

    await invalidateByTags(tags);

  }

  /**
   * Invalidate search caches (usually after course updates)
   */
  static async invalidateSearch(): Promise<void> {
    await invalidateByTags(['search']);

  }

  /**
   * Invalidate all course-related caches (for major updates)
   */
  static async invalidateAllCourses(): Promise<void> {
    await invalidateByTags(['courses', 'course-list', 'search']);

  }

  /**
   * Invalidate user dashboard and related data
   */
  static async invalidateUserDashboard(userId: string): Promise<void> {
    const tags = [`user:${userId}`, 'dashboard'];
    await invalidateByTags(tags);
    
    // Specific keys
    await invalidateKey(REDIS_KEYS.DASHBOARD_DATA(userId));
    await invalidateKey(REDIS_KEYS.USER_COURSES(userId));
    await invalidateKey(REDIS_KEYS.USER_ANALYTICS(userId));

  }
}

/**
 * API middleware helpers for cache invalidation
 */
export class APIMiddlewareCache {
  /**
   * Middleware for course API routes
   */
  static courseMiddleware = {
    afterUpdate: async (courseId: string, userId?: string) => {
      await CacheInvalidation.invalidateCourse(courseId, userId);
      await CacheInvalidation.invalidateSearch();
    },
    
    afterDelete: async (courseId: string, userId?: string) => {
      await CacheInvalidation.invalidateCourse(courseId, userId);
      await CacheInvalidation.invalidateAllCourses();
    },

    afterPublish: async (courseId: string) => {
      await CacheInvalidation.invalidateCourse(courseId);
      await CacheInvalidation.invalidateAllCourses();
      await CacheInvalidation.invalidateSearch();
    }
  };

  /**
   * Middleware for progress API routes
   */
  static progressMiddleware = {
    afterUpdate: async (userId: string, courseId: string) => {
      await CacheInvalidation.invalidateUserProgress(userId, courseId);
      await CacheInvalidation.invalidateAnalytics(userId, courseId);
    },

    afterCompletion: async (userId: string, courseId: string) => {
      await CacheInvalidation.invalidateUserProgress(userId, courseId);
      await CacheInvalidation.invalidateUserDashboard(userId);
      await CacheInvalidation.invalidateAnalytics(userId, courseId);
    }
  };

  /**
   * Middleware for enrollment API routes
   */
  static enrollmentMiddleware = {
    afterEnroll: async (userId: string, courseId: string) => {
      await CacheInvalidation.invalidateUserDashboard(userId);
      await CacheInvalidation.invalidateAnalytics(userId, courseId);
    },

    afterUnenroll: async (userId: string, courseId: string) => {
      await CacheInvalidation.invalidateUserDashboard(userId);
      await CacheInvalidation.invalidateUserProgress(userId, courseId);
    }
  };
}

// Export convenience functions
export const invalidateCourse = CacheInvalidation.invalidateCourse;
export const invalidateUserProgress = CacheInvalidation.invalidateUserProgress;
export const invalidateAnalytics = CacheInvalidation.invalidateAnalytics;
export const invalidateSearch = CacheInvalidation.invalidateSearch;
export const invalidateUserDashboard = CacheInvalidation.invalidateUserDashboard;