/**
 * Tests for Courses Search Route - app/api/courses/search/route.ts
 *
 * Covers: GET (course search with filtering, pagination, sorting, badges, wishlists)
 */

// @/lib/db, @/lib/auth, @/lib/logger, @/lib/cache/redis-cache are globally mocked in jest.setup.js

// Provide the Prisma namespace so the route's `import { Prisma }` resolves properly.
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

import { GET } from '@/app/api/courses/search/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

// ============================================================================
// Helper: build a NextRequest (uses the mock NextRequest from jest.setup.js)
// ============================================================================

function createSearchRequest(params?: Record<string, string>) {
  const { NextRequest } = jest.requireMock('next/server') as {
    NextRequest: new (url: string, init?: Record<string, unknown>) => {
      url: string;
      method: string;
      headers: Map<string, string>;
      nextUrl: { pathname: string; searchParams: URLSearchParams; href: string };
    };
  };

  const url = new URL('http://localhost:3000/api/courses/search');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new NextRequest(url.toString());
}

// ============================================================================
// Default mock data
// ============================================================================

const now = new Date('2026-02-20T12:00:00Z');

const defaultCourse = {
  id: 'course-1',
  title: 'TypeScript Masterclass',
  subtitle: 'Learn TS from scratch',
  description: 'A comprehensive TypeScript course',
  imageUrl: '/img/ts.jpg',
  price: 49.99,
  originalPrice: 79.99,
  difficulty: 'Intermediate',
  totalDuration: 600,
  createdAt: new Date('2026-02-01T00:00:00Z'),
  updatedAt: new Date('2026-02-10T00:00:00Z'),
  averageRating: 4.5,
  isPublished: true,
  categoryId: 'cat-1',
  userId: 'teacher-1',
  category: { id: 'cat-1', name: 'Programming' },
  user: { id: 'teacher-1', name: 'Jane Doe', image: '/img/jane.jpg' },
  chapters: [
    {
      id: 'ch-1',
      sections: [
        { id: 'sec-1', duration: 300 },
        { id: 'sec-2', duration: 600 },
      ],
    },
    {
      id: 'ch-2',
      sections: [
        { id: 'sec-3', duration: 400 },
      ],
    },
  ],
  Enrollment: [{ userId: 'user-1' }],
  reviews: [{ rating: 5 }, { rating: 4 }],
  wishlists: [{ id: 'wl-1' }],
  _count: {
    Enrollment: 150,
    reviews: 2,
    chapters: 5,
    certifications: 1,
  },
};

const defaultCourseNoUser = {
  ...defaultCourse,
  id: 'course-2',
  title: 'Python Basics',
  description: null,
  imageUrl: null,
  price: null,
  originalPrice: null,
  difficulty: null,
  totalDuration: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-05T00:00:00Z'),
  category: null,
  user: null,
  chapters: [],
  Enrollment: [],
  reviews: [],
  wishlists: [],
  _count: {
    Enrollment: 0,
    reviews: 0,
    chapters: 0,
    certifications: 0,
  },
};

const defaultCategories = [
  { id: 'cat-1', name: 'Programming', _count: { courses: 10 } },
  { id: 'cat-2', name: 'Design', _count: { courses: 5 } },
];

const defaultDifficultyCounts = [
  { difficulty: 'Beginner', _count: 10 },
  { difficulty: 'Intermediate', _count: 8 },
  { difficulty: 'Advanced', _count: 3 },
  { difficulty: null, _count: 2 },
];

// ============================================================================
// Test Suite
// ============================================================================

