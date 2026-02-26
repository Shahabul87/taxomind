/**
 * Tests for Dashboard User Analytics Route - app/api/dashboard/user/analytics/route.ts
 */

import { GET } from '@/app/api/dashboard/user/analytics/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

for (const model of ['learning_metrics', 'performance_metrics', 'learning_sessions', 'study_streaks', 'user_progress', 'user_achievements']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = { findMany: jest.fn() };
  } else {
    const m = (db as Record<string, any>)[model];
    if (!m.findMany) m.findMany = jest.fn();
  }
}

const mockLearningMetrics = (db as Record<string, any>).learning_metrics;
const mockPerformanceMetrics = (db as Record<string, any>).performance_metrics;
const mockSessions = (db as Record<string, any>).learning_sessions;
const mockStreaks = (db as Record<string, any>).study_streaks;
const mockProgress = (db as Record<string, any>).user_progress;
const mockAchievements = (db as Record<string, any>).user_achievements;

function req(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/user/analytics${query ? `?${query}` : ''}`);
}

describe('Dashboard user analytics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockLearningMetrics.findMany.mockResolvedValue([
      { averageEngagementScore: 80, riskScore: 20, Course: { title: 'Course 1' } },
    ]);
    mockPerformanceMetrics.findMany.mockResolvedValue([
      {
        date: new Date(),
        learningVelocity: 40,
        engagementTrend: 'STABLE',
        performanceTrend: 'STABLE',
      },
    ]);
    mockSessions.findMany.mockResolvedValue([{ duration: 60, startTime: new Date() }]);
    mockStreaks.findMany.mockResolvedValue([{ currentStreak: 5, lastStudyDate: new Date() }]);
    mockProgress.findMany.mockResolvedValue([{ progressPercent: 60, courseId: 'c1' }]);
    mockAchievements.findMany.mockResolvedValue([{ id: 'ach1' }]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns analytics summary', async () => {
    const res = await GET(req('period=DAILY'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.summary.currentStreak).toBe(5);
    expect(Array.isArray(body.learning_metrics)).toBe(true);
    expect(Array.isArray(body.achievements)).toBe(true);
  });
});

