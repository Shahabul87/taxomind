/**
 * Tests for Reply Reactions Route - app/api/posts/[postId]/replies/[replyId]/reactions/route.ts
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

import { POST } from '@/app/api/posts/[postId]/replies/[replyId]/reactions/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).reply) {
  (db as Record<string, unknown>).reply = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  };
}
if (!(db as Record<string, unknown>).reaction) {
  (db as Record<string, unknown>).reaction = {
    findFirst: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };
}

const mockReply = (db as Record<string, any>).reply;

function req(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/posts/post-1/replies/reply-1/reactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function props(postId = 'post-1', replyId = 'reply-1') {
  return { params: Promise.resolve({ postId, replyId }) };
}

describe('Reply reactions route', () => {
  const tx = {
    reaction: {
      findFirst: jest.fn(),
      delete: jest.fn(() => Promise.resolve({})),
      create: jest.fn(() => Promise.resolve({})),
    },
    reply: {
      findUnique: jest.fn(() => Promise.resolve({ id: 'reply-1', Reaction: [] })),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1' });
    mockReply.findFirst.mockResolvedValue({ id: 'reply-1', postId: 'post-1' });
    (db.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(tx));
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await POST(req({ type: 'like' }) as any, props() as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 when type is missing', async () => {
    const res = await POST(req({}) as any, props() as any);
    expect(res.status).toBe(400);
  });

  it('returns 404 when post is missing', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(req({ type: 'like' }) as any, props() as any);
    expect(res.status).toBe(404);
  });

  it('returns 404 when reply is missing', async () => {
    mockReply.findFirst.mockResolvedValue(null);

    const res = await POST(req({ type: 'like' }) as any, props() as any);
    expect(res.status).toBe(404);
  });

  it('creates reaction when none exists', async () => {
    tx.reaction.findFirst.mockResolvedValue(null);

    const res = await POST(req({ type: 'like' }) as any, props() as any);
    expect(res.status).toBe(200);
    expect(tx.reaction.create).toHaveBeenCalled();
  });

  it('deletes existing identical reaction', async () => {
    tx.reaction.findFirst.mockResolvedValue({ id: 'rx-1' });

    const res = await POST(req({ type: 'like' }) as any, props() as any);
    expect(res.status).toBe(200);
    expect(tx.reaction.delete).toHaveBeenCalledWith({ where: { id: 'rx-1' } });
  });
});
