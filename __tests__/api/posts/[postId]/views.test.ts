/**
 * Tests for Post Views Route - app/api/posts/[postId]/views/route.ts
 */

import { GET, POST } from '@/app/api/posts/[postId]/views/route';
import { db } from '@/lib/db';

function req(method: 'GET' | 'POST') {
  return new Request('http://localhost:3000/api/posts/post-1/views', { method });
}

function props(postId = 'post-1') {
  return { params: Promise.resolve({ postId }) };
}

describe('Post views route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1', views: 12 });
    (db.post.update as jest.Mock).mockResolvedValue({ views: 13 });
  });

  it('POST returns 404 when post is missing', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(req('POST'), props());
    expect(res.status).toBe(404);
  });

  it('POST increments and returns updated views', async () => {
    const res = await POST(req('POST'), props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.views).toBe(13);
    expect(db.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'post-1' },
        data: { views: { increment: 1 } },
      })
    );
  });

  it('GET returns current view count', async () => {
    const res = await GET(req('GET'), props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.views).toBe(12);
  });

  it('GET returns 500 on query failure', async () => {
    (db.post.findUnique as jest.Mock).mockRejectedValue(new Error('db fail'));

    const res = await GET(req('GET'), props());
    expect(res.status).toBe(500);
  });
});
