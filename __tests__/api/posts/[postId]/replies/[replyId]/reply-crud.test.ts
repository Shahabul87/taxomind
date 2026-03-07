/**
 * Tests for Reply PATCH/DELETE API Routes
 * app/api/posts/[postId]/comments/[commentId]/replies/[replyId]/route.ts
 *
 * Covers: PATCH (update a reply), DELETE (delete a reply with descendants)
 * Both endpoints use withAuth for authentication.
 */

// Modules are globally mocked in jest.setup.js: @/lib/db, @/lib/auth, @/lib/logger, next/server

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
  getRateLimitMessage: jest.fn().mockReturnValue('Rate limit exceeded.'),
}));

jest.mock('@/app/lib/cache', () => ({
  getFromCache: jest.fn().mockResolvedValue(null),
  setInCache: jest.fn().mockResolvedValue(true),
  getCommentsKey: jest.fn(),
  shouldCachePost: jest.fn().mockReturnValue(false),
  invalidateCache: jest.fn().mockResolvedValue(true),
  getCommentKey: jest.fn(),
}));

jest.mock('@/lib/role-management', () => ({
  hasPermission: jest.fn().mockResolvedValue(true),
  Permission: {},
}));

import { PATCH, DELETE } from '@/app/api/posts/[postId]/comments/[commentId]/replies/[replyId]/route';
import { currentUser, currentRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { invalidateCache } from '@/app/lib/cache';

const mockCurrentUser = currentUser as jest.Mock;
const mockCurrentRole = currentRole as jest.Mock;
const mockInvalidateCache = invalidateCache as jest.Mock;

const { NextRequest } = jest.requireMock('next/server');

// Ensure required db models exist
beforeAll(() => {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    const nodeCrypto = require('crypto');
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: () => nodeCrypto.randomUUID(),
      configurable: true,
      writable: true,
    });
  }

  const dbAny = db as Record<string, unknown>;

  if (!dbAny.reply) {
    dbAny.reply = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    };
  }

  if (!dbAny.reaction) {
    dbAny.reaction = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    };
  }

  if (!dbAny.$transaction) {
    dbAny.$transaction = jest.fn().mockImplementation(async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => {
      return fn({
        reply: dbAny.reply,
        reaction: dbAny.reaction,
      });
    });
  }
});

function createPatchRequest(content: string) {
  return new NextRequest(
    'http://localhost:3000/api/posts/post-1/comments/comment-1/replies/reply-1',
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }
  );
}

function createDeleteRequest() {
  return new NextRequest(
    'http://localhost:3000/api/posts/post-1/comments/comment-1/replies/reply-1',
    { method: 'DELETE' }
  );
}

function createProps(
  postId = 'post-1',
  commentId = 'comment-1',
  replyId = 'reply-1'
) {
  return { params: Promise.resolve({ postId, commentId, replyId }) };
}

// ============================================================================
// PATCH /api/posts/[postId]/comments/[commentId]/replies/[replyId]
// ============================================================================

