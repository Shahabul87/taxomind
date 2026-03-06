/**
 * Tests for lib/db/query-optimizer.ts
 *
 * Covers the QueryPerformanceMonitor (module-level singleton) via the
 * getQueryPerformanceMetrics export, and the withCache utility.
 * Database-bound query functions are tested through their cache/metric behavior.
 *
 * Phase 1.3 - Database Core Tests
 */

jest.mock('@/lib/db', () => ({
  db: {
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    enrollment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    purchase: {
      aggregate: jest.fn(),
    },
    userCourseEnrollment: {
      findUnique: jest.fn(),
      aggregate: jest.fn(),
    },
    userChapterCompletion: {
      count: jest.fn(),
    },
    userSectionCompletion: {
      count: jest.fn(),
    },
    chapter: {
      count: jest.fn(),
    },
    section: {
      count: jest.fn(),
    },
    courseReview: {
      aggregate: jest.fn(),
    },
    learning_sessions: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

jest.mock('@/lib/cache/redis-cache', () => ({
  redisCache: {
    get: jest.fn().mockResolvedValue({ hit: false, value: null }),
    set: jest.fn().mockResolvedValue(undefined),
    invalidatePattern: jest.fn().mockResolvedValue(undefined),
    invalidateByTags: jest.fn().mockResolvedValue(undefined),
  },
  CACHE_PREFIXES: {
    COURSE: 'course:',
    USER: 'user:',
    ENROLLMENT: 'enrollment:',
    SEARCH: 'search:',
    ANALYTICS: 'analytics:',
    PROGRESS: 'progress:',
  },
  CACHE_TTL: {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 3600,
  },
  cacheHelpers: {},
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  getQueryPerformanceMetrics,
  withCache,
  optimizedCourseQueries,
  optimizedUserQueries,
  optimizedAnalyticsQueries,
  optimizedProgressQueries,
  cacheInvalidation,
  type QueryMetrics,
  type QueryOptions,
  type PaginationOptions,
} from '@/lib/db/query-optimizer';
import { redisCache, CACHE_PREFIXES } from '@/lib/cache/redis-cache';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const mockedRedisCache = redisCache as jest.Mocked<typeof redisCache>;
const mockedDb = db as jest.Mocked<typeof db>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the cache mock to miss by default
  mockedRedisCache.get.mockResolvedValue({ hit: false, value: null });
  mockedRedisCache.set.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// QueryPerformanceMonitor (tested via getQueryPerformanceMetrics)
// ---------------------------------------------------------------------------
describe('QueryPerformanceMonitor via getQueryPerformanceMetrics', () => {
  // The monitor is a module-level singleton. Its internal state accumulates
  // across test runs within this file. We test behavioral expectations.

  it('returns an object of metrics keyed by query name', () => {
    const metrics = getQueryPerformanceMetrics();
    expect(typeof metrics).toBe('object');
    expect(metrics).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// withCache utility
// ---------------------------------------------------------------------------
describe('withCache', () => {
  it('returns cached value when cache hits', async () => {
    mockedRedisCache.get.mockResolvedValueOnce({
      hit: true,
      value: { id: 'cached-course' },
    });

    const queryFn = jest.fn().mockResolvedValue({ id: 'db-course' });
    const result = await withCache('test-key', queryFn, {
      prefix: 'course:',
      ttl: 300,
    });

    expect(result).toEqual({ id: 'cached-course' });
    expect(queryFn).not.toHaveBeenCalled();
  });

  it('executes query and caches result on cache miss', async () => {
    mockedRedisCache.get.mockResolvedValueOnce({ hit: false, value: null });

    const queryFn = jest.fn().mockResolvedValue({ id: 'fresh-data' });
    const result = await withCache('miss-key', queryFn, {
      prefix: 'course:',
      ttl: 600,
      tags: ['courses'],
    });

    expect(result).toEqual({ id: 'fresh-data' });
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(mockedRedisCache.set).toHaveBeenCalledWith(
      'miss-key',
      { id: 'fresh-data' },
      expect.objectContaining({ prefix: 'course:', ttl: 600, tags: ['courses'] })
    );
  });

  it('does not cache null results', async () => {
    mockedRedisCache.get.mockResolvedValueOnce({ hit: false, value: null });

    const queryFn = jest.fn().mockResolvedValue(null);
    const result = await withCache('null-key', queryFn);

    expect(result).toBeNull();
    expect(mockedRedisCache.set).not.toHaveBeenCalled();
  });

  it('does not cache undefined results', async () => {
    mockedRedisCache.get.mockResolvedValueOnce({ hit: false, value: null });

    const queryFn = jest.fn().mockResolvedValue(undefined);
    const result = await withCache('undef-key', queryFn);

    expect(result).toBeUndefined();
    expect(mockedRedisCache.set).not.toHaveBeenCalled();
  });

  it('uses default TTL of MEDIUM when not specified', async () => {
    mockedRedisCache.get.mockResolvedValueOnce({ hit: false, value: null });

    const queryFn = jest.fn().mockResolvedValue({ data: true });
    await withCache('default-ttl-key', queryFn);

    expect(mockedRedisCache.set).toHaveBeenCalledWith(
      'default-ttl-key',
      { data: true },
      expect.objectContaining({ ttl: 300 }) // CACHE_TTL.MEDIUM
    );
  });

  it('propagates errors from the query function', async () => {
    mockedRedisCache.get.mockResolvedValueOnce({ hit: false, value: null });

    const queryFn = jest.fn().mockRejectedValue(new Error('DB timeout'));

    await expect(withCache('error-key', queryFn)).rejects.toThrow('DB timeout');
  });

  it('works without options parameter', async () => {
    mockedRedisCache.get.mockResolvedValueOnce({ hit: false, value: null });

    const queryFn = jest.fn().mockResolvedValue('result');
    const result = await withCache('no-opts-key', queryFn);

    expect(result).toBe('result');
  });
});

// ---------------------------------------------------------------------------
// optimizedCourseQueries
// ---------------------------------------------------------------------------
describe('optimizedCourseQueries', () => {
  describe('getCourseWithDetails', () => {
    it('returns cached data when cache hits', async () => {
      const cachedCourse = {
        id: 'course-1',
        title: 'Cached Course',
      };
      mockedRedisCache.get.mockResolvedValueOnce({
        hit: true,
        value: cachedCourse,
      });

      const result = await optimizedCourseQueries.getCourseWithDetails('course-1');

      expect(result).toEqual(cachedCourse);
      expect(mockedDb.course.findUnique).not.toHaveBeenCalled();
    });

    it('queries database on cache miss and caches the result', async () => {
      const dbCourse = {
        id: 'course-2',
        title: 'DB Course',
        chapters: [],
      };
      (mockedDb.course.findUnique as jest.Mock).mockResolvedValueOnce(dbCourse);

      const result = await optimizedCourseQueries.getCourseWithDetails('course-2');

      expect(result).toEqual(dbCourse);
      expect(mockedRedisCache.set).toHaveBeenCalled();
    });

    it('does not cache when course is not found', async () => {
      (mockedDb.course.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await optimizedCourseQueries.getCourseWithDetails('missing');

      expect(result).toBeNull();
      // set should not be called for null courses (the source checks `if (course)`)
      expect(mockedRedisCache.set).not.toHaveBeenCalled();
    });

    it('skips cache when cache option is false', async () => {
      const dbCourse = { id: 'no-cache', title: 'No Cache' };
      (mockedDb.course.findUnique as jest.Mock).mockResolvedValueOnce(dbCourse);

      const result = await optimizedCourseQueries.getCourseWithDetails(
        'no-cache',
        undefined,
        { cache: false }
      );

      expect(result).toEqual(dbCourse);
      // Should not try to get from cache
      expect(mockedRedisCache.get).not.toHaveBeenCalled();
      // Should not set cache either when cache is disabled
      expect(mockedRedisCache.set).not.toHaveBeenCalled();
    });
  });

  describe('getPopularCourses', () => {
    it('returns cached popular courses on cache hit', async () => {
      const cached = [{ id: '1', title: 'Popular' }];
      mockedRedisCache.get.mockResolvedValueOnce({ hit: true, value: cached });

      const result = await optimizedCourseQueries.getPopularCourses(5);

      expect(result).toEqual(cached);
      expect(mockedDb.course.findMany).not.toHaveBeenCalled();
    });

    it('queries and caches on cache miss', async () => {
      const courses = [
        { id: 'pop-1', title: 'Course A' },
        { id: 'pop-2', title: 'Course B' },
      ];
      (mockedDb.course.findMany as jest.Mock).mockResolvedValueOnce(courses);

      const result = await optimizedCourseQueries.getPopularCourses(10);

      expect(result).toEqual(courses);
      expect(mockedRedisCache.set).toHaveBeenCalled();
    });

    it('defaults to limit of 10 when not specified', async () => {
      (mockedDb.course.findMany as jest.Mock).mockResolvedValueOnce([]);

      await optimizedCourseQueries.getPopularCourses();

      expect(mockedDb.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  describe('searchCourses', () => {
    it('returns cached search results on cache hit', async () => {
      const cached = {
        courses: [{ id: 's1' }],
        pagination: { page: 1, pageSize: 20, totalPages: 1, totalCount: 1 },
      };
      mockedRedisCache.get.mockResolvedValueOnce({ hit: true, value: cached });

      const result = await optimizedCourseQueries.searchCourses('react');

      expect(result).toEqual(cached);
    });

    it('builds search results with pagination on cache miss', async () => {
      (mockedDb.course.count as jest.Mock).mockResolvedValueOnce(2);
      (mockedDb.course.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'r1' },
        { id: 'r2' },
      ]);

      const result = await optimizedCourseQueries.searchCourses('react', {}, {
        page: 1,
        pageSize: 20,
      });

      expect(result).toHaveProperty('courses');
      expect(result).toHaveProperty('pagination');
      expect((result as { pagination: { totalCount: number } }).pagination.totalCount).toBe(2);
    });
  });
});

// ---------------------------------------------------------------------------
// optimizedUserQueries
// ---------------------------------------------------------------------------
describe('optimizedUserQueries', () => {
  describe('getUserProfile', () => {
    it('returns cached profile on cache hit', async () => {
      const cachedUser = { id: 'u1', name: 'Test User' };
      mockedRedisCache.get.mockResolvedValueOnce({
        hit: true,
        value: cachedUser,
      });

      const result = await optimizedUserQueries.getUserProfile('u1');

      expect(result).toEqual(cachedUser);
      expect(mockedDb.user.findUnique).not.toHaveBeenCalled();
    });

    it('queries database and caches on miss', async () => {
      const dbUser = { id: 'u2', name: 'DB User', role: 'USER' };
      (mockedDb.user.findUnique as jest.Mock).mockResolvedValueOnce(dbUser);

      const result = await optimizedUserQueries.getUserProfile('u2');

      expect(result).toEqual(dbUser);
      expect(mockedRedisCache.set).toHaveBeenCalled();
    });

    it('does not cache null user results', async () => {
      (mockedDb.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await optimizedUserQueries.getUserProfile('missing');

      expect(result).toBeNull();
      expect(mockedRedisCache.set).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// cacheInvalidation
// ---------------------------------------------------------------------------
describe('cacheInvalidation', () => {
  it('invalidates course caches by courseId', async () => {
    await cacheInvalidation.invalidateCourse('course-99');

    expect(mockedRedisCache.invalidatePattern).toHaveBeenCalledWith(
      expect.stringContaining('course-99')
    );
    expect(mockedRedisCache.invalidateByTags).toHaveBeenCalledWith(['course:course-99']);
  });

  it('invalidates user caches across multiple prefixes', async () => {
    await cacheInvalidation.invalidateUser('user-42');

    // Should invalidate user, enrollment, and progress patterns (3 calls)
    expect(mockedRedisCache.invalidatePattern).toHaveBeenCalledTimes(3);
    expect(mockedRedisCache.invalidateByTags).toHaveBeenCalledWith(['user:user-42']);
  });

  it('invalidates all analytics caches', async () => {
    await cacheInvalidation.invalidateAnalytics();

    expect(mockedRedisCache.invalidatePattern).toHaveBeenCalledWith(
      expect.stringContaining(CACHE_PREFIXES.ANALYTICS)
    );
    expect(mockedRedisCache.invalidateByTags).toHaveBeenCalledWith(['analytics']);
  });

  it('invalidates all search caches', async () => {
    await cacheInvalidation.invalidateSearch();

    expect(mockedRedisCache.invalidatePattern).toHaveBeenCalledWith(
      expect.stringContaining(CACHE_PREFIXES.SEARCH)
    );
    expect(mockedRedisCache.invalidateByTags).toHaveBeenCalledWith(['search']);
  });

  it('logs info message after invalidation', async () => {
    await cacheInvalidation.invalidateCourse('course-log');

    expect(mockedLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('course-log')
    );
  });
});

// ---------------------------------------------------------------------------
// Type export verification
// ---------------------------------------------------------------------------
describe('type exports', () => {
  it('exports QueryMetrics interface shape', () => {
    const metric: QueryMetrics = {
      queryTime: 50,
      cacheHit: false,
      rowCount: 10,
    };
    expect(metric.queryTime).toBe(50);
    expect(metric.cacheHit).toBe(false);
    expect(metric.rowCount).toBe(10);
  });

  it('exports QueryOptions interface shape', () => {
    const options: QueryOptions = {
      cache: true,
      cacheTTL: 300,
      includeRelations: true,
      limit: 50,
      offset: 0,
    };
    expect(options.cache).toBe(true);
    expect(options.limit).toBe(50);
  });

  it('exports PaginationOptions interface shape', () => {
    const pagination: PaginationOptions = {
      page: 1,
      pageSize: 20,
      maxPageSize: 100,
    };
    expect(pagination.page).toBe(1);
    expect(pagination.pageSize).toBe(20);
    expect(pagination.maxPageSize).toBe(100);
  });
});
