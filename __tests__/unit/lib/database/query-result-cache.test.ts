/**
 * Unit Tests for Query Result Cache
 * Tests the database query result caching functionality from Phase 3
 */

import { QueryResultCache } from '@/lib/database/query-result-cache';

// Mock redis cache
const mockRedisCache = {
  set: jest.fn().mockResolvedValue(true),
  get: jest.fn().mockResolvedValue({ hit: false, value: null }),
  delete: jest.fn().mockResolvedValue(true),
  invalidateByTags: jest.fn().mockResolvedValue(1),
};

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock redis cache module
jest.mock('@/lib/cache/redis-cache', () => ({
  redisCache: mockRedisCache,
  CACHE_PREFIXES: {
    COURSE: 'course:',
    USER: 'user:',
  },
  CACHE_TTL: {
    SHORT: 300,
    MEDIUM: 900,
    LONG: 3600,
    VERY_LONG: 86400,
  },
}));

describe('QueryResultCache', () => {
  let cache: QueryResultCache;

  beforeEach(() => {
    jest.clearAllMocks();
    cache = QueryResultCache.getInstance();
  });

  afterEach(() => {
    // Clear cache metrics if method exists
    try {
      cache.clearMetrics();
    } catch (error) {
      // Ignore if method doesn't exist
    }
  });

  describe('Basic Cache Operations', () => {
    it('should cache query results', async () => {
      const operation = 'findMany';
      const model = 'User';
      const params = { where: { role: 'ADMIN' } };
      const result = [{ id: 'user-1', name: 'Admin User' }];

      // Mock cache miss then set
      mockRedisCache.get.mockResolvedValueOnce({ hit: false, value: null });
      
      await cache.cacheQueryResult(operation, model, params, result);
      
      expect(mockRedisCache.set).toHaveBeenCalled();
    });

    it('should return cached query results', async () => {
      const operation = 'findMany';
      const model = 'User';
      const params = { where: { role: 'ADMIN' } };
      const cachedResult = [{ id: 'user-1', name: 'Admin User' }];

      // Mock cache hit
      mockRedisCache.get.mockResolvedValueOnce({ hit: true, value: cachedResult });

      const result = await cache.getCachedQueryResult(operation, model, params);
      
      expect(result).toEqual(cachedResult);
      expect(mockRedisCache.get).toHaveBeenCalled();
    });

    it('should return null for cache miss', async () => {
      const operation = 'findUnique';
      const model = 'Course';
      const params = { where: { id: 'nonexistent' } };

      // Mock cache miss
      mockRedisCache.get.mockResolvedValueOnce({ hit: false, value: null });

      const result = await cache.getCachedQueryResult(operation, model, params);
      
      expect(result).toBeNull();
    });

    it('should skip cache when skipCache is true', async () => {
      const operation = 'findMany';
      const model = 'User';
      const params = {};
      const config = { skipCache: true };

      const result = await cache.getCachedQueryResult(operation, model, params, config);
      
      expect(result).toBeNull();
      expect(mockRedisCache.get).not.toHaveBeenCalled();
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const operation = 'findMany';
      const model = 'User';
      const params1 = { where: { role: 'ADMIN' }, orderBy: { name: 'asc' } };
      const params2 = { where: { role: 'ADMIN' }, orderBy: { name: 'asc' } };

      // Access private method for testing
      const key1 = (cache as any).generateCacheKey(operation, model, params1);
      const key2 = (cache as any).generateCacheKey(operation, model, params2);

      expect(key1).toBe(key2);
      expect(typeof key1).toBe('string');
      expect(key1.length).toBeGreaterThan(0);
    });

    it('should generate different keys for different parameters', () => {
      const operation = 'findMany';
      const model = 'User';
      const params1 = { where: { role: 'ADMIN' } };
      const params2 = { where: { role: 'USER' } };

      const key1 = (cache as any).generateCacheKey(operation, model, params1);
      const key2 = (cache as any).generateCacheKey(operation, model, params2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('Execute with Cache', () => {
    it('should execute function and cache result on cache miss', async () => {
      const operation = 'findMany';
      const model = 'Course';
      const params = { where: { published: true } };
      const queryResult = [{ id: 'course-1', title: 'Test Course' }];

      // Mock cache miss
      mockRedisCache.get.mockResolvedValueOnce({ hit: false, value: null });
      
      const queryFn = jest.fn().mockResolvedValue(queryResult);

      const result = await cache.executeWithCache(operation, model, params, queryFn);

      expect(queryFn).toHaveBeenCalled();
      expect(result.data).toEqual(queryResult);
      expect(result.cached).toBe(false);
      expect(result.cacheHit).toBe(false);
      expect(typeof result.executionTime).toBe('number');
      expect(mockRedisCache.set).toHaveBeenCalled();
    });

    it('should return cached result without executing function on cache hit', async () => {
      const operation = 'findMany';
      const model = 'Course';
      const params = { where: { published: true } };
      const cachedResult = [{ id: 'course-1', title: 'Test Course' }];

      // Mock cache hit
      mockRedisCache.get.mockResolvedValueOnce({ hit: true, value: cachedResult });
      
      const queryFn = jest.fn();

      const result = await cache.executeWithCache(operation, model, params, queryFn);

      expect(queryFn).not.toHaveBeenCalled();
      expect(result.data).toEqual(cachedResult);
      expect(result.cached).toBe(true);
      expect(result.cacheHit).toBe(true);
      expect(result.executionTime).toBe(0);
      expect(typeof result.cacheTime).toBe('number');
    });

    it('should handle query function errors', async () => {
      const operation = 'findMany';
      const model = 'User';
      const params = {};
      const error = new Error('Database connection failed');

      // Mock cache miss
      mockRedisCache.get.mockResolvedValueOnce({ hit: false, value: null });
      
      const queryFn = jest.fn().mockRejectedValue(error);

      await expect(
        cache.executeWithCache(operation, model, params, queryFn)
      ).rejects.toThrow('Database connection failed');

      expect(queryFn).toHaveBeenCalled();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache by model', async () => {
      const deleted = await cache.invalidateModel('User');

      expect(mockRedisCache.invalidateByTags).toHaveBeenCalledWith(['model:user']);
      expect(typeof deleted).toBe('number');
    });

    it('should invalidate specific query', async () => {
      const operation = 'findUnique';
      const model = 'Course';
      const params = { where: { id: 'course-123' } };

      const deleted = await cache.invalidateQuery(operation, model, params);

      expect(mockRedisCache.delete).toHaveBeenCalled();
      expect(typeof deleted).toBe('boolean');
    });

    it('should invalidate cache by operation', async () => {
      const deleted = await cache.invalidateOperation('findMany');

      expect(mockRedisCache.invalidateByTags).toHaveBeenCalledWith(['operation:findMany']);
      expect(typeof deleted).toBe('number');
    });
  });

  describe('TTL Configuration', () => {
    it('should use default TTL for known operations', () => {
      const ttl1 = (cache as any).getDefaultTTL('findMany', 'Category');
      const ttl2 = (cache as any).getDefaultTTL('findMany', 'User');
      const ttl3 = (cache as any).getDefaultTTL('findMany', 'UnknownModel');

      expect(typeof ttl1).toBe('number');
      expect(typeof ttl2).toBe('number');
      expect(typeof ttl3).toBe('number');
      expect(ttl1).toBeGreaterThan(0);
      expect(ttl2).toBeGreaterThan(0);
      expect(ttl3).toBeGreaterThan(0);
    });
  });

  describe('Tag Generation', () => {
    it('should generate appropriate tags', () => {
      const tags = (cache as any).generateTags('User', 'findMany', ['custom-tag']);

      expect(Array.isArray(tags)).toBe(true);
      expect(tags).toContain('model:user');
      expect(tags).toContain('operation:findMany');
      expect(tags).toContain('query:user:findMany');
      expect(tags).toContain('custom-tag');
    });

    it('should generate tags without custom tags', () => {
      const tags = (cache as any).generateTags('Course', 'findUnique');

      expect(Array.isArray(tags)).toBe(true);
      expect(tags).toContain('model:course');
      expect(tags).toContain('operation:findUnique');
      expect(tags).toContain('query:course:findUnique');
      expect(tags.length).toBe(3);
    });
  });

  describe('Metrics', () => {
    it('should provide cache metrics', () => {
      const metrics = cache.getMetrics();

      expect(metrics).toHaveProperty('totalQueries');
      expect(metrics).toHaveProperty('cacheHits');
      expect(metrics).toHaveProperty('cacheMisses');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('averageExecutionTime');
      expect(metrics).toHaveProperty('averageCacheTime');

      expect(typeof metrics.totalQueries).toBe('number');
      expect(typeof metrics.cacheHits).toBe('number');
      expect(typeof metrics.cacheMisses).toBe('number');
      expect(typeof metrics.cacheHitRate).toBe('number');
    });

    it('should clear metrics', () => {
      cache.clearMetrics();
      
      const metrics = cache.getMetrics();
      expect(metrics.totalQueries).toBe(0);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle cache get errors gracefully', async () => {
      mockRedisCache.get.mockRejectedValueOnce(new Error('Redis connection failed'));

      const result = await cache.getCachedQueryResult('findMany', 'User', {});
      
      expect(result).toBeNull();
    });

    it('should handle cache set errors gracefully', async () => {
      mockRedisCache.set.mockRejectedValueOnce(new Error('Redis write failed'));

      // Should not throw error
      await expect(
        cache.cacheQueryResult('findMany', 'User', {}, [])
      ).resolves.not.toThrow();
    });
  });

  describe('Cache Warmup', () => {
    it('should warm up cache', async () => {
      await cache.warmupCache();
      
      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = QueryResultCache.getInstance();
      const instance2 = QueryResultCache.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});