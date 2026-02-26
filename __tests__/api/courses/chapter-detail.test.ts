/**
 * Tests for Chapter Detail Route - app/api/courses/[courseId]/chapters/[chapterId]/route.ts
 *
 * Covers:
 *   DELETE - Delete a chapter (requires course ownership), reorder remaining chapters
 *   PATCH  - Update a chapter (requires course ownership), explicit field mapping
 *
 * Tests auth checks, authorization (owner), validation, position reordering,
 * error-specific responses (503 for DB connection, 401 for auth errors),
 * memory lifecycle reindex queueing, and the happy-path for both methods.
 */

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

jest.mock('@/lib/sam/memory-lifecycle-service', () => ({
  queueChapterReindex: jest.fn().mockResolvedValue(undefined),
}));

import { DELETE, PATCH } from '@/app/api/courses/[courseId]/chapters/[chapterId]/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { queueChapterReindex } from '@/lib/sam/memory-lifecycle-service';

const mockCurrentUser = currentUser as jest.Mock;
const mockQueueChapterReindex = queueChapterReindex as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDeleteRequest() {
  return new Request('http://localhost:3000/api/courses/course-1/chapters/chapter-1', {
    method: 'DELETE',
  });
}

function createPatchRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/course-1/chapters/chapter-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createParams(courseId = 'course-1', chapterId = 'chapter-1') {
  return { params: Promise.resolve({ courseId, chapterId }) };
}

// ---------------------------------------------------------------------------
// DELETE /api/courses/[courseId]/chapters/[chapterId]
// ---------------------------------------------------------------------------

