/**
 * Section Data Caching Layer
 * Redis-based caching with intelligent invalidation strategies
 */

import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
  tags?: string[]; // Cache tags for grouped invalidation
}

export interface CachedSectionData {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  learningObjectives: string | null;
  isFree: boolean;
  isPublished: boolean;
  position: number;
  // Additional fields as needed
  [key: string]: unknown;
}

class SectionCacheManager {
  private static instance: SectionCacheManager;
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'section:cache';
  private readonly TAG_PREFIX = 'section:tag';

  private constructor() {}

  static getInstance(): SectionCacheManager {
    if (!SectionCacheManager.instance) {
      SectionCacheManager.instance = new SectionCacheManager();
    }
    return SectionCacheManager.instance;
  }

  /**
   * Get cache key for section
   */
  private getSectionKey(sectionId: string): string {
    return `${this.CACHE_PREFIX}:${sectionId}`;
  }

  /**
   * Get cache key for chapter sections list
   */
  private getChapterSectionsKey(chapterId: string): string {
    return `${this.CACHE_PREFIX}:chapter:${chapterId}:sections`;
  }

  /**
   * Get cache key for course sections list
   */
  private getCourseSectionsKey(courseId: string): string {
    return `${this.CACHE_PREFIX}:course:${courseId}:sections`;
  }

  /**
   * Get cache key for tag
   */
  private getTagKey(tag: string): string {
    return `${this.TAG_PREFIX}:${tag}`;
  }

