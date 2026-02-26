/**
 * Tests for Public Posts API Route - app/api/posts/public/route.ts
 *
 * Covers: GET (list published, non-archived posts - no authentication required)
 * The endpoint fetches published posts with User and comment count,
 * transforms the data, and returns it as JSON.
 */

// Modules are globally mocked in jest.setup.js: @/lib/db, @/lib/auth, @/lib/logger, next/server

import { GET } from '@/app/api/posts/public/route';
import { db } from '@/lib/db';

const { NextRequest } = jest.requireMock('next/server');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicGetRequest(searchParams?: Record<string, string>) {
  let url = 'http://localhost:3000/api/posts/public';
  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    url += `?${params.toString()}`;
  }
  return new NextRequest(url, { method: 'GET' });
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const now = new Date('2026-02-20T12:00:00.000Z');
const yesterday = new Date('2026-02-19T12:00:00.000Z');

const mockPosts = [
  {
    id: 'post-1',
    title: 'First Published Post',
    description: 'Description of the first post',
    imageUrl: 'https://example.com/image1.jpg',
    published: true,
    isArchived: false,
    category: 'Technology',
    createdAt: now,
    updatedAt: now,
    userId: 'user-1',
    views: 100,
    comments: [{ id: 'comment-1' }, { id: 'comment-2' }],
    User: { name: 'John Doe' },
  },
  {
    id: 'post-2',
    title: 'Second Published Post',
    description: 'Description of the second post',
    imageUrl: null,
    published: true,
    isArchived: false,
    category: 'Science',
    createdAt: yesterday,
    updatedAt: yesterday,
    userId: 'user-2',
    views: 50,
    comments: [],
    User: { name: 'Jane Smith' },
  },
];

// ============================================================================
// GET /api/posts/public
// ============================================================================

describe('GET /api/posts/public', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
  });

  // ---------- Successful Responses ----------

  it('returns 200 with published posts', async () => {
    const res = await GET(createPublicGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.posts).toHaveLength(2);
    expect(body.count).toBe(2);
  });

  it('does not require authentication', async () => {
    // No currentUser mock needed - endpoint is fully public
    const res = await GET(createPublicGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns transformed post data with correct fields', async () => {
    const res = await GET(createPublicGetRequest());
    const body = await res.json();
    const post = body.posts[0];

    expect(post.id).toBe('post-1');
    expect(post.title).toBe('First Published Post');
    expect(post.description).toBe('Description of the first post');
    expect(post.imageUrl).toBe('https://example.com/image1.jpg');
    expect(post.published).toBe(true);
    expect(post.category).toBe('Technology');
    expect(post.userId).toBe('user-1');
    expect(post.views).toBe(100);
  });

  it('serializes createdAt as ISO string', async () => {
    const res = await GET(createPublicGetRequest());
    const body = await res.json();

    expect(body.posts[0].createdAt).toBe('2026-02-20T12:00:00.000Z');
    expect(body.posts[1].createdAt).toBe('2026-02-19T12:00:00.000Z');
  });

  it('transforms User relation to user.name format', async () => {
    const res = await GET(createPublicGetRequest());
    const body = await res.json();

    expect(body.posts[0].user).toEqual({ name: 'John Doe' });
    expect(body.posts[1].user).toEqual({ name: 'Jane Smith' });
  });

  it('includes comments array in the response', async () => {
    const res = await GET(createPublicGetRequest());
    const body = await res.json();

    expect(body.posts[0].comments).toHaveLength(2);
    expect(body.posts[0].comments[0]).toEqual({ id: 'comment-1' });
    expect(body.posts[1].comments).toHaveLength(0);
  });

  it('returns count matching the number of posts', async () => {
    const res = await GET(createPublicGetRequest());
    const body = await res.json();

    expect(body.count).toBe(body.posts.length);
  });

  // ---------- Database Query ----------

  it('queries only published and non-archived posts', async () => {
    await GET(createPublicGetRequest());

    expect(db.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          published: true,
          isArchived: false,
        },
      })
    );
  });

  it('includes User name and comment ids in the query', async () => {
    await GET(createPublicGetRequest());

    expect(db.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          User: { select: { name: true } },
          comments: { select: { id: true } },
        },
      })
    );
  });

  it('orders posts by createdAt descending (newest first)', async () => {
    await GET(createPublicGetRequest());

    expect(db.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('limits results to 50 posts', async () => {
    await GET(createPublicGetRequest());

    expect(db.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
      })
    );
  });

  // ---------- Edge Cases ----------

  it('returns empty array when no published posts exist', async () => {
    (db.post.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET(createPublicGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.posts).toEqual([]);
    expect(body.count).toBe(0);
  });

  it('handles posts with null User (deleted user)', async () => {
    (db.post.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'post-orphan',
        title: 'Orphan Post',
        description: null,
        imageUrl: null,
        published: true,
        isArchived: false,
        category: null,
        createdAt: now,
        updatedAt: now,
        userId: 'deleted-user',
        views: 0,
        comments: [],
        User: null,
      },
    ]);

    const res = await GET(createPublicGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.posts[0].user).toEqual({ name: null });
  });

  it('handles posts with User having null name', async () => {
    (db.post.findMany as jest.Mock).mockResolvedValue([
      {
        ...mockPosts[0],
        User: { name: null },
      },
    ]);

    const res = await GET(createPublicGetRequest());
    const body = await res.json();

    expect(body.posts[0].user).toEqual({ name: null });
  });

  // ---------- Error Handling ----------

  it('returns 500 with error message on database failure', async () => {
    (db.post.findMany as jest.Mock).mockRejectedValue(
      new Error('Connection timeout')
    );

    const res = await GET(createPublicGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch posts');
    expect(body.posts).toEqual([]);
  });

  it('returns an empty posts array even on error for UI safety', async () => {
    (db.post.findMany as jest.Mock).mockRejectedValue(
      new Error('Unexpected error')
    );

    const res = await GET(createPublicGetRequest());
    const body = await res.json();

    expect(body.posts).toEqual([]);
  });

  it('logs error when database fails', async () => {
    const { logger } = require('@/lib/logger');
    const dbError = new Error('DB crash');
    (db.post.findMany as jest.Mock).mockRejectedValue(dbError);

    await GET(createPublicGetRequest());

    expect(logger.error).toHaveBeenCalledWith(
      '[PUBLIC_POSTS] Error fetching posts:',
      dbError
    );
  });

  // ---------- Single Post Scenario ----------

  it('correctly transforms a single post result', async () => {
    (db.post.findMany as jest.Mock).mockResolvedValue([mockPosts[0]]);

    const res = await GET(createPublicGetRequest());
    const body = await res.json();

    expect(body.posts).toHaveLength(1);
    expect(body.count).toBe(1);
    expect(body.posts[0].title).toBe('First Published Post');
  });
});