describe('DELETE /api/courses/[courseId]/chapters/[chapterId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await DELETE(createDeleteRequest(), createParams());
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID User' });

    const res = await DELETE(createDeleteRequest(), createParams());
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe('Unauthorized');
  });

  it('returns 401 when user does not own the course', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await DELETE(createDeleteRequest(), createParams());
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe('Unauthorized');
  });

  it('returns 404 when chapter is not found', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await DELETE(createDeleteRequest(), createParams());
    const text = await res.text();

    expect(res.status).toBe(404);
    expect(text).toBe('Chapter not found');
  });

  it('deletes a chapter and returns the deleted chapter', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    const chapter = { id: 'chapter-1', courseId: 'course-1', position: 2, title: 'Ch 2' };
    (db.chapter.findUnique as jest.Mock).mockResolvedValue(chapter);
    (db.chapter.delete as jest.Mock).mockResolvedValue(chapter);
    (db.chapter.findMany as jest.Mock).mockResolvedValue([]);

    const res = await DELETE(createDeleteRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('chapter-1');
    expect(body.title).toBe('Ch 2');
  });

  it('reorders remaining chapters after deletion', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    const deletedChapter = { id: 'chapter-2', courseId: 'course-1', position: 2, title: 'Ch 2' };
    (db.chapter.findUnique as jest.Mock).mockResolvedValue(deletedChapter);
    (db.chapter.delete as jest.Mock).mockResolvedValue(deletedChapter);

    const remainingChapters = [
      { id: 'chapter-3', position: 3 },
      { id: 'chapter-4', position: 4 },
    ];
    (db.chapter.findMany as jest.Mock).mockResolvedValue(remainingChapters);
    (db.chapter.update as jest.Mock).mockResolvedValue({});

    await DELETE(createDeleteRequest(), createParams('course-1', 'chapter-2'));

    // Should query remaining chapters with position > deleted chapter's position
    expect(db.chapter.findMany).toHaveBeenCalledWith({
      where: {
        courseId: 'course-1',
        position: { gt: 2 },
      },
      orderBy: { position: 'asc' },
    });

    // Should call $transaction with the update promises
    expect(db.$transaction).toHaveBeenCalled();
  });

  it('skips reordering when no remaining chapters exist after deletion', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    const deletedChapter = { id: 'chapter-1', courseId: 'course-1', position: 5, title: 'Last' };
    (db.chapter.findUnique as jest.Mock).mockResolvedValue(deletedChapter);
    (db.chapter.delete as jest.Mock).mockResolvedValue(deletedChapter);
    (db.chapter.findMany as jest.Mock).mockResolvedValue([]);

    await DELETE(createDeleteRequest(), createParams());

    // $transaction should NOT be called because no remaining chapters
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('queues memory lifecycle reindex on chapter delete', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    const chapter = { id: 'chapter-1', courseId: 'course-1', position: 1, title: 'Ch' };
    (db.chapter.findUnique as jest.Mock).mockResolvedValue(chapter);
    (db.chapter.delete as jest.Mock).mockResolvedValue(chapter);
    (db.chapter.findMany as jest.Mock).mockResolvedValue([]);

    await DELETE(createDeleteRequest(), createParams());

    expect(mockQueueChapterReindex).toHaveBeenCalledWith('chapter-1', 'course-1', 'delete');
  });

  it('does not fail if memory reindex queue throws', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    const chapter = { id: 'chapter-1', courseId: 'course-1', position: 1, title: 'Ch' };
    (db.chapter.findUnique as jest.Mock).mockResolvedValue(chapter);
    (db.chapter.delete as jest.Mock).mockResolvedValue(chapter);
    (db.chapter.findMany as jest.Mock).mockResolvedValue([]);
    mockQueueChapterReindex.mockRejectedValue(new Error('Queue failed'));

    const res = await DELETE(createDeleteRequest(), createParams());

    // Should still return 200 because the catch handles the error
    expect(res.status).toBe(200);
  });

  it('verifies course ownership with correct courseId and userId', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-42' });
    (db.course.findFirst as jest.Mock).mockResolvedValue(null);

    await DELETE(createDeleteRequest(), createParams('custom-course', 'ch-99'));

    expect(db.course.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'custom-course',
        userId: 'user-42',
      },
    });
  });

  it('looks up chapter with correct chapterId and courseId', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'my-course',
      userId: 'owner-1',
    });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue(null);

    await DELETE(createDeleteRequest(), createParams('my-course', 'my-chapter'));

    expect(db.chapter.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'my-chapter',
        courseId: 'my-course',
      },
    });
  });

  it('returns 503 on database connection errors', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockRejectedValue(
      new Error('Could not connect to database')
    );

    const res = await DELETE(createDeleteRequest(), createParams());
    const text = await res.text();

    expect(res.status).toBe(503);
    expect(text).toBe('Database connection error');
  });

  it('returns 503 on database timeout errors', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockRejectedValue(
      new Error('Query timeout exceeded')
    );

    const res = await DELETE(createDeleteRequest(), createParams());
    const text = await res.text();

    expect(res.status).toBe(503);
    expect(text).toBe('Database connection error');
  });

  it('returns 401 on authentication-related errors', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockRejectedValue(
      new Error('unauthorized access detected')
    );

    const res = await DELETE(createDeleteRequest(), createParams());
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe('Authentication error');
  });

  it('returns 500 on generic unexpected errors', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockRejectedValue(
      new Error('Something went wrong')
    );

    const res = await DELETE(createDeleteRequest(), createParams());
    const text = await res.text();

    expect(res.status).toBe(500);
    expect(text).toBe('Internal Error');
  });

  it('returns 500 on non-Error thrown values', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockRejectedValue('string error');

    const res = await DELETE(createDeleteRequest(), createParams());
    const text = await res.text();

    expect(res.status).toBe(500);
    expect(text).toBe('Internal Error');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/courses/[courseId]/chapters/[chapterId]
// ---------------------------------------------------------------------------

describe('PATCH /api/courses/[courseId]/chapters/[chapterId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PATCH(
      createPatchRequest({ title: 'Updated' }),
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID' });

    const res = await PATCH(
      createPatchRequest({ title: 'Updated' }),
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe('Unauthorized');
  });

  it('returns 401 when user does not own the course', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(
      createPatchRequest({ title: 'Updated' }),
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe('Unauthorized');
  });

  it('updates a chapter title and returns success response', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });

    const updatedChapter = {
      id: 'chapter-1',
      title: 'New Title',
      courseId: 'course-1',
    };
    (db.chapter.update as jest.Mock).mockResolvedValue(updatedChapter);

    const res = await PATCH(
      createPatchRequest({ title: 'New Title' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('New Title');
    expect(body.metadata.fieldsUpdated).toContain('title');
  });

  it('maps core content fields correctly', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'chapter-1' });

    await PATCH(
      createPatchRequest({
        title: 'Updated Title',
        description: 'Updated Desc',
        courseGoals: 'Goals',
        learningOutcomes: 'Outcomes',
      }),
      createParams()
    );

    expect(db.chapter.update).toHaveBeenCalledWith({
      where: { id: 'chapter-1', courseId: 'course-1' },
      data: expect.objectContaining({
        title: 'Updated Title',
        description: 'Updated Desc',
        courseGoals: 'Goals',
        learningOutcomes: 'Outcomes',
      }),
    });
  });

  it('maps metadata fields correctly', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'chapter-1' });

    await PATCH(
      createPatchRequest({
        position: 3,
        estimatedTime: '30 min',
        difficulty: 'intermediate',
        prerequisites: 'Chapter 1',
        resources: 'Links',
        status: 'draft',
      }),
      createParams()
    );

    expect(db.chapter.update).toHaveBeenCalledWith({
      where: { id: 'chapter-1', courseId: 'course-1' },
      data: expect.objectContaining({
        position: 3,
        estimatedTime: '30 min',
        difficulty: 'intermediate',
        prerequisites: 'Chapter 1',
        resources: 'Links',
        status: 'draft',
      }),
    });
  });

  it('maps access control fields correctly (isFree and isPublished)', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'chapter-1' });

    await PATCH(
      createPatchRequest({
        isFree: true,
        isPublished: true,
      }),
      createParams()
    );

    expect(db.chapter.update).toHaveBeenCalledWith({
      where: { id: 'chapter-1', courseId: 'course-1' },
      data: expect.objectContaining({
        isFree: true,
        isPublished: true,
      }),
    });
  });

  it('maps numeric fields correctly (sectionCount and totalDuration)', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'chapter-1' });

    await PATCH(
      createPatchRequest({
        sectionCount: 5,
        totalDuration: 120,
      }),
      createParams()
    );

    expect(db.chapter.update).toHaveBeenCalledWith({
      where: { id: 'chapter-1', courseId: 'course-1' },
      data: expect.objectContaining({
        sectionCount: 5,
        totalDuration: 120,
      }),
    });
  });

  it('ignores unknown fields (prevents mass assignment)', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'chapter-1' });

    await PATCH(
      createPatchRequest({
        title: 'Valid',
        maliciousField: 'hack',
        userId: 'hijack',
      }),
      createParams()
    );

    const updateCall = (db.chapter.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty('maliciousField');
    expect(updateCall.data).not.toHaveProperty('userId');
    expect(updateCall.data).toHaveProperty('title', 'Valid');
  });

  it('only includes fields that are explicitly defined in the request', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'chapter-1' });

    await PATCH(
      createPatchRequest({ title: 'Only Title' }),
      createParams()
    );

    const updateCall = (db.chapter.update as jest.Mock).mock.calls[0][0];
    expect(Object.keys(updateCall.data)).toEqual(['title']);
  });

  it('returns fieldsUpdated metadata in the response', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'chapter-1' });

    const res = await PATCH(
      createPatchRequest({ title: 'T', description: 'D' }),
      createParams()
    );
    const body = await res.json();

    expect(body.metadata).toBeDefined();
    expect(body.metadata.fieldsUpdated).toEqual(
      expect.arrayContaining(['title', 'description'])
    );
    expect(body.metadata.timestamp).toBeDefined();
  });

  it('queues memory lifecycle reindex on chapter update', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'chapter-1' });

    await PATCH(
      createPatchRequest({ title: 'Updated' }),
      createParams()
    );

    expect(mockQueueChapterReindex).toHaveBeenCalledWith('chapter-1', 'course-1', 'update');
  });

  it('does not fail if memory reindex queue throws during update', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'chapter-1' });
    mockQueueChapterReindex.mockRejectedValue(new Error('Queue failed'));

    const res = await PATCH(
      createPatchRequest({ title: 'Updated' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('verifies course ownership with correct courseId and userId', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-42' });
    (db.course.findFirst as jest.Mock).mockResolvedValue(null);

    await PATCH(
      createPatchRequest({ title: 'Test' }),
      createParams('custom-course', 'ch-99')
    );

    expect(db.course.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'custom-course',
        userId: 'user-42',
      },
    });
  });

  it('updates the chapter using the correct chapterId and courseId', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'my-course',
      userId: 'owner-1',
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'my-chapter' });

    await PATCH(
      createPatchRequest({ title: 'T' }),
      createParams('my-course', 'my-chapter')
    );

    expect(db.chapter.update).toHaveBeenCalledWith({
      where: { id: 'my-chapter', courseId: 'my-course' },
      data: expect.any(Object),
    });
  });

  it('handles isPublished separately from the spread values', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'chapter-1' });

    await PATCH(
      createPatchRequest({ isPublished: false }),
      createParams()
    );

    const updateCall = (db.chapter.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.isPublished).toBe(false);
  });

  it('returns 503 on database connection errors', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockRejectedValue(
      new Error('Could not connect to database')
    );

    const res = await PATCH(
      createPatchRequest({ title: 'Fail' }),
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(503);
    expect(text).toBe('Database connection error');
  });

  it('returns 503 on database timeout errors', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockRejectedValue(
      new Error('Query timeout exceeded')
    );

    const res = await PATCH(
      createPatchRequest({ title: 'Timeout' }),
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(503);
    expect(text).toBe('Database connection error');
  });

  it('returns 401 on authentication-related errors', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockRejectedValue(
      new Error('unauthorized access detected')
    );

    const res = await PATCH(
      createPatchRequest({ title: 'AuthErr' }),
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(401);
    expect(text).toBe('Authentication error');
  });

  it('returns 500 on generic unexpected errors', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockRejectedValue(
      new Error('Something went wrong')
    );

    const res = await PATCH(
      createPatchRequest({ title: 'Generic Err' }),
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(500);
    expect(text).toBe('Internal Error');
  });

  it('returns 500 on non-Error thrown values', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockRejectedValue('string error');

    const res = await PATCH(
      createPatchRequest({ title: 'StrErr' }),
      createParams()
    );
    const text = await res.text();

    expect(res.status).toBe(500);
    expect(text).toBe('Internal Error');
  });

  it('handles updating with an empty body (no fields to update)', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
    (db.course.findFirst as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'owner-1',
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'chapter-1' });

    const res = await PATCH(
      createPatchRequest({}),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.metadata.fieldsUpdated).toEqual([]);
  });
});
