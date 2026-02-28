jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/lib/audit/course-audit', () => ({
  logBulkCourseOperation: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/teacher/courses/bulk-update/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logBulkCourseOperation } from '@/lib/audit/course-audit';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;
const mockLogBulkCourseOperation = logBulkCourseOperation as jest.Mock;

const COURSE_1 = '11111111-1111-1111-1111-111111111111';
const COURSE_2 = '22222222-2222-2222-2222-222222222222';

function patchRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/teacher/courses/bulk-update', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/teacher/courses/bulk-update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, 'crypto', {
      value: { randomUUID: jest.fn(() => 'req-1') },
      configurable: true,
    });
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    mockDb.course = {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    };
    mockLogBulkCourseOperation.mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await PATCH(
      patchRequest({
        courseIds: [COURSE_1],
        isPublished: true,
      })
    );

    expect(res.status).toBe(401);
  });

  it('returns 400 when payload fails validation', async () => {
    const res = await PATCH(
      patchRequest({
        courseIds: ['not-a-uuid'],
        isPublished: true,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 404 when some courses are missing', async () => {
    mockDb.course.findMany.mockResolvedValueOnce([
      { id: COURSE_1, userId: 'teacher-1', title: 'Course A', isPublished: false },
    ]);

    const res = await PATCH(
      patchRequest({
        courseIds: [COURSE_1, COURSE_2],
        isPublished: true,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.metadata.missingIds).toEqual([COURSE_2]);
  });

  it('returns 403 when user does not own all courses', async () => {
    mockDb.course.findMany.mockResolvedValueOnce([
      { id: COURSE_1, userId: 'teacher-1', title: 'Course A', isPublished: false },
      { id: COURSE_2, userId: 'teacher-2', title: 'Course B', isPublished: false },
    ]);

    const res = await PATCH(
      patchRequest({
        courseIds: [COURSE_1, COURSE_2],
        isPublished: true,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('You can only update your own courses');
  });

  it('updates courses and writes an audit entry', async () => {
    mockDb.course.findMany.mockResolvedValueOnce([
      { id: COURSE_1, userId: 'teacher-1', title: 'Course A', isPublished: false },
      { id: COURSE_2, userId: 'teacher-1', title: 'Course B', isPublished: false },
    ]);
    mockDb.course.updateMany.mockResolvedValueOnce({ count: 2 });

    const res = await PATCH(
      patchRequest({
        courseIds: [COURSE_1, COURSE_2],
        isPublished: true,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.updatedCount).toBe(2);
    expect(mockDb.course.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: [COURSE_1, COURSE_2] },
        userId: 'teacher-1',
      },
      data: {
        isPublished: true,
        updatedAt: expect.any(Date),
      },
    });
    expect(mockLogBulkCourseOperation).toHaveBeenCalledWith(
      'PUBLISH',
      [COURSE_1, COURSE_2],
      expect.objectContaining({ userId: 'teacher-1' })
    );
  });

  it('returns 500 when update throws unexpectedly', async () => {
    mockDb.course.findMany.mockRejectedValueOnce(new Error('db exploded'));

    const res = await PATCH(
      patchRequest({
        courseIds: [COURSE_1],
        isPublished: false,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('An error occurred during bulk update');
  });
});