describe('PATCH /api/posts/[postId]/comments/[commentId]/replies/[replyId]', () => {
  const mockUpdatedReply = {
    id: 'reply-1',
    content: 'Updated reply content',
    userId: 'user-1',
    postId: 'post-1',
    commentId: 'comment-1',
    updatedAt: new Date(),
    User: { id: 'user-1', name: 'Test User', image: null },
    Reaction: [],
  };

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

    (db.reply.findFirst as jest.Mock).mockResolvedValue({ id: 'reply-1' });
    (db.reply.update as jest.Mock).mockResolvedValue(mockUpdatedReply);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PATCH(createPatchRequest('Updated'), createProps());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 when content is empty', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/posts/post-1/comments/comment-1/replies/reply-1',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      }
    );

    const res = await PATCH(req, createProps());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('returns 404 when reply does not exist', async () => {
    (db.reply.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(createPatchRequest('Updated'), createProps());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Reply not found');
  });

  it('returns 404 when reply belongs to a different user', async () => {
    // findFirst with userId: context.user.id will return null for wrong user
    (db.reply.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(createPatchRequest('Updated'), createProps());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('updates a reply successfully and returns 200', async () => {
    const res = await PATCH(
      createPatchRequest('Updated reply content'),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.content).toBe('Updated reply content');
    expect(body.data.User.id).toBe('user-1');
  });

  it('verifies reply ownership with correct where clause', async () => {
    await PATCH(createPatchRequest('Updated'), createProps());

    expect(db.reply.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'reply-1',
        commentId: 'comment-1',
        postId: 'post-1',
        userId: 'user-1',
      },
      select: { id: true },
    });
  });

  it('invalidates cache after updating a reply', async () => {
    await PATCH(createPatchRequest('Updated'), createProps('post-1'));
    expect(mockInvalidateCache).toHaveBeenCalledWith('comments:post-1:*');
  });

  it('handles invalid JSON body gracefully', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/posts/post-1/comments/comment-1/replies/reply-1',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: 'bad-json',
      }
    );
    req.json = jest.fn().mockRejectedValue(new SyntaxError('Unexpected token'));

    const res = await PATCH(req, createProps());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('returns 500 on unexpected database error', async () => {
    (db.reply.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await PATCH(createPatchRequest('Updated'), createProps());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// ============================================================================
// DELETE /api/posts/[postId]/comments/[commentId]/replies/[replyId]
// ============================================================================

describe('DELETE /api/posts/[postId]/comments/[commentId]/replies/[replyId]', () => {
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

    (db.reply.findFirst as jest.Mock).mockResolvedValue({ id: 'reply-1' });
    // No descendants by default
    (db.reply.findMany as jest.Mock).mockResolvedValue([]);
    (db.reply.delete as jest.Mock).mockResolvedValue({ id: 'reply-1' });
    (db.reply.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (db.reaction.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

    // Mock transaction
    const dbAny = db as Record<string, unknown>;
    (dbAny.$transaction as jest.Mock).mockImplementation(
      async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => {
        return fn({
          reply: db.reply,
          reaction: db.reaction,
        });
      }
    );
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await DELETE(createDeleteRequest(), createProps());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 404 when reply does not exist', async () => {
    (db.reply.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await DELETE(createDeleteRequest(), createProps());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Reply not found');
  });

  it('deletes a reply with no descendants successfully', async () => {
    const res = await DELETE(createDeleteRequest(), createProps());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.success).toBe(true);
  });

  it('verifies reply ownership before deleting', async () => {
    await DELETE(createDeleteRequest(), createProps());

    expect(db.reply.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'reply-1',
        commentId: 'comment-1',
        postId: 'post-1',
        userId: 'user-1',
      },
      select: { id: true },
    });
  });

  it('deletes descendant replies and their reactions', async () => {
    // Mock a reply with children
    let findManyCallCount = 0;
    (db.reply.findMany as jest.Mock).mockImplementation(() => {
      findManyCallCount++;
      if (findManyCallCount === 1) {
        // First call: children of reply-1
        return Promise.resolve([{ id: 'child-1' }, { id: 'child-2' }]);
      }
      // Subsequent calls: no grandchildren
      return Promise.resolve([]);
    });

    const res = await DELETE(createDeleteRequest(), createProps());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Should delete reactions for all reply IDs (reply-1, child-1, child-2)
    expect(db.reaction.deleteMany).toHaveBeenCalledWith({
      where: { replyId: { in: ['reply-1', 'child-1', 'child-2'] } },
    });

    // Should delete descendant replies
    expect(db.reply.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['child-1', 'child-2'] } },
    });

    // Should delete the target reply itself
    expect(db.reply.delete).toHaveBeenCalledWith({
      where: { id: 'reply-1' },
    });
  });

  it('invalidates cache after deleting a reply', async () => {
    await DELETE(createDeleteRequest(), createProps('post-1'));
    expect(mockInvalidateCache).toHaveBeenCalledWith('comments:post-1:*');
  });

  it('uses a transaction for atomic deletion', async () => {
    const dbAny = db as Record<string, unknown>;
    await DELETE(createDeleteRequest(), createProps());
    expect(dbAny.$transaction).toHaveBeenCalled();
  });

  it('returns 500 on unexpected database error', async () => {
    (db.reply.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await DELETE(createDeleteRequest(), createProps());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
