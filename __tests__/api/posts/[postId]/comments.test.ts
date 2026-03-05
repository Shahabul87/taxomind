/**
 * Tests for Post Comments API Routes - app/api/posts/[postId]/comments/route.ts
 *
 * Covers: POST (create a comment), GET (list comments with pagination/sorting/caching)
 * Both endpoints are wrapped with withAuth which calls currentUser() internally.
 */

// Modules are globally mocked in jest.setup.js: @/lib/db, @/lib/auth, @/lib/logger, next/server

// Mock admin auth modules to prevent Credentials() import error
jest.mock('@/auth.config.admin', () => ({
  default: { providers: [] },
}));

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn().mockResolvedValue(null),
  default: jest.fn(),
}));

jest.mock('@/lib/api-protection', () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
  requirePermission: jest.fn(),
  UnauthorizedError: class extends Error {
    constructor(m?: string) { super(m || 'Unauthorized'); }
  },
  ForbiddenError: class extends Error {
    constructor(m?: string) { super(m || 'Forbidden'); }
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({
    success: true, limit: 100, remaining: 99, reset: Date.now() + 60000,
  }),
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  getRateLimitHeaders: jest.fn().mockReturnValue({}),
  isRateLimited: jest.fn().mockResolvedValue({ limited: false }),
  getRateLimitMessage: jest.fn().mockReturnValue('Rate limit exceeded. Try again later.'),
}));

jest.mock('@/app/lib/cache', () => ({
  getFromCache: jest.fn().mockResolvedValue(null),
  setInCache: jest.fn().mockResolvedValue(true),
  getCommentsKey: jest.fn(
    (postId: string, page: number, sortBy: string) =>
      `comments:${postId}:${page}:${sortBy}`
  ),
  shouldCachePost: jest.fn().mockReturnValue(false),
  invalidateCache: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/validations/blog', () => ({
  CommentCreateSchema: {
    safeParse: jest.fn(),
  },
}));

jest.mock('@/lib/role-management', () => ({
  hasPermission: jest.fn().mockResolvedValue(true),
  Permission: {},
}));

import { POST, GET } from '@/app/api/posts/[postId]/comments/route';
import { currentUser, currentRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { isRateLimited } from '@/lib/rate-limit';
import {
  getFromCache,
  shouldCachePost,
  setInCache,
  invalidateCache,
} from '@/app/lib/cache';
import { CommentCreateSchema } from '@/lib/validations/blog';

const mockCurrentUser = currentUser as jest.Mock;
const mockCurrentRole = currentRole as jest.Mock;
const mockIsRateLimited = isRateLimited as jest.Mock;
const mockGetFromCache = getFromCache as jest.Mock;
const mockShouldCachePost = shouldCachePost as jest.Mock;
const mockSetInCache = setInCache as jest.Mock;
const mockInvalidateCache = invalidateCache as jest.Mock;
const mockCommentSafeParse = CommentCreateSchema.safeParse as jest.Mock;

const { NextRequest } = jest.requireMock('next/server');

// Add missing 'comment' model to the mock db if it does not exist
beforeAll(() => {
  // Polyfill crypto.randomUUID for jsdom test environment
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    const nodeCrypto = require('crypto');
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: () => nodeCrypto.randomUUID(),
      configurable: true,
      writable: true,
    });
  }

  // The __mocks__/prisma.js may not include 'comment' model.
  // Add it if missing so tests can mock db.comment methods.
  const dbAny = db as Record<string, unknown>;
  if (!dbAny.comment) {
    dbAny.comment = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn(),
      groupBy: jest.fn().mockResolvedValue([]),
    };
  }
});

function createCommentPostRequest(body?: Record<string, unknown>) {
  return new NextRequest(
    'http://localhost:3000/api/posts/post-1/comments',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }
  );
}

function createCommentGetRequest(
  postId = 'post-1',
  searchParams?: Record<string, string>
) {
  let url = `http://localhost:3000/api/posts/${postId}/comments`;
  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    url += `?${params.toString()}`;
  }
  return new NextRequest(url, {
    method: 'GET',
  });
}

function createProps(postId = 'post-1') {
  return { params: Promise.resolve({ postId }) };
}

// ============================================================================
// POST /api/posts/[postId]/comments
// ============================================================================

