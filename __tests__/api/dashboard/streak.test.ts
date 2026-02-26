/**
 * Tests for Dashboard Streak Route - app/api/dashboard/streak/route.ts
 */

import { GET, PATCH } from '@/app/api/dashboard/streak/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).learningStreak) {
  (db as Record<string, unknown>).learningStreak = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
}
if (!(db as Record<string, unknown>).dailyLearningLog) {
  (db as Record<string, unknown>).dailyLearningLog = { findMany: jest.fn() };
}

const mockLearningStreak = (db as Record<string, any>).learningStreak;
const mockDailyLearningLog = (db as Record<string, any>).dailyLearningLog;

function getReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/streak');
}

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/streak', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const baseStreak = {
  userId: 'user-1',
  currentStreak: 5,
  longestStreak: 10,
  streakStartDate: new Date('2026-01-01T00:00:00.000Z'),
  lastActiveDate: new Date(),
  freezesAvailable: 2,
  freezesUsed: 0,
  lastFreezeDate: null,
  weeklyGoalMinutes: 420,
  totalActiveDays: 50,
  totalMinutesAllTime: 3000,
  averageDailyMinutes: 60,
};

describe('Dashboard streak route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockLearningStreak.findUnique.mockResolvedValue({ ...baseStreak });
    mockLearningStreak.create.mockResolvedValue({ ...baseStreak, currentStreak: 0, longestStreak: 0 });
    mockLearningStreak.update.mockResolvedValue({ ...baseStreak, weeklyGoalMinutes: 600 });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns streak summary and activity calendar', async () => {
    mockDailyLearningLog.findMany
      .mockResolvedValueOnce([
        { actualMinutes: 30, date: new Date() },
        { actualMinutes: 60, date: new Date() },
      ])
      .mockResolvedValueOnce([
        { actualMinutes: 30, date: new Date() },
        { actualMinutes: 60, date: new Date() },
      ]);

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.streak.status).toBe('active');
    expect(body.data.weeklyProgress.completedMinutes).toBe(90);
    expect(body.data.activityCalendar.length).toBeGreaterThan(0);
  });

  it('GET creates a streak row when missing', async () => {
    mockLearningStreak.findUnique.mockResolvedValue(null);
    mockDailyLearningLog.findMany.mockResolvedValue([]);

    const res = await GET(getReq());

    expect(res.status).toBe(200);
    expect(mockLearningStreak.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1' }),
      })
    );
  });

  it('PATCH returns 400 when no freezes are available', async () => {
    mockLearningStreak.findUnique.mockResolvedValue({
      ...baseStreak,
      freezesAvailable: 0,
      lastActiveDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    const res = await PATCH(patchReq({ useFreeze: true }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH updates weekly goal minutes', async () => {
    const res = await PATCH(patchReq({ updateWeeklyGoal: 600 }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockLearningStreak.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { weeklyGoalMinutes: 600 },
    });
  });

  it('PATCH returns 400 for invalid payload', async () => {
    const res = await PATCH(patchReq({ updateWeeklyGoal: 10 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

