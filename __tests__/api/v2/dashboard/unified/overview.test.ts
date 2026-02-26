const mockGoalStore = {
  getByUser: jest.fn(),
};

jest.mock('@/lib/sam/taxomind-context', () => ({
  getStore: jest.fn(() => mockGoalStore),
}));

import { GET } from '@/app/api/v2/dashboard/unified/overview/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const learningNotification = ensureModel('learningNotification', ['count', 'findMany']);
const dashboardNotification = ensureModel('dashboardNotification', ['count']);
const learningStreak = ensureModel('learningStreak', ['findUnique']);
const learningActivity = ensureModel('learningActivity', ['count', 'aggregate']);
const enrollment = ensureModel('enrollment', ['findMany']);
const dashboardTodo = ensureModel('dashboardTodo', ['count']);

function req() {
  return new NextRequest('http://localhost:3000/api/v2/dashboard/unified/overview');
}

describe('GET /api/v2/dashboard/unified/overview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    mockGoalStore.getByUser.mockResolvedValue([
      { id: 'g1', title: 'Goal 1', status: 'active', priority: 'high', progress: 50, targetDate: null },
      { id: 'g2', title: 'Goal 2', status: 'completed', priority: 'medium', progress: 100, targetDate: null },
      { id: 'g3', title: 'Goal 3', status: 'active', priority: 'low', progress: 20, targetDate: null },
    ]);

    learningNotification.count.mockResolvedValue(2);
    learningNotification.findMany.mockResolvedValue([
      {
        id: 'ln-1',
        type: 'REMINDER',
        title: 'Keep going',
        message: 'study',
        read: false,
        createdAt: new Date('2026-02-20T00:00:00.000Z'),
        actionUrl: '/dashboard',
      },
    ]);
    dashboardNotification.count.mockResolvedValue(1);

    learningStreak.findUnique.mockResolvedValue({
      currentStreak: 6,
      longestStreak: 14,
      lastActiveDate: new Date('2026-02-22T00:00:00.000Z'),
    });

    learningActivity.count.mockResolvedValue(9);
    learningActivity.aggregate.mockResolvedValue({
      _sum: { actualDuration: 120, estimatedDuration: 300 },
    });

    enrollment.findMany.mockResolvedValue([
      { Course: { title: 'Course 1', chapters: [] }, updatedAt: new Date() },
      { Course: { title: 'Course 2', chapters: [] }, updatedAt: new Date() },
    ]);

    dashboardTodo.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns unified dashboard overview data', async () => {
    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.goals.total).toBe(3);
    expect(body.data.goals.byStatus.active).toBe(2);
    expect(body.data.notifications).toMatchObject({
      unreadCount: 3,
      learningUnread: 2,
      dashboardUnread: 1,
    });
    expect(body.data.streak).toMatchObject({
      currentStreak: 6,
      longestStreak: 14,
    });
    expect(body.data.activity.last7Days).toEqual({
      activitiesCount: 9,
      studyMinutes: 120,
    });
    expect(body.data.todos).toEqual({
      pending: 4,
      completedToday: 1,
      overdue: 2,
    });
  });

  it('returns safe fallback data when helper fetches fail', async () => {
    mockGoalStore.getByUser.mockRejectedValueOnce(new Error('goal store fail'));
    learningNotification.count.mockRejectedValueOnce(new Error('notification fail'));
    learningStreak.findUnique.mockRejectedValueOnce(new Error('streak fail'));
    learningActivity.count.mockRejectedValueOnce(new Error('activity fail'));
    dashboardTodo.count.mockReset();
    dashboardTodo.count.mockRejectedValueOnce(new Error('todo fail'));

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.goals.total).toBe(0);
    expect(body.data.notifications.unreadCount).toBe(0);
    expect(body.data.streak.currentStreak).toBe(0);
    expect(body.data.activity.last7Days.activitiesCount).toBe(0);
    expect(body.data.todos.pending).toBe(0);
  });

  it('returns 500 when top-level execution fails', async () => {
    mockAuth.mockRejectedValueOnce(new Error('auth fail'));

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch dashboard overview');
  });
});
