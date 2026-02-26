/**
 * Tests for SAM Insights Analytics Route - app/api/dashboard/analytics/sam-insights/route.ts
 */

import { GET } from '@/app/api/dashboard/analytics/sam-insights/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

for (const model of ['enrollment', 'dashboardStudySession', 'user_progress', 'dashboardGoal', 'userExamAttempt', 'study_streaks']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = { findMany: jest.fn(), findFirst: jest.fn() };
  } else {
    const m = (db as Record<string, any>)[model];
    if (!m.findMany) m.findMany = jest.fn();
    if (!m.findFirst) m.findFirst = jest.fn();
  }
}

const mockEnrollment = (db as Record<string, any>).enrollment;
const mockSessions = (db as Record<string, any>).dashboardStudySession;
const mockProgress = (db as Record<string, any>).user_progress;
const mockGoals = (db as Record<string, any>).dashboardGoal;
const mockAttempts = (db as Record<string, any>).userExamAttempt;
const mockStreaks = (db as Record<string, any>).study_streaks;

function req() {
  return new NextRequest('http://localhost:3000/api/dashboard/analytics/sam-insights');
}

describe('SAM insights analytics route', () => {
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
          chapters: [{ sections: [{ id: 's1', title: 'Section 1' }] }],
        },
      },
    ]);
    mockSessions.findMany.mockResolvedValue([
      {
        startTime: new Date(),
        duration: 60,
        actualStartTime: null,
        actualEndTime: null,
        courseId: 'c1',
      },
    ]);
    mockProgress.findMany.mockResolvedValue([
      {
        isCompleted: true,
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        Section: { chapter: { courseId: 'c1', course: { id: 'c1', title: 'Course 1' } } },
      },
    ]);
    mockGoals.findMany.mockResolvedValue([]);
    mockAttempts.findMany.mockResolvedValue([{ scorePercentage: 75, submittedAt: new Date() }]);
    mockStreaks.findFirst.mockResolvedValue({ currentStreak: 4, lastStudyDate: new Date() });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns SAM insights payload', async () => {
    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.patterns)).toBe(true);
    expect(Array.isArray(body.data.insights)).toBe(true);
  });
});

