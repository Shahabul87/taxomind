jest.mock('@prisma/client', () => ({
  LearningAlertType: {
    REMINDER: 'REMINDER',
    DEADLINE: 'DEADLINE',
    STREAK_WARNING: 'STREAK_WARNING',
    STREAK_ACHIEVEMENT: 'STREAK_ACHIEVEMENT',
    GOAL_PROGRESS: 'GOAL_PROGRESS',
    GOAL_COMPLETED: 'GOAL_COMPLETED',
    WEEKLY_SUMMARY: 'WEEKLY_SUMMARY',
    STUDY_SUGGESTION: 'STUDY_SUGGESTION',
    BREAK_REMINDER: 'BREAK_REMINDER',
  },
  AlertChannel: {
    IN_APP: 'IN_APP',
    EMAIL: 'EMAIL',
    PUSH: 'PUSH',
    SMS: 'SMS',
  },
}));

import { GET, POST, PATCH } from '@/app/api/v2/dashboard/notifications/route';
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

const learningNotification = ensureModel('learningNotification', [
  'count',
  'findMany',
  'groupBy',
  'create',
  'updateMany',
]);
const dashboardNotification = ensureModel('dashboardNotification', ['findMany']);
const preferences = ensureModel('learningNotificationPreference', ['findUnique']);

function getReq(query = '') {
  return new NextRequest(
    `http://localhost:3000/api/v2/dashboard/notifications${query ? `?${query}` : ''}`
  );
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/v2/dashboard/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/v2/dashboard/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('v2 notifications route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    learningNotification.count.mockResolvedValue(0);
    learningNotification.findMany.mockResolvedValue([]);
    learningNotification.groupBy.mockResolvedValue([]);
    learningNotification.create.mockResolvedValue({
      id: 'ln-created',
      userId: 'user-1',
      type: 'REMINDER',
      title: 'Reminder',
      message: 'Study now',
      read: false,
      dismissed: false,
      createdAt: new Date('2026-02-22T10:00:00.000Z'),
    });
    learningNotification.updateMany.mockResolvedValue({ count: 2 });
    dashboardNotification.findMany.mockResolvedValue([]);
    preferences.findUnique.mockResolvedValue(null);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns notifications with metadata and optional legacy items', async () => {
    learningNotification.count
      .mockResolvedValueOnce(3) // pagination total
      .mockResolvedValueOnce(1); // unread
    learningNotification.findMany.mockResolvedValueOnce([
      {
        id: 'ln-1',
        type: 'REMINDER',
        title: 'Practice',
        message: 'Practice now',
        icon: null,
        color: null,
        read: false,
        dismissed: false,
        createdAt: new Date('2026-02-22T10:00:00.000Z'),
        actionUrl: '/dashboard',
        actionLabel: 'Open',
        metadata: { a: 1 },
        activityId: null,
        goalId: null,
        courseId: 'course-1',
      },
    ]);
    learningNotification.groupBy.mockResolvedValueOnce([
      { type: 'REMINDER', _count: 2 },
      { type: 'DEADLINE', _count: 1 },
    ]);
    dashboardNotification.findMany.mockResolvedValueOnce([
      {
        id: 'dn-1',
        category: 'REMINDER',
        title: 'Legacy',
        description: 'legacy desc',
        read: true,
        createdAt: new Date('2026-02-21T10:00:00.000Z'),
        actionUrl: '/legacy',
        actionLabel: 'View',
        metadata: null,
      },
    ]);

    const res = await GET(
      getReq('type=REMINDER&read=false&page=2&limit=1&includeLegacy=true&timeRange=7d')
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].source).toBe('learning');
    expect(body.data[1].source).toBe('dashboard');
    expect(body.metadata.pagination).toEqual({
      total: 3,
      limit: 1,
      offset: 1,
      page: 2,
      hasMore: true,
    });
    expect(body.metadata.counts.unread).toBe(1);
    expect(body.metadata.counts.byType.REMINDER).toBe(2);
    expect(dashboardNotification.findMany).toHaveBeenCalled();
  });

  it('GET returns 400 for invalid query input', async () => {
    const res = await GET(getReq('type=NOT_A_REAL_TYPE'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid query parameters');
  });

  it('POST skips notification creation when preferences disable notifications', async () => {
    preferences.findUnique.mockResolvedValue({ userId: 'user-1', enabled: false });

    const res = await POST(postReq({
      type: 'REMINDER',
      title: 'Study',
      message: 'Study now',
      channels: ['IN_APP'],
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.metadata.skipped).toBe(true);
    expect(learningNotification.create).not.toHaveBeenCalled();
  });

  it('POST creates a learning notification when enabled', async () => {
    const res = await POST(postReq({
      type: 'REMINDER',
      title: 'Study',
      message: 'Study now',
      channels: ['IN_APP'],
      actionUrl: '/dashboard',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(learningNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'REMINDER',
          deliveryStatus: 'pending',
        }),
      })
    );
  });

  it('PATCH marks notifications as read', async () => {
    const res = await PATCH(patchReq({ notificationIds: ['ln-1', 'ln-2'] }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.updatedCount).toBe(2);
    expect(learningNotification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          id: { in: ['ln-1', 'ln-2'] },
        }),
      })
    );
  });

  it('PATCH returns 400 for invalid payload', async () => {
    const res = await PATCH(patchReq({ notificationIds: [] }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid input');
  });

  it('GET returns 500 on unexpected errors', async () => {
    learningNotification.count.mockRejectedValueOnce(new Error('db fail'));

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch notifications');
  });
});
