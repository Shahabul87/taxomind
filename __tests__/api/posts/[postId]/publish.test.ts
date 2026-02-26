/**
 * Tests for Post Publish Route - app/api/posts/[postId]/publish/route.ts
 */

import { PATCH } from '@/app/api/posts/[postId]/publish/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

function req() {
  return new Request('http://localhost:3000/api/posts/post-1/publish', { method: 'PATCH' });
}

function props(postId = 'post-1') {
  return { params: Promise.resolve({ postId }) };
}

describe('Post publish route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.post.findUnique as jest.Mock).mockResolvedValue({
      id: 'post-1',
      userId: 'user-1',
      title: 'Post title',
      description: 'Post desc',
      imageUrl: 'https://example.com/image.png',
      category: 'Tech',
      PostChapterSection: [{ id: 'c1', isPublished: true }],
    });
    (db.post.update as jest.Mock).mockResolvedValue({ id: 'post-1', published: true });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PATCH(req(), props());
    expect(res.status).toBe(401);
  });

  it('returns 404 when post is not found/owned', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(req(), props());
    expect(res.status).toBe(404);
  });

  it('returns 400 when required fields are missing', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue({
      id: 'post-1',
      userId: 'user-1',
      title: 'Post title',
      description: '',
      imageUrl: 'https://example.com/image.png',
      category: 'Tech',
      PostChapterSection: [{ id: 'c1', isPublished: true }],
    });

    const res = await PATCH(req(), props());
    expect(res.status).toBe(400);
  });

  it('returns 400 when no chapter is published', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue({
      id: 'post-1',
      userId: 'user-1',
      title: 'Post title',
      description: 'Post desc',
      imageUrl: 'https://example.com/image.png',
      category: 'Tech',
      PostChapterSection: [{ id: 'c1', isPublished: false }],
    });

    const res = await PATCH(req(), props());
    expect(res.status).toBe(400);
  });

  it('publishes post successfully', async () => {
    const res = await PATCH(req(), props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.published).toBe(true);
    expect(db.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'post-1', userId: 'user-1' },
        data: { published: true },
      })
    );
  });
});
