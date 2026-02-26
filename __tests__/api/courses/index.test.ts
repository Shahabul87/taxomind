/**
 * Tests for Courses Route - app/api/courses/route.ts
 *
 * Covers: POST (course creation), GET (courses listing)
 */

// @/lib/db, @/lib/auth, @/lib/logger, @/lib/cache/redis-cache are globally mocked in jest.setup.js

// Provide the Prisma namespace so the route's `import { Prisma }` resolves properly.
// The moduleNameMapper maps @prisma/client to __mocks__/prisma.js, but the Prisma namespace
// is not properly exposed as a named ESM export. This mock ensures it is available.
// NOTE: jest.mock() calls are hoisted, so we must define the class INSIDE the factory.
jest.mock('@prisma/client', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    meta?: Record<string, unknown>;
    constructor(message: string, code: string, meta?: Record<string, unknown>) {
      super(message);
      this.name = 'PrismaClientKnownRequestError';
      this.code = code;
      this.meta = meta;
    }
  }

  return {
    Prisma: {
      PrismaClientKnownRequestError,
      QueryMode: {
        insensitive: 'insensitive',
        default: 'default',
      },
    },
  };
});

// Mock modules NOT covered by jest.setup.js
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  getClientIdentifier: jest.fn(() => '127.0.0.1:user-1'),
}));

jest.mock('@/lib/db/query-optimizer', () => ({
  cacheInvalidation: {
    invalidateUser: jest.fn(() => Promise.resolve()),
    invalidateSearch: jest.fn(() => Promise.resolve()),
    invalidateCourse: jest.fn(() => Promise.resolve()),
  },
  queryPerformanceMonitor: {
    recordMetric: jest.fn(),
  },
}));

jest.mock('@/lib/audit/course-audit', () => ({
  logCourseCreation: jest.fn(() => Promise.resolve()),
  logCourseUpdate: jest.fn(() => Promise.resolve()),
  logCourseDeletion: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/adapters/achievement-adapter', () => ({
  getAchievementEngine: jest.fn(() =>
    Promise.resolve({
      trackProgress: jest.fn(() => Promise.resolve()),
    })
  ),
}));

import { POST, GET } from '@/app/api/courses/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { redisCache } from '@/lib/cache/redis-cache';
import { cacheInvalidation } from '@/lib/db/query-optimizer';
import { logCourseCreation } from '@/lib/audit/course-audit';

const mockCurrentUser = currentUser as jest.Mock;
const mockRateLimit = rateLimit as jest.Mock;
const mockGetClientIdentifier = getClientIdentifier as jest.Mock;
const mockRedisCache = redisCache as jest.Mocked<typeof redisCache>;

// ============================================================================
// Helper Functions
// ============================================================================

