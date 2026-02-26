/**
 * Tests for Post Detail API Routes - app/api/posts/[postId]/route.ts
 *
 * Covers: DELETE (delete a post), PATCH (update a post)
 * These endpoints use currentUser() directly (NOT withAuth wrapper).
 */

// Modules are globally mocked in jest.setup.js: @/lib/db, @/lib/auth, @/lib/logger, next/server

import { DELETE, PATCH } from '@/app/api/posts/[postId]/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

function createDeleteRequest() {
  return new Request('http://localhost:3000/api/posts/post-1', {
    method: 'DELETE',
  });
}

function createPatchRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/posts/post-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createParams(postId = 'post-1') {
  return { params: Promise.resolve({ postId }) };
}

// ============================================================================
// DELETE /api/posts/[postId]
// ============================================================================

describe('DELETE /api/posts/[postId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test User' });
    (db.post.delete as jest.Mock).mockResolvedValue({
      id: 'post-1',
      title: 'Deleted Post',
      userId: 'user-1',
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await DELETE(createDeleteRequest(), createParams());

    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID User' });

    const res = await DELETE(createDeleteRequest(), createParams());

    expect(res.status).toBe(401);
  });

  it('successfully deletes a post owned by the user', async () => {
    const deletedPost = {
      id: 'post-1',
      title: 'My Post',
      userId: 'user-1',
    };
    (db.post.delete as jest.Mock).mockResolvedValue(deletedPost);

    const res = await DELETE(createDeleteRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('post-1');
    expect(db.post.delete).toHaveBeenCalledWith({
      where: {
        id: 'post-1',
        userId: 'user-1',
      },
    });
  });

  it('scopes delete to the authenticated user', async () => {
    (db.post.delete as jest.Mock).mockResolvedValue({ id: 'post-1' });

    await DELETE(createDeleteRequest(), createParams('post-1'));

    expect(db.post.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
        }),
      })
    );
  });

  it('uses the postId from route params', async () => {
    (db.post.delete as jest.Mock).mockResolvedValue({ id: 'post-42' });

    await DELETE(createDeleteRequest(), createParams('post-42'));

    expect(db.post.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'post-42',
        }),
      })
    );
  });

  it('returns 500 when database throws an error', async () => {
    (db.post.delete as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await DELETE(createDeleteRequest(), createParams());

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('Internal Error');
  });
});

// ============================================================================
// PATCH /api/posts/[postId]
// ============================================================================

describe('PATCH /api/posts/[postId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test User' });

    (db.post.findFirst as jest.Mock).mockResolvedValue({
      id: 'post-1',
      title: 'Original Title',
      userId: 'user-1',
    });

    (db.post.update as jest.Mock).mockResolvedValue({
      id: 'post-1',
      title: 'Updated Title',
      userId: 'user-1',
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PATCH(
      createPatchRequest({ title: 'Updated' }),
      createParams()
    );

    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID User' });

    const res = await PATCH(
      createPatchRequest({ title: 'Updated' }),
      createParams()
    );

    expect(res.status).toBe(401);
  });

  it('returns 404 when post does not exist', async () => {
    (db.post.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(
      createPatchRequest({ title: 'Updated' }),
      createParams()
    );

    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toBe('Post not found or unauthorized');
  });

  it('returns 404 when post belongs to another user', async () => {
    (db.post.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(
      createPatchRequest({ title: 'Updated' }),
      createParams('other-user-post')
    );

    expect(res.status).toBe(404);
  });

  it('successfully updates a post title', async () => {
    const updatedPost = {
      id: 'post-1',
      title: 'Updated Title',
      userId: 'user-1',
    };
    (db.post.update as jest.Mock).mockResolvedValue(updatedPost);

    const res = await PATCH(
      createPatchRequest({ title: 'Updated Title' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toBe('Updated Title');
  });

  it('successfully updates a post description', async () => {
    const updatedPost = {
      id: 'post-1',
      description: 'New description',
      userId: 'user-1',
    };
    (db.post.update as jest.Mock).mockResolvedValue(updatedPost);

    const res = await PATCH(
      createPatchRequest({ description: 'New description' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.description).toBe('New description');
  });

  it('successfully updates a post imageUrl', async () => {
    const updatedPost = {
      id: 'post-1',
      imageUrl: 'https://example.com/image.jpg',
      userId: 'user-1',
    };
    (db.post.update as jest.Mock).mockResolvedValue(updatedPost);

    const res = await PATCH(
      createPatchRequest({ imageUrl: 'https://example.com/image.jpg' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.imageUrl).toBe('https://example.com/image.jpg');
  });

  it('successfully updates post category', async () => {
    const updatedPost = {
      id: 'post-1',
      category: 'Technology',
      userId: 'user-1',
    };
    (db.post.update as jest.Mock).mockResolvedValue(updatedPost);

    const res = await PATCH(
      createPatchRequest({ category: 'Technology' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.category).toBe('Technology');
  });

  it('checks ownership before updating', async () => {
    (db.post.update as jest.Mock).mockResolvedValue({ id: 'post-1' });

    await PATCH(
      createPatchRequest({ title: 'Update' }),
      createParams('post-1')
    );

    expect(db.post.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'post-1',
        userId: 'user-1',
      },
    });
  });

  it('returns 400 when request data is invalid (Zod validation)', async () => {
    // Send an extra unknown field - the schema has .strict() so it rejects unknown keys
    const res = await PATCH(
      createPatchRequest({ unknownField: 'value' }),
      createParams()
    );

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid request data');
  });

  it('returns 400 when title exceeds max length', async () => {
    const longTitle = 'A'.repeat(101);

    const res = await PATCH(
      createPatchRequest({ title: longTitle }),
      createParams()
    );

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid request data');
  });

  it('returns 400 when imageUrl is not a valid URL', async () => {
    const res = await PATCH(
      createPatchRequest({ imageUrl: 'not-a-url' }),
      createParams()
    );

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid request data');
  });

  it('returns 400 when description exceeds max length', async () => {
    const longDesc = 'A'.repeat(5001);

    const res = await PATCH(
      createPatchRequest({ description: longDesc }),
      createParams()
    );

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid request data');
  });

  it('returns 500 when database update throws an error', async () => {
    (db.post.update as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await PATCH(
      createPatchRequest({ title: 'Updated' }),
      createParams()
    );

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('Internal Error');
  });

  it('calls db.post.update with validated data only', async () => {
    (db.post.update as jest.Mock).mockResolvedValue({
      id: 'post-1',
      title: 'Clean Title',
    });

    await PATCH(
      createPatchRequest({ title: 'Clean Title' }),
      createParams()
    );

    expect(db.post.update).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { title: 'Clean Title' },
    });
  });
});
