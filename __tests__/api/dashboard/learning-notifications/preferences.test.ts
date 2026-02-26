/**
 * Tests for Learning Notification Preferences Route - app/api/dashboard/learning-notifications/preferences/route.ts
 */

import { GET, PATCH, DELETE } from '@/app/api/dashboard/learning-notifications/preferences/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).learningNotificationPreference) {
  (db as Record<string, unknown>).learningNotificationPreference = {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).learningNotificationPreference;
  if (!model.findUnique) model.findUnique = jest.fn();
  if (!model.create) model.create = jest.fn();
  if (!model.upsert) model.upsert = jest.fn();
  if (!model.deleteMany) model.deleteMany = jest.fn();
}

const mockPreferences = (db as Record<string, any>).learningNotificationPreference;

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/learning-notifications/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Learning notification preferences route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockPreferences.findUnique.mockResolvedValue({
      userId: 'user-1',
      enabled: true,
      timezone: 'UTC',
      remindersBefore: 15,
    });
    mockPreferences.create.mockResolvedValue({
      userId: 'user-1',
      enabled: true,
      timezone: 'UTC',
      remindersBefore: 15,
      digestTime: '08:00',
      weeklyDigestDay: 1,
    });
    mockPreferences.upsert.mockResolvedValue({
      userId: 'user-1',
      enabled: false,
      timezone: 'Asia/Dhaka',
    });
    mockPreferences.deleteMany.mockResolvedValue({ count: 1 });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET creates defaults when preferences are missing', async () => {
    mockPreferences.findUnique.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPreferences.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          enabled: true,
        }),
      })
    );
  });

  it('PATCH returns 400 when quiet hours are incomplete', async () => {
    const res = await PATCH(patchReq({ quietHoursStart: '22:00' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH upserts valid preferences', async () => {
    const payload = {
      enabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00',
      timezone: 'Asia/Dhaka',
      remindersBefore: 20,
      channelPreferences: { REMINDER: ['IN_APP'] },
    };

    const res = await PATCH(patchReq(payload));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPreferences.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
      })
    );
  });

  it('DELETE resets preferences to defaults', async () => {
    const res = await DELETE();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.metadata.reset).toBe(true);
    expect(mockPreferences.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(mockPreferences.create).toHaveBeenCalled();
  });

  it('PATCH returns 500 on unexpected db errors', async () => {
    mockPreferences.upsert.mockRejectedValue(new Error('db fail'));

    const res = await PATCH(patchReq({ enabled: false }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

