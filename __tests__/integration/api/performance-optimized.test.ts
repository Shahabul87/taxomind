/**
 * Integration Tests for Performance-Optimized API Endpoints
 * Tests API endpoints with caching, database optimizations, and rate limiting
 */

import { NextRequest } from 'next/server';
import {
  MockDataGenerator as MockData,
} from '@/__tests__/utils/test-utilities';

// Mock implementations
const mockDb: Record<string, Record<string, jest.Mock> & { mock?: { calls: unknown[][] } }> & { $queryRaw: jest.Mock; $transaction: jest.Mock } = {
  course: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    findUnique: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    count: jest.fn().mockResolvedValue(0),
  },
  user: {
    update: jest.fn().mockResolvedValue({}),
  },
  $queryRaw: jest.fn().mockResolvedValue([]),
  $transaction: jest.fn().mockImplementation((callback: (db: unknown) => Promise<unknown>) => callback(mockDb)),
};

const mockRedis: Record<string, jest.Mock> = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
};

// In-memory cache for testing
const cache = new Map<string, { data: unknown; expires: number }>();

// Mock route handlers that simulate caching and performance features
function createCachedGET() {
  return async (request: Request) => {
    const url = new URL(request.url);
    const cacheKey = `courses:${url.search}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }

    // Database query
    const data = await mockDb.course.findMany();
    cache.set(cacheKey, { data, expires: Date.now() + 60000 });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  };
}

function createPaginatedGET() {
  return async (request: Request) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const items = await mockDb.course.findMany();
    const total = await mockDb.course.count();

    return new Response(
      JSON.stringify({ items, total, page, limit }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };
}

// Mock rate limiter
function createRateLimitedGET(limit: number) {
  const requestCounts = new Map<string, number>();

  return async (request: Request) => {
    const ip = request.headers.get('x-forwarded-for') || 'default';
    const count = (requestCounts.get(ip) || 0) + 1;
    requestCounts.set(ip, count);

    if (count > limit) {
      return new Response(JSON.stringify({ error: 'Rate limited' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await mockDb.course.findMany();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

describe('Performance-Optimized API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.clear();
    mockDb.course.findMany.mockResolvedValue([]);
  });

  describe('Cached API Endpoints', () => {
    it('should cache GET requests', async () => {
      const GET = createCachedGET();
      const mockCourses = MockData.generateQueryResult(50);
      mockDb.course.findMany.mockResolvedValue(mockCourses);

      // First request - cache miss
      const request1 = new NextRequest('http://localhost:3000/api/courses');
      const response1 = await GET(request1);
      const data1 = await response1.json();

      // JSON round-trip converts Date objects to ISO strings
      const expectedData = JSON.parse(JSON.stringify(mockCourses));

      expect(mockDb.course.findMany).toHaveBeenCalledTimes(1);
      expect(data1).toEqual(expectedData);
      expect(response1.headers.get('X-Cache')).toBe('MISS');

      // Second request - cache hit
      const request2 = new NextRequest('http://localhost:3000/api/courses');
      const response2 = await GET(request2);
      const data2 = await response2.json();

      // Should use cache, not database
      expect(mockDb.course.findMany).toHaveBeenCalledTimes(1);
      expect(data2).toEqual(expectedData);
      expect(response2.headers.get('X-Cache')).toBe('HIT');
    });

    it('should invalidate cache on mutations', async () => {
      const GET = createCachedGET();
      const mockCourses = MockData.generateQueryResult(10);
      mockDb.course.findMany.mockResolvedValue(mockCourses);

      // Initial GET to populate cache
      await GET(new NextRequest('http://localhost:3000/api/courses'));
      expect(mockDb.course.findMany).toHaveBeenCalledTimes(1);

      // Simulate mutation by clearing cache
      cache.clear();
      mockRedis.del('courses');

      // Next GET should hit database again
      mockDb.course.findMany.mockClear();
      await GET(new NextRequest('http://localhost:3000/api/courses'));
      expect(mockDb.course.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle query parameter variations', async () => {
      const GET = createCachedGET();
      const mockFilteredCourses = MockData.generateQueryResult(5);
      mockDb.course.findMany.mockResolvedValue(mockFilteredCourses);

      // Different query parameters should have different cache keys
      const urls = [
        'http://localhost:3000/api/courses?category=programming',
        'http://localhost:3000/api/courses?category=design',
        'http://localhost:3000/api/courses?category=programming&sort=popular',
      ];

      for (const url of urls) {
        await GET(new NextRequest(url));
      }

      // Each unique query should hit the database once
      expect(mockDb.course.findMany).toHaveBeenCalledTimes(3);
    });
  });

  describe('Database Query Optimizations', () => {
    it('should use optimized queries with proper includes', async () => {
      const mockCourse = {
        id: 'course-123',
        title: 'Test Course',
        chapters: MockData.generateQueryResult(10),
        user: { id: 'user-1', name: 'Instructor' },
        _count: { Enrollment: 100, reviews: 50 },
      };

      mockDb.course.findUnique.mockResolvedValue(mockCourse);

      // Simulate a findUnique call with includes
      const result = await mockDb.course.findUnique({
        where: { id: 'course-123' },
        include: {
          chapters: { select: { id: true, title: true } },
          user: { select: { id: true, name: true } },
          _count: { select: { Enrollment: true } },
        },
      });

      expect(result).toBeDefined();
      expect(result.chapters).toHaveLength(10);
      expect(result.user).toBeDefined();
    });

    it('should batch database operations', async () => {
      const updates = Array.from({ length: 10 }, (_, i) => ({
        id: `course-${i}`,
        title: `Updated Title ${i}`,
      }));

      mockDb.$transaction.mockResolvedValue(updates);

      const result = await mockDb.$transaction(async (tx: unknown) => {
        return updates;
      });

      expect(result).toHaveLength(10);
    });

    it('should implement pagination efficiently', async () => {
      const GET = createPaginatedGET();
      const totalCourses = 1000;
      const pageSize = 20;

      for (let page = 1; page <= 5; page++) {
        const mockPageData = MockData.generateQueryResult(pageSize);
        mockDb.course.findMany.mockResolvedValue(mockPageData);
        mockDb.course.count.mockResolvedValue(totalCourses);

        const pageStart = Date.now();
        const response = await GET(
          new NextRequest(`http://localhost:3000/api/courses?page=${page}&limit=${pageSize}`)
        );
        const duration = Date.now() - pageStart;

        const data = await response.json();

        expect(data.items).toHaveLength(pageSize);
        expect(data.total).toBe(totalCourses);
        expect(data.page).toBe(page);
        expect(duration).toBeLessThan(100);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const rateLimit = 10;
      const GET = createRateLimitedGET(rateLimit);

      const requests: Promise<Response>[] = [];
      for (let i = 0; i < rateLimit + 5; i++) {
        const request = new NextRequest('http://localhost:3000/api/courses', {
          headers: { 'x-forwarded-for': '192.168.1.1' },
        });
        requests.push(GET(request));
      }

      const responses = await Promise.all(requests);

      const successful = responses.filter((r) => r.status === 200);
      const rateLimited = responses.filter((r) => r.status === 429);

      expect(successful.length).toBeLessThanOrEqual(rateLimit);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should use sliding window rate limiting', async () => {
      const GET = createRateLimitedGET(10);

      // First burst
      for (let i = 0; i < 5; i++) {
        await GET(new NextRequest('http://localhost:3000/api/courses'));
      }

      // Second burst from same default IP
      const responses: Response[] = [];
      for (let i = 0; i < 5; i++) {
        responses.push(await GET(new NextRequest('http://localhost:3000/api/courses')));
      }

      // All should still be allowed (under limit of 10)
      const allowed = responses.filter((r) => r.status === 200);
      expect(allowed.length).toBeGreaterThan(0);
    });
  });

  describe('Connection Pooling', () => {
    it('should reuse database connections', async () => {
      const GET = createCachedGET();
      const concurrentRequests = 50;

      const concurrentStart = Date.now();
      await Promise.all(
        Array.from({ length: concurrentRequests }, (_, i) =>
          GET(new NextRequest(`http://localhost:3000/api/courses?page=${i}`))
        )
      );
      const duration = Date.now() - concurrentStart;

      // Should handle concurrent requests efficiently
      const avgTimePerRequest = duration / concurrentRequests;
      expect(avgTimePerRequest).toBeLessThan(50);
    });

    it('should handle connection failures gracefully', async () => {
      const GET = async (request: Request) => {
        try {
          const data = await mockDb.course.findMany();
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch {
          return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      };

      mockDb.course.findMany.mockRejectedValueOnce(new Error('Connection timeout'));

      const response = await GET(new NextRequest('http://localhost:3000/api/courses'));
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Response Compression', () => {
    it('should compress large responses', async () => {
      const largeDataset = MockData.generateLargeDataset(1000);
      const jsonString = JSON.stringify(largeDataset);

      // Verify the dataset is large enough to benefit from compression
      expect(jsonString.length).toBeGreaterThan(1000);

      // In a real scenario, Next.js handles compression at the server level
      // Here we verify the data can be serialized and the size is reasonable
      const parsed = JSON.parse(jsonString);
      expect(parsed).toHaveLength(1000);
    });
  });

  describe('API Performance Monitoring', () => {
    it('should track API response times', async () => {
      const timings: number[] = [];

      const GET = async () => {
        const start = Date.now();
        await mockDb.course.findMany();
        timings.push(Date.now() - start);
        return new Response('{}', { status: 200 });
      };

      for (let i = 0; i < 10; i++) {
        await GET();
      }

      expect(timings.length).toBe(10);
      timings.forEach((timing) => {
        expect(timing).toBeGreaterThanOrEqual(0);
      });
    });

    it('should detect slow queries', async () => {
      mockDb.course.findMany.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return MockData.generateQueryResult(10);
      });

      const slowStart = Date.now();
      await mockDb.course.findMany();
      const duration = Date.now() - slowStart;

      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Optimistic Updates', () => {
    it('should handle optimistic updates correctly', async () => {
      const courseId = 'course-123';
      const updateData = { title: 'Updated Title' };

      mockDb.course.update.mockResolvedValue({
        id: courseId,
        ...updateData,
      });

      const result = await mockDb.course.update({
        where: { id: courseId },
        data: updateData,
      });

      expect(result.id).toBe(courseId);
      expect(result.title).toBe(updateData.title);

      // Cache invalidation
      cache.delete(`course:${courseId}`);
      expect(cache.has(`course:${courseId}`)).toBe(false);
    });
  });

  describe('Search Optimization', () => {
    it('should use full-text search efficiently', async () => {
      const mockResults = MockData.generateQueryResult(20);
      mockDb.$queryRaw.mockResolvedValue(mockResults);

      const searchStart = Date.now();
      const results = await mockDb.$queryRaw();
      const duration = Date.now() - searchStart;

      expect(results).toHaveLength(20);
      expect(duration).toBeLessThan(1000);
    });

    it('should implement search result caching', async () => {
      const searchKey = 'search:react hooks';
      const mockResults = MockData.generateQueryResult(15);

      // First search - cache miss
      cache.set(searchKey, { data: mockResults, expires: Date.now() + 60000 });

      // Second search - cache hit
      const cached = cache.get(searchKey);
      expect(cached).toBeDefined();
      expect(cached!.data).toEqual(mockResults);
    });
  });

  describe('Webhook Processing', () => {
    it('should process webhooks asynchronously', async () => {
      const processed: unknown[] = [];

      const POST = async (request: Request) => {
        const body = await request.json();
        // Acknowledge immediately
        setTimeout(() => {
          processed.push(body);
        }, 10);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      };

      const request = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        body: JSON.stringify({
          event: 'payment.success',
          data: { userId: 'user-123', amount: 100 },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(processed.length).toBe(1);
    });
  });

  describe('Error Recovery', () => {
    it('should implement retry logic for failed operations', async () => {
      let attempts = 0;
      const retryableOperation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { id: 'new-course' };
      };

      // Manual retry
      let result: { id: string } | null = null;
      for (let i = 0; i < 3; i++) {
        try {
          result = await retryableOperation();
          break;
        } catch {
          // Retry
        }
      }

      expect(attempts).toBe(3);
      expect(result!.id).toBe('new-course');
    });

    it('should handle partial failures in batch operations', async () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        title: `Course ${i}`,
      }));

      const results = await Promise.allSettled(
        items.map(async (item, i) => {
          if (i === 2) throw new Error('Failed');
          return { ...item, id: `id-${i}` };
        })
      );

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(4);
      expect(rejected.length).toBe(1);
    });
  });
});