describe('POST /api/posts/[postId]/comments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      isOAuth: false,
      isTwoFactorEnabled: false,
    });
    mockCurrentRole.mockResolvedValue(null);
    mockIsRateLimited.mockResolvedValue({ limited: false });
    mockCommentSafeParse.mockReturnValue({
      success: true,
      data: { content: 'Great post!' },
    });
    (db.post.findUnique as jest.Mock).mockResolvedValue({
      id: 'post-1',
      userId: 'author-1',
    });
    (db.comment.create as jest.Mock).mockResolvedValue({
      id: 'comment-1',
      content: 'Great post!',
      userId: 'user-1',
      postId: 'post-1',
      User: { id: 'user-1', name: 'Test User', image: null },
      reactions: [],
      replies: [],
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(
      createCommentPostRequest({ content: 'Nice!' }),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 429 when rate limited', async () => {
    mockIsRateLimited.mockResolvedValue({
      limited: true,
      reset: Date.now() + 60000,
    });

    const res = await POST(
      createCommentPostRequest({ content: 'Nice!' }),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('returns 400 when content validation fails', async () => {
    mockCommentSafeParse.mockReturnValue({
      success: false,
      error: {
        errors: [{ message: 'Comment cannot be empty' }],
      },
    });

    const res = await POST(
      createCommentPostRequest({ content: '' }),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('returns 404 when post does not exist', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(
      createCommentPostRequest({ content: 'Hello!' }),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Post not found');
  });

  it('creates a comment successfully and returns 201', async () => {
    const mockComment = {
      id: 'comment-1',
      content: 'Great post!',
      userId: 'user-1',
      postId: 'post-1',
      User: { id: 'user-1', name: 'Test User', image: null },
      reactions: [],
      replies: [],
    };
    (db.comment.create as jest.Mock).mockResolvedValue(mockComment);

    const res = await POST(
      createCommentPostRequest({ content: 'Great post!' }),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('comment-1');
    expect(body.data.content).toBe('Great post!');
  });

  it('invalidates cache after creating a comment', async () => {
    await POST(
      createCommentPostRequest({ content: 'Great post!' }),
      createProps('post-1')
    );

    expect(mockInvalidateCache).toHaveBeenCalledWith('comments:post-1:*');
  });

  it('creates comment with correct data in database', async () => {
    await POST(
      createCommentPostRequest({ content: 'My comment' }),
      createProps('post-1')
    );

    expect(db.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: 'Great post!', // comes from mockCommentSafeParse
          userId: 'user-1',
          postId: 'post-1',
        }),
      })
    );
  });

  it('returns 500 on unexpected database errors', async () => {
    (db.post.findUnique as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const res = await POST(
      createCommentPostRequest({ content: 'Hello' }),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('handles invalid JSON body gracefully', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/posts/post-1/comments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'bad-json',
      }
    );
    req.json = jest
      .fn()
      .mockRejectedValue(new SyntaxError('Unexpected token'));

    // The route catches json parse with .catch(() => ({}))
    // Then validation fails because content is empty
    mockCommentSafeParse.mockReturnValue({
      success: false,
      error: { errors: [{ message: 'Comment cannot be empty' }] },
    });

    const res = await POST(req, createProps());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('includes User relation in the created comment response', async () => {
    const res = await POST(
      createCommentPostRequest({ content: 'Nice' }),
      createProps()
    );
    const body = await res.json();

    expect(body.data.User).toBeDefined();
    expect(body.data.User.id).toBe('user-1');
    expect(body.data.User.name).toBe('Test User');
  });
});

// ============================================================================
// GET /api/posts/[postId]/comments
// ============================================================================

describe('GET /api/posts/[postId]/comments', () => {
  const mockComments = [
    {
      id: 'comment-1',
      content: 'First comment',
      userId: 'user-1',
      postId: 'post-1',
      createdAt: new Date('2026-01-01'),
      User: { id: 'user-1', name: 'User 1', image: null },
      reactions: [],
      replies: [],
      _count: { replies: 0 },
    },
    {
      id: 'comment-2',
      content: 'Second comment',
      userId: 'user-2',
      postId: 'post-1',
      createdAt: new Date('2026-01-02'),
      User: { id: 'user-2', name: 'User 2', image: null },
      reactions: [],
      replies: [],
      _count: { replies: 2 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      isOAuth: false,
      isTwoFactorEnabled: false,
    });
    mockCurrentRole.mockResolvedValue(null);
    mockGetFromCache.mockResolvedValue(null);
    mockShouldCachePost.mockReturnValue(false);

    (db.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1' });
    (db.comment.count as jest.Mock).mockResolvedValue(2);
    (db.comment.findMany as jest.Mock).mockResolvedValue(mockComments);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createCommentGetRequest(), createProps());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns comments with pagination metadata', async () => {
    const res = await GET(createCommentGetRequest(), createProps());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.data).toHaveLength(2);
    expect(body.data.pagination).toBeDefined();
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.pageSize).toBe(20);
    expect(body.data.pagination.totalCount).toBe(2);
    expect(body.data.pagination.totalPages).toBe(1);
    expect(body.data.pagination.hasMore).toBe(false);
  });

  it('returns 404 when post does not exist', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(
      createCommentGetRequest('non-existent'),
      createProps('non-existent')
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Post not found');
  });

  it('supports pagination via page query parameter', async () => {
    (db.comment.count as jest.Mock).mockResolvedValue(25);
    (db.comment.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET(
      createCommentGetRequest('post-1', { page: '2' }),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.pagination.page).toBe(2);
    expect(db.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
      })
    );
  });

  it('defaults to page 1 when no page param is provided', async () => {
    const res = await GET(
      createCommentGetRequest('post-1'),
      createProps()
    );
    const body = await res.json();

    expect(body.data.pagination.page).toBe(1);
    expect(db.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
      })
    );
  });

  it('sorts by newest by default (descending createdAt)', async () => {
    await GET(createCommentGetRequest('post-1'), createProps());

    expect(db.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('sorts by oldest when sortBy=oldest', async () => {
    await GET(
      createCommentGetRequest('post-1', { sortBy: 'oldest' }),
      createProps()
    );

    expect(db.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'asc' },
      })
    );
  });

  it('sorts by popular when sortBy=popular', async () => {
    await GET(
      createCommentGetRequest('post-1', { sortBy: 'popular' }),
      createProps()
    );

    expect(db.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { reactions: { _count: 'desc' } },
      })
    );
  });

  it('returns 400 for invalid sortBy parameter', async () => {
    const res = await GET(
      createCommentGetRequest('post-1', { sortBy: 'invalid' }),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toBe('Invalid sortBy parameter');
  });

  it('returns cached data when available (cache HIT)', async () => {
    const cachedData = {
      data: mockComments,
      pagination: {
        page: 1,
        pageSize: 20,
        totalCount: 2,
        totalPages: 1,
        hasMore: false,
      },
    };
    mockGetFromCache.mockResolvedValue(cachedData);

    const res = await GET(
      createCommentGetRequest('post-1'),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // Database should NOT have been queried
    expect(db.comment.findMany).not.toHaveBeenCalled();
    expect(db.comment.count).not.toHaveBeenCalled();
  });

  it('caches result when post has many comments', async () => {
    mockShouldCachePost.mockReturnValue(true);
    (db.comment.count as jest.Mock).mockResolvedValue(50);
    (db.comment.findMany as jest.Mock).mockResolvedValue(mockComments);

    await GET(createCommentGetRequest('post-1'), createProps());

    expect(mockSetInCache).toHaveBeenCalledWith(
      expect.stringContaining('comments:post-1'),
      expect.objectContaining({
        data: mockComments,
        pagination: expect.any(Object),
      })
    );
  });

  it('does not cache when shouldCachePost returns false', async () => {
    mockShouldCachePost.mockReturnValue(false);

    await GET(createCommentGetRequest('post-1'), createProps());

    expect(mockSetInCache).not.toHaveBeenCalled();
  });

  it('handles hasMore correctly for paginated results', async () => {
    (db.comment.count as jest.Mock).mockResolvedValue(25);
    (db.comment.findMany as jest.Mock).mockResolvedValue(mockComments);

    const res = await GET(
      createCommentGetRequest('post-1', { page: '1' }),
      createProps()
    );
    const body = await res.json();

    expect(body.data.pagination.hasMore).toBe(true);
    expect(body.data.pagination.totalPages).toBe(2);
  });

  it('returns 500 on unexpected database errors', async () => {
    (db.post.findUnique as jest.Mock).mockRejectedValue(
      new Error('DB crash')
    );

    const res = await GET(
      createCommentGetRequest('post-1'),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Internal server error');
  });

  it('clamps page to minimum of 1 for negative values', async () => {
    const res = await GET(
      createCommentGetRequest('post-1', { page: '-5' }),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.pagination.page).toBe(1);
  });

  it('includes _count for reply counts in response', async () => {
    const res = await GET(
      createCommentGetRequest('post-1'),
      createProps()
    );
    const body = await res.json();

    expect(body.data.data[1]._count.replies).toBe(2);
  });
});
