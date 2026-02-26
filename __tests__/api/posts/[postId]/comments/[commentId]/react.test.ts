/**
 * Tests for Comment React Route - app/api/posts/[postId]/comments/[commentId]/react/route.ts
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

import { PATCH } from '@/app/api/posts/[postId]/comments/[commentId]/react/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

for (const model of ['comment', 'reaction']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
  }
}

const mockComment = (db as Record<string, any>).comment;
const mockReaction = (db as Record<string, any>).reaction;

function req(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/posts/post-1/comments/comment-1/react', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function props(commentId = 'comment-1') {
  return { params: Promise.resolve({ commentId }) };
}

describe('Comment react route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockComment.findUnique.mockResolvedValue({
      id: 'comment-1',
      reactions: [{ id: 'r1', type: 'like', userId: 'user-1' }],
    });
    mockReaction.delete.mockResolvedValue({});
    mockReaction.update.mockResolvedValue({});
    mockReaction.create.mockResolvedValue({});
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PATCH(req({ type: 'like' }) as any, props() as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid reaction type', async () => {
    const res = await PATCH(req({ type: 'wow' }) as any, props() as any);
    expect(res.status).toBe(400);
  });

  it('returns 404 when comment not found', async () => {
    mockComment.findUnique.mockResolvedValue(null);

    const res = await PATCH(req({ type: 'like' }) as any, props() as any);
    expect(res.status).toBe(404);
  });

  it('deletes reaction when same type already exists', async () => {
    const res = await PATCH(req({ type: 'like' }) as any, props() as any);
    expect(res.status).toBe(200);
    expect(mockReaction.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
  });

  it('updates reaction when type differs', async () => {
    mockComment.findUnique.mockResolvedValue({
      id: 'comment-1',
      reactions: [{ id: 'r1', type: 'love', userId: 'user-1' }],
    });

    const res = await PATCH(req({ type: 'angry' }) as any, props() as any);
    expect(res.status).toBe(200);
    expect(mockReaction.update).toHaveBeenCalled();
  });

  it('creates reaction when none exists', async () => {
    mockComment.findUnique.mockResolvedValue({ id: 'comment-1', reactions: [] });

    const res = await PATCH(req({ type: 'laugh' }) as any, props() as any);
    expect(res.status).toBe(200);
    expect(mockReaction.create).toHaveBeenCalled();
  });
});
