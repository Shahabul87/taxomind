/**
 * Tests for Post Chapters API Route - app/api/posts/[postId]/postchapters/route.ts
 *
 * Covers: POST (create a new PostChapterSection)
 * The endpoint uses currentUser() directly for authentication and verifies
 * post ownership before creating a chapter.
 */

// Modules are globally mocked in jest.setup.js: @/lib/db, @/lib/auth, @/lib/logger, next/server

import { POST } from '@/app/api/posts/[postId]/postchapters/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

// Add postChapterSection model to the mock db if it does not exist
beforeAll(() => {
  const dbAny = db as Record<string, unknown>;
  if (!dbAny.postChapterSection) {
    dbAny.postChapterSection = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn(),
      groupBy: jest.fn().mockResolvedValue([]),
    };
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createChapterPostRequest(body?: Record<string, unknown>) {
  return new Request(
    'http://localhost:3000/api/posts/post-1/postchapters',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }
  );
}

function createProps(postId = 'post-1') {
  return { params: Promise.resolve({ postId }) };
}

// ============================================================================
// POST /api/posts/[postId]/postchapters
// ============================================================================

describe('POST /api/posts/[postId]/postchapters', () => {
  const defaultBody = {
    title: 'Chapter 1: Introduction',
    description: 'Getting started with the basics',
    isPublished: false,
    isFree: false,
  };

  const mockCreatedChapter = {
    id: 'chapter-uuid-1',
    title: 'Chapter 1: Introduction',
    description: 'Getting started with the basics',
    isPublished: false,
    isFree: false,
    postId: 'post-1',
    position: 1,
    updatedAt: new Date('2026-02-25T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    });
    (db.post.findUnique as jest.Mock).mockResolvedValue({
      id: 'post-1',
      userId: 'user-1',
      title: 'My Post',
    });
    ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).findFirst.mockResolvedValue(null);
    ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).create.mockResolvedValue(mockCreatedChapter);
  });

  // ---------- Authentication ----------

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(
      createChapterPostRequest(defaultBody),
      createProps()
    );

    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toBe('Unauthorized');
  });

  it('returns 401 when user id is missing', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID User' });

    const res = await POST(
      createChapterPostRequest(defaultBody),
      createProps()
    );

    expect(res.status).toBe(401);
  });

  // ---------- Authorization (Post Ownership) ----------

  it('returns 401 when user does not own the post', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(
      createChapterPostRequest(defaultBody),
      createProps()
    );

    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toBe('Unauthorized');
  });

  it('verifies post ownership with both postId and userId', async () => {
    await POST(
      createChapterPostRequest(defaultBody),
      createProps('post-1')
    );

    expect(db.post.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'post-1',
        userId: 'user-1',
      },
    });
  });

  // ---------- Successful Chapter Creation ----------

  it('creates a chapter successfully and returns it as JSON', async () => {
    const res = await POST(
      createChapterPostRequest(defaultBody),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('chapter-uuid-1');
    expect(body.title).toBe('Chapter 1: Introduction');
    expect(body.description).toBe('Getting started with the basics');
    expect(body.postId).toBe('post-1');
  });

  it('sets position to 1 when no existing chapters', async () => {
    ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).findFirst.mockResolvedValue(null);

    await POST(
      createChapterPostRequest(defaultBody),
      createProps()
    );

    const createCall = ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).create;
    expect(createCall).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          position: 1,
        }),
      })
    );
  });

  it('sets position to lastChapter.position + 1 when chapters exist', async () => {
    ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).findFirst.mockResolvedValue({
      id: 'existing-chapter',
      position: 3,
    });

    await POST(
      createChapterPostRequest(defaultBody),
      createProps()
    );

    const createCall = ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).create;
    expect(createCall).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          position: 4,
        }),
      })
    );
  });

  it('finds the last chapter ordered by position descending', async () => {
    await POST(
      createChapterPostRequest(defaultBody),
      createProps('post-1')
    );

    const findFirstCall = ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).findFirst;
    expect(findFirstCall).toHaveBeenCalledWith({
      where: { postId: 'post-1' },
      orderBy: { position: 'desc' },
    });
  });

  it('passes correct data to db.postChapterSection.create', async () => {
    await POST(
      createChapterPostRequest(defaultBody),
      createProps('post-1')
    );

    const createCall = ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).create;
    expect(createCall).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Chapter 1: Introduction',
        description: 'Getting started with the basics',
        isPublished: false,
        isFree: false,
        postId: 'post-1',
        position: 1,
      }),
    });
  });

  it('generates a UUID for the new chapter id', async () => {
    await POST(
      createChapterPostRequest(defaultBody),
      createProps()
    );

    const createCall = ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).create;
    const callData = createCall.mock.calls[0][0].data;
    // The id should be a string (UUID from crypto.randomUUID)
    expect(typeof callData.id).toBe('string');
    expect(callData.id.length).toBeGreaterThan(0);
  });

  it('includes updatedAt in the created chapter data', async () => {
    await POST(
      createChapterPostRequest(defaultBody),
      createProps()
    );

    const createCall = ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).create;
    const callData = createCall.mock.calls[0][0].data;
    expect(callData.updatedAt).toBeInstanceOf(Date);
  });

  // ---------- Default values ----------

  it('defaults isPublished to false when not provided', async () => {
    const body = { title: 'Title', description: 'Desc' };

    await POST(
      createChapterPostRequest(body),
      createProps()
    );

    const createCall = ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).create;
    const callData = createCall.mock.calls[0][0].data;
    expect(callData.isPublished).toBe(false);
  });

  it('defaults isFree to false when not provided', async () => {
    const body = { title: 'Title', description: 'Desc' };

    await POST(
      createChapterPostRequest(body),
      createProps()
    );

    const createCall = ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).create;
    const callData = createCall.mock.calls[0][0].data;
    expect(callData.isFree).toBe(false);
  });

  it('allows isPublished to be set to true', async () => {
    const body = { ...defaultBody, isPublished: true };

    await POST(
      createChapterPostRequest(body),
      createProps()
    );

    const createCall = ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).create;
    const callData = createCall.mock.calls[0][0].data;
    expect(callData.isPublished).toBe(true);
  });

  it('allows isFree to be set to true', async () => {
    const body = { ...defaultBody, isFree: true };

    await POST(
      createChapterPostRequest(body),
      createProps()
    );

    const createCall = ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).create;
    const callData = createCall.mock.calls[0][0].data;
    expect(callData.isFree).toBe(true);
  });

  // ---------- Error Handling ----------

  it('returns 500 when database create throws an error', async () => {
    ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).create.mockRejectedValue(
      new Error('Database connection lost')
    );

    const res = await POST(
      createChapterPostRequest(defaultBody),
      createProps()
    );

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('Internal Error');
  });

  it('returns 500 when post ownership check throws an error', async () => {
    (db.post.findUnique as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const res = await POST(
      createChapterPostRequest(defaultBody),
      createProps()
    );

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('Internal Error');
  });

  it('returns 500 when findFirst for last chapter throws', async () => {
    ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).findFirst.mockRejectedValue(
      new Error('Query failed')
    );

    const res = await POST(
      createChapterPostRequest(defaultBody),
      createProps()
    );

    expect(res.status).toBe(500);
  });

  // ---------- Different Post IDs ----------

  it('uses the postId from params for ownership check and chapter creation', async () => {
    (db.post.findUnique as jest.Mock).mockResolvedValue({
      id: 'post-99',
      userId: 'user-1',
    });

    await POST(
      createChapterPostRequest(defaultBody),
      createProps('post-99')
    );

    expect(db.post.findUnique).toHaveBeenCalledWith({
      where: { id: 'post-99', userId: 'user-1' },
    });

    const createCall = ((db as Record<string, unknown>).postChapterSection as Record<string, jest.Mock>).create;
    const callData = createCall.mock.calls[0][0].data;
    expect(callData.postId).toBe('post-99');
  });
});
