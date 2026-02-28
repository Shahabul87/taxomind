jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/rate-limit', () => ({
  isRateLimited: jest.fn(),
  getRateLimitMessage: jest.fn(() => 'Too many reply attempts'),
}));

import { POST } from '@/app/api/nested-reply/route';
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
const comment = ensureModel('comment', ['findUnique']);
const reply = ensureModel('reply', ['findUnique', 'create']);

function req(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/nested-reply', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/nested-reply route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockIsRateLimited.mockResolvedValue({ limited: false, reset: Date.now() + 1000 });
    post.findUnique.mockResolvedValue({ id: 'post-1' });
    comment.findUnique.mockResolvedValue({ id: 'comment-1' });
    reply.findUnique.mockResolvedValue({ id: 'reply-0', depth: 1, path: 'comment-1', commentId: 'comment-1' });
    reply.create.mockResolvedValue({ id: 'reply-1', content: 'hello', commentId: 'comment-1' });
  });

  it('returns 401 for unauthenticated users', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(req({}));
    expect(res.status).toBe(401);
  });

  it('returns 429 when user is rate-limited', async () => {
    mockIsRateLimited.mockResolvedValueOnce({ limited: true, reset: Date.now() + 1000 });
    const res = await POST(req({ postId: 'post-1', commentId: 'comment-1', content: 'hello' }));
    expect(res.status).toBe(429);
  });

  it('returns 404 when target post does not exist', async () => {
    post.findUnique.mockResolvedValueOnce(null);
    const res = await POST(req({ postId: 'missing', commentId: 'comment-1', content: 'hello' }));
    expect(res.status).toBe(404);
  });

  it('creates direct nested reply under a comment', async () => {
    const res = await POST(req({ postId: 'post-1', commentId: 'comment-1', content: 'hello' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('reply-1');
    expect(reply.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          postId: 'post-1',
          commentId: 'comment-1',
          depth: 0,
          path: 'comment-1',
        }),
      })
    );
  });

  it('creates deep reply when parentReplyId is provided', async () => {
    reply.findUnique.mockResolvedValueOnce({
      id: 'reply-0',
      commentId: 'comment-1',
      depth: 2,
      path: 'comment-1/reply-x',
    });

    const res = await POST(req({ postId: 'post-1', parentReplyId: 'reply-0', content: 'deep hello' }));
    expect(res.status).toBe(200);
    expect(reply.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          commentId: 'comment-1',
          depth: 3,
          path: 'comment-1/reply-x/reply-0',
        }),
      })
    );
  });
});
