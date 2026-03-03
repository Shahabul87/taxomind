/**
 * Tests for Course Chapters Route - app/api/courses/[courseId]/chapters/route.ts
 *
 * Covers:
 *   GET  - Fetch published chapters for a course (requires enrollment or ownership)
 *   POST - Create a new chapter (requires course ownership)
 *
 * Tests auth checks, authorization (enrolled/owner), validation, position logic,
 * error-specific responses (503 for DB connection, 401 for auth errors in POST),
 * and the happy-path for both methods.
 */

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { GET, POST } from '@/app/api/courses/[courseId]/chapters/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createGetRequest() {
  return new Request('http://localhost:3000/api/courses/course-1/chapters', {
    method: 'GET',
  });
}

function createPostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/course-1/chapters', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createParams(courseId = 'course-1') {
  return { params: Promise.resolve({ courseId }) };
}

// ---------------------------------------------------------------------------
// GET /api/courses/[courseId]/chapters
// ---------------------------------------------------------------------------

describe('GET /api/courses/[courseId]/chapters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createGetRequest() as never, createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID User' });

    const res = await GET(createGetRequest() as never, createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when user is neither enrolled nor owner', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.enrollment.findFirst as jest.Mock).mockResolvedValue(null);
    (db.course.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await GET(createGetRequest() as never, createParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toContain('enrolled');
  });

  it('returns chapters when user is enrolled', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.enrollment.findFirst as jest.Mock).mockResolvedValue({
      id: 'enroll-1',
      userId: 'user-1',
      courseId: 'course-1',
    });
    (db.course.findFirst as jest.Mock).mockResolvedValue(null);

    const chapters = [
      { id: 'ch-1', title: 'Intro', description: 'Intro desc', position: 1 },
      { id: 'ch-2', title: 'Basics', description: 'Basics desc', position: 2 },
    ];
    (db.chapter.findMany as jest.Mock).mockResolvedValue(chapters);

    const res = await GET(createGetRequest() as never, createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].title).toBe('Intro');
    expect(body.data[1].title).toBe('Basics');
  });

  it('returns chapters when user is the course owner', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.enrollment.findFirst as jest.Mock).mockResolvedValue(null);
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });

    const chapters = [
      { id: 'ch-1', title: 'Owner Chapter', description: null, position: 1 },
    ];
    (db.chapter.findMany as jest.Mock).mockResolvedValue(chapters);

    const res = await GET(createGetRequest() as never, createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Owner Chapter');
  });

  it('queries only published chapters ordered by position asc', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.enrollment.findFirst as jest.Mock).mockResolvedValue({ id: 'e-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue(null);
    (db.chapter.findMany as jest.Mock).mockResolvedValue([]);

    await GET(createGetRequest() as never, createParams('course-99'));

    expect(db.chapter.findMany).toHaveBeenCalledWith({
      where: {
        courseId: 'course-99',
        isPublished: true,
        OR: [{ status: null }, { status: 'ready' }],
      },
      select: {
        id: true,
        title: true,
        description: true,
        position: true,
      },
      orderBy: {
        position: 'asc',
      },
    });
  });

  it('returns an empty array when no published chapters exist', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.enrollment.findFirst as jest.Mock).mockResolvedValue({ id: 'e-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue(null);
    (db.chapter.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET(createGetRequest() as never, createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('returns 500 on unexpected database error', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.enrollment.findFirst as jest.Mock).mockRejectedValue(
      new Error('Connection lost')
    );

    const res = await GET(createGetRequest() as never, createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toContain('Failed to fetch chapters');
  });

  it('uses the correct courseId from route params', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.enrollment.findFirst as jest.Mock).mockResolvedValue({ id: 'e-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue(null);
    (db.chapter.findMany as jest.Mock).mockResolvedValue([]);

    await GET(createGetRequest() as never, createParams('custom-id'));

    expect(db.enrollment.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1', courseId: 'custom-id' },
    });
  });
});

// ---------------------------------------------------------------------------
// POST /api/courses/[courseId]/chapters
// ---------------------------------------------------------------------------

