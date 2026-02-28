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
import { POST } from '@/app/api/teacher/courses/bulk-delete/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logBulkCourseOperation } from '@/lib/audit/course-audit';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;
const mockLogBulkCourseOperation = logBulkCourseOperation as jest.Mock;

const COURSE_1 = '11111111-1111-1111-1111-111111111111';
const COURSE_2 = '22222222-2222-2222-2222-222222222222';

function postRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/teacher/courses/bulk-delete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/teacher/courses/bulk-delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, 'crypto', {
      value: { randomUUID: jest.fn(() => 'req-1') },
      configurable: true,
    });
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    mockDb.course = {
      findMany: jest.fn(),
    };
    mockDb.$transaction = jest.fn();
    mockLogBulkCourseOperation.mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await POST(
      postRequest({
        courseIds: [COURSE_1],
        confirmDelete: true,
      })
    );

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid payload', async () => {
    const res = await POST(
      postRequest({
        courseIds: ['not-a-uuid'],
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 404 when some course ids are missing', async () => {
    mockDb.course.findMany.mockResolvedValueOnce([
      { id: COURSE_1, userId: 'teacher-1', title: 'A' },
    ]);

    const res = await POST(
      postRequest({
        courseIds: [COURSE_1, COURSE_2],
        confirmDelete: true,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.metadata.missingIds).toEqual([COURSE_2]);
  });

  it('returns 403 when user attempts deleting someone else courses', async () => {
    mockDb.course.findMany.mockResolvedValueOnce([
      { id: COURSE_1, userId: 'teacher-1', title: 'A' },
      { id: COURSE_2, userId: 'teacher-2', title: 'B' },
    ]);

    const res = await POST(
      postRequest({
        courseIds: [COURSE_1, COURSE_2],
        confirmDelete: true,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('You can only delete your own courses');
  });

  it('deletes courses in a transaction and logs audit', async () => {
    mockDb.course.findMany.mockResolvedValueOnce([
      { id: COURSE_1, userId: 'teacher-1', title: 'A' },
      { id: COURSE_2, userId: 'teacher-1', title: 'B' },
    ]);

    const tx = {
      chapter: { deleteMany: jest.fn().mockResolvedValue({ count: 4 }) },
      purchase: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      enrollment: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      course: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    mockDb.$transaction.mockImplementationOnce(async (fn: (arg: unknown) => unknown) => fn(tx));

    const res = await POST(
      postRequest({
        courseIds: [COURSE_1, COURSE_2],
        confirmDelete: true,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deletedCount).toBe(2);
    expect(tx.chapter.deleteMany).toHaveBeenCalledWith({
      where: { courseId: { in: [COURSE_1, COURSE_2] } },
    });
    expect(tx.course.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: [COURSE_1, COURSE_2] },
        userId: 'teacher-1',
      },
    });
    expect(mockLogBulkCourseOperation).toHaveBeenCalledWith(
      'DELETE',
      [COURSE_1, COURSE_2],
      expect.objectContaining({ userId: 'teacher-1' })
    );
  });

  it('returns 500 when transaction fails', async () => {
    mockDb.course.findMany.mockResolvedValueOnce([
      { id: COURSE_1, userId: 'teacher-1', title: 'A' },
    ]);
    mockDb.$transaction.mockRejectedValueOnce(new Error('tx failed'));

    const res = await POST(
      postRequest({
        courseIds: [COURSE_1],
        confirmDelete: true,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('An error occurred during bulk deletion');
  });
});
