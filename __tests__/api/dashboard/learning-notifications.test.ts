/**
 * Tests for Dashboard Learning Notifications Route - app/api/dashboard/learning-notifications/route.ts
 */

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

import { GET, POST } from '@/app/api/dashboard/learning-notifications/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).learningNotification) {
  (db as Record<string, unknown>).learningNotification = {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
    create: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).learningNotification;
  if (!model.count) model.count = jest.fn();
  if (!model.findMany) model.findMany = jest.fn();
  if (!model.groupBy) model.groupBy = jest.fn();
  if (!model.create) model.create = jest.fn();
}
if (!(db as Record<string, unknown>).learningNotificationPreference) {
  (db as Record<string, unknown>).learningNotificationPreference = {
    findUnique: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).learningNotificationPreference;
  if (!model.findUnique) model.findUnique = jest.fn();
}

const mockLearningNotification = (db as Record<string, any>).learningNotification;
const mockPreferences = (db as Record<string, any>).learningNotificationPreference;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/learning-notifications${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/learning-notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Dashboard learning notifications route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockLearningNotification.count
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2);
    mockLearningNotification.findMany.mockResolvedValue([
      { id: 'ln-1', userId: 'user-1', type: 'REMINDER', read: false },
    ]);
    mockLearningNotification.groupBy.mockResolvedValue([
      { type: 'REMINDER', _count: 5 },
      { type: 'DEADLINE', _count: 3 },
    ]);
    mockLearningNotification.create.mockResolvedValue({
      id: 'ln-2',
      userId: 'user-1',
      type: 'REMINDER',
      title: 'Study now',
      channels: ['IN_APP'],
    });

    mockPreferences.findUnique.mockResolvedValue(null);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns paginated notifications with counts', async () => {
    const res = await GET(getReq('page=1&limit=5&type=REMINDER&timeRange=7d&read=false'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagination).toEqual({ page: 1, limit: 5, total: 8 });
    expect(body.metadata.counts.total).toBe(8);
    expect(body.metadata.counts.unread).toBe(2);
    expect(body.metadata.counts.byType.REMINDER).toBe(5);
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ type: 'INVALID', title: '', message: '' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST skips creation when notifications are disabled', async () => {
    mockPreferences.findUnique.mockResolvedValue({
      userId: 'user-1',
      enabled: false,
    });

    const res = await POST(postReq({
      type: 'REMINDER',
      title: 'Study now',
      message: 'Quick reminder',
      channels: ['IN_APP'],
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.metadata.skipped).toBe(true);
    expect(mockLearningNotification.create).not.toHaveBeenCalled();
  });

  it('POST creates a learning notification', async () => {
    const res = await POST(postReq({
      type: 'REMINDER',
      title: 'Study now',
      message: 'Quick reminder',
      channels: ['IN_APP'],
      actionUrl: '/dashboard',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockLearningNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'REMINDER',
          title: 'Study now',
          deliveryStatus: 'pending',
        }),
      })
    );
  });

  it('GET returns 500 on unexpected errors', async () => {
    mockLearningNotification.count.mockReset();
    mockLearningNotification.count.mockRejectedValue(new Error('db fail'));

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