describe('GET /api/courses/search', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now });

    // Ensure crypto.randomUUID is available (jsdom may strip it)
    if (!globalThis.crypto?.randomUUID) {
      const nodeCrypto = require('crypto');
      Object.defineProperty(globalThis, 'crypto', {
        value: {
          ...globalThis.crypto,
          randomUUID: () => nodeCrypto.randomUUID(),
          getRandomValues: (array: Uint8Array) => nodeCrypto.randomFillSync(array),
        },
        configurable: true,
        writable: true,
      });
    }

    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test User' });

    (db.course.findMany as jest.Mock).mockResolvedValue([defaultCourse]);
    (db.course.count as jest.Mock).mockResolvedValue(1);
    (db.course.groupBy as jest.Mock).mockResolvedValue(defaultDifficultyCounts);
    (db.category.findMany as jest.Mock).mockResolvedValue(defaultCategories);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ------------------------------------------------------------------
  // Basic successful response
  // ------------------------------------------------------------------

  it('returns 200 with courses, filterOptions, pagination, and metadata', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.courses).toBeDefined();
    expect(body.data.filterOptions).toBeDefined();
    expect(body.data.pagination).toBeDefined();
    expect(body.metadata).toBeDefined();
    expect(body.metadata.version).toBe('1.0.0');
  });

  it('includes timestamp and requestId in metadata', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.metadata.timestamp).toBeDefined();
    expect(body.metadata.requestId).toBeDefined();
  });

  // ------------------------------------------------------------------
  // Course transformation
  // ------------------------------------------------------------------

  it('transforms courses with all computed fields', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    const course = body.data.courses[0];
    expect(course.id).toBe('course-1');
    expect(course.title).toBe('TypeScript Masterclass');
    expect(course.subtitle).toBe('Learn TS from scratch');
    expect(course.description).toBe('A comprehensive TypeScript course');
    expect(course.imageUrl).toBe('/img/ts.jpg');
    expect(course.price).toBe(49.99);
    expect(course.originalPrice).toBe(79.99);
  });

  it('calculates average rating from reviews', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    // ratings: [5, 4] => avg = 4.5
    expect(body.data.courses[0].rating).toBe(4.5);
  });

  it('returns 0 rating when no reviews', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([defaultCourseNoUser]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].rating).toBe(0);
  });

  it('computes lessonsCount from chapter sections', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    // ch-1 has 2 sections, ch-2 has 1 section => 3 lessons
    expect(body.data.courses[0].lessonsCount).toBe(3);
  });

  it('uses totalDuration materialized field when available', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    // totalDuration on the course is 600
    expect(body.data.courses[0].duration).toBe(600);
  });

  it('falls back to calculated duration from sections when totalDuration is null', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([
      { ...defaultCourse, totalDuration: null },
    ]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    // sections: 300 + 600 + 400 = 1300 seconds => Math.round(1300 / 60) = 22
    expect(body.data.courses[0].duration).toBe(22);
  });

  it('provides fallback imageUrl for courses without images', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([defaultCourseNoUser]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].imageUrl).toBe('/images/course-placeholder.svg');
  });

  it('provides default category for courses without category', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([defaultCourseNoUser]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].category.name).toBe('Uncategorized');
  });

  it('defaults difficulty to Beginner for null difficulty courses', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([defaultCourseNoUser]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].difficulty).toBe('Beginner');
  });

  it('sets instructor to undefined when user is null', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([defaultCourseNoUser]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].instructor).toBeUndefined();
  });

  it('populates instructor with name and avatar', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].instructor).toEqual({
      id: 'teacher-1',
      name: 'Jane Doe',
      avatar: '/img/jane.jpg',
    });
  });

  it('defaults instructor name to Unknown Instructor when name is null', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([
      { ...defaultCourse, user: { id: 'teacher-1', name: null, image: null } },
    ]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].instructor.name).toBe('Unknown Instructor');
  });

  // ------------------------------------------------------------------
  // Badges
  // ------------------------------------------------------------------

  it('adds New badge for courses created within 30 days', async () => {
    // defaultCourse was created on 2026-02-01, current time is 2026-02-20 => 19 days
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].badges).toContain('New');
  });

  it('does not add New badge for older courses', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([
      { ...defaultCourse, createdAt: new Date('2025-01-01') },
    ]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].badges).not.toContain('New');
  });

  it('adds Bestseller badge when enrollment count exceeds 100', async () => {
    // defaultCourse has _count.Enrollment = 150
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].badges).toContain('Bestseller');
  });

  it('does not add Bestseller badge when enrollment count is 100 or less', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([
      {
        ...defaultCourse,
        _count: { ...defaultCourse._count, Enrollment: 50 },
      },
    ]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].badges).not.toContain('Bestseller');
  });

  it('adds Hot badge when avg rating >= 4.5 and reviews >= 10', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([
      {
        ...defaultCourse,
        reviews: [{ rating: 5 }, { rating: 5 }, { rating: 4 }, { rating: 5 }],
        _count: { ...defaultCourse._count, reviews: 12 },
      },
    ]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].badges).toContain('Hot');
  });

  it('does not add Hot badge when avg rating is below 4.5', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([
      {
        ...defaultCourse,
        reviews: [{ rating: 3 }, { rating: 4 }],
        _count: { ...defaultCourse._count, reviews: 12 },
      },
    ]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].badges).not.toContain('Hot');
  });

  // ------------------------------------------------------------------
  // Enrollment & Wishlist
  // ------------------------------------------------------------------

  it('computes isEnrolled true when user is in enrollment list', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    // defaultCourse has Enrollment: [{ userId: 'user-1' }], user is 'user-1'
    expect(body.data.courses[0].isEnrolled).toBe(true);
  });

  it('computes isEnrolled false when user is not enrolled', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-99', name: 'Other User' });

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].isEnrolled).toBe(false);
  });

  it('computes isEnrolled false for anonymous user', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].isEnrolled).toBe(false);
  });

  it('computes isWishlisted true when wishlists array is non-empty for logged in user', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].isWishlisted).toBe(true);
  });

  it('computes isWishlisted false for anonymous user', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].isWishlisted).toBe(false);
  });

  // ------------------------------------------------------------------
  // hasCertificate and hasExercises
  // ------------------------------------------------------------------

  it('sets hasCertificate true when certifications count > 0', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].hasCertificate).toBe(true);
  });

  it('sets hasCertificate false when certifications count is 0', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([
      {
        ...defaultCourse,
        _count: { ...defaultCourse._count, certifications: 0 },
      },
    ]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].hasCertificate).toBe(false);
  });

  it('sets hasExercises true when chapters exist', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].hasExercises).toBe(true);
  });

  it('sets hasExercises false when no chapters', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([defaultCourseNoUser]);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.courses[0].hasExercises).toBe(false);
  });

  // ------------------------------------------------------------------
  // Search filter
  // ------------------------------------------------------------------

  it('applies text search filter when search param is provided', async () => {
    await GET(createSearchRequest({ search: 'typescript' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.isPublished).toBe(true);
    expect(callArgs.where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: expect.objectContaining({ contains: 'typescript', mode: 'insensitive' }),
        }),
        expect.objectContaining({
          description: expect.objectContaining({ contains: 'typescript', mode: 'insensitive' }),
        }),
      ])
    );
  });

  it('does not add OR filter when search param is empty', async () => {
    await GET(createSearchRequest());

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.OR).toBeUndefined();
  });

  // ------------------------------------------------------------------
  // Category filter
  // ------------------------------------------------------------------

  it('applies category filter with comma-separated IDs', async () => {
    await GET(createSearchRequest({ categories: 'cat-1,cat-2' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.categoryId).toEqual({ in: ['cat-1', 'cat-2'] });
  });

  it('applies single category filter', async () => {
    await GET(createSearchRequest({ categories: 'cat-1' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.categoryId).toEqual({ in: ['cat-1'] });
  });

  // ------------------------------------------------------------------
  // Price filter
  // ------------------------------------------------------------------

  it('applies minPrice filter', async () => {
    await GET(createSearchRequest({ minPrice: '10' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.price).toEqual(expect.objectContaining({ gte: 10 }));
  });

  it('applies maxPrice filter', async () => {
    await GET(createSearchRequest({ maxPrice: '100' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.price).toEqual(expect.objectContaining({ lte: 100 }));
  });

  it('applies both minPrice and maxPrice filter', async () => {
    await GET(createSearchRequest({ minPrice: '10', maxPrice: '100' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.price).toEqual({ gte: 10, lte: 100 });
  });

  // ------------------------------------------------------------------
  // Difficulty filter
  // ------------------------------------------------------------------

  it('applies difficulty filter for non-Beginner levels', async () => {
    await GET(createSearchRequest({ difficulties: 'Intermediate,Advanced' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.difficulty).toEqual({ in: ['Intermediate', 'Advanced'] });
  });

  it('includes null difficulty in OR when Beginner is selected', async () => {
    await GET(createSearchRequest({ difficulties: 'Beginner' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.OR).toEqual(
      expect.arrayContaining([
        { difficulty: { in: ['Beginner'] } },
        { difficulty: null },
      ])
    );
  });

  it('combines search OR with difficulty Beginner using AND', async () => {
    await GET(createSearchRequest({ search: 'python', difficulties: 'Beginner' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.AND).toBeDefined();
    expect(callArgs.where.AND.length).toBe(2);
    // First AND element: search OR
    expect(callArgs.where.AND[0].OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: expect.objectContaining({ contains: 'python' }) }),
      ])
    );
    // Second AND element: difficulty OR
    expect(callArgs.where.AND[1].OR).toEqual(
      expect.arrayContaining([
        { difficulty: { in: ['Beginner'] } },
        { difficulty: null },
      ])
    );
  });

  // ------------------------------------------------------------------
  // Duration filter
  // ------------------------------------------------------------------

  it('applies minDuration filter', async () => {
    await GET(createSearchRequest({ minDuration: '120' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.totalDuration).toEqual(expect.objectContaining({ gte: 120 }));
  });

  it('applies maxDuration filter', async () => {
    await GET(createSearchRequest({ maxDuration: '600' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.totalDuration).toEqual(expect.objectContaining({ lte: 600 }));
  });

  // ------------------------------------------------------------------
  // Sorting
  // ------------------------------------------------------------------

  it('sorts by newest (createdAt desc) by default', async () => {
    await GET(createSearchRequest());

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('sorts by newest when sort=newest', async () => {
    await GET(createSearchRequest({ sort: 'newest' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('sorts by price-low (price asc)', async () => {
    await GET(createSearchRequest({ sort: 'price-low' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.orderBy).toEqual({ price: 'asc' });
  });

  it('sorts by price-high (price desc)', async () => {
    await GET(createSearchRequest({ sort: 'price-high' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.orderBy).toEqual({ price: 'desc' });
  });

  it('sorts by popular (Enrollment count desc)', async () => {
    await GET(createSearchRequest({ sort: 'popular' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.orderBy).toEqual({ Enrollment: { _count: 'desc' } });
  });

  it('sorts by rating (averageRating desc)', async () => {
    await GET(createSearchRequest({ sort: 'rating' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.orderBy).toEqual({ averageRating: 'desc' });
  });

  it('sorts by duration-short (totalDuration asc)', async () => {
    await GET(createSearchRequest({ sort: 'duration-short' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.orderBy).toEqual({ totalDuration: 'asc' });
  });

  it('sorts by duration-long (totalDuration desc)', async () => {
    await GET(createSearchRequest({ sort: 'duration-long' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.orderBy).toEqual({ totalDuration: 'desc' });
  });

  // ------------------------------------------------------------------
  // Pagination
  // ------------------------------------------------------------------

  it('defaults to page 1 and limit 12', async () => {
    await GET(createSearchRequest());

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.skip).toBe(0);
    expect(callArgs.take).toBe(12);
  });

  it('applies custom page and limit', async () => {
    await GET(createSearchRequest({ page: '3', limit: '20' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.skip).toBe(40); // (3-1) * 20
    expect(callArgs.take).toBe(20);
  });

  it('clamps page to minimum of 1', async () => {
    await GET(createSearchRequest({ page: '0' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.skip).toBe(0);
  });

  it('clamps limit to maximum of 100', async () => {
    await GET(createSearchRequest({ limit: '200' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.take).toBe(100);
  });

  it('clamps limit to minimum of 1', async () => {
    await GET(createSearchRequest({ limit: '0' }));

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.take).toBe(1);
  });

  it('returns correct pagination metadata', async () => {
    (db.course.count as jest.Mock).mockResolvedValue(50);

    const res = await GET(createSearchRequest({ page: '2', limit: '10' }));
    const body = await res.json();

    expect(body.data.pagination).toEqual({
      page: 2,
      limit: 10,
      totalCount: 50,
      totalPages: 5,
    });
  });

  it('calculates totalPages correctly with remainder', async () => {
    (db.course.count as jest.Mock).mockResolvedValue(25);

    const res = await GET(createSearchRequest({ limit: '10' }));
    const body = await res.json();

    expect(body.data.pagination.totalPages).toBe(3); // Math.ceil(25/10)
  });

  // ------------------------------------------------------------------
  // Filter options (sidebar)
  // ------------------------------------------------------------------

  it('includes category filter options from database', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.filterOptions.categories).toEqual([
      { id: 'cat-1', name: 'Programming', count: 10 },
      { id: 'cat-2', name: 'Design', count: 5 },
    ]);
  });

  it('includes difficulty counts with Beginner including null count', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    const difficulties = body.data.filterOptions.difficulties;
    // Beginner = 10 (explicit) + 2 (null) = 12
    expect(difficulties[0]).toEqual({ value: 'Beginner', label: 'Beginner', count: 12 });
    expect(difficulties[1]).toEqual({ value: 'Intermediate', label: 'Intermediate', count: 8 });
    expect(difficulties[2]).toEqual({ value: 'Advanced', label: 'Advanced', count: 3 });
    expect(difficulties[3]).toEqual({ value: 'Expert', label: 'Expert', count: 0 });
  });

  it('includes static priceRanges in filterOptions', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.filterOptions.priceRanges).toHaveLength(5);
    expect(body.data.filterOptions.priceRanges[0]).toEqual({
      label: 'Free',
      min: 0,
      max: 0,
    });
  });

  it('includes static durations in filterOptions', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.filterOptions.durations).toHaveLength(4);
  });

  it('includes static ratings in filterOptions', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.filterOptions.ratings).toHaveLength(4);
  });

  it('includes static features in filterOptions', async () => {
    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(body.data.filterOptions.features).toHaveLength(5);
  });

  // ------------------------------------------------------------------
  // Anonymous user (no auth)
  // ------------------------------------------------------------------

  it('works for anonymous users (no auth)', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.courses).toHaveLength(1);
  });

  it('sets wishlists to false include for anonymous users', async () => {
    mockCurrentUser.mockResolvedValue(null);

    await GET(createSearchRequest());

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.include.wishlists).toBe(false);
  });

  // ------------------------------------------------------------------
  // Empty results
  // ------------------------------------------------------------------

  it('returns empty courses array when no courses match', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([]);
    (db.course.count as jest.Mock).mockResolvedValue(0);

    const res = await GET(createSearchRequest({ search: 'nonexistent' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.courses).toEqual([]);
    expect(body.data.pagination.totalCount).toBe(0);
    expect(body.data.pagination.totalPages).toBe(0);
  });

  // ------------------------------------------------------------------
  // Validation errors
  // ------------------------------------------------------------------

  it('returns 400 on invalid sort parameter', async () => {
    const res = await GET(createSearchRequest({ sort: 'invalid-sort' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  // ------------------------------------------------------------------
  // Internal errors
  // ------------------------------------------------------------------

  it('returns 500 on unexpected database error', async () => {
    (db.course.count as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Failed to search courses');
  });

  it('returns 500 when findMany throws', async () => {
    (db.course.findMany as jest.Mock).mockRejectedValue(new Error('Connection lost'));

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('returns 500 when groupBy throws', async () => {
    (db.course.groupBy as jest.Mock).mockRejectedValue(new Error('GroupBy failed'));

    const res = await GET(createSearchRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  // ------------------------------------------------------------------
  // Query structure checks
  // ------------------------------------------------------------------

  it('always filters by isPublished: true', async () => {
    await GET(createSearchRequest());

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.isPublished).toBe(true);
  });

  it('includes wishlists with user filter for authenticated users', async () => {
    await GET(createSearchRequest());

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.include.wishlists).toEqual(
      expect.objectContaining({
        where: { userId: 'user-1' },
        take: 1,
      })
    );
  });

  it('includes reviews, chapters, Enrollment, category, user in query', async () => {
    await GET(createSearchRequest());

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.include.reviews).toBeDefined();
    expect(callArgs.include.chapters).toBeDefined();
    expect(callArgs.include.Enrollment).toBeDefined();
    expect(callArgs.include.category).toBe(true);
    expect(callArgs.include.user).toBeDefined();
    expect(callArgs.include._count).toBeDefined();
  });

  // ------------------------------------------------------------------
  // Combined filters
  // ------------------------------------------------------------------

  it('applies multiple filters simultaneously', async () => {
    await GET(
      createSearchRequest({
        search: 'react',
        categories: 'cat-1',
        minPrice: '10',
        maxPrice: '50',
        difficulties: 'Intermediate',
        minDuration: '120',
        sort: 'newest',
        page: '2',
        limit: '5',
      })
    );

    const callArgs = (db.course.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.isPublished).toBe(true);
    expect(callArgs.where.OR).toBeDefined(); // search
    expect(callArgs.where.categoryId).toEqual({ in: ['cat-1'] });
    expect(callArgs.where.price).toEqual({ gte: 10, lte: 50 });
    expect(callArgs.where.difficulty).toEqual({ in: ['Intermediate'] });
    expect(callArgs.where.totalDuration).toEqual(expect.objectContaining({ gte: 120 }));
    expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
    expect(callArgs.skip).toBe(5); // (2-1) * 5
    expect(callArgs.take).toBe(5);
  });
});
