/**
 * Tests for Reply-to-Reply Route - app/api/posts/[postId]/comments/[commentId]/replies/[replyId]/route.ts
 */

jest.mock('@/lib/api', () => ({
  withAuth: (h: any) => h,
  createSuccessResponse: (data: any, status = 200) =>
    new Response(JSON.stringify({ success: status < 400, data }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  createErrorResponse: jest.fn(),
  ApiError: {},
}));

import { POST } from '@/app/api/posts/[postId]/comments/[commentId]/replies/[replyId]/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).reply) {
  (db as Record<string, unknown>).reply = {
    findFirst: jest.fn(),
    create: jest.fn(),
  };
}
if (!(db as Record<string, unknown>).comment) {
  (db as Record<string, unknown>).comment = {
    findFirst: jest.fn(),
  };
}

const mockReply = (db as Record<string, any>).reply;

function req(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/posts/post-1/comments/comment-1/replies/reply-1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function props(postId = 'post-1', commentId = 'comment-1', replyId = 'reply-1') {
  return { params: Promise.resolve({ postId, commentId, replyId }) };
}

describe('Reply-to-reply route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.comment.findFirst as jest.Mock).mockResolvedValue({ id: 'comment-1', postId: 'post-1' });
    mockReply.findFirst.mockResolvedValue({ id: 'reply-1', commentId: 'comment-1', postId: 'post-1' });
    mockReply.create.mockResolvedValue({ id: 'reply-2', parentReplyId: 'reply-1', content: 'Nested' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(req({ content: 'Nested' }) as any, props() as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 when content is missing', async () => {
    const res = await POST(req({}) as any, props() as any);
    expect(res.status).toBe(400);
  });

  it('returns 404 when parent comment is missing', async () => {
    (db.comment.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await POST(req({ content: 'Nested' }) as any, props() as any);
    expect(res.status).toBe(404);
  });

  it('returns 404 when parent reply is missing', async () => {
    mockReply.findFirst.mockResolvedValue(null);

    const res = await POST(req({ content: 'Nested' }) as any, props() as any);
    expect(res.status).toBe(404);
  });

  it('creates nested reply successfully', async () => {
    const res = await POST(req({ content: 'Nested' }) as any, props() as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('reply-2');
    expect(mockReply.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ parentReplyId: 'reply-1', commentId: 'comment-1', postId: 'post-1' }),
      })
    );
  });
});
