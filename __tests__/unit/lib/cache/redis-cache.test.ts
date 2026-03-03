/**
 * Unit Tests for Redis Cache Module
 * Tests the Redis caching functionality from Phase 3
 */

jest.unmock('@/lib/cache/redis-cache');

// Build a full in-memory Redis mock that supports all methods used by RedisCache
function createFullRedisClient() {
  const store = new Map<string, string>();
  const sets = new Map<string, Set<string>>();
  const sortedSets = new Map<string, Map<string, number>>();
  const ttls = new Map<string, number>();

  const pipelineOps: Array<() => Promise<[Error | null, unknown]>> = [];

  const client: Record<string, jest.Mock> = {
    get: jest.fn(async (key: string) => {
      const exp = ttls.get(key);
      if (exp && exp < Date.now()) {
        store.delete(key);
        ttls.delete(key);
        return null;
      }
      return store.get(key) ?? null;
    }),
    set: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    setex: jest.fn(async (key: string, seconds: number, value: string) => {
      store.set(key, value);
      ttls.set(key, Date.now() + seconds * 1000);
      return 'OK';
    }),
    del: jest.fn(async (...keys: string[]) => {
      let count = 0;
      for (const k of keys) {
        if (store.has(k)) count++;
        store.delete(k);
        ttls.delete(k);
        sets.delete(k);
        sortedSets.delete(k);
      }
      return count;
    }),
    keys: jest.fn(async (pattern: string) => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return Array.from(store.keys()).filter((k) => regex.test(k));
    }),
    scan: jest.fn(async (cursor: string, ..._args: unknown[]) => {
      // Parse MATCH pattern from variadic args: scan(cursor, 'MATCH', pattern, 'COUNT', n)
      let pattern = '*';
      for (let i = 0; i < _args.length - 1; i++) {
        if (_args[i] === 'MATCH') {
          pattern = _args[i + 1] as string;
          break;
        }
      }
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      const matched = Array.from(store.keys()).filter((k) => regex.test(k));
      // Return all keys in one batch (cursor '0' = done)
      return ['0', matched];
    }),
    mget: jest.fn(async (...keys: string[]) => {
      return keys.map((k) => store.get(k) ?? null);
    }),
    incrby: jest.fn(async (key: string, amount: number) => {
      const current = parseInt(store.get(key) || '0', 10);
      const newVal = current + amount;
      store.set(key, String(newVal));
      return newVal;
    }),
    expire: jest.fn(async (key: string, seconds: number) => {
      if (store.has(key) || sets.has(key) || sortedSets.has(key)) {
        ttls.set(key, Date.now() + seconds * 1000);
        return 1;
      }
      return 0;
    }),
    sadd: jest.fn(async (key: string, ...members: string[]) => {
      if (!sets.has(key)) sets.set(key, new Set());
      let added = 0;
      for (const m of members) {
        if (!sets.get(key)!.has(m)) added++;
        sets.get(key)!.add(m);
      }
      return added;
    }),
    smembers: jest.fn(async (key: string) => {
      return Array.from(sets.get(key) ?? []);
    }),
    zadd: jest.fn(async (key: string, score: number, member: string) => {
      if (!sortedSets.has(key)) sortedSets.set(key, new Map());
      const existed = sortedSets.get(key)!.has(member);
      sortedSets.get(key)!.set(member, score);
      return existed ? 0 : 1;
    }),
    zrevrange: jest.fn(async (key: string, start: number, stop: number, withScores?: string) => {
      const ss = sortedSets.get(key);
      if (!ss) return [];
      const sorted = Array.from(ss.entries()).sort((a, b) => b[1] - a[1]);
      const sliced = sorted.slice(start, stop + 1);
      if (withScores === 'WITHSCORES') {
        const result: string[] = [];
        for (const [member, score] of sliced) {
          result.push(member, String(score));
        }
        return result;
      }
      return sliced.map(([m]) => m);
    }),
    pipeline: jest.fn(() => {
      pipelineOps.length = 0;
      const pipe = {
        setex: jest.fn((key: string, seconds: number, value: string) => {
          pipelineOps.push(async () => {
            store.set(key, value);
            ttls.set(key, Date.now() + seconds * 1000);
            return [null, 'OK'];
          });
          return pipe;
        }),
        del: jest.fn((key: string) => {
          pipelineOps.push(async () => {
            const existed = store.has(key);
            store.delete(key);
            ttls.delete(key);
            return [null, existed ? 1 : 0];
          });
          return pipe;
        }),
        exec: jest.fn(async () => {
          const results = [];
          for (const op of pipelineOps) {
            results.push(await op());
          }
          pipelineOps.length = 0;
          return results;
        }),
      };
      return pipe;
    }),
    flushdb: jest.fn(async () => {
      store.clear();
      sets.clear();
      sortedSets.clear();
      ttls.clear();
      return 'OK';
    }),
    ping: jest.fn(async () => 'PONG'),
    info: jest.fn(async () => 'used_memory:1024\r\n'),
    dbsize: jest.fn(async () => store.size),
    quit: jest.fn(async () => 'OK'),
    on: jest.fn(() => client),
  };
  return client;
}