function createPostRequest(
  body: Record<string, unknown>,
  headers?: Record<string, string>
): Request {
  return new Request('http://localhost:3000/api/courses', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function createGetRequest(params?: Record<string, string>): Request {
  const url = new URL('http://localhost:3000/api/courses');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new Request(url.toString(), { method: 'GET' });
}

// ============================================================================
// Default mock data
// ============================================================================

const defaultRateLimitResult = {
  success: true,
  limit: 10,
  remaining: 9,
  reset: Date.now() + 3600000,
};

const defaultDbUser = {
  id: 'user-1',
  email: 'teacher@test.com',
  isTeacher: true,
};

const defaultCreatedCourse = {
  id: 'course-new',
  title: 'Test Course',
  description: null,
  categoryId: null,
  isPublished: false,
  createdAt: new Date('2026-02-01'),
  userId: 'user-1',
};

const defaultCoursesList = [
  {
    id: 'course-1',
    title: 'Published Course A',
    subtitle: null,
    description: '<p>Course A description</p>',
    cleanDescription: 'Course A description',
    imageUrl: '/img/a.jpg',
    price: 29.99,
    isPublished: true,
    isFeatured: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-20'),
    categoryId: 'cat-1',
    userId: 'teacher-1',
    category: { id: 'cat-1', name: 'Programming' },
    user: { id: 'teacher-1', name: 'Teacher One', image: null },
    Enrollment: [],
    _count: { Enrollment: 5, reviews: 3, chapters: 10 },
    reviews: [{ rating: 5 }, { rating: 4 }, { rating: 3 }],
  },
  {
    id: 'course-2',
    title: 'Published Course B',
    subtitle: 'Subtitle B',
    description: null,
    cleanDescription: null,
    imageUrl: null,
    price: null,
    isPublished: true,
    isFeatured: false,
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-12'),
    categoryId: null,
    userId: 'teacher-2',
    category: null,
    user: { id: 'teacher-2', name: 'Teacher Two', image: '/img/t2.jpg' },
    Enrollment: [{ createdAt: new Date() }],
    _count: { Enrollment: 2, reviews: 0, chapters: 3 },
    reviews: [],
  },
];

// ============================================================================
// POST /api/courses - Course Creation
// ============================================================================

describe('POST /api/courses', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test Teacher' });
    mockRateLimit.mockResolvedValue(defaultRateLimitResult);
    mockGetClientIdentifier.mockReturnValue('127.0.0.1:user-1');

    (db.user.findUnique as jest.Mock).mockResolvedValue(defaultDbUser);
    (db.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) => {
      return fn(db);
    });
    (db.course.create as jest.Mock).mockResolvedValue(defaultCreatedCourse);

    (redisCache.invalidatePattern as jest.Mock).mockResolvedValue(1);
  });

  // ---------------------------
  // Authentication
  // ---------------------------

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createPostRequest({ title: 'My Course' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID User' });

    const res = await POST(createPostRequest({ title: 'My Course' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  // ---------------------------
  // Rate Limiting
  // ---------------------------

  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimit.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 3600000,
      retryAfter: 3500,
    });

    const res = await POST(createPostRequest({ title: 'My Course' }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('includes rate limit headers when rate limited', async () => {
    mockRateLimit.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 1700000000,
      retryAfter: 3500,
    });

    const res = await POST(createPostRequest({ title: 'My Course' }));

    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(res.headers.get('Retry-After')).toBe('3500');
  });

  // ---------------------------
  // User existence check
  // ---------------------------

  it('returns 404 when user is not found in database', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createPostRequest({ title: 'My Course' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('User account not found');
  });

  // ---------------------------
  // Validation
  // ---------------------------

  it('returns 422 when title is missing', async () => {
    const res = await POST(createPostRequest({}));
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 when title is too short (less than 3 chars)', async () => {
    const res = await POST(createPostRequest({ title: 'AB' }));
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'title',
          message: expect.stringContaining('at least 3 characters'),
        }),
      ])
    );
  });

  it('returns 422 when title exceeds 200 characters', async () => {
    const longTitle = 'A'.repeat(201);
    const res = await POST(createPostRequest({ title: longTitle }));
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 when description exceeds 5000 characters', async () => {
    const longDesc = 'D'.repeat(5001);
    const res = await POST(
      createPostRequest({ title: 'Valid Title', description: longDesc })
    );
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 when categoryId is not a valid UUID', async () => {
    const res = await POST(
      createPostRequest({ title: 'Valid Title', categoryId: 'not-a-uuid' })
    );
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 when learningObjectives exceeds 20 items', async () => {
    const objectives = Array.from({ length: 21 }, (_, i) => `Objective ${i + 1}`);
    const res = await POST(
      createPostRequest({ title: 'Valid Title', learningObjectives: objectives })
    );
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 when a learning objective exceeds 500 characters', async () => {
    const longObjective = 'X'.repeat(501);
    const res = await POST(
      createPostRequest({ title: 'Valid Title', learningObjectives: [longObjective] })
    );
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  // ---------------------------
  // Successful creation
  // ---------------------------

  it('creates a course with minimal data (title only)', async () => {
    const res = await POST(createPostRequest({ title: 'My New Course' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.id).toBe('course-new');
    expect(body.data.title).toBe('Test Course');
  });

  it('passes correct data to db.course.create via transaction', async () => {
    await POST(
      createPostRequest({
        title: '  Trimmed Title  ',
        description: 'A great course',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        learningObjectives: ['Learn X', 'Learn Y'],
      })
    );

    expect(db.course.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Trimmed Title',
          description: 'A great course',
          categoryId: '550e8400-e29b-41d4-a716-446655440000',
          isPublished: false,
          whatYouWillLearn: ['Learn X', 'Learn Y'],
        }),
      })
    );
  });

  it('sets courseGoals string when learning objectives are provided', async () => {
    await POST(
      createPostRequest({
        title: 'Course With Objectives',
        learningObjectives: ['Obj1', 'Obj2', 'Obj3'],
      })
    );

    expect(db.course.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          courseGoals: expect.stringContaining('3 learning objectives'),
          whatYouWillLearn: ['Obj1', 'Obj2', 'Obj3'],
        }),
      })
    );
  });

  it('sets courseGoals to null when no learning objectives provided', async () => {
    await POST(createPostRequest({ title: 'No Objectives Course' }));

    expect(db.course.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          courseGoals: null,
          whatYouWillLearn: [],
        }),
      })
    );
  });

  it('allows null description', async () => {
    await POST(
      createPostRequest({ title: 'Course', description: null })
    );

    expect(db.course.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: null,
        }),
      })
    );
  });

  it('includes rate limit headers on success', async () => {
    const res = await POST(createPostRequest({ title: 'My Course' }));

    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9');
  });

  it('includes meta timestamp in success response', async () => {
    const res = await POST(createPostRequest({ title: 'My Course' }));
    const body = await res.json();

    expect(body.meta).toBeDefined();
    expect(body.meta.timestamp).toBeDefined();
  });

  it('uses transaction for atomicity', async () => {
    await POST(createPostRequest({ title: 'Atomic Course' }));

    expect(db.$transaction).toHaveBeenCalled();
  });

  // ---------------------------
  // Audit logging
  // ---------------------------

  it('calls logCourseCreation after successful creation', async () => {
    await POST(
      createPostRequest({ title: 'Audited Course' })
    );

    expect(logCourseCreation).toHaveBeenCalledWith(
      'course-new',
      expect.objectContaining({
        userId: 'user-1',
      }),
      expect.objectContaining({
        title: 'Audited Course',
      })
    );
  });

  it('does not fail if audit logging throws', async () => {
    (logCourseCreation as jest.Mock).mockRejectedValue(new Error('Audit failed'));

    const res = await POST(createPostRequest({ title: 'Audit Fail Course' }));
    const body = await res.json();

    // Should still succeed
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
  });

  // ---------------------------
  // Cache invalidation
  // ---------------------------

  it('invalidates caches after successful creation', async () => {
    await POST(createPostRequest({ title: 'Cache Test Course' }));

    expect(cacheInvalidation.invalidateUser).toHaveBeenCalledWith('user-1');
    expect(cacheInvalidation.invalidateSearch).toHaveBeenCalled();
    expect(redisCache.invalidatePattern).toHaveBeenCalled();
  });

  it('does not fail if cache invalidation throws', async () => {
    (cacheInvalidation.invalidateUser as jest.Mock).mockRejectedValue(
      new Error('Cache error')
    );

    const res = await POST(createPostRequest({ title: 'Cache Fail Course' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
  });

  // ---------------------------
  // Prisma-specific errors
  // ---------------------------

  it('returns 409 on Prisma unique constraint violation (P2002)', async () => {
    // Get the PrismaClientKnownRequestError from our mock
    const { Prisma } = jest.requireMock('@prisma/client') as {
      Prisma: { PrismaClientKnownRequestError: new (msg: string, code: string, meta?: Record<string, unknown>) => Error & { code: string } };
    };
    const p2002 = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      'P2002',
      { target: ['title'] }
    );

    (db.$transaction as jest.Mock).mockRejectedValue(p2002);

    const res = await POST(createPostRequest({ title: 'Duplicate Course' }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.message).toContain('already exists');
  });

  it('returns 400 on Prisma foreign key constraint (P2003)', async () => {
    const { Prisma } = jest.requireMock('@prisma/client') as {
      Prisma: { PrismaClientKnownRequestError: new (msg: string, code: string, meta?: Record<string, unknown>) => Error & { code: string } };
    };
    const p2003 = new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint failed',
      'P2003',
      { field_name: 'categoryId' }
    );

    (db.$transaction as jest.Mock).mockRejectedValue(p2003);

    const res = await POST(
      createPostRequest({
        title: 'Bad Category Course',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toContain('Invalid category reference');
  });

  // ---------------------------
  // Generic errors
  // ---------------------------

  it('returns 500 on unexpected database errors', async () => {
    (db.$transaction as jest.Mock).mockRejectedValue(new Error('Connection lost'));

    const res = await POST(createPostRequest({ title: 'Error Course' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Unable to create course. Please try again.');
  });

  it('returns 500 when req.json() throws (malformed JSON)', async () => {
    const badReq = new Request('http://localhost:3000/api/courses', {
      method: 'POST',
      body: 'not json at all',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(badReq);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  // ---------------------------
  // IP address extraction
  // ---------------------------

  it('extracts IP from x-forwarded-for header for audit', async () => {
    await POST(
      createPostRequest(
        { title: 'IP Test' },
        { 'x-forwarded-for': '203.0.113.50, 70.41.3.18' }
      )
    );

    expect(logCourseCreation).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        ipAddress: '203.0.113.50',
      }),
      expect.any(Object)
    );
  });

  it('extracts IP from x-real-ip header when x-forwarded-for is absent', async () => {
    await POST(
      createPostRequest(
        { title: 'Real IP Test' },
        { 'x-real-ip': '10.0.0.1' }
      )
    );

    expect(logCourseCreation).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        ipAddress: '10.0.0.1',
      }),
      expect.any(Object)
    );
  });
});

// ============================================================================
// GET /api/courses - Courses Listing
// ============================================================================

describe('GET /api/courses', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test User' });

    (db.course.findMany as jest.Mock).mockResolvedValue(defaultCoursesList);
    (db.course.count as jest.Mock).mockResolvedValue(2);

    // Default: cache miss
    (redisCache.get as jest.Mock).mockResolvedValue({ hit: false, value: null });
    (redisCache.set as jest.Mock).mockResolvedValue(true);
  });

  // ---------------------------
  // Basic listing
  // ---------------------------

  it('returns published courses list', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
  });

  it('returns processed course objects with computed fields', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    const course = body[0];
    expect(course.id).toBe('course-1');
    expect(course.title).toBe('Published Course A');
    expect(course.averageRating).toBe(4);
    expect(course.reviewsCount).toBe(3);
    expect(course.enrollmentsCount).toBe(5);
    expect(course.chaptersLength).toBe(10);
    expect(course.chapters).toEqual([]);
  });

  it('computes average rating correctly', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    // ratings: [5, 4, 3] => avg = 4.0
    expect(body[0].averageRating).toBe(4);
    // no reviews => avg = 0
    expect(body[1].averageRating).toBe(0);
  });

  it('computes isEnrolled flag for logged-in user', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    // user-1: course-1 has empty Enrollment array => not enrolled
    expect(body[0].isEnrolled).toBe(false);
    // user-1: course-2 has an enrollment entry => enrolled
    expect(body[1].isEnrolled).toBe(true);
  });

  it('strips HTML from description for cleanDescription', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    // course-1 has HTML description
    expect(body[0].cleanDescription).toBe('Course A description');
  });

  // ---------------------------
  // Query parameters
  // ---------------------------

  it('passes categoryId filter to Prisma query', async () => {
    await GET(createGetRequest({ categoryId: 'cat-1' }));

    expect(db.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublished: true,
          categoryId: 'cat-1',
        }),
      })
    );
  });

  it('passes search filter with OR conditions', async () => {
    const res = await GET(createGetRequest({ search: 'javascript' }));

    // Verify the request succeeded (not an error that prevented the DB query)
    expect(res.status).toBe(200);
    expect(db.course.findMany).toHaveBeenCalled();

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.isPublished).toBe(true);
    expect(callArgs.where.OR).toBeDefined();
    expect(callArgs.where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: expect.objectContaining({ contains: 'javascript' }),
        }),
      ])
    );
  });

  it('passes featured filter when featured=true', async () => {
    await GET(createGetRequest({ featured: 'true' }));

    expect(db.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublished: true,
          isFeatured: true,
        }),
      })
    );
  });

  it('does not add isFeatured filter when featured param is not "true"', async () => {
    await GET(createGetRequest({ featured: 'false' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.isFeatured).toBeUndefined();
  });

  it('applies pagination with page and limit', async () => {
    await GET(createGetRequest({ page: '2', limit: '10' }));

    expect(db.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });

  it('defaults to page 1 and limit 20', async () => {
    await GET(createGetRequest());

    expect(db.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
      })
    );
  });

  // ---------------------------
  // Anonymous user
  // ---------------------------

  it('handles anonymous users (no auth)', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it('passes Enrollment: false when user is not logged in', async () => {
    mockCurrentUser.mockResolvedValue(null);

    await GET(createGetRequest());

    expect(db.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          Enrollment: false,
        }),
      })
    );
  });

  // ---------------------------
  // Caching
  // ---------------------------

  it('returns cached data on cache hit', async () => {
    const cachedData = [{ id: 'cached-course', title: 'Cached' }];
    (redisCache.get as jest.Mock).mockResolvedValue({ hit: true, value: cachedData });

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(body).toEqual(cachedData);
    // Should NOT query the database
    expect(db.course.findMany).not.toHaveBeenCalled();
  });

  it('stores result in cache on cache miss', async () => {
    await GET(createGetRequest());

    expect(redisCache.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({
        tags: ['courses', 'list'],
      })
    );
  });

  // ---------------------------
  // Error handling
  // ---------------------------

  it('returns 500 on database error', async () => {
    (db.course.findMany as jest.Mock).mockRejectedValue(new Error('DB connection error'));

    const res = await GET(createGetRequest());

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('Internal Error');
  });

  it('returns 500 if count query fails', async () => {
    (db.course.count as jest.Mock).mockRejectedValue(new Error('Count failed'));

    const res = await GET(createGetRequest());

    expect(res.status).toBe(500);
  });

  // ---------------------------
  // Edge cases
  // ---------------------------

  it('handles empty course list', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([]);
    (db.course.count as jest.Mock).mockResolvedValue(0);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it('handles courses with no reviews gracefully', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([
      {
        ...defaultCoursesList[0],
        reviews: [],
        _count: { ...defaultCoursesList[0]._count, reviews: 0 },
      },
    ]);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(body[0].averageRating).toBe(0);
    expect(body[0].reviewsCount).toBe(0);
  });

  it('handles courses with null description', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([
      {
        ...defaultCoursesList[0],
        description: null,
        cleanDescription: null,
      },
    ]);

    const res = await GET(createGetRequest());
    const body = await res.json();

    // cleanDescription should fallback to empty string or null cleanDescription
    expect(body[0].cleanDescription).toBeFalsy();
  });

  it('handles HTML entity decoding in descriptions', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([
      {
        ...defaultCoursesList[0],
        description: '<p>Tom &amp; Jerry&#39;s &lt;adventure&gt; &quot;fun&quot; &nbsp;time</p>',
        cleanDescription: null,
      },
    ]);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(body[0].cleanDescription).toBe('Tom & Jerry\'s <adventure> "fun"  time');
  });
});
