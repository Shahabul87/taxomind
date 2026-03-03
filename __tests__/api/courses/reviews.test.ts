/**
 * Tests for Course Reviews Route - app/api/courses/[courseId]/reviews/route.ts
 *
 * Covers:
 *   POST - Create a course review
 *   GET  - Retrieve reviews (legacy full list and paginated/filtered)
 *
 * Test scenarios:
 * POST:
 *   - Unauthenticated user (401)
 *   - Invalid rating: missing, below 1, above 5 (400)
 *   - Comment too short / missing (400)
 *   - Course not found (404)
 *   - Duplicate review prevention (400)
 *   - Successful review creation
 *   - Internal server error (500)
 *
 * GET (legacy - no query params):
 *   - Returns full list of reviews with user info
 *   - Returns empty array when no reviews exist
 *   - Includes helpfulCount and viewerHasVoted for authenticated users
 *   - Works for unauthenticated viewers
 *
 * GET (paginated - with query params):
 *   - Paginated response with total, page, pageSize, ratingCounts
 *   - Rating filter
 *   - Sort by highest/lowest/helpful
 *   - Page size cap at 50
 *   - Internal server error (500)
 */

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { POST, GET } from '@/app/api/courses/[courseId]/reviews/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

/**
 * Create a Request for the reviews endpoint
 */
