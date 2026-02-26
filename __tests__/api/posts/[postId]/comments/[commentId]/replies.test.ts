/**
 * Tests for Comment Replies Route - app/api/posts/[postId]/comments/[commentId]/replies/route.ts
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
    tooManyRequests: (message: string) => ({ message, statusCode: 429 }),
    internal: (message: string) => ({ message, statusCode: 500 }),
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  isRateLimited: jest.fn(),
  getRateLimitMessage: jest.fn(() => 'Rate limit exceeded'),
}));

jest.mock('@/lib/validations/blog', () => ({
  ReplyCreateSchema: {
    safeParse: jest.fn(),
  },
}));

jest.mock('@/app/lib/cache', () => ({
  invalidateCache: jest.fn(() => Promise.resolve(true)),
}));

import { GET, POST } from '@/app/api/posts/[postId]/comments/[commentId]/replies/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { isRateLimited } from '@/lib/rate-limit';
import { ReplyCreateSchema } from '@/lib/validations/blog';
import { invalidateCache } from '@/app/lib/cache';

const mockCurrentUser = currentUser as jest.Mock;
const mockIsRateLimited = isRateLimited as jest.Mock;
const mockSafeParse = ReplyCreateSchema.safeParse as jest.Mock;
const mockInvalidateCache = invalidateCache as jest.Mock;

for (const model of ['comment', 'reply']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    };
  }
}

const mockComment = (db as Record<string, any>).comment;
const mockReply = (db as Record<string, any>).reply;

function req(method: 'GET' | 'POST', body?: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/posts/post-1/comments/comment-1/replies', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function props(postId = 'post-1', commentId = 'comment-1') {
  return { params: Promise.resolve({ postId, commentId }) };
}

function propsMissingCommentId() {
  return { params: Promise.resolve({ postId: 'post-1' }) } as any;
}

describe('Comment replies route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockIsRateLimited.mockResolvedValue({ limited: false });
    mockSafeParse.mockReturnValue({ success: true, data: { content: 'Reply text' } });

    mockComment.findFirst.mockResolvedValue({ id: 'comment-1', postId: 'post-1' });
    mockReply.findFirst.mockResolvedValue(null);
    mockReply.create.mockResolvedValue({ id: 'reply-1', content: 'Reply text' });
    mockReply.findMany.mockResolvedValue([{ id: 'reply-1', content: 'Reply text' }]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(req('POST', { content: 'x' }) as any, props() as any);
    expect(res.status).toBe(401);
  });

  it('POST returns 429 when rate limited', async () => {
    mockIsRateLimited.mockResolvedValue({ limited: true, reset: Date.now() + 1000 });

    const res = await POST(req('POST', { content: 'x' }) as any, props() as any);
    expect(res.status).toBe(429);
  });

  it('POST returns 400 for invalid body', async () => {
    mockSafeParse.mockReturnValue({
      success: false,
      error: { errors: [{ message: 'Content required' }] },
    });

    const res = await POST(req('POST', { content: '' }) as any, props() as any);
    expect(res.status).toBe(400);
  });

  it('POST returns 404 when comment not found', async () => {
    mockComment.findFirst.mockResolvedValue(null);

    const res = await POST(req('POST', { content: 'x' }) as any, props() as any);
    expect(res.status).toBe(404);
  });

  it('POST returns 404 when parent reply is not found', async () => {
    mockSafeParse.mockReturnValue({ success: true, data: { content: 'x', parentReplyId: 'r-parent' } });
    mockReply.findFirst.mockResolvedValue(null);

    const res = await POST(req('POST', { content: 'x', parentReplyId: 'r-parent' }) as any, props() as any);
    expect(res.status).toBe(404);
  });

  it('POST creates reply and invalidates comment cache', async () => {
    const res = await POST(req('POST', { content: 'Reply text' }) as any, props() as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(mockReply.create).toHaveBeenCalled();
    expect(mockInvalidateCache).toHaveBeenCalledWith('comments:post-1:*');
  });

  it('GET returns 400 for invalid commentId', async () => {
    const res = await GET(req('GET') as any, propsMissingCommentId());
    expect(res.status).toBe(400);
  });

  it('GET returns 404 when comment is missing', async () => {
    mockComment.findFirst.mockResolvedValue(null);

    const res = await GET(req('GET') as any, props() as any);
    expect(res.status).toBe(404);
  });

  it('GET returns replies list', async () => {
    const res = await GET(req('GET') as any, props() as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});
