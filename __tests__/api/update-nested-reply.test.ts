jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { PATCH } from '@/app/api/update-nested-reply/route';
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

const post = ensureModel('post', ['findUnique']);
const reply = ensureModel('reply', ['findFirst', 'findUnique', 'update']);

function req(query: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost:3000/api/update-nested-reply?${query}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

describe('/api/update-nested-reply route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    post.findUnique.mockResolvedValue({ id: 'post-1' });
    reply.findFirst.mockResolvedValue({ id: 'reply-1', userId: 'user-1' });
    reply.update.mockResolvedValue({ id: 'reply-1', content: 'updated' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await PATCH(
      req('postId=post-1&replyId=reply-1', { content: 'updated' })
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when content is missing', async () => {
    const res = await PATCH(
      req('postId=post-1&replyId=reply-1', {})
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when post is not found', async () => {
    post.findUnique.mockResolvedValueOnce(null);
    const res = await PATCH(
      req('postId=post-1&replyId=reply-1', { content: 'updated' })
    );
    expect(res.status).toBe(404);
  });

  it('updates owned reply successfully', async () => {
    const res = await PATCH(
      req('postId=post-1&replyId=reply-1', { content: 'updated' })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('reply-1');
    expect(reply.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'reply-1' },
        data: expect.objectContaining({
          content: 'updated',
        }),
      })
    );
  });
});
