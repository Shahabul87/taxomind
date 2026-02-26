/**
 * Tests for PostChapter Detail Route - app/api/posts/[postId]/postchapters/[postchapterId]/route.ts
 */

import { DELETE, PATCH } from '@/app/api/posts/[postId]/postchapters/[postchapterId]/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).postChapterSection) {
  (db as Record<string, unknown>).postChapterSection = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };
}

const mockChapter = (db as Record<string, any>).postChapterSection;

function delReq() {
  return new Request('http://localhost:3000/api/posts/post-1/postchapters/ch-1', { method: 'DELETE' });
}

function patchReq(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/posts/post-1/postchapters/ch-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function props(postId = 'post-1', postchapterId = 'ch-1') {
  return { params: Promise.resolve({ postId, postchapterId }) };
}

describe('Postchapter detail route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1', userId: 'user-1' });
    (db.post.findFirst as jest.Mock).mockResolvedValue({ id: 'post-1', userId: 'user-1' });
    (db.post.update as jest.Mock).mockResolvedValue({ id: 'post-1', published: false });

    mockChapter.findUnique.mockResolvedValue({ id: 'ch-1', postId: 'post-1', isPublished: true });
    mockChapter.findFirst.mockResolvedValue({ id: 'ch-1', postId: 'post-1' });
    mockChapter.findMany.mockResolvedValue([]);
    mockChapter.delete.mockResolvedValue({ id: 'ch-1' });
    mockChapter.update.mockResolvedValue({ id: 'ch-1', title: 'Updated' });
  });

  it('DELETE returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await DELETE(delReq(), props());
    expect(res.status).toBe(401);
  });

  it('DELETE returns 401 when post is not owned', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await DELETE(delReq(), props());
    expect(res.status).toBe(401);
  });

  it('DELETE returns 404 when chapter does not exist', async () => {
    mockChapter.findUnique.mockResolvedValue(null);

    const res = await DELETE(delReq(), props());
    expect(res.status).toBe(404);
  });

  it('DELETE removes chapter and unpublishes post when no published chapters left', async () => {
    mockChapter.findMany.mockResolvedValue([]);

    const res = await DELETE(delReq(), props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('ch-1');
    expect(db.post.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'post-1' }, data: { published: false } })
    );
  });

  it('PATCH returns 400 when values are empty', async () => {
    const res = await PATCH(patchReq({}), props());
    expect(res.status).toBe(400);
  });

  it('PATCH returns 404 when post not owned/found', async () => {
    (db.post.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(patchReq({ title: 'New' }), props());
    expect(res.status).toBe(404);
  });

  it('PATCH returns 404 when chapter not linked/found', async () => {
    mockChapter.findFirst.mockResolvedValue(null);

    const res = await PATCH(patchReq({ title: 'New' }), props());
    expect(res.status).toBe(404);
  });

  it('PATCH updates chapter with validated values', async () => {
    const res = await PATCH(patchReq({ title: 'Updated', isFree: true }), props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('ch-1');
    expect(mockChapter.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ch-1' }, data: expect.objectContaining({ title: 'Updated', isFree: true }) })
    );
  });
});
