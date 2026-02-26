/**
 * Tests for Post Unpublish Route - app/api/posts/[postId]/unpublish/route.ts
 */

jest.mock('@/lib/api', () => ({
  withAuth: (handler: any) => async (request: any, props: any) => {
    const { currentUser } = require('@/lib/auth');
    const user = await currentUser();
    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }
    return handler(request, { user: { id: user.id } }, props);
  },
  createSuccessResponse: (data: any, status = 200) =>
    new Response(JSON.stringify({ success: true, data }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  createErrorResponse: (err: any) =>
    new Response(JSON.stringify({ success: false, error: err?.message || 'error' }), {
      status: err?.statusCode || err?.status || 500,
      headers: { 'Content-Type': 'application/json' },
    }),
  ApiError: {
    internal: (message: string) => ({ message, statusCode: 500 }),
  },
}));

import { PATCH } from '@/app/api/posts/[postId]/unpublish/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

function req() {
  return new Request('http://localhost:3000/api/posts/post-1/unpublish', { method: 'PATCH' });
}

function props(postId = 'post-1') {
  return { params: Promise.resolve({ postId }) };
}

describe('Post unpublish route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1', userId: 'user-1' });
    (db.post.update as jest.Mock).mockResolvedValue({ id: 'post-1', published: false });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PATCH(req() as any, props());
    expect(res.status).toBe(401);
  });

  it('returns 404 when post is not found/owned', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(req() as any, props());
    expect(res.status).toBe(404);
  });

  it('unpublishes post successfully', async () => {
    const res = await PATCH(req() as any, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.published).toBe(false);
    expect(db.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'post-1', userId: 'user-1' },
        data: { published: false },
      })
    );
  });
});