function createPostRequest(body: Record<string, unknown>, courseId = 'course-1') {
  return new Request(
    `http://localhost:3000/api/courses/${courseId}/reviews`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

function createGetRequest(courseId = 'course-1', query = '') {
  const qs = query ? `?${query}` : '';
  return new Request(
    `http://localhost:3000/api/courses/${courseId}/reviews${qs}`,
    { method: 'GET' }
  );
}

function createParams(courseId = 'course-1') {
  return { params: Promise.resolve({ courseId }) };
}

// ============================================
// POST /api/courses/[courseId]/reviews
// ============================================

describe('POST /api/courses/[courseId]/reviews', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test User' });

    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Test Course',
    });

    (db.courseReview.findFirst as jest.Mock).mockResolvedValue(null);

    (db.courseReview.create as jest.Mock).mockResolvedValue({
      id: 'review-1',
      rating: 4,
      comment: 'This is a great course with lots of content',
      courseId: 'course-1',
      userId: 'user-1',
      createdAt: new Date('2026-02-01'),
      updatedAt: new Date('2026-02-01'),
      user: { id: 'user-1', name: 'Test User', image: null },
    });
  });

  // ----------------------------
  // Authentication
  // ----------------------------

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(
      createPostRequest({ rating: 4, comment: 'Good course indeed!' }),
      createParams()
    );

    expect(res.status).toBe(401);
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID' });

    const res = await POST(
      createPostRequest({ rating: 4, comment: 'Good course indeed!' }),
      createParams()
    );

    expect(res.status).toBe(401);
  });

  // ----------------------------
  // Rating validation
  // ----------------------------

  it('returns 400 when rating is missing', async () => {
    const res = await POST(
      createPostRequest({ comment: 'Good course indeed!' }),
      createParams()
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 when rating is 0', async () => {
    const res = await POST(
      createPostRequest({ rating: 0, comment: 'Good course indeed!' }),
      createParams()
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 when rating is below 1', async () => {
    const res = await POST(
      createPostRequest({ rating: -1, comment: 'Bad course rating test' }),
      createParams()
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 when rating is above 5', async () => {
    const res = await POST(
      createPostRequest({ rating: 6, comment: 'Six star review here!' }),
      createParams()
    );

    expect(res.status).toBe(400);
  });

  // ----------------------------
  // Comment validation
  // ----------------------------

  it('returns 400 when comment is missing', async () => {
    const res = await POST(
      createPostRequest({ rating: 4 }),
      createParams()
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 when comment is too short (less than 10 chars)', async () => {
    const res = await POST(
      createPostRequest({ rating: 4, comment: 'Short' }),
      createParams()
    );

    expect(res.status).toBe(400);
    const text = await res.json();
    expect(JSON.stringify(text)).toContain('at least 10');
  });

  it('returns 400 when comment is empty string', async () => {
    const res = await POST(
      createPostRequest({ rating: 4, comment: '' }),
      createParams()
    );

    expect(res.status).toBe(400);
  });

  // ----------------------------
  // Course validation
  // ----------------------------

  it('returns 404 when course does not exist', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(
      createPostRequest({ rating: 5, comment: 'This is a great course!' }),
      createParams()
    );

    expect(res.status).toBe(404);
    const text = await res.json();
    expect(JSON.stringify(text)).toContain('Course not found');
  });

  // ----------------------------
  // Duplicate review prevention
  // ----------------------------

  it('returns 400 when user has already reviewed the course', async () => {
    (db.courseReview.findFirst as jest.Mock).mockResolvedValue({
      id: 'existing-review',
      rating: 3,
      userId: 'user-1',
      courseId: 'course-1',
    });

    const res = await POST(
      createPostRequest({ rating: 5, comment: 'Trying to review again here!' }),
      createParams()
    );

    expect(res.status).toBe(400);
    const text = await res.json();
    expect(JSON.stringify(text)).toContain('already reviewed');
  });

  it('checks for existing review with correct userId and courseId', async () => {
    await POST(
      createPostRequest({ rating: 4, comment: 'This is a valid review' }),
      createParams('course-abc')
    );

    expect(db.courseReview.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          courseId: 'course-abc',
          userId: 'user-1',
        },
      })
    );
  });

  // ----------------------------
  // Successful creation
  // ----------------------------

  it('creates review successfully with valid data', async () => {
    const res = await POST(
      createPostRequest({ rating: 4, comment: 'This is a great course with lots of content' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('review-1');
    expect(body.rating).toBe(4);
    expect(body.comment).toBe('This is a great course with lots of content');
    expect(body.user.name).toBe('Test User');
  });

  it('creates review with rating at boundary (1)', async () => {
    (db.courseReview.create as jest.Mock).mockResolvedValue({
      id: 'review-low',
      rating: 1,
      comment: 'Not a good experience overall',
      courseId: 'course-1',
      userId: 'user-1',
      user: { id: 'user-1', name: 'Test User', image: null },
    });

    const res = await POST(
      createPostRequest({ rating: 1, comment: 'Not a good experience overall' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.rating).toBe(1);
  });

  it('creates review with rating at boundary (5)', async () => {
    (db.courseReview.create as jest.Mock).mockResolvedValue({
      id: 'review-high',
      rating: 5,
      comment: 'Absolutely outstanding course!',
      courseId: 'course-1',
      userId: 'user-1',
      user: { id: 'user-1', name: 'Test User', image: null },
    });

    const res = await POST(
      createPostRequest({ rating: 5, comment: 'Absolutely outstanding course!' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.rating).toBe(5);
  });

  it('passes correct data to db.courseReview.create', async () => {
    await POST(
      createPostRequest({ rating: 3, comment: 'Average course experience' }),
      createParams('course-xyz')
    );

    expect(db.courseReview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          rating: 3,
          comment: 'Average course experience',
          courseId: 'course-xyz',
          userId: 'user-1',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      })
    );
  });

  it('creates review with exactly 10-character comment', async () => {
    (db.courseReview.create as jest.Mock).mockResolvedValue({
      id: 'review-min',
      rating: 3,
      comment: '0123456789',
      courseId: 'course-1',
      userId: 'user-1',
      user: { id: 'user-1', name: 'Test User', image: null },
    });

    const res = await POST(
      createPostRequest({ rating: 3, comment: '0123456789' }),
      createParams()
    );

    expect(res.status).toBe(200);
  });

  // ----------------------------
  // Error handling
  // ----------------------------

  it('returns 500 on unexpected database error during create', async () => {
    (db.courseReview.create as jest.Mock).mockRejectedValue(
      new Error('DB write error')
    );

    const res = await POST(
      createPostRequest({ rating: 4, comment: 'This is a valid review comment' }),
      createParams()
    );

    expect(res.status).toBe(500);
    const text = await res.json();
    expect(JSON.stringify(text)).toContain('Internal Server Error');
  });
});

// ============================================
// GET /api/courses/[courseId]/reviews
// ============================================

describe('GET /api/courses/[courseId]/reviews', () => {
  const mockReviewData = [
    {
      id: 'review-1',
      rating: 5,
      comment: 'Excellent!',
      courseId: 'course-1',
      userId: 'user-2',
      createdAt: new Date('2026-02-01'),
      updatedAt: new Date('2026-02-01'),
      user: { id: 'user-2', name: 'Alice', image: 'alice.jpg' },
      _count: { helpfulVotes: 3 },
      helpfulVotes: [],
    },
    {
      id: 'review-2',
      rating: 3,
      comment: 'Average content',
      courseId: 'course-1',
      userId: 'user-3',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      user: { id: 'user-3', name: 'Bob', image: null },
      _count: { helpfulVotes: 0 },
      helpfulVotes: [],
    },
  ];

  // ----------------------------------------
  // Legacy GET (no query params)
  // ----------------------------------------

  describe('Legacy mode (no query params)', () => {
    beforeEach(() => {
      mockCurrentUser.mockResolvedValue({ id: 'user-1' });

      (db.courseReview.findMany as jest.Mock).mockResolvedValue(mockReviewData);
    });

    it('returns all reviews for a course', async () => {
      const res = await GET(createGetRequest(), createParams());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
    });

    it('maps helpfulCount from _count.helpfulVotes', async () => {
      const res = await GET(createGetRequest(), createParams());
      const body = await res.json();

      expect(body[0].helpfulCount).toBe(3);
      expect(body[1].helpfulCount).toBe(0);
    });

    it('maps viewerHasVoted correctly when no helpful votes', async () => {
      const res = await GET(createGetRequest(), createParams());
      const body = await res.json();

      expect(body[0].viewerHasVoted).toBe(false);
      expect(body[1].viewerHasVoted).toBe(false);
    });

    it('maps viewerHasVoted to true when viewer has voted', async () => {
      (db.courseReview.findMany as jest.Mock).mockResolvedValue([
        {
          ...mockReviewData[0],
          helpfulVotes: [{ id: 'vote-1' }],
        },
      ]);

      const res = await GET(createGetRequest(), createParams());
      const body = await res.json();

      expect(body[0].viewerHasVoted).toBe(true);
    });

    it('returns reviews for unauthenticated viewer', async () => {
      mockCurrentUser.mockRejectedValue(new Error('Not authenticated'));

      (db.courseReview.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'review-1',
          rating: 5,
          comment: 'Great!',
          courseId: 'course-1',
          userId: 'user-2',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 'user-2', name: 'Alice', image: null },
          _count: { helpfulVotes: 1 },
          // No helpfulVotes field since viewerId is null
        },
      ]);

      const res = await GET(createGetRequest(), createParams());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].viewerHasVoted).toBe(false);
    });

    it('returns empty array when no reviews exist', async () => {
      (db.courseReview.findMany as jest.Mock).mockResolvedValue([]);

      const res = await GET(createGetRequest(), createParams());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });

    it('includes user data in each review', async () => {
      const res = await GET(createGetRequest(), createParams());
      const body = await res.json();

      expect(body[0].user).toEqual({
        id: 'user-2',
        name: 'Alice',
        image: 'alice.jpg',
      });
    });

    it('queries reviews ordered by createdAt desc', async () => {
      await GET(createGetRequest(), createParams());

      expect(db.courseReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { courseId: 'course-1' },
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  // ----------------------------------------
  // Paginated GET (with query params)
  // ----------------------------------------

  describe('Paginated mode (with query params)', () => {
    beforeEach(() => {
      mockCurrentUser.mockResolvedValue({ id: 'user-1' });

      // Mock count
      (db.courseReview.count as jest.Mock).mockResolvedValue(25);

      // Mock findMany (paginated results)
      (db.courseReview.findMany as jest.Mock).mockResolvedValue(mockReviewData);

      // Mock groupBy (rating distribution)
      (db.courseReview.groupBy as jest.Mock).mockResolvedValue([
        { rating: 5, _count: { rating: 10 } },
        { rating: 4, _count: { rating: 8 } },
        { rating: 3, _count: { rating: 4 } },
        { rating: 2, _count: { rating: 2 } },
        { rating: 1, _count: { rating: 1 } },
      ]);
    });

    it('returns paginated response when page param is provided', async () => {
      const res = await GET(
        createGetRequest('course-1', 'page=1'),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.items).toBeDefined();
      expect(body.total).toBe(25);
      expect(body.page).toBe(1);
      expect(body.pageSize).toBe(10); // default
    });

    it('returns correct ratingCounts distribution', async () => {
      const res = await GET(
        createGetRequest('course-1', 'page=1'),
        createParams()
      );
      const body = await res.json();

      expect(body.ratingCounts).toEqual([1, 2, 4, 8, 10]);
    });

    it('respects custom pageSize', async () => {
      const res = await GET(
        createGetRequest('course-1', 'page=1&pageSize=5'),
        createParams()
      );
      const body = await res.json();

      expect(body.pageSize).toBe(5);

      expect(db.courseReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 0,
        })
      );
    });

    it('caps pageSize at 50', async () => {
      const res = await GET(
        createGetRequest('course-1', 'page=1&pageSize=100'),
        createParams()
      );
      const body = await res.json();

      expect(body.pageSize).toBe(50);
    });

    it('calculates correct skip for page 2', async () => {
      await GET(
        createGetRequest('course-1', 'page=2&pageSize=10'),
        createParams()
      );

      expect(db.courseReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('calculates correct skip for page 3 with custom pageSize', async () => {
      await GET(
        createGetRequest('course-1', 'page=3&pageSize=5'),
        createParams()
      );

      expect(db.courseReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      );
    });

    it('filters by rating when rating param is provided', async () => {
      await GET(
        createGetRequest('course-1', 'page=1&rating=5'),
        createParams()
      );

      expect(db.courseReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            courseId: 'course-1',
            rating: 5,
          }),
        })
      );
    });

    it('sorts by highest rating', async () => {
      await GET(
        createGetRequest('course-1', 'page=1&sortBy=highest'),
        createParams()
      );

      expect(db.courseReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { rating: 'desc' },
        })
      );
    });

    it('sorts by lowest rating', async () => {
      await GET(
        createGetRequest('course-1', 'page=1&sortBy=lowest'),
        createParams()
      );

      expect(db.courseReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { rating: 'asc' },
        })
      );
    });

    it('sorts by helpful (most helpful first)', async () => {
      await GET(
        createGetRequest('course-1', 'page=1&sortBy=helpful'),
        createParams()
      );

      expect(db.courseReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { helpfulVotes: { _count: 'desc' } },
            { createdAt: 'desc' },
          ],
        })
      );
    });

    it('defaults to recent sort', async () => {
      await GET(
        createGetRequest('course-1', 'page=1'),
        createParams()
      );

      expect(db.courseReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('handles invalid page number gracefully (defaults to 1)', async () => {
      const res = await GET(
        createGetRequest('course-1', 'page=0'),
        createParams()
      );
      const body = await res.json();

      expect(body.page).toBe(1);
    });

    it('handles negative page number gracefully (defaults to 1)', async () => {
      const res = await GET(
        createGetRequest('course-1', 'page=-5'),
        createParams()
      );
      const body = await res.json();

      expect(body.page).toBe(1);
    });

    it('ignores invalid rating filter', async () => {
      await GET(
        createGetRequest('course-1', 'page=1&rating=0'),
        createParams()
      );

      // rating=0 is not between 1-5, so it should not be in the where clause
      expect(db.courseReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { courseId: 'course-1' },
        })
      );
    });

    it('ignores rating filter above 5', async () => {
      await GET(
        createGetRequest('course-1', 'page=1&rating=7'),
        createParams()
      );

      expect(db.courseReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { courseId: 'course-1' },
        })
      );
    });

    it('maps items with helpfulCount and viewerHasVoted', async () => {
      const res = await GET(
        createGetRequest('course-1', 'page=1'),
        createParams()
      );
      const body = await res.json();

      expect(body.items[0].helpfulCount).toBe(3);
      expect(body.items[0].viewerHasVoted).toBe(false);
    });

    it('activates paginated mode when pageSize param is provided', async () => {
      const res = await GET(
        createGetRequest('course-1', 'pageSize=5'),
        createParams()
      );
      const body = await res.json();

      expect(body.items).toBeDefined();
      expect(body.total).toBeDefined();
    });

    it('activates paginated mode when sortBy param is provided', async () => {
      const res = await GET(
        createGetRequest('course-1', 'sortBy=highest'),
        createParams()
      );
      const body = await res.json();

      expect(body.items).toBeDefined();
    });

    it('activates paginated mode when rating param is provided', async () => {
      const res = await GET(
        createGetRequest('course-1', 'rating=4'),
        createParams()
      );
      const body = await res.json();

      expect(body.items).toBeDefined();
    });

    it('uses groupBy on courseId (not filtered by rating) for distribution', async () => {
      await GET(
        createGetRequest('course-1', 'page=1&rating=5'),
        createParams()
      );

      expect(db.courseReview.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['rating'],
          where: { courseId: 'course-1' },
          _count: { rating: true },
        })
      );
    });
  });

  // ----------------------------------------
  // GET error handling
  // ----------------------------------------

  describe('Error handling', () => {
    it('returns 500 on database error in legacy mode', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'user-1' });
      (db.courseReview.findMany as jest.Mock).mockRejectedValue(
        new Error('DB read error')
      );

      const res = await GET(createGetRequest(), createParams());

      expect(res.status).toBe(500);
      const text = await res.json();
      expect(JSON.stringify(text)).toContain('Internal Server Error');
    });

    it('returns 500 on database error in paginated mode', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'user-1' });
      (db.courseReview.count as jest.Mock).mockRejectedValue(
        new Error('DB count error')
      );

      const res = await GET(
        createGetRequest('course-1', 'page=1'),
        createParams()
      );

      expect(res.status).toBe(500);
    });
  });
});
