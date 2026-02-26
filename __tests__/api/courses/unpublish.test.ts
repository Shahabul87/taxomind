/**
 * Tests for Unpublish Course Route - app/api/courses/[courseId]/unpublish/route.ts
 */

import { PATCH } from '@/app/api/courses/[courseId]/unpublish/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

function props(courseId = 'course-1') {
  return { params: Promise.resolve({ courseId }) };
}

describe('PATCH /api/courses/[courseId]/unpublish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'course-1', userId: 'user-1' });
    (db.course.update as jest.Mock).mockResolvedValue({ id: 'course-1', isPublished: false });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PATCH(new Request('http://localhost', { method: 'PATCH' }), props());
    expect(res.status).toBe(401);
  });

  it('returns 404 when course is not found', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(new Request('http://localhost', { method: 'PATCH' }), props());
    expect(res.status).toBe(404);
  });

  it('unpublishes course successfully', async () => {
    const res = await PATCH(new Request('http://localhost', { method: 'PATCH' }), props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isPublished).toBe(false);
    expect(db.course.update).toHaveBeenCalledWith({
      where: { id: 'course-1', userId: 'user-1' },
      data: { isPublished: false },
    });
  });
});
