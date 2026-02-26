/**
 * Tests for actions/get-homepage-content.ts
 *
 * Tests the two server-action exports:
 *   - getHomepageFeaturedCourses(limit?)
 *   - getHomepageFeaturedPosts(limit?)
 *
 * Strategy:
 *   - @/lib/db is auto-mocked via __mocks__/db.js (moduleNameMapper)
 *   - @/lib/api-cache is mocked so cacheWrapper is a transparent pass-through
 *   - The real function body executes, so we can verify query args,
 *     mapping logic, HTML stripping, and error handling.
 */

import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// Mock: @/lib/api-cache  -- cacheWrapper simply returns the function it receives
// ---------------------------------------------------------------------------
jest.mock('@/lib/api-cache', () => ({
  cacheWrapper: <T extends (...args: never[]) => Promise<unknown>>(fn: T): T => fn,
  CACHE_REVALIDATE_TIMES: { COURSES: 300, POSTS: 180, DEFAULT: 300, STATIC: 3600 },
  CACHE_TAGS: { COURSES: 'courses', POSTS: 'posts' },
}));

// ---------------------------------------------------------------------------
// Import the functions AFTER mocks are in place
// ---------------------------------------------------------------------------
import {
  getHomepageFeaturedCourses,
  getHomepageFeaturedPosts,
} from '@/actions/get-homepage-content';

// Typed references to the mock db models
const mockCourseFindMany = db.course.findMany as jest.Mock;
const mockPostFindMany = db.post.findMany as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers: factory functions for mock data
// ---------------------------------------------------------------------------
function makeCourseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'course-1',
    title: 'React Fundamentals',
    description: '<p>Learn <strong>React</strong> today!</p>',
    imageUrl: 'https://img.example.com/react.jpg',
    price: 49.99,
    isPublished: true,
    isFeatured: true,
    category: { name: 'Programming' },
    chapters: [{ id: 'ch-1' }, { id: 'ch-2' }],
    averageRating: 4.7,
    _count: { Enrollment: 120 },
    createdAt: new Date('2025-06-01T00:00:00Z'),
    updatedAt: new Date('2025-06-15T00:00:00Z'),
    ...overrides,
  };
}

function makePostRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'post-1',
    title: 'Getting Started with TypeScript',
    description: 'A beginner-friendly guide.',
    imageUrl: 'https://img.example.com/ts.jpg',
    published: true,
    category: 'Technology',
    createdAt: new Date('2025-05-10T00:00:00Z'),
    updatedAt: new Date('2025-05-20T00:00:00Z'),
    userId: 'user-42',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('getHomepageFeaturedCourses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silence console.log / console.error emitted inside the action
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  // 1. Returns published courses ordered by featured first
  it('queries published courses ordered by isFeatured desc then createdAt desc', async () => {
    const featured = makeCourseRow({ id: 'c-feat', isFeatured: true });
    const regular = makeCourseRow({ id: 'c-reg', isFeatured: false });
    mockCourseFindMany.mockResolvedValue([featured, regular]);

    const result = await getHomepageFeaturedCourses();

    // Verify the Prisma call
    expect(mockCourseFindMany).toHaveBeenCalledTimes(1);
    const callArgs = mockCourseFindMany.mock.calls[0][0];
    expect(callArgs.where).toEqual({ isPublished: true });
    expect(callArgs.orderBy).toEqual([
      { isFeatured: 'desc' },
      { createdAt: 'desc' },
    ]);

    // Two results, order preserved
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('c-feat');
    expect(result[1].id).toBe('c-reg');
  });

  // 2. Respects limit parameter
  it('passes the limit parameter as take to the query', async () => {
    mockCourseFindMany.mockResolvedValue([]);

    await getHomepageFeaturedCourses(3);

    const callArgs = mockCourseFindMany.mock.calls[0][0];
    expect(callArgs.take).toBe(3);
  });

  // 10 (part a). Default limit is 8 courses
  it('defaults to limit of 8 when no argument is provided', async () => {
    mockCourseFindMany.mockResolvedValue([]);

    await getHomepageFeaturedCourses();

    const callArgs = mockCourseFindMany.mock.calls[0][0];
    expect(callArgs.take).toBe(8);
  });

  // 3. Returns empty array on DB error
  it('returns an empty array when the database throws', async () => {
    mockCourseFindMany.mockRejectedValue(new Error('Connection refused'));

    const result = await getHomepageFeaturedCourses();

    expect(result).toEqual([]);
  });

  // 4. Strips HTML from descriptions correctly
  it('strips HTML tags from the description field into cleanDescription', async () => {
    const row = makeCourseRow({
      description: '<p>Learn <strong>React</strong> &amp; <em>Next.js</em></p>',
    });
    mockCourseFindMany.mockResolvedValue([row]);

    const result = await getHomepageFeaturedCourses();

    expect(result[0].cleanDescription).toBe('Learn React & Next.js');
  });

  it('decodes all supported HTML entities in cleanDescription', async () => {
    const row = makeCourseRow({
      description: '&lt;code&gt;a &amp; b&lt;/code&gt; &quot;hello&#39;s&quot; &nbsp;end',
    });
    mockCourseFindMany.mockResolvedValue([row]);

    const result = await getHomepageFeaturedCourses();

    // &nbsp; becomes a space, so the original space + decoded &nbsp; yields two spaces
    expect(result[0].cleanDescription).toBe('<code>a & b</code> "hello\'s"  end');
  });

  // 5. Maps enrollment count from _count
  it('maps _count.Enrollment to enrollmentCount on each course', async () => {
    const row = makeCourseRow({ _count: { Enrollment: 55 } });
    mockCourseFindMany.mockResolvedValue([row]);

    const result = await getHomepageFeaturedCourses();

    expect(result[0].enrollmentCount).toBe(55);
  });

  // 9 (part a). Handles null description
  it('produces an empty cleanDescription when description is null', async () => {
    const row = makeCourseRow({ description: null });
    mockCourseFindMany.mockResolvedValue([row]);

    const result = await getHomepageFeaturedCourses();

    expect(result[0].cleanDescription).toBe('');
  });

  it('preserves averageRating in the mapped result', async () => {
    const row = makeCourseRow({ averageRating: 4.3 });
    mockCourseFindMany.mockResolvedValue([row]);

    const result = await getHomepageFeaturedCourses();

    expect(result[0].averageRating).toBe(4.3);
  });

  it('spreads all course fields except _count into the result', async () => {
    const row = makeCourseRow();
    mockCourseFindMany.mockResolvedValue([row]);

    const result = await getHomepageFeaturedCourses();
    const course = result[0];

    // _count should not leak into the result
    expect(course).not.toHaveProperty('_count');
    // Core fields should be present
    expect(course).toHaveProperty('id');
    expect(course).toHaveProperty('title');
    expect(course).toHaveProperty('imageUrl');
    expect(course).toHaveProperty('price');
    expect(course).toHaveProperty('category');
    expect(course).toHaveProperty('chapters');
    expect(course).toHaveProperty('createdAt');
    expect(course).toHaveProperty('updatedAt');
  });
});

