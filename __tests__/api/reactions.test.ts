jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/reactions/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

function req(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/reactions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/reactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.post = {
      findUnique: jest.fn().mockResolvedValue({ id: 'post-1' }),
    };
    mockDb.comment = {
      findFirst: jest.fn().mockResolvedValue({ id: 'comment-1', reactions: [] }),
    };
    mockDb.reply = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    };
    mockDb.$transaction = jest.fn();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(req({ type: 'LIKE', postId: 'post-1', commentId: 'comment-1' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when reaction type is missing', async () => {
    const res = await POST(req({ postId: 'post-1', commentId: 'comment-1' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when post does not exist', async () => {
    mockDb.post.findUnique.mockResolvedValueOnce(null);
    const res = await POST(req({ type: 'LIKE', postId: 'post-1', commentId: 'comment-1' }));
    expect(res.status).toBe(404);
  });

  it('handles comment reaction and returns updated comment', async () => {
    const tx = {
      reaction: {
        findFirst: jest.fn().mockResolvedValue(null),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'reaction-1' }),
      },
      comment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'comment-1',
          reactions: [{ id: 'reaction-1', type: 'LIKE' }],
        }),
      },
    };
    mockDb.$transaction.mockImplementationOnce(async (fn: (arg: unknown) => unknown) => fn(tx));

    const res = await POST(req({ type: 'LIKE', postId: 'post-1', commentId: 'comment-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('comment-1');
    expect(tx.reaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'LIKE',
        userId: 'user-1',
        commentId: 'comment-1',
      }),
    });
  });
});
