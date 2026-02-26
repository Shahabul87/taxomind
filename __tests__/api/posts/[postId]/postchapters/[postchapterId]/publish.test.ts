/**
 * Tests for PostChapter Publish Route - app/api/posts/[postId]/postchapters/[postchapterId]/publish/route.ts
 */

import { PATCH } from '@/app/api/posts/[postId]/postchapters/[postchapterId]/publish/route';
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
  return new Request('http://localhost:3000/api/posts/post-1/postchapters/ch-1/publish', { method: 'PATCH' });
}

function props(postId: string | undefined = 'post-1', postchapterId: string | undefined = 'ch-1') {
  return { params: Promise.resolve({ postId, postchapterId }) } as any;
}

function propsMissingPostId() {
  return { params: Promise.resolve({ postchapterId: 'ch-1' }) } as any;
}

describe('Postchapter publish route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1', userId: 'user-1', PostChapterSection: [] });
    mockChapter.findUnique.mockResolvedValue({ id: 'ch-1', isPublished: false });
    mockChapter.update.mockResolvedValue({ id: 'ch-1', isPublished: true });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await PATCH(req(), props());
    expect(res.status).toBe(401);
  });

  it('returns 400 when params are missing', async () => {
    const res = await PATCH(req(), propsMissingPostId());
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

  it('toggles chapter publish state', async () => {
    const res = await PATCH(req(), props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isPublished).toBe(true);
    expect(mockChapter.update).toHaveBeenCalledWith({ where: { id: 'ch-1' }, data: { isPublished: true } });
  });
});