describe('POST /api/courses/[courseId]/chapters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(
      createPostRequest({ title: 'Test' }) as never,
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID' });

    const res = await POST(
      createPostRequest({ title: 'Test' }) as never,
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe('Unauthorized');
  });

  it('returns 401 when user does not own the course', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(
      createPostRequest({ title: 'Test' }) as never,
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe('Unauthorized');
  });

  it('creates a chapter with automatic position when no chapters exist', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.findFirst as jest.Mock).mockResolvedValue(null);

    const createdChapter = {
      id: 'ch-new',
      title: 'First Chapter',
      description: null,
      courseId: 'course-1',
      position: 1,
    };
    (db.chapter.create as jest.Mock).mockResolvedValue(createdChapter);

    const res = await POST(
      createPostRequest({ title: 'First Chapter' }) as never,
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('ch-new');
    expect(body.title).toBe('First Chapter');
    expect(body.position).toBe(1);

    expect(db.chapter.create).toHaveBeenCalledWith({
      data: {
        title: 'First Chapter',
        description: null,
        courseId: 'course-1',
        position: 1,
      },
    });
  });

  it('creates a chapter with position = lastChapter.position + 1', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.findFirst as jest.Mock).mockResolvedValue({ position: 5 });

    const createdChapter = {
      id: 'ch-6',
      title: 'Next Chapter',
      description: null,
      courseId: 'course-1',
      position: 6,
    };
    (db.chapter.create as jest.Mock).mockResolvedValue(createdChapter);

    const res = await POST(
      createPostRequest({ title: 'Next Chapter' }) as never,
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.position).toBe(6);
    expect(db.chapter.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ position: 6 }),
    });
  });

  it('uses the explicitly provided position over auto-calculated position', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.findFirst as jest.Mock).mockResolvedValue({ position: 5 });

    const createdChapter = {
      id: 'ch-custom',
      title: 'Custom Pos',
      description: null,
      courseId: 'course-1',
      position: 3,
    };
    (db.chapter.create as jest.Mock).mockResolvedValue(createdChapter);

    const res = await POST(
      createPostRequest({ title: 'Custom Pos', position: 3 }) as never,
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.position).toBe(3);
    expect(db.chapter.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ position: 3 }),
    });
  });

  it('stores description when provided', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.findFirst as jest.Mock).mockResolvedValue(null);

    const createdChapter = {
      id: 'ch-desc',
      title: 'With Desc',
      description: 'A detailed description',
      courseId: 'course-1',
      position: 1,
    };
    (db.chapter.create as jest.Mock).mockResolvedValue(createdChapter);

    const res = await POST(
      createPostRequest({
        title: 'With Desc',
        description: 'A detailed description',
      }) as never,
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.description).toBe('A detailed description');
    expect(db.chapter.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ description: 'A detailed description' }),
    });
  });

  it('stores null description when not provided', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.findFirst as jest.Mock).mockResolvedValue(null);

    (db.chapter.create as jest.Mock).mockResolvedValue({
      id: 'ch-no-desc',
      title: 'No Desc',
      description: null,
      courseId: 'course-1',
      position: 1,
    });

    await POST(
      createPostRequest({ title: 'No Desc' }) as never,
      createParams()
    );

    expect(db.chapter.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ description: null }),
    });
  });

  it('returns 503 on database connection errors', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockRejectedValue(
      new Error('Could not connect to database')
    );

    const res = await POST(
      createPostRequest({ title: 'Fail' }) as never,
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(503);
    expect(text).toBe('Database connection error');
  });

  it('returns 503 on database timeout errors', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockRejectedValue(
      new Error('Query timeout exceeded')
    );

    const res = await POST(
      createPostRequest({ title: 'Timeout' }) as never,
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(503);
    expect(text).toBe('Database connection error');
  });

  it('returns 401 on authentication-related errors', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockRejectedValue(
      new Error('unauthorized access detected')
    );

    const res = await POST(
      createPostRequest({ title: 'AuthErr' }) as never,
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe('Authentication error');
  });

  it('returns 500 on generic unexpected errors', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockRejectedValue(
      new Error('Something went wrong')
    );

    const res = await POST(
      createPostRequest({ title: 'Generic Err' }) as never,
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(500);
    expect(text).toBe('Internal Error');
  });

  it('returns 500 on non-Error thrown values', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockRejectedValue('string error');

    const res = await POST(
      createPostRequest({ title: 'StrErr' }) as never,
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(500);
    expect(text).toBe('Internal Error');
  });

  it('uses the correct courseId from route params for ownership check', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'other-course',
      userId: 'owner-1',
    });
    (db.chapter.findFirst as jest.Mock).mockResolvedValue(null);
    (db.chapter.create as jest.Mock).mockResolvedValue({
      id: 'ch-x',
      title: 'X',
      courseId: 'other-course',
      position: 1,
    });

    await POST(
      createPostRequest({ title: 'X' }) as never,
      createParams('other-course')
    );

    expect(db.course.findUnique).toHaveBeenCalledWith({
      where: { id: 'other-course', userId: 'owner-1' },
    });
    expect(db.chapter.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ courseId: 'other-course' }),
    });
  });

  it('queries last chapter by descending position for auto-position', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.findFirst as jest.Mock).mockResolvedValue({ position: 10 });
    (db.chapter.create as jest.Mock).mockResolvedValue({
      id: 'ch-11',
      title: 'T',
      courseId: 'course-1',
      position: 11,
    });

    await POST(
      createPostRequest({ title: 'T' }) as never,
      createParams()
    );

    expect(db.chapter.findFirst).toHaveBeenCalledWith({
      where: { courseId: 'course-1' },
      orderBy: { position: 'desc' },
    });
  });

  it('returns the created chapter object as JSON', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.findFirst as jest.Mock).mockResolvedValue(null);

    const fullChapter = {
      id: 'ch-full',
      title: 'Full Chapter',
      description: 'Desc',
      courseId: 'course-1',
      position: 1,
      isPublished: false,
      isFree: false,
      videoUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    (db.chapter.create as jest.Mock).mockResolvedValue(fullChapter);

    const res = await POST(
      createPostRequest({ title: 'Full Chapter', description: 'Desc' }) as never,
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(fullChapter);
  });

  it('ignores bloomsLevel in the create data (stored via TODO comment)', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.findFirst as jest.Mock).mockResolvedValue(null);
    (db.chapter.create as jest.Mock).mockResolvedValue({
      id: 'ch-bloom',
      title: 'Bloom',
      description: null,
      courseId: 'course-1',
      position: 1,
    });

    await POST(
      createPostRequest({
        title: 'Bloom',
        bloomsLevel: 'ANALYZE',
      }) as never,
      createParams()
    );

    // bloomsLevel should NOT be in the create data (it is destructured but not used)
    const createCall = (db.chapter.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data).not.toHaveProperty('bloomsLevel');
  });
});