  /**
   * Get cached section data
   */
  async get<T = CachedSectionData>(sectionId: string): Promise<T | null> {
    try {
      const key = this.getSectionKey(sectionId);
      const cached = await redis.get(key);

      if (!cached) {
        logger.debug('Cache miss for section', { sectionId });
        return null;
      }

      logger.debug('Cache hit for section', { sectionId });
      return JSON.parse(cached) as T;
    } catch (error) {
      logger.error('Failed to get cached section', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sectionId,
      });
      return null;
    }
  }

  /**
   * Set cached section data
   */
  async set<T = CachedSectionData>(
    sectionId: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const key = this.getSectionKey(sectionId);
      const ttl = options.ttl || this.DEFAULT_TTL;

      await redis.setex(key, ttl, JSON.stringify(data));

      // Register tags if provided
      if (options.tags && options.tags.length > 0) {
        await Promise.all(
          options.tags.map(tag => this.registerTag(tag, sectionId, ttl))
        );
      }

      logger.debug('Section cached', { sectionId, ttl, tags: options.tags });
    } catch (error) {
      logger.error('Failed to cache section', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sectionId,
      });
    }
  }

  /**
   * Delete cached section
   */
  async delete(sectionId: string): Promise<void> {
    try {
      const key = this.getSectionKey(sectionId);
      await redis.del(key);
      logger.debug('Section cache deleted', { sectionId });
    } catch (error) {
      logger.error('Failed to delete cached section', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sectionId,
      });
    }
  }

  /**
   * Register a tag for a cache entry
   */
  private async registerTag(tag: string, sectionId: string, ttl: number): Promise<void> {
    try {
      const tagKey = this.getTagKey(tag);
      await redis.sadd(tagKey, sectionId);
      await redis.expire(tagKey, ttl);
    } catch (error) {
      logger.error('Failed to register cache tag', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tag,
        sectionId,
      });
    }
  }

  /**
   * Invalidate cache by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = this.getTagKey(tag);
      const sectionIds = await redis.smembers(tagKey);

      if (sectionIds.length > 0) {
        await Promise.all(sectionIds.map(id => this.delete(id)));
        await redis.del(tagKey);
        logger.info('Cache invalidated by tag', { tag, count: sectionIds.length });
      }
    } catch (error) {
      logger.error('Failed to invalidate cache by tag', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tag,
      });
    }
  }

  /**
   * Invalidate all caches for a chapter
   */
  async invalidateChapter(chapterId: string): Promise<void> {
    try {
      const chapterKey = this.getChapterSectionsKey(chapterId);
      await redis.del(chapterKey);
      await this.invalidateByTag(`chapter:${chapterId}`);
      logger.info('Chapter cache invalidated', { chapterId });
    } catch (error) {
      logger.error('Failed to invalidate chapter cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        chapterId,
      });
    }
  }

  /**
   * Invalidate all caches for a course
   */
  async invalidateCourse(courseId: string): Promise<void> {
    try {
      const courseKey = this.getCourseSectionsKey(courseId);
      await redis.del(courseKey);
      await this.invalidateByTag(`course:${courseId}`);
      logger.info('Course cache invalidated', { courseId });
    } catch (error) {
      logger.error('Failed to invalidate course cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        courseId,
      });
    }
  }

  /**
   * Get or set cached data (cache-aside pattern)
   */
  async getOrSet<T = CachedSectionData>(
    sectionId: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<{ data: T; cached: boolean }> {
    // Try to get from cache first
    const cached = await this.get<T>(sectionId);
    if (cached) {
      return { data: cached, cached: true };
    }

    // Fetch from database
    const data = await fetchFn();

    // Store in cache
    await this.set(sectionId, data, options);

    return { data, cached: false };
  }

  /**
   * Warm cache for a chapter's sections
   */
  async warmChapterCache(
    chapterId: string,
    sections: CachedSectionData[]
  ): Promise<void> {
    try {
      await Promise.all(
        sections.map(section =>
          this.set(section.id, section, {
            ttl: this.DEFAULT_TTL,
            tags: [`chapter:${chapterId}`, `course:${(section as { courseId?: string }).courseId}`].filter(Boolean),
          })
        )
      );

      logger.info('Chapter cache warmed', { chapterId, count: sections.length });
    } catch (error) {
      logger.error('Failed to warm chapter cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        chapterId,
      });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalCachedSections: number;
    tags: number;
  }> {
    try {
      const sectionKeys = await redis.keys(`${this.CACHE_PREFIX}:*`);
      const tagKeys = await redis.keys(`${this.TAG_PREFIX}:*`);

      return {
        totalCachedSections: sectionKeys.length,
        tags: tagKeys.length,
      };
    } catch (error) {
      logger.error('Failed to get cache stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        totalCachedSections: 0,
        tags: 0,
      };
    }
  }

  /**
   * Clear all section caches (use with caution)
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.CACHE_PREFIX}:*`);
      const tagKeys = await redis.keys(`${this.TAG_PREFIX}:*`);

      if (keys.length > 0) {
        await redis.del(...keys);
      }

      if (tagKeys.length > 0) {
        await redis.del(...tagKeys);
      }

      logger.warn('All section caches cleared', {
        sectionsCleared: keys.length,
        tagsCleared: tagKeys.length,
      });
    } catch (error) {
      logger.error('Failed to clear all caches', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Export singleton instance
export const sectionCache = SectionCacheManager.getInstance();

// Convenience helper functions
export const sectionCacheHelpers = {
  get: <T = CachedSectionData>(sectionId: string) => sectionCache.get<T>(sectionId),

  set: <T = CachedSectionData>(sectionId: string, data: T, options?: CacheOptions) =>
    sectionCache.set(sectionId, data, options),

  delete: (sectionId: string) => sectionCache.delete(sectionId),

  getOrSet: <T = CachedSectionData>(
    sectionId: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ) => sectionCache.getOrSet(sectionId, fetchFn, options),

  invalidateChapter: (chapterId: string) => sectionCache.invalidateChapter(chapterId),

  invalidateCourse: (courseId: string) => sectionCache.invalidateCourse(courseId),

  warmChapterCache: (chapterId: string, sections: CachedSectionData[]) =>
    sectionCache.warmChapterCache(chapterId, sections),

  getStats: () => sectionCache.getStats(),

  clearAll: () => sectionCache.clearAll(),
};
