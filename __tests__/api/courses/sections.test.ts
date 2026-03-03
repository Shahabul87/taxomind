/**
 * Tests for Sections Route - app/api/courses/[courseId]/chapters/[chapterId]/sections/route.ts
 *
 * Covers:
 *   POST - Create a new section within a chapter
 *
 * Tests auth checks, chapter existence validation, position calculation,
 * duration parsing from string to integer, contentType handling,
 * generated content handling, and error cases.
 */

// @/lib/db, @/lib/auth, @/lib/logger, @/auth are globally mocked in jest.setup.js

import { POST } from '@/app/api/courses/[courseId]/chapters/[chapterId]/sections/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createProps(courseId = 'course-1', chapterId = 'chapter-1') {
  return { params: Promise.resolve({ courseId, chapterId }) };
}

// ---------------------------------------------------------------------------
// POST /api/courses/[courseId]/chapters/[chapterId]/sections
// ---------------------------------------------------------------------------

describe('POST /api/courses/[courseId]/chapters/[chapterId]/sections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The route now verifies course ownership before checking chapter existence.
    // Default: return a course owned by user-1.
    (db.course.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' });
  });

  // -----------------------------------------------------------------------
  // Authentication
  // -----------------------------------------------------------------------

  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(createPostRequest({ title: 'Sec' }), createProps());
    const text = await res.json();

    expect(res.status).toBe(401);
    expect(text.error?.message ?? text.message ?? text).toBe('Unauthorized');
  });

  it('returns 401 when session has no user', async () => {
    mockAuth.mockResolvedValue({ user: null });

    const res = await POST(createPostRequest({ title: 'Sec' }), createProps());
    const text = await res.json();

    expect(res.status).toBe(401);
    expect(text.error?.message ?? text.message ?? text).toBe('Unauthorized');
  });

  it('returns 401 when session user has no id', async () => {
    mockAuth.mockResolvedValue({ user: { name: 'No ID' } });

    const res = await POST(createPostRequest({ title: 'Sec' }), createProps());
    const text = await res.json();

    expect(res.status).toBe(401);
    expect(text.error?.message ?? text.message ?? text).toBe('Unauthorized');
  });

  // -----------------------------------------------------------------------
  // Chapter validation
  // -----------------------------------------------------------------------

  it('returns 404 when course does not exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createPostRequest({ title: 'Sec' }), createProps());
    const text = await res.json();

    expect(res.status).toBe(404);
    expect(text.error?.message ?? text.message ?? text).toBe('Course not found');
  });

  it('returns 403 when user does not own the course', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ userId: 'other-user' });

    const res = await POST(createPostRequest({ title: 'Sec' }), createProps());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 when chapter does not exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createPostRequest({ title: 'Sec' }), createProps());
    const text = await res.json();

    expect(res.status).toBe(404);
    expect(text.error?.message ?? text.message ?? text).toBe('Chapter not found');
  });

  it('verifies chapter with correct chapterId and courseId', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue(null);

    await POST(createPostRequest({ title: 'Sec' }), createProps('course-99', 'ch-42'));

    expect(db.chapter.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'ch-42',
        courseId: 'course-99',
      },
    });
  });

  // -----------------------------------------------------------------------
  // Happy path - basic creation
  // -----------------------------------------------------------------------

  it('creates a section and returns it as JSON', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({
      id: 'chapter-1',
      courseId: 'course-1',
    });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);

    const createdSection = {
      id: 'sec-1',
      title: 'My Section',
      chapterId: 'chapter-1',
      position: 0,
      type: null,
      duration: null,
    };
    (db.section.create as jest.Mock).mockResolvedValue(createdSection);

    const res = await POST(createPostRequest({ title: 'My Section' }), createProps());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('sec-1');
    expect(body.title).toBe('My Section');
    expect(body.position).toBe(0);
  });

  // -----------------------------------------------------------------------
  // Position logic
  // -----------------------------------------------------------------------

  it('uses position 0 when no sections exist and no position provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-new',
      title: 'First',
      chapterId: 'chapter-1',
      position: 0,
    });

    await POST(createPostRequest({ title: 'First' }), createProps());

    expect(db.section.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ position: 0 }),
    });
  });

  it('uses lastSection.position + 1 when sections exist and no position provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue({ position: 5 });
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-new',
      title: 'After',
      chapterId: 'chapter-1',
      position: 6,
    });

    await POST(createPostRequest({ title: 'After' }), createProps());

    expect(db.section.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ position: 6 }),
    });
  });

  it('uses explicitly provided position over auto-calculated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue({ position: 10 });
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-new',
      title: 'Custom Pos',
      chapterId: 'chapter-1',
      position: 3,
    });

    await POST(createPostRequest({ title: 'Custom Pos', position: 3 }), createProps());

    expect(db.section.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ position: 3 }),
    });
  });

  it('queries last section by descending position for auto-position', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-new',
      title: 'T',
      chapterId: 'chapter-1',
      position: 0,
    });

    await POST(createPostRequest({ title: 'T' }), createProps('course-1', 'chapter-1'));

    expect(db.section.findFirst).toHaveBeenCalledWith({
      where: { chapterId: 'chapter-1' },
      orderBy: { position: 'desc' },
    });
  });

  // -----------------------------------------------------------------------
  // Duration parsing
  // -----------------------------------------------------------------------

  it('parses estimatedDuration string to integer minutes', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-d',
      title: 'Dur',
      chapterId: 'chapter-1',
      position: 0,
      duration: 15,
    });

    await POST(
      createPostRequest({ title: 'Dur', estimatedDuration: '15-20 minutes' }),
      createProps()
    );

    expect(db.section.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ duration: 15 }),
    });
  });

  it('parses estimatedDuration with only numbers', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-d',
      title: 'Dur',
      chapterId: 'chapter-1',
      position: 0,
      duration: 30,
    });

    await POST(
      createPostRequest({ title: 'Dur', estimatedDuration: '30' }),
      createProps()
    );

    expect(db.section.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ duration: 30 }),
    });
  });

  it('sets duration to null when estimatedDuration is not provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-nd',
      title: 'NoDur',
      chapterId: 'chapter-1',
      position: 0,
      duration: null,
    });

    await POST(createPostRequest({ title: 'NoDur' }), createProps());

    expect(db.section.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ duration: null }),
    });
  });

  it('sets duration to null when estimatedDuration has no digits', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-nod',
      title: 'NoDig',
      chapterId: 'chapter-1',
      position: 0,
      duration: null,
    });

    await POST(
      createPostRequest({ title: 'NoDig', estimatedDuration: 'about some time' }),
      createProps()
    );

    expect(db.section.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ duration: null }),
    });
  });

  // -----------------------------------------------------------------------
  // Content type
  // -----------------------------------------------------------------------

  it('stores contentType when provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-ct',
      title: 'Video Sec',
      chapterId: 'chapter-1',
      position: 0,
      type: 'VIDEO',
    });

    await POST(
      createPostRequest({ title: 'Video Sec', contentType: 'VIDEO' }),
      createProps()
    );

    expect(db.section.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'VIDEO' }),
    });
  });

  it('stores null type when contentType is not provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-nct',
      title: 'No Type',
      chapterId: 'chapter-1',
      position: 0,
      type: null,
    });

    await POST(createPostRequest({ title: 'No Type' }), createProps());

    expect(db.section.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: null }),
    });
  });

  // -----------------------------------------------------------------------
  // Generated content handling
  // -----------------------------------------------------------------------

  it('creates a section even when generatedContent is provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-gen',
      title: 'AI Section',
      chapterId: 'chapter-1',
      position: 0,
      type: null,
      duration: null,
    });

    const res = await POST(
      createPostRequest({
        title: 'AI Section',
        generatedContent: '<p>AI generated content</p>',
      }),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('sec-gen');
  });

  it('does not include bloomsLevel in create data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-bl',
      title: 'Bloom Sec',
      chapterId: 'chapter-1',
      position: 0,
    });

    await POST(
      createPostRequest({ title: 'Bloom Sec', bloomsLevel: 'ANALYZE' }),
      createProps()
    );

    const createCall = (db.section.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data).not.toHaveProperty('bloomsLevel');
  });

  it('does not include description in create data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-desc',
      title: 'Desc Sec',
      chapterId: 'chapter-1',
      position: 0,
    });

    await POST(
      createPostRequest({ title: 'Desc Sec', description: 'A description' }),
      createProps()
    );

    const createCall = (db.section.create as jest.Mock).mock.calls[0][0];
    // description is destructured from JSON but NOT used in section.create
    expect(createCall.data).not.toHaveProperty('description');
  });

  // -----------------------------------------------------------------------
  // Correct chapterId in create data
  // -----------------------------------------------------------------------

  it('uses the chapterId from route params in the section create data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'ch-99', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockResolvedValue({
      id: 'sec-x',
      title: 'X',
      chapterId: 'ch-99',
      position: 0,
    });

    await POST(createPostRequest({ title: 'X' }), createProps('course-1', 'ch-99'));

    expect(db.section.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ chapterId: 'ch-99' }),
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  it('returns 500 on unexpected errors', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockRejectedValue(
      new Error('Something went wrong')
    );

    const res = await POST(createPostRequest({ title: 'Err' }), createProps());
    const text = await res.json();

    expect(res.status).toBe(500);
    expect(text.error?.message ?? text.message ?? text).toBe('Internal Server Error');
  });

  it('returns 500 on non-Error thrown values', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockRejectedValue('string error');

    const res = await POST(createPostRequest({ title: 'Err' }), createProps());
    const text = await res.json();

    expect(res.status).toBe(500);
    expect(text.error?.message ?? text.message ?? text).toBe('Internal Server Error');
  });

  it('returns 500 when section create fails', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);
    (db.section.create as jest.Mock).mockRejectedValue(
      new Error('Create failed')
    );

    const res = await POST(createPostRequest({ title: 'Fail' }), createProps());
    const text = await res.json();

    expect(res.status).toBe(500);
    expect(text.error?.message ?? text.message ?? text).toBe('Internal Server Error');
  });

  // -----------------------------------------------------------------------
  // Full create data structure
  // -----------------------------------------------------------------------

  it('creates section with all provided fields mapped correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue({ position: 2 });

    const fullSection = {
      id: 'sec-full',
      title: 'Full Section',
      chapterId: 'chapter-1',
      position: 3,
      type: 'TEXT',
      duration: 20,
    };
    (db.section.create as jest.Mock).mockResolvedValue(fullSection);

    const res = await POST(
      createPostRequest({
        title: 'Full Section',
        contentType: 'TEXT',
        estimatedDuration: '20 minutes',
        bloomsLevel: 'APPLY',
        description: 'Full desc',
        generatedContent: '<p>Content</p>',
      }),
      createProps()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(fullSection);

    expect(db.section.create).toHaveBeenCalledWith({
      data: {
        title: 'Full Section',
        chapterId: 'chapter-1',
        position: 3,
        type: 'TEXT',
        duration: 20,
      },
    });
  });

  it('returns the created section object as JSON', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.findFirst as jest.Mock).mockResolvedValue(null);

    const section = {
      id: 'sec-ret',
      title: 'Return Test',
      chapterId: 'chapter-1',
      position: 0,
      type: null,
      duration: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    (db.section.create as jest.Mock).mockResolvedValue(section);

    const res = await POST(createPostRequest({ title: 'Return Test' }), createProps());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(section);
  });
});
