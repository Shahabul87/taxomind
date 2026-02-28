jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { POST } from '@/app/api/simple-reply/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

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

const reply = ensureModel('reply', ['findUnique', 'create']);
const comment = ensureModel('comment', ['findUnique', 'findFirst']);

function req(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/simple-reply', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/simple-reply route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    reply.findUnique.mockResolvedValue(null);
    comment.findUnique.mockResolvedValue({ id: 'comment-1' });
    comment.findFirst.mockResolvedValue({ id: 'comment-1' });
    reply.create.mockResolvedValue({
      id: 'reply-1',
      content: 'hello',
      commentId: 'comment-1',
      User: { id: 'user-1', name: 'User' },
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(req({}));
    expect(res.status).toBe(401);
  });

  it('returns 400 when content is missing', async () => {
    const res = await POST(req({ postId: 'post-1' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when no valid comment can be resolved', async () => {
    comment.findUnique.mockResolvedValueOnce(null);
    comment.findFirst.mockResolvedValueOnce(null);
    const res = await POST(req({ postId: 'post-1', content: 'hello' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('no valid comment');
  });

  it('creates reply and returns reactions array for UI parity', async () => {
    const res = await POST(req({ postId: 'post-1', commentId: 'comment-1', content: 'hello' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('reply-1');
    expect(body.reactions).toEqual([]);
    expect(reply.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          postId: 'post-1',
          commentId: 'comment-1',
        }),
      })
    );
  });
});