// ---------------------------------------------------------------------------
describe('getHomepageFeaturedPosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  // 6. Returns published non-archived posts
  it('queries posts that are published and not archived', async () => {
    mockPostFindMany.mockResolvedValue([makePostRow()]);

    await getHomepageFeaturedPosts();

    expect(mockPostFindMany).toHaveBeenCalledTimes(1);
    const callArgs = mockPostFindMany.mock.calls[0][0];
    expect(callArgs.where).toEqual({ published: true, isArchived: false });
  });

  // 7. Posts ordered by createdAt desc
  it('orders posts by createdAt descending', async () => {
    mockPostFindMany.mockResolvedValue([]);

    await getHomepageFeaturedPosts();

    const callArgs = mockPostFindMany.mock.calls[0][0];
    expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
  });

  // 8. Returns empty array on post DB error
  it('returns an empty array when the database throws', async () => {
    mockPostFindMany.mockRejectedValue(new Error('timeout'));

    const result = await getHomepageFeaturedPosts();

    expect(result).toEqual([]);
  });

  // 10 (part b). Default limit is 6 posts
  it('defaults to a limit of 6 when no argument is provided', async () => {
    mockPostFindMany.mockResolvedValue([]);

    await getHomepageFeaturedPosts();

    const callArgs = mockPostFindMany.mock.calls[0][0];
    expect(callArgs.take).toBe(6);
  });

  it('passes a custom limit as take to the query', async () => {
    mockPostFindMany.mockResolvedValue([]);

    await getHomepageFeaturedPosts(2);

    const callArgs = mockPostFindMany.mock.calls[0][0];
    expect(callArgs.take).toBe(2);
  });

  // 9 (part b). Handles null description/imageUrl in posts
  it('maps null description and imageUrl safely', async () => {
    const row = makePostRow({ description: null, imageUrl: null });
    mockPostFindMany.mockResolvedValue([row]);

    const result = await getHomepageFeaturedPosts();

    expect(result[0].description).toBeNull();
    expect(result[0].imageUrl).toBeNull();
  });

  it('provides "Untitled Post" when the post title is falsy', async () => {
    const row = makePostRow({ title: '' });
    mockPostFindMany.mockResolvedValue([row]);

    const result = await getHomepageFeaturedPosts();

    expect(result[0].title).toBe('Untitled Post');
  });

  it('converts createdAt Date to an ISO string', async () => {
    const date = new Date('2025-08-01T12:00:00Z');
    const row = makePostRow({ createdAt: date });
    mockPostFindMany.mockResolvedValue([row]);

    const result = await getHomepageFeaturedPosts();

    expect(result[0].createdAt).toBe(date.toISOString());
  });

  it('sets published to true for every returned post', async () => {
    const rows = [makePostRow({ id: 'p-1' }), makePostRow({ id: 'p-2' })];
    mockPostFindMany.mockResolvedValue(rows);

    const result = await getHomepageFeaturedPosts();

    result.forEach((post) => {
      expect(post.published).toBe(true);
    });
  });

  it('handles null category gracefully', async () => {
    const row = makePostRow({ category: null });
    mockPostFindMany.mockResolvedValue([row]);

    const result = await getHomepageFeaturedPosts();

    expect(result[0].category).toBeNull();
  });
});
