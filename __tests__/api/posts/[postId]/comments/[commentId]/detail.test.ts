/**
 * Tests for Comment Detail Route - app/api/posts/[postId]/comments/[commentId]/route.ts
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

jest.mock('@/app/lib/cache', () => ({
  invalidateCache: jest.fn(() => Promise.resolve(true)),
  getCommentKey: jest.fn((id: string) => `comment:${id}`),
}));

import { DELETE, GET, PATCH } from '@/app/api/posts/[postId]/comments/[commentId]/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { invalidateCache, getCommentKey } from '@/app/lib/cache';

const mockCurrentUser = currentUser as jest.Mock;
const mockInvalidateCache = invalidateCache as jest.Mock;
const mockGetCommentKey = getCommentKey as jest.Mock;

for (const model of ['comment', 'reaction', 'reply']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    };
  }
}

const mockComment = (db as Record<string, any>).comment;

function req(method: 'GET' | 'PATCH' | 'DELETE', body?: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/posts/post-1/comments/comment-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function props(postId = 'post-1', commentId = 'comment-1') {
  return { params: Promise.resolve({ postId, commentId }) };
}

describe('Comment detail route', () => {
  const tx = {
    reaction: { deleteMany: jest.fn(() => Promise.resolve({ count: 1 })) },
    reply: { deleteMany: jest.fn(() => Promise.resolve({ count: 1 })) },
    comment: { delete: jest.fn(() => Promise.resolve({ id: 'comment-1' })) },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockComment.findFirst.mockResolvedValue({ id: 'comment-1', postId: 'post-1', userId: 'user-1' });
    mockComment.update.mockResolvedValue({ id: 'comment-1', content: 'Updated comment' });
    (db.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(tx));
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(req('GET') as any, props() as any);
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when comment is missing', async () => {
    mockComment.findFirst.mockResolvedValue(null);

    const res = await GET(req('GET') as any, props() as any);
    expect(res.status).toBe(404);
  });

  it('GET returns comment payload when found', async () => {
    mockComment.findFirst.mockResolvedValue({ id: 'comment-1', content: 'Hello' });

    const res = await GET(req('GET') as any, props() as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('comment-1');
  });

  it('PATCH returns 400 for invalid content', async () => {
    const res = await PATCH(req('PATCH', { content: '' }) as any, props() as any);
    expect(res.status).toBe(400);
  });

  it('PATCH returns 404 when comment is missing', async () => {
    mockComment.findFirst.mockResolvedValue(null);

    const res = await PATCH(req('PATCH', { content: 'Updated' }) as any, props() as any);
    expect(res.status).toBe(404);
  });

  it('PATCH updates comment successfully', async () => {
    const res = await PATCH(req('PATCH', { content: 'Updated comment' }) as any, props() as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe('comment-1');
    expect(mockComment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'comment-1' }, data: expect.objectContaining({ content: 'Updated comment' }) })
    );
  });

  it('DELETE returns 404 when comment is not owned/found', async () => {
    mockComment.findFirst.mockResolvedValue(null);

    const res = await DELETE(req('DELETE') as any, props() as any);
    expect(res.status).toBe(404);
  });

  it('DELETE removes comment and invalidates caches', async () => {
    const res = await DELETE(req('DELETE') as any, props() as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(tx.comment.delete).toHaveBeenCalledWith({ where: { id: 'comment-1' } });
    expect(mockGetCommentKey).toHaveBeenCalledWith('comment-1');
    expect(mockInvalidateCache).toHaveBeenCalledWith('comments:post-1:*');
    expect(mockInvalidateCache).toHaveBeenCalledWith('comment:comment-1');
    expect(mockInvalidateCache).toHaveBeenCalledWith('replies:comment-1:*');
  });
});
