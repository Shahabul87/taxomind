jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { DELETE } from '@/app/api/delete-nested-reply/route';
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
const reply = ensureModel('reply', ['findFirst', 'findUnique', 'findMany', 'delete', 'deleteMany']);
const reaction = ensureModel('reaction', ['deleteMany']);

function req(query: string) {
  return new NextRequest(`http://localhost:3000/api/delete-nested-reply?${query}`, {
    method: 'DELETE',
  });
}

describe('/api/delete-nested-reply route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    post.findUnique.mockResolvedValue({ id: 'post-1' });
    reply.findFirst.mockResolvedValue({ id: 'reply-1', userId: 'user-1', other_Reply: [] });
    reply.findMany.mockResolvedValue([]);
    reaction.deleteMany.mockResolvedValue({ count: 0 });
    reply.deleteMany.mockResolvedValue({ count: 0 });
    reply.delete.mockResolvedValue({ id: 'reply-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await DELETE(req('postId=post-1&replyId=reply-1'));
    expect(res.status).toBe(401);
  });

  it('returns 400 when postId is missing', async () => {
    const res = await DELETE(req('replyId=reply-1'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when post does not exist', async () => {
    post.findUnique.mockResolvedValueOnce(null);
    const res = await DELETE(req('postId=post-1&replyId=reply-1'));
    expect(res.status).toBe(404);
  });

  it('deletes reply tree in transaction', async () => {
    const res = await DELETE(req('postId=post-1&replyId=reply-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(reaction.deleteMany).toHaveBeenCalled();
    expect(reply.delete).toHaveBeenCalledWith({ where: { id: 'reply-1' } });
  });
});
