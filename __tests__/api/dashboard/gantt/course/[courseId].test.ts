/**
 * Tests for Course Gantt Route - app/api/dashboard/gantt/course/[courseId]/route.ts
 */

import { GET } from '@/app/api/dashboard/gantt/course/[courseId]/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

for (const model of ['enrollment', 'course', 'user_progress']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() };
  } else {
    const m = (db as Record<string, any>)[model];
    if (!m.findFirst) m.findFirst = jest.fn();
    if (!m.findUnique) m.findUnique = jest.fn();
    if (!m.findMany) m.findMany = jest.fn();
  }
}

const mockEnrollment = (db as Record<string, any>).enrollment;
const mockCourse = (db as Record<string, any>).course;
const mockProgress = (db as Record<string, any>).user_progress;

function req(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/gantt/course/c1${query ? `?${query}` : ''}`);
}

const params = { params: Promise.resolve({ courseId: 'c1' }) };

describe('Course gantt route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockEnrollment.findFirst.mockResolvedValue({
      courseId: 'c1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      status: 'ACTIVE',
    });
    mockCourse.findUnique.mockResolvedValue({
      id: 'c1',
      title: 'Course 1',
      chapters: [{ id: 'ch1', title: 'Chapter 1', sections: [{ id: 's1', title: 'Sec 1', description: '' }] }],
    });
    mockProgress.findMany.mockResolvedValue([{ sectionId: 's1', isCompleted: true }]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(req(), params);
    expect(res.status).toBe(401);
  });

  it('returns 403 when not enrolled', async () => {
    mockEnrollment.findFirst.mockResolvedValue(null);
    const res = await GET(req(), params);
    expect(res.status).toBe(403);
  });

  it('returns 404 when course missing', async () => {
    mockCourse.findUnique.mockResolvedValue(null);
    const res = await GET(req(), params);
    expect(res.status).toBe(404);
  });

  it('returns course gantt data', async () => {
    const res = await GET(req('weeks=2'), params);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.course.id).toBe('c1');
  });
});

