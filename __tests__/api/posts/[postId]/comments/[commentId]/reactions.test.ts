/**
 * Tests for Comment Reactions Route - app/api/posts/[postId]/comments/[commentId]/reactions/route.ts
 */

jest.mock('@/lib/api', () => ({
  withAuth: (handler: any) => async (request: any, props: any) => {
    const { currentUser } = require('@/lib/auth');
    const user = await currentUser();
    if (!user?.id) {
      return new Response(JSON.stringify({ success: false, error: { message: 'Unauthorized' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return handler(request, { user: { id: user.id } }, props);
  },
  createSuccessResponse: (data: any, status = 200) =>
    new Response(JSON.stringify({ success: true, data }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  createErrorResponse: (err: any) =>
    new Response(JSON.stringify({ success: false, error: { message: err?.message || 'error' } }), {
      status: err?.statusCode || err?.status || 500,
      headers: { 'Content-Type': 'application/json' },
    }),
  ApiError: {
    badRequest: (message: string) => ({ message, statusCode: 400 }),
    notFound: (message: string) => ({ message, statusCode: 404 }),
    internal: (message: string) => ({ message, statusCode: 500 }),
  },
}));

import { POST } from '@/app/api/posts/[postId]/comments/[commentId]/reactions/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

for (const model of ['comment', 'reaction']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    };
  }
}

const mockComment = (db as Record<string, any>).comment;

function req(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/posts/post-1/comments/comment-1/reactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function props(postId = 'post-1', commentId = 'comment-1') {
  return { params: Promise.resolve({ postId, commentId }) };
}

describe('Comment reactions route', () => {
  const tx = {
    reaction: {
      findFirst: jest.fn(),
      delete: jest.fn(() => Promise.resolve({})),
      create: jest.fn(() => Promise.resolve({})),
    },
    comment: {
      findUnique: jest.fn(() => Promise.resolve({ id: 'comment-1', reactions: [] })),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1' });
    mockComment.findFirst.mockResolvedValue({ id: 'comment-1', postId: 'post-1' });
    mockComment.findUnique.mockResolvedValue({ id: 'comment-1', postId: 'post-2' });
    (db.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(tx));
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(req({ type: 'like' }) as any, props() as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid reaction type payload', async () => {
    const res = await POST(req({}) as any, props() as any);
    expect(res.status).toBe(400);
  });

  it('returns 404 when post is not found', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(req({ type: 'like' }) as any, props() as any);
    expect(res.status).toBe(404);
  });

  it('returns 400 when comment exists but not under this post', async () => {
    mockComment.findFirst.mockResolvedValue(null);
    mockComment.findUnique.mockResolvedValue({ id: 'comment-1', postId: 'other-post' });

    const res = await POST(req({ type: 'like' }) as any, props() as any);
    expect(res.status).toBe(400);
  });

  it('toggles off existing identical reaction', async () => {
    tx.reaction.findFirst.mockResolvedValue({ id: 'r1' });

    const res = await POST(req({ type: 'like' }) as any, props() as any);
    expect(res.status).toBe(200);
    expect(tx.reaction.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
  });

  it('creates reaction when none exists', async () => {
    tx.reaction.findFirst.mockResolvedValue(null);

    const res = await POST(req({ type: 'love' }) as any, props() as any);
    expect(res.status).toBe(200);
    expect(tx.reaction.create).toHaveBeenCalled();
  });
});
