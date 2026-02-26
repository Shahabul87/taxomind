jest.mock('@/lib/api', () => {
  return {
    withAuth: (handler: any) => (request: any) =>
      handler(request, { user: { id: 'user-1', name: 'Test User' } }),
    createSuccessResponse: (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    createErrorResponse: jest.fn(),
    ApiError: class ApiError extends Error {},
  };
});

jest.mock('@/lib/rate-limit', () => ({
  isRateLimited: jest.fn(),
  getRateLimitMessage: jest.fn(() => 'Too many reactions'),
}));

import { POST } from '@/app/api/comment-reaction/route';
import { db } from '@/lib/db';
import { isRateLimited } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

const mockIsRateLimited = isRateLimited as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  const dbRecord = db as Record<string, Record<string, jest.Mock> | undefined>;
  if (!dbRecord[modelName]) {
    dbRecord[modelName] = {} as Record<string, jest.Mock>;
  }
  for (const method of methods) {
    if (!(dbRecord[modelName] as Record<string, jest.Mock>)[method]) {
      (dbRecord[modelName] as Record<string, jest.Mock>)[method] = jest.fn();
    }
  }
  return dbRecord[modelName] as Record<string, jest.Mock>;
}

const post = ensureModel('post', ['findUnique']);

describe('/api/comment-reaction route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsRateLimited.mockResolvedValue({ limited: false, reset: Date.now() + 1000 });
    post.findUnique.mockResolvedValue({ id: 'ckpost1234567890123456789' });
  });

  it('returns 429 when rate limited', async () => {
    mockIsRateLimited.mockResolvedValueOnce({ limited: true, reset: Date.now() + 5000 });

    const req = new NextRequest('http://localhost:3000/api/comment-reaction', {
      method: 'POST',
      body: JSON.stringify({
        type: 'LIKE',
        postId: 'ckpost1234567890123456789',
        commentId: 'ckcomment12345678901234567',
      }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(429);
  });

  it('returns 400 when reaction payload is invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/comment-reaction', {
      method: 'POST',
      body: JSON.stringify({ type: 'INVALID', postId: 'bad', commentId: 'bad' }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it('returns 404 when post is not found', async () => {
    post.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/comment-reaction', {
      method: 'POST',
      body: JSON.stringify({
        type: 'LIKE',
        postId: 'ckpost1234567890123456789',
        commentId: 'ckcomment12345678901234567',
      }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(404);
  });
});
