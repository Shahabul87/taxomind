/**
 * Tests for Course Progress Analytics Route - app/api/dashboard/analytics/course-progress/route.ts
 */

import { GET } from '@/app/api/dashboard/analytics/course-progress/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

for (const model of ['enrollment', 'user_progress', 'dashboardStudySession', 'userExamAttempt']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = { findMany: jest.fn() };
  } else {
    const m = (db as Record<string, any>)[model];
    if (!m.findMany) m.findMany = jest.fn();
  }
}

const mockEnrollment = (db as Record<string, any>).enrollment;
const mockUserProgress = (db as Record<string, any>).user_progress;
const mockSessions = (db as Record<string, any>).dashboardStudySession;
const mockExamAttempts = (db as Record<string, any>).userExamAttempt;

function req(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/analytics/course-progress${query ? `?${query}` : ''}`);
}

describe('Course progress analytics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockEnrollment.findMany.mockResolvedValue([
      {
        courseId: 'c1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        Course: {
          id: 'c1',
          title: 'Course 1',
          imageUrl: null,
          chapters: [{ sections: [{ id: 's1' }, { id: 's2' }] }],
        },
      },
    ]);

    mockUserProgress.findMany
      .mockResolvedValueOnce([
        {
          isCompleted: true,
          sectionId: 's1',
          updatedAt: new Date(),
          createdAt: new Date(),
          Section: { chapter: { courseId: 'c1' } },
        },
      ])
      .mockResolvedValueOnce([
        {
          isCompleted: true,
          createdAt: new Date(),
          Section: { chapter: { courseId: 'c1' } },
        },
      ]);

    mockSessions.findMany.mockResolvedValue([
      {
        courseId: 'c1',
        duration: 45,
        actualStartTime: null,
        actualEndTime: null,
        startTime: new Date(),
      },
    ]);

    mockExamAttempts.findMany.mockResolvedValue([
      { submittedAt: new Date(), scorePercentage: 80 },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid query params', async () => {
    const res = await GET(req('limit=0'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('INVALID_PARAMS');
  });

  it('returns course progress analytics', async () => {
    const res = await GET(req('limit=5&courseId=c1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.courses).toHaveLength(1);
    expect(body.data.summary.totalCourses).toBe(1);
  });
});
