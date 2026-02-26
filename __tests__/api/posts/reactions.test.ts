/**
 * Tests for Post Reactions API Routes - app/api/posts/[postId]/reactions/route.ts
 *
 * Covers: POST (create/toggle reaction - currently returns 503),
 *         GET (get reaction data - currently returns empty stub)
 *
 * The PostReaction model does not exist in the schema yet, so both endpoints
 * are temporarily disabled / stubbed.
 */

// Modules are globally mocked in jest.setup.js: @/lib/db, @/lib/auth, @/lib/logger, next/server

import { POST, GET } from '@/app/api/posts/[postId]/reactions/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createReactionPostRequest(body?: Record<string, unknown>) {
  return new Request(
    'http://localhost:3000/api/posts/post-1/reactions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }
  );
}

function createReactionGetRequest(postId = 'post-1') {
  return new Request(
    `http://localhost:3000/api/posts/${postId}/reactions`,
    { method: 'GET' }
  );
}

function createProps(postId = 'post-1') {
  return { params: Promise.resolve({ postId }) };
}

// ============================================================================
// POST /api/posts/[postId]/reactions
// ============================================================================

describe('POST /api/posts/[postId]/reactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 503 indicating the feature is unavailable', async () => {
    const res = await POST(
      createReactionPostRequest({ type: 'LIKE' }),
      createProps()
    );

    expect(res.status).toBe(503);
    const text = await res.text();
    expect(text).toBe('Post reactions feature is currently unavailable');
  });

  it('returns 503 regardless of the reaction type provided', async () => {
    const res = await POST(
      createReactionPostRequest({ type: 'HEART' }),
      createProps()
    );

    expect(res.status).toBe(503);
  });

  it('returns 503 even without a request body', async () => {
    const res = await POST(
      createReactionPostRequest(),
      createProps()
    );

    expect(res.status).toBe(503);
  });

  it('returns 503 for any postId', async () => {
    const res = await POST(
      createReactionPostRequest({ type: 'LIKE' }),
      createProps('any-post-id')
    );

    expect(res.status).toBe(503);
  });

  it('does not call any database operations', async () => {
    const { db } = require('@/lib/db');

    await POST(
      createReactionPostRequest({ type: 'LIKE' }),
      createProps()
    );

    // No Prisma model methods should have been invoked
    expect(db.post.findUnique).not.toHaveBeenCalled();
    expect(db.post.create).not.toHaveBeenCalled();
    expect(db.post.update).not.toHaveBeenCalled();
  });
});

// ============================================================================
// GET /api/posts/[postId]/reactions
// ============================================================================

describe('GET /api/posts/[postId]/reactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with empty reaction data', async () => {
    const res = await GET(
      createReactionGetRequest(),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalCount).toBe(0);
    expect(body.data.hasReacted).toBe(false);
    expect(body.data.reactionType).toBeNull();
  });

  it('returns consistent empty data for any postId', async () => {
    const res = await GET(
      createReactionGetRequest('other-post'),
      createProps('other-post')
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalCount).toBe(0);
  });

  it('returns data with the expected shape', async () => {
    const res = await GET(
      createReactionGetRequest(),
      createProps()
    );
    const body = await res.json();

    expect(body).toEqual({
      success: true,
      data: {
        totalCount: 0,
        hasReacted: false,
        reactionType: null,
      },
    });
  });

  it('does not require authentication', async () => {
    // Since the endpoint does not call currentUser(), any request should work
    const res = await GET(
      createReactionGetRequest(),
      createProps()
    );

    expect(res.status).toBe(200);
  });

  it('does not call any database operations', async () => {
    const { db } = require('@/lib/db');

    await GET(
      createReactionGetRequest(),
      createProps()
    );

    expect(db.post.findUnique).not.toHaveBeenCalled();
    expect(db.post.findMany).not.toHaveBeenCalled();
  });

  it('returns hasReacted as false in stub response', async () => {
    const res = await GET(
      createReactionGetRequest(),
      createProps()
    );
    const body = await res.json();

    expect(body.data.hasReacted).toBe(false);
  });

  it('returns reactionType as null in stub response', async () => {
    const res = await GET(
      createReactionGetRequest(),
      createProps()
    );
    const body = await res.json();

    expect(body.data.reactionType).toBeNull();
  });
});
