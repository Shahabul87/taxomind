/**
 * Tests for PostChapter Reorder Route - app/api/posts/[postId]/postchapters/reorder/route.ts
 */

import { PUT } from '@/app/api/posts/[postId]/postchapters/reorder/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).postChapterSection) {
  (db as Record<string, unknown>).postChapterSection = {
    update: jest.fn(),
  };
}

const mockChapter = (db as Record<string, any>).postChapterSection;

function req(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/posts/post-1/postchapters/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function props(postId = 'post-1') {
  return { params: Promise.resolve({ postId }) };
}

describe('Postchapter reorder route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.post.findFirst as jest.Mock).mockResolvedValue({ id: 'post-1', userId: 'user-1' });
    mockChapter.update.mockResolvedValue({ id: 'c1', position: 1 });
    (db.$transaction as jest.Mock).mockResolvedValue([]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PUT(req({ list: [{ id: 'c1', position: 1 }] }), props());
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid list payload', async () => {
    const res = await PUT(req({ list: [] }), props());
    expect(res.status).toBe(400);
  });

  it('returns 400 when list item shape is invalid', async () => {
    const res = await PUT(req({ list: [{ id: 1, position: 'bad' }] as any }), props());
    expect(res.status).toBe(400);
  });

  it('returns 404 when post is not owned/found', async () => {
    (db.post.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await PUT(req({ list: [{ id: 'c1', position: 1 }] }), props());
    expect(res.status).toBe(404);
  });

  it('reorders chapters in transaction', async () => {
    const list = [{ id: 'c1', position: 2 }, { id: 'c2', position: 1 }];
    const res = await PUT(req({ list }), props());

    expect(res.status).toBe(200);
    expect(db.$transaction).toHaveBeenCalled();
    expect(mockChapter.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { position: 2 } });
    expect(mockChapter.update).toHaveBeenCalledWith({ where: { id: 'c2' }, data: { position: 1 } });
  });
});
