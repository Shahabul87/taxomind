import { DELETE } from '@/app/api/comment-delete/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

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
const comment = ensureModel('comment', ['findFirst', 'delete']);
const reply = ensureModel('reply', ['findFirst', 'delete']);

describe('/api/comment-delete route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    post.findUnique.mockResolvedValue({ id: 'post-1' });
    comment.findFirst.mockResolvedValue({ id: 'comment-1', userId: 'user-1' });
    comment.delete.mockResolvedValue({ id: 'comment-1' });
    reply.findFirst.mockResolvedValue({ id: 'reply-1', userId: 'user-1' });
    reply.delete.mockResolvedValue({ id: 'reply-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/comment-delete?postId=post-1&commentId=comment-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when postId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/comment-delete?commentId=comment-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(400);
  });

  it('deletes comment when owner and commentId provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/comment-delete?postId=post-1&commentId=comment-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(comment.delete).toHaveBeenCalledWith({ where: { id: 'comment-1' } });
  });

  it('returns 403 when reply exists but belongs to another user', async () => {
    reply.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'reply-1', userId: 'other-user', commentId: 'comment-1' });

    const req = new NextRequest('http://localhost:3000/api/comment-delete?postId=post-1&replyId=reply-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(403);
  });
});
