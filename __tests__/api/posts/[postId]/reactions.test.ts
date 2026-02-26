import { GET, POST } from '@/app/api/posts/[postId]/reactions/route';

describe('api/posts/[postId]/reactions route', () => {
  it('POST returns 503 while feature is disabled', async () => {
    const req = new Request('http://localhost:3000/api/posts/post-1/reactions', {
      method: 'POST',
      body: JSON.stringify({ reactionType: 'like' }),
    });

    const res = await POST(req, { params: Promise.resolve({ postId: 'post-1' }) });
    const text = await res.text();

    expect(res.status).toBe(503);
    expect(text).toContain('currently unavailable');
  });

  it('GET returns empty reactions payload', async () => {
    const req = new Request('http://localhost:3000/api/posts/post-1/reactions');

    const res = await GET(req, { params: Promise.resolve({ postId: 'post-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      totalCount: 0,
      hasReacted: false,
      reactionType: null,
    });
  });
});
