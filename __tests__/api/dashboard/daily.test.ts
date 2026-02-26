/**
 * Tests for Dashboard Daily Route - app/api/dashboard/daily/route.ts
 */

import { GET } from '@/app/api/dashboard/daily/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).learningActivity) {
  (db as Record<string, unknown>).learningActivity = { findMany: jest.fn() };
}
if (!(db as Record<string, unknown>).dashboardTodo) {
  (db as Record<string, unknown>).dashboardTodo = { findMany: jest.fn() };
}
if (!(db as Record<string, unknown>).learningGoal) {
  (db as Record<string, unknown>).learningGoal = { findMany: jest.fn() };
}
if (!(db as Record<string, unknown>).dailyLearningLog) {
  (db as Record<string, unknown>).dailyLearningLog = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
}
if (!(db as Record<string, unknown>).learningStreak) {
  (db as Record<string, unknown>).learningStreak = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };
}

const mockLearningActivity = (db as Record<string, any>).learningActivity;
const mockDashboardTodo = (db as Record<string, any>).dashboardTodo;
const mockLearningGoal = (db as Record<string, any>).learningGoal;
const mockDailyLearningLog = (db as Record<string, any>).dailyLearningLog;
const mockLearningStreak = (db as Record<string, any>).learningStreak;

function req(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/daily${query ? `?${query}` : ''}`);
}

describe('Dashboard daily route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Jane Doe' });

    mockLearningActivity.findMany.mockResolvedValue([
      {
        id: 'act-1',
        type: 'STUDY',
        title: 'Read chapter',
        description: 'Read chapter 1',
        startTime: new Date('2026-01-10T09:00:00.000Z'),
        endTime: new Date('2026-01-10T10:00:00.000Z'),
        estimatedDuration: 60,
        actualDuration: 50,
        status: 'COMPLETED',
        progress: 100,
        priority: 'HIGH',
        tags: ['reading'],
        course: { title: 'Math' },
        chapter: { title: 'Intro' },
      },
      {
        id: 'act-2',
        type: 'QUIZ',
        title: 'Quiz',
        description: null,
        startTime: null,
        endTime: null,
        estimatedDuration: 30,
        actualDuration: null,
        status: 'PENDING',
        progress: 0,
        priority: 'MEDIUM',
        tags: [],
        course: null,
        chapter: null,
      },
    ]);

    mockDashboardTodo.findMany.mockResolvedValue([
      { id: 'todo-1', title: 'Task A', completed: false, priority: 'HIGH', dueDate: new Date(), tags: [] },
      { id: 'todo-2', title: 'Task B', completed: true, priority: 'LOW', dueDate: null, tags: [] },
    ]);

    mockLearningGoal.findMany.mockResolvedValue([
      {
        id: 'goal-1',
        title: 'Finish course',
        description: 'Complete in 2 weeks',
        progress: 40,
        status: 'ON_TRACK',
        targetDate: new Date('2026-01-20T00:00:00.000Z'),
        course: { title: 'Math' },
        milestones: [{ id: 'm-1', title: 'Milestone 1', completed: false, targetDate: null }],
      },
    ]);

    mockDailyLearningLog.findUnique.mockResolvedValue({
      id: 'log-1',
      plannedMinutes: 90,
      actualMinutes: 50,
      plannedActivities: 2,
      completedActivities: 1,
      focusScore: 80,
      productivityScore: 76,
    });
    mockDailyLearningLog.findMany.mockResolvedValue([{ actualMinutes: 120 }, { actualMinutes: 60 }]);
    mockDailyLearningLog.create.mockResolvedValue({
      id: 'log-new',
      plannedMinutes: 90,
      actualMinutes: 0,
      plannedActivities: 2,
      completedActivities: 0,
      focusScore: 0,
      productivityScore: 0,
    });

    mockLearningStreak.findUnique.mockResolvedValue({
      currentStreak: 4,
      longestStreak: 12,
      lastActiveDate: new Date('2026-01-09T00:00:00.000Z'),
      freezesAvailable: 1,
      weeklyGoalMinutes: 420,
    });
    mockLearningStreak.create.mockResolvedValue({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      freezesAvailable: 0,
      weeklyGoalMinutes: 420,
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns aggregated daily data', async () => {
    const res = await GET(req('date=2026-01-10'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userName).toBe('Jane');
    expect(body.data.activities).toHaveLength(2);
    expect(body.data.tasks).toHaveLength(2);
    expect(body.data.goals).toHaveLength(1);
    expect(body.data.stats.completionRate).toBe(50);
    expect(body.data.stats.weeklyProgress).toBe(43);
  });

  it('creates missing daily log and streak record', async () => {
    mockDailyLearningLog.findUnique.mockResolvedValue(null);
    mockLearningStreak.findUnique.mockResolvedValue(null);

    const res = await GET(req());

    expect(res.status).toBe(200);
    expect(mockDailyLearningLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          plannedMinutes: 90,
          plannedActivities: 2,
          plannedTasks: 1,
        }),
      })
    );
    expect(mockLearningStreak.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          currentStreak: 0,
        }),
      })
    );
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockLearningActivity.findMany.mockRejectedValue(new Error('db unavailable'));

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

