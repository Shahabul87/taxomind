jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'reaction-1'),
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/nested-reply-reaction/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

describe('POST /api/nested-reply-reaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.reply = {
      findUnique: jest.fn().mockResolvedValue({ id: 'reply-1' }),
    };
    mockDb.$transaction = jest.fn();
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(
      new NextRequest('http://localhost:3000/api/nested-reply-reaction', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postId: 'post-1', replyId: 'reply-1', type: 'LIKE' }),
      })
    );

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid request JSON', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/nested-reply-reaction', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{invalid-json',
      })
    );

    expect(res.status).toBe(400);
  });

  it('returns 404 when reply is not found', async () => {
    mockDb.reply.findUnique.mockResolvedValueOnce(null);
    const res = await POST(
      new NextRequest('http://localhost:3000/api/nested-reply-reaction', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postId: 'post-1', replyId: 'reply-1', type: 'LIKE' }),
      })
    );

    expect(res.status).toBe(404);
  });

  it('creates reply reaction and returns updated reply', async () => {
    const tx = {
      reaction: {
        findFirst: jest.fn().mockResolvedValue(null),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'reaction-1', type: 'LIKE' }),
      },
      reply: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'reply-1',
          Reaction: [{ id: 'reaction-1', type: 'LIKE' }],
        }),
      },
    };
    mockDb.$transaction.mockImplementationOnce(async (fn: (arg: unknown) => unknown) => fn(tx));

    const res = await POST(
      new NextRequest('http://localhost:3000/api/nested-reply-reaction', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postId: 'post-1', replyId: 'reply-1', type: 'LIKE' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('reply-1');
    expect(tx.reaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'reaction-1',
        replyId: 'reply-1',
        type: 'LIKE',
      }),
    });
  });
});
