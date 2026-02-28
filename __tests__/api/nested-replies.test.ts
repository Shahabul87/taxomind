jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/rate-limit', () => ({
  isRateLimited: jest.fn(),
  getRateLimitMessage: jest.fn(() => 'Too many reply attempts'),
}));

jest.mock('@/lib/api', () => {
  class MockApiError extends Error {
    statusCode: number;
    code: string;
    constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  }

  return {
    withAuth: (handler: unknown) => handler,
    createSuccessResponse: (data: unknown, status = 200) =>
      new Response(JSON.stringify({ success: true, data }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    createErrorResponse: (error: { message?: string; statusCode?: number; code?: string }) =>
      new Response(
        JSON.stringify({
          success: false,
          error: {
            message: error?.message || 'Internal Error',
            code: error?.code || 'INTERNAL_ERROR',
          },
        }),
        {
          status: error?.statusCode || 500,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    ApiError: MockApiError,
  };
});

import { POST } from '@/app/api/nested-replies/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { isRateLimited } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockIsRateLimited = isRateLimited as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const post = ensureModel('post', ['findUnique']);
const comment = ensureModel('comment', ['findFirst']);
const reply = ensureModel('reply', ['findFirst', 'create']);

function req(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/nested-replies', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/nested-replies route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockIsRateLimited.mockResolvedValue({ limited: false, reset: Date.now() + 1000 });
    post.findUnique.mockResolvedValue({ id: 'post-1' });
    comment.findFirst.mockResolvedValue({ id: 'comment-1' });
    reply.findFirst.mockResolvedValue({ id: 'reply-0', depth: 1, path: 'comment-1' });
    reply.create.mockResolvedValue({ id: 'reply-1', content: 'hello', commentId: 'comment-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(req({}));
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockIsRateLimited.mockResolvedValueOnce({ limited: true, reset: Date.now() + 1000 });
    const res = await POST(req({ postId: 'post-1', commentId: 'comment-1', content: 'hello' }));
    expect(res.status).toBe(429);
  });

  it('returns 404 when post is not found', async () => {
    post.findUnique.mockResolvedValueOnce(null);
    const res = await POST(req({ postId: 'missing', commentId: 'comment-1', content: 'hello' }));
    expect(res.status).toBe(404);
  });

  it('returns 400 when commentId is missing', async () => {
    const res = await POST(req({ postId: 'post-1', content: 'hello' }));
    expect(res.status).toBe(400);
  });

  it('creates nested reply with inherited parent path/depth', async () => {
    reply.findFirst.mockResolvedValueOnce({
      id: 'reply-0',
      depth: 2,
      path: 'comment-1/reply-a',
      commentId: 'comment-1',
    });

    const res = await POST(
      req({
        postId: 'post-1',
        commentId: 'comment-1',
        parentReplyId: 'reply-0',
        content: 'hello',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(reply.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          depth: 3,
          path: 'comment-1/reply-a/reply-0',
        }),
      })
    );
  });
});
