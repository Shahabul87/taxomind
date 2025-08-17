/**
 * Unit Tests for Query Result Cache
 * Tests the database query result caching functionality from Phase 3
 */

import { QueryResultCache } from '@/lib/database/query-result-cache';
import { Cache, MockData, Async, Performance } from '@/__tests__/utils/test-utilities';

describe('QueryResultCache', () => {
  let cache: QueryResultCache;
  let mockRedisClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient = Cache.createMockRedisClient();
    cache = new QueryResultCache(mockRedisClient);
  });

  afterEach(async () => {
    await cache.clear();
  });

  describe('Basic Cache Operations', () => {
    it('should cache query results', async () => {
      const query = 'SELECT * FROM users WHERE role = ?';
      const params = ['ADMIN'];
      const result = MockData.generateQueryResult(5);

      await cache.set(query, params, result);
      const cached = await cache.get(query, params);

      expect(cached).toEqual(result);
    });

    it('should return null for cache miss', async () => {
      const query = 'SELECT * FROM non_existent';
      const params = [];

      const result = await cache.get(query, params);
      expect(result).toBeNull();
    });

    it('should handle different parameter combinations', async () => {
      const query = 'SELECT * FROM products WHERE category = ? AND price < ?';
      const params1 = ['electronics', 1000];
      const params2 = ['books', 50];
      const result1 = MockData.generateQueryResult(10);
      const result2 = MockData.generateQueryResult(5);

      await cache.set(query, params1, result1);
      await cache.set(query, params2, result2);

      const cached1 = await cache.get(query, params1);
      const cached2 = await cache.get(query, params2);

      expect(cached1).toEqual(result1);
      expect(cached2).toEqual(result2);
      expect(cached1).not.toEqual(cached2);
    });

    it('should generate consistent cache keys', () => {
      const query = 'SELECT * FROM users';
      const params1 = ['param1', 123, true];
      const params2 = ['param1', 123, true];

      const key1 = cache.generateCacheKey(query, params1);
      const key2 = cache.generateCacheKey(query, params2);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different queries', () => {
      const query1 = 'SELECT * FROM users';
      const query2 = 'SELECT * FROM courses';
      const params = [];

      const key1 = cache.generateCacheKey(query1, params);
      const key2 = cache.generateCacheKey(query2, params);

      expect(key1).not.toBe(key2);
    });
  });

  describe('TTL and Expiration', () => {
    it('should respect TTL settings', async () => {
      const query = 'SELECT * FROM sessions';
      const params = ['active'];
      const result = MockData.generateQueryResult(3);
      const ttl = 1; // 1 second

      await cache.set(query, params, result, { ttl });
      
      // Should exist immediately
      let cached = await cache.get(query, params);
      expect(cached).toEqual(result);

      // Wait for expiration
      await Async.waitForAsync(async () => {
        const expired = await cache.get(query, params);
        return expired === null;
      }, 2000, 100);

      cached = await cache.get(query, params);
      expect(cached).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const query = 'SELECT * FROM config';
      const result = { setting: 'value' };

      await cache.set(query, [], result);
      const ttlValue = await mockRedisClient.ttl(cache.generateCacheKey(query, []));
      
      expect(ttlValue).toBeGreaterThan(0);
      expect(ttlValue).toBeLessThanOrEqual(300); // Default 5 minutes
    });

    it('should allow infinite TTL', async () => {
      const query = 'SELECT * FROM static_data';
      const result = MockData.generateQueryResult(1);

      await cache.set(query, [], result, { ttl: 0 });
      const ttlValue = await mockRedisClient.ttl(cache.generateCacheKey(query, []));
      
      expect(ttlValue).toBe(-1); // No expiration
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate specific cache entry', async () => {
      const query = 'SELECT * FROM users WHERE id = ?';
      const params = ['user-123'];
      const result = MockData.generateQueryResult(1);

      await cache.set(query, params, result);
      await cache.invalidate(query, params);

      const cached = await cache.get(query, params);
      expect(cached).toBeNull();
    });

    it('should invalidate by pattern', async () => {
      const queries = [
        { query: 'SELECT * FROM users', params: [] },
        { query: 'SELECT * FROM users WHERE role = ?', params: ['ADMIN'] },
        { query: 'SELECT * FROM courses', params: [] },
      ];

      // Set cache entries
      for (const { query, params } of queries) {
        await cache.set(query, params, MockData.generateQueryResult(5));
      }

      // Invalidate all user queries
      await cache.invalidatePattern('*users*');

      // Check invalidation
      const userCache1 = await cache.get(queries[0].query, queries[0].params);
      const userCache2 = await cache.get(queries[1].query, queries[1].params);
      const courseCache = await cache.get(queries[2].query, queries[2].params);

      expect(userCache1).toBeNull();
      expect(userCache2).toBeNull();
      expect(courseCache).not.toBeNull();
    });

    it('should invalidate by table', async () => {
      const queries = [
        'SELECT * FROM users',
        'SELECT COUNT(*) FROM users',
        'SELECT u.*, c.* FROM users u JOIN courses c ON u.id = c.user_id',
        'SELECT * FROM courses',
      ];

      // Set cache entries
      for (const query of queries) {
        await cache.set(query, [], MockData.generateQueryResult(5));
      }

      // Invalidate all queries involving users table
      await cache.invalidateTable('users');

      // Check invalidation
      const results = await Promise.all(
        queries.map(q => cache.get(q, []))
      );

      expect(results[0]).toBeNull(); // Direct users query
      expect(results[1]).toBeNull(); // Count users query
      expect(results[2]).toBeNull(); // Join with users
      expect(results[3]).not.toBeNull(); // Only courses
    });

    it('should support tag-based invalidation', async () => {
      const query1 = 'SELECT * FROM products WHERE featured = true';
      const query2 = 'SELECT * FROM products WHERE category = ?';
      const query3 = 'SELECT * FROM orders';

      await cache.set(query1, [], MockData.generateQueryResult(10), {
        tags: ['products', 'featured'],
      });
      await cache.set(query2, ['electronics'], MockData.generateQueryResult(20), {
        tags: ['products', 'category'],
      });
      await cache.set(query3, [], MockData.generateQueryResult(5), {
        tags: ['orders'],
      });

      // Invalidate by tag
      await cache.invalidateByTag('products');

      const cached1 = await cache.get(query1, []);
      const cached2 = await cache.get(query2, ['electronics']);
      const cached3 = await cache.get(query3, []);

      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
      expect(cached3).not.toBeNull();
    });
  });

  describe('Smart Caching Strategies', () => {
    it('should implement LRU eviction', async () => {
      const maxSize = 3;
      cache.setMaxSize(maxSize);

      // Add entries exceeding max size
      for (let i = 0; i < 5; i++) {
        await cache.set(`query-${i}`, [], { id: i });
      }

      // First two should be evicted
      const cached0 = await cache.get('query-0', []);
      const cached1 = await cache.get('query-1', []);
      const cached2 = await cache.get('query-2', []);
      const cached3 = await cache.get('query-3', []);
      const cached4 = await cache.get('query-4', []);

      expect(cached0).toBeNull();
      expect(cached1).toBeNull();
      expect(cached2).not.toBeNull();
      expect(cached3).not.toBeNull();
      expect(cached4).not.toBeNull();
    });

    it('should implement adaptive TTL based on query frequency', async () => {
      const query = 'SELECT * FROM popular_items';
      const result = MockData.generateQueryResult(10);

      // Simulate frequent access
      for (let i = 0; i < 10; i++) {
        await cache.set(query, [], result);
        await cache.get(query, []);
      }

      const adaptiveTTL = cache.getAdaptiveTTL(query);
      const defaultTTL = 300;

      // Frequently accessed queries should have longer TTL
      expect(adaptiveTTL).toBeGreaterThan(defaultTTL);
    });

    it('should skip caching for non-deterministic queries', () => {
      const deterministicQueries = [
        'SELECT * FROM users WHERE id = ?',
        'SELECT COUNT(*) FROM products',
        'SELECT * FROM categories ORDER BY name',
      ];

      const nonDeterministicQueries = [
        'SELECT * FROM logs WHERE timestamp > NOW()',
        'SELECT RANDOM() as value',
        'SELECT * FROM users ORDER BY RAND()',
      ];

      for (const query of deterministicQueries) {
        expect(cache.isCacheable(query)).toBe(true);
      }

      for (const query of nonDeterministicQueries) {
        expect(cache.isCacheable(query)).toBe(false);
      }
    });

    it('should implement cache warming', async () => {
      const warmupQueries = [
        { query: 'SELECT * FROM categories', params: [] },
        { query: 'SELECT * FROM featured_products', params: [] },
        { query: 'SELECT * FROM site_config', params: [] },
      ];

      const mockExecutor = jest.fn(async () => MockData.generateQueryResult(5));
      
      await cache.warmup(warmupQueries, mockExecutor);

      expect(mockExecutor).toHaveBeenCalledTimes(warmupQueries.length);

      // All queries should be cached
      for (const { query, params } of warmupQueries) {
        const cached = await cache.get(query, params);
        expect(cached).not.toBeNull();
      }
    });
  });

  describe('Performance Metrics', () => {
    it('should track cache hit rate', async () => {
      const query = 'SELECT * FROM users';
      const result = MockData.generateQueryResult(5);

      // Miss
      await cache.get(query, []);
      
      // Set
      await cache.set(query, [], result);
      
      // Hits
      await cache.get(query, []);
      await cache.get(query, []);
      await cache.get(query, []);

      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(3);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(0.75);
    });

    it('should track memory usage', async () => {
      const largeDateset = MockData.generateLargeDataset(1000);
      const query = 'SELECT * FROM large_table';

      const initialMemory = cache.getMemoryUsage();
      await cache.set(query, [], largeDateset);
      const finalMemory = cache.getMemoryUsage();

      expect(finalMemory).toBeGreaterThan(initialMemory);
    });

    it('should track average response time', async () => {
      const query = 'SELECT * FROM products';
      const result = MockData.generateQueryResult(10);

      await cache.set(query, [], result);

      const timings: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await cache.get(query, []);
        timings.push(performance.now() - start);
      }

      const metrics = cache.getMetrics();
      expect(metrics.averageResponseTime).toBeDefined();
      expect(metrics.averageResponseTime).toBeLessThan(10); // Should be fast
    });
  });

  describe('Compression and Optimization', () => {
    it('should compress large results', async () => {
      const largeResult = MockData.generateLargeDataset(5000);
      const query = 'SELECT * FROM big_table';

      await cache.set(query, [], largeResult, { compress: true });
      const cached = await cache.get(query, []);

      expect(cached).toEqual(largeResult);
      
      // Verify compression happened
      const stats = cache.getCompressionStats();
      expect(stats.compressionRatio).toBeGreaterThan(0);
      expect(stats.bytessSaved).toBeGreaterThan(0);
    });

    it('should optimize storage format', async () => {
      const numericData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: Math.random() * 1000,
        timestamp: Date.now(),
      }));

      const query = 'SELECT id, value, timestamp FROM metrics';
      
      await cache.set(query, [], numericData, { optimize: true });
      const cached = await cache.get(query, []);

      expect(cached).toEqual(numericData);
      
      // Optimized storage should use less memory
      const standardSize = JSON.stringify(numericData).length;
      const optimizedSize = cache.getStorageSize(query, []);
      expect(optimizedSize).toBeLessThan(standardSize);
    });
  });

  describe('Distributed Caching', () => {
    it('should handle cache synchronization', async () => {
      const cache1 = new QueryResultCache(mockRedisClient);
      const cache2 = new QueryResultCache(mockRedisClient);

      const query = 'SELECT * FROM shared_data';
      const result = MockData.generateQueryResult(5);

      // Set in cache1
      await cache1.set(query, [], result);

      // Should be available in cache2
      const cached = await cache2.get(query, []);
      expect(cached).toEqual(result);
    });

    it('should handle concurrent access', async () => {
      const query = 'SELECT * FROM concurrent_table';
      const operations = 100;

      const promises = Array.from({ length: operations }, async (_, i) => {
        if (i % 2 === 0) {
          await cache.set(query, [i], { value: i });
        } else {
          await cache.get(query, [i - 1]);
        }
      });

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should implement distributed locking', async () => {
      const query = 'SELECT * FROM locked_resource';
      const lockKey = cache.generateCacheKey(query, []);

      const acquired = await cache.acquireLock(lockKey);
      expect(acquired).toBe(true);

      // Second acquisition should fail
      const secondAcquired = await cache.acquireLock(lockKey);
      expect(secondAcquired).toBe(false);

      // Release lock
      await cache.releaseLock(lockKey);

      // Now acquisition should succeed
      const thirdAcquired = await cache.acquireLock(lockKey);
      expect(thirdAcquired).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors', async () => {
      mockRedisClient.get.mockRejectedValueOnce(new Error('Connection failed'));

      const query = 'SELECT * FROM test';
      const result = await cache.get(query, []);

      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalled();
    });

    it('should handle serialization errors', async () => {
      const query = 'SELECT * FROM circular';
      const circularObj: any = { a: 1 };
      circularObj.self = circularObj; // Circular reference

      await expect(
        cache.set(query, [], circularObj)
      ).rejects.toThrow();
    });

    it('should implement circuit breaker', async () => {
      const failureThreshold = 5;
      cache.setCircuitBreakerThreshold(failureThreshold);

      // Simulate failures
      for (let i = 0; i < failureThreshold; i++) {
        mockRedisClient.get.mockRejectedValueOnce(new Error('Redis error'));
        await cache.get('query', []);
      }

      // Circuit should be open
      const isOpen = cache.isCircuitOpen();
      expect(isOpen).toBe(true);

      // Calls should fail fast
      const start = performance.now();
      await cache.get('another-query', []);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10); // Should fail immediately
    });
  });

  describe('Integration Tests', () => {
    it('should work with complex query patterns', async () => {
      const complexQuery = `
        SELECT u.*, 
               COUNT(c.id) as course_count,
               AVG(r.rating) as avg_rating
        FROM users u
        LEFT JOIN courses c ON u.id = c.user_id
        LEFT JOIN reviews r ON c.id = r.course_id
        WHERE u.role = ? AND u.created_at > ?
        GROUP BY u.id
        HAVING course_count > ?
        ORDER BY avg_rating DESC
        LIMIT ?
      `;

      const params = ['INSTRUCTOR', '2024-01-01', 5, 10];
      const result = MockData.generateQueryResult(10);

      await cache.set(complexQuery, params, result);
      const cached = await cache.get(complexQuery, params);

      expect(cached).toEqual(result);
    });

    it('should handle transaction queries appropriately', async () => {
      const transactionQueries = [
        'BEGIN',
        'UPDATE users SET balance = balance - 100 WHERE id = ?',
        'UPDATE users SET balance = balance + 100 WHERE id = ?',
        'COMMIT',
      ];

      for (const query of transactionQueries) {
        const shouldCache = cache.isCacheable(query);
        expect(shouldCache).toBe(false);
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should demonstrate significant performance improvement', async () => {
      const mockSlowQuery = jest.fn(async () => {
        await Async.waitForAsync(() => true, 100); // Simulate slow query
        return MockData.generateLargeDataset(1000);
      });

      const query = 'SELECT * FROM slow_table';
      const params: any[] = [];

      // First execution (cache miss)
      Performance.startMeasure('uncached');
      const result1 = await cache.getOrSet(query, params, mockSlowQuery);
      const uncachedTime = Performance.endMeasure('uncached');

      // Second execution (cache hit)
      Performance.startMeasure('cached');
      const result2 = await cache.getOrSet(query, params, mockSlowQuery);
      const cachedTime = Performance.endMeasure('cached');

      expect(result1).toEqual(result2);
      expect(mockSlowQuery).toHaveBeenCalledTimes(1);
      
      // Cached access should be at least 10x faster
      Performance.assertPerformanceImprovement(uncachedTime, cachedTime, 0.9);
    });

    it('should handle high throughput', async () => {
      const operations = 10000;
      const queries = 100; // Different query variations
      
      const start = performance.now();
      
      const promises = Array.from({ length: operations }, async (_, i) => {
        const queryIndex = i % queries;
        const query = `SELECT * FROM table_${queryIndex}`;
        
        if (i < queries) {
          // Warm up cache
          await cache.set(query, [], { id: queryIndex });
        } else {
          // Read from cache
          await cache.get(query, []);
        }
      });

      await Promise.all(promises);
      
      const duration = performance.now() - start;
      const opsPerSecond = (operations / duration) * 1000;

      // Should handle at least 1000 ops/second
      expect(opsPerSecond).toBeGreaterThan(1000);
    });
  });
});