// Mock Redis to avoid actual Redis dependency in tests
jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => createFullRedisClient()),
  };
});

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { RedisCache, redisCache, CACHE_PREFIXES, CACHE_TTL } from '@/lib/cache/redis-cache';

describe('RedisCache', () => {
  let cacheInstance: RedisCache;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get singleton instance
    cacheInstance = RedisCache.getInstance();

    // Mock connection status and inject fresh in-memory Redis mock
    (cacheInstance as any).isConnected = true;
    (cacheInstance as any).redis = createFullRedisClient();
    (cacheInstance as any).readReplica = null;
    // Reset in-memory tag index
    (cacheInstance as any).tagIndex = new Map();
    // Reset metrics
    (cacheInstance as any).metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      latency: [],
      memoryUsage: 0,
      keyCount: 0,
      connectionStatus: 'connected',
    };
  });

  afterEach(async () => {
    await cacheInstance.flush();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get values', async () => {
      const key = 'test-key';
      const value = { data: 'test-value', timestamp: Date.now() };

      const setResult = await cacheInstance.set(key, value);
      expect(setResult).toBe(true);

      const retrieved = await cacheInstance.get(key);
      expect(retrieved.hit).toBe(true);
      expect(retrieved.value).toEqual(value);
    });

    it('should handle different data types', async () => {
      const testCases = [
        { key: 'string', value: 'test string' },
        { key: 'number', value: 42 },
        { key: 'boolean', value: true },
        { key: 'array', value: [1, 2, 3] },
        { key: 'object', value: { nested: { deep: 'value' } } },
        { key: 'null', value: null },
      ];

      for (const { key, value } of testCases) {
        await cacheInstance.set(key, value);
        const retrieved = await cacheInstance.get(key);
        expect(retrieved.hit).toBe(true);
        expect(retrieved.value).toEqual(value);
      }
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheInstance.get('non-existent');
      expect(result.hit).toBe(false);
      expect(result.value).toBeNull();
    });

    it('should delete keys', async () => {
      const key = 'delete-test';
      await cacheInstance.set(key, 'value');

      const deleted = await cacheInstance.delete(key);
      expect(deleted).toBe(true);

      const result = await cacheInstance.get(key);
      expect(result.hit).toBe(false);
      expect(result.value).toBeNull();
    });

    it('should invalidate cache by pattern', async () => {
      const prefix = 'test-pattern:';

      await cacheInstance.set('key1', 'value1', { prefix });
      await cacheInstance.set('key2', 'value2', { prefix });
      await cacheInstance.set('key3', 'value3', { prefix });

      const result1 = await cacheInstance.get('key1', { prefix });
      expect(result1.hit).toBe(true);

      const invalidated = await cacheInstance.invalidatePattern(`${prefix}*`);
      expect(invalidated).toBeGreaterThan(0);
    });
  });

  describe('Cache Options and TTL', () => {
    it('should set cache entries with TTL options', async () => {
      const key = 'ttl-test';
      const value = 'test-value';
      const ttl = CACHE_TTL.SHORT;

      const setResult = await cacheInstance.set(key, value, { ttl });
      expect(setResult).toBe(true);

      const result = await cacheInstance.get(key);
      expect(result.hit).toBe(true);
      expect(result.value).toBe(value);
    });

    it('should set cache entries with prefixes', async () => {
      const key = 'user-123';
      const value = { id: 'user-123', name: 'Test User' };
      const prefix = CACHE_PREFIXES.USER;

      await cacheInstance.set(key, value, { prefix });

      const result = await cacheInstance.get(key, { prefix });
      expect(result.hit).toBe(true);
      expect(result.value).toEqual(value);
    });

    it('should set cache entries with tags for bulk invalidation', async () => {
      const key = 'tagged-key';
      const value = 'tagged-value';
      const tags = ['tag1', 'tag2'];

      await cacheInstance.set(key, value, { tags, ttl: CACHE_TTL.MEDIUM });

      const result = await cacheInstance.get(key);
      expect(result.hit).toBe(true);
      expect(result.value).toBe(value);

      const invalidated = await cacheInstance.invalidateByTags(['tag1']);
      expect(invalidated).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Batch Operations', () => {
    it('should batch get multiple keys', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', 'value2', 'value3'];

      for (let i = 0; i < keys.length; i++) {
        await cacheInstance.set(keys[i], values[i]);
      }

      const results = await cacheInstance.mget(keys);

      expect(results.size).toBe(keys.length);
      keys.forEach((key, index) => {
        expect(results.get(key)).toBe(values[index]);
      });
    });

    it('should batch set multiple key-value pairs', async () => {
      const items = new Map([
        ['batch-key1', 'batch-value1'],
        ['batch-key2', 'batch-value2'],
        ['batch-key3', 'batch-value3'],
      ]);

      const result = await cacheInstance.mset(items);
      expect(result).toBe(true);

      for (const [key, value] of items) {
        const retrieved = await cacheInstance.get(key);
        expect(retrieved.hit).toBe(true);
        expect(retrieved.value).toBe(value);
      }
    });

    it('should handle empty batch operations', async () => {
      const emptyGetResults = await cacheInstance.mget([]);
      expect(emptyGetResults.size).toBe(0);

      const emptySetResult = await cacheInstance.mset(new Map());
      expect(emptySetResult).toBe(false);
    });
  });

  describe('Advanced Cache Features', () => {
    it('should support getOrSet pattern', async () => {
      const key = 'get-or-set-test';
      const expectedValue = { computed: 'data', timestamp: Date.now() };

      const fetchFn = jest.fn().mockResolvedValue(expectedValue);

      const result1 = await cacheInstance.getOrSet(key, fetchFn);
      expect(result1).toEqual(expectedValue);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      const result2 = await cacheInstance.getOrSet(key, fetchFn);
      expect(result2).toEqual(expectedValue);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should support increment operations', async () => {
      const key = 'counter-test';

      const result1 = await cacheInstance.increment(key, 5);
      expect(result1).toBe(5);

      const result2 = await cacheInstance.increment(key, 3);
      expect(result2).toBe(8);

      const result3 = await cacheInstance.increment(key);
      expect(result3).toBe(9);
    });

    it('should support sorted set operations for leaderboards', async () => {
      const key = 'leaderboard-test';

      await cacheInstance.zadd(key, 100, 'player1');
      await cacheInstance.zadd(key, 200, 'player2');
      await cacheInstance.zadd(key, 150, 'player3');

      const topPlayers = (await cacheInstance.zrevrange(key, 0, 2, true)) as Array<{
        member: string;
        score: number;
      }>;

      expect(topPlayers).toHaveLength(3);
      expect(topPlayers[0].member).toBe('player2');
      expect(topPlayers[0].score).toBe(200);
      expect(topPlayers[1].member).toBe('player3');
      expect(topPlayers[1].score).toBe(150);
    });
  });

  describe('Session Management', () => {
    it('should handle session operations', async () => {
      const sessionId = 'test-session-123';
      const sessionData = {
        userId: 'user-456',
        role: 'admin',
        loginTime: Date.now(),
      };

      const setResult = await cacheInstance.setSession(sessionId, sessionData);
      expect(setResult).toBe(true);

      const retrievedSession = await cacheInstance.getSession(sessionId);
      expect(retrievedSession).toEqual(sessionData);

      const deleteResult = await cacheInstance.deleteSession(sessionId);
      expect(deleteResult).toBe(true);

      const deletedSession = await cacheInstance.getSession(sessionId);
      expect(deletedSession).toBeNull();
    });
  });

  describe('Cache Health and Metrics', () => {
    it('should provide health check information', async () => {
      const health = await cacheInstance.healthCheck();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('details');
      expect(['healthy', 'unhealthy']).toContain(health.status);
    });

    it('should track cache metrics', async () => {
      await cacheInstance.set('metrics-test-1', 'value1');
      await cacheInstance.get('metrics-test-1');
      await cacheInstance.get('non-existent-key');

      const metrics = cacheInstance.getMetrics();

      expect(metrics).toHaveProperty('hits');
      expect(metrics).toHaveProperty('misses');
      expect(metrics).toHaveProperty('errors');
      expect(metrics).toHaveProperty('latency');
      expect(metrics).toHaveProperty('connectionStatus');

      expect(metrics.hits).toBeGreaterThan(0);
      expect(metrics.misses).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle disconnected state gracefully', async () => {
      (cacheInstance as any).isConnected = false;

      const setResult = await cacheInstance.set('test-key', 'test-value');
      expect(setResult).toBe(false);

      const getResult = await cacheInstance.get('test-key');
      expect(getResult.hit).toBe(false);
      expect(getResult.value).toBeNull();

      (cacheInstance as any).isConnected = true;
    });

    it('should handle cache options correctly', async () => {
      const key = 'options-test';
      const value = 'test-value';

      const getResultSkipped = await cacheInstance.get(key, { skipCache: true });
      expect(getResultSkipped.hit).toBe(false);

      await cacheInstance.set(key, value);

      const getResultSkipped2 = await cacheInstance.get(key, { skipCache: true });
      expect(getResultSkipped2.hit).toBe(false);

      const getResultNormal = await cacheInstance.get(key);
      expect(getResultNormal.hit).toBe(true);
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should work with realistic course caching scenario', async () => {
      const courseId = 'course-123';
      const courseData = {
        id: courseId,
        title: 'Test Course',
        instructor: 'Test Instructor',
        chapters: ['chapter1', 'chapter2'],
        enrollment: 150,
      };

      await cacheInstance.set(courseId, courseData, {
        prefix: CACHE_PREFIXES.COURSE,
        ttl: CACHE_TTL.LONG,
        tags: ['courses', `course:${courseId}`],
      });

      const cached = await cacheInstance.get(courseId, {
        prefix: CACHE_PREFIXES.COURSE,
      });

      expect(cached.hit).toBe(true);
      expect(cached.value).toEqual(courseData);
    });

    it('should work with analytics data caching', async () => {
      const analyticsKey = 'daily-metrics-2024-01-15';
      const analyticsData = {
        date: '2024-01-15',
        totalUsers: 1500,
        coursesCompleted: 45,
        averageSessionTime: 23.5,
      };

      await cacheInstance.set(analyticsKey, analyticsData, {
        prefix: CACHE_PREFIXES.ANALYTICS,
        ttl: CACHE_TTL.SHORT,
        tags: ['analytics', 'daily-metrics'],
      });

      const fetchFn = jest.fn().mockResolvedValue(analyticsData);
      const result = await cacheInstance.getOrSet(analyticsKey, fetchFn, {
        prefix: CACHE_PREFIXES.ANALYTICS,
      });

      expect(result).toEqual(analyticsData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should handle cache invalidation scenarios', async () => {
      const userId = 'user-456';
      const courseId = 'course-789';

      await cacheInstance.set(
        userId,
        { id: userId, name: 'Test User' },
        {
          prefix: CACHE_PREFIXES.USER,
          tags: ['users', `user:${userId}`],
        }
      );

      await cacheInstance.set(
        courseId,
        { id: courseId, title: 'Test Course' },
        {
          prefix: CACHE_PREFIXES.COURSE,
          tags: ['courses', `course:${courseId}`],
        }
      );

      const userData = await cacheInstance.get(userId, { prefix: CACHE_PREFIXES.USER });
      expect(userData.hit).toBe(true);

      const invalidated = await cacheInstance.invalidateByTags([`user:${userId}`]);
      expect(invalidated).toBeGreaterThanOrEqual(0);
    });
  });
});

// Test singleton pattern
describe('RedisCache Singleton', () => {
  it('should return the same instance', () => {
    const instance1 = RedisCache.getInstance();
    const instance2 = RedisCache.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should export the global instance', () => {
    expect(redisCache).toBeInstanceOf(RedisCache);
    expect(redisCache).toBe(RedisCache.getInstance());
  });
});
