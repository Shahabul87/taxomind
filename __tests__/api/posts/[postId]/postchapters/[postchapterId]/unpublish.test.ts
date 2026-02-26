/**
 * Tests for PostChapter Unpublish Route - app/api/posts/[postId]/postchapters/[postchapterId]/unpublish/route.ts
 */

import { PATCH } from '@/app/api/posts/[postId]/postchapters/[postchapterId]/unpublish/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).postChapterSection) {
  (db as Record<string, unknown>).postChapterSection = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
}

const mockChapter = (db as Record<string, any>).postChapterSection;

function req() {
  return new Request('http://localhost:3000/api/posts/post-1/postchapters/ch-1/unpublish', { method: 'PATCH' });
}

function props(postId: string | undefined = 'post-1', postchapterId: string | undefined = 'ch-1') {
  return { params: Promise.resolve({ postId, postchapterId }) } as any;
}

function propsMissingChapterId() {
  return { params: Promise.resolve({ postId: 'post-1' }) } as any;
}

describe('Postchapter unpublish route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1', userId: 'user-1', PostChapterSection: [] });
    mockChapter.findUnique.mockResolvedValue({ id: 'ch-1', isPublished: true });
    mockChapter.update.mockResolvedValue({ id: 'ch-1', isPublished: false });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await PATCH(req(), props());
    expect(res.status).toBe(401);
  });

  it('returns 400 when params are missing', async () => {
    const res = await PATCH(req(), propsMissingChapterId());
    expect(res.status).toBe(400);
  });

  it('returns 404 when post not found', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(req(), props());
    expect(res.status).toBe(404);
  });

  it('returns 404 when chapter not found', async () => {
    mockChapter.findUnique.mockResolvedValue(null);

    const res = await PATCH(req(), props());
    expect(res.status).toBe(404);
  });

  it('sets chapter published flag to false', async () => {
    const res = await PATCH(req(), props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isPublished).toBe(false);
    expect(mockChapter.update).toHaveBeenCalledWith({ where: { id: 'ch-1' }, data: { isPublished: false } });
  });
});
