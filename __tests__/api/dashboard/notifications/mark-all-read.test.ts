/**
 * Tests for Dashboard Notifications Mark-All-Read Route - app/api/dashboard/notifications/mark-all-read/route.ts
 */

import { PATCH } from '@/app/api/dashboard/notifications/mark-all-read/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardNotification) {
  (db as Record<string, unknown>).dashboardNotification = {
    updateMany: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardNotification;
  if (!model.updateMany) model.updateMany = jest.fn();
}

const mockNotification = (db as Record<string, any>).dashboardNotification;

function req() {
  return new NextRequest('http://localhost:3000/api/dashboard/notifications/mark-all-read', {
    method: 'PATCH',
  });
}

describe('Dashboard notifications mark-all-read route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockNotification.updateMany.mockResolvedValue({ count: 7 });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PATCH(req());
    expect(res.status).toBe(401);
  });

  it('marks unread notifications as read', async () => {
    const res = await PATCH(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.count).toBe(7);
    expect(mockNotification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
      data: expect.objectContaining({
        read: true,
        readAt: expect.any(Date),
      }),
    });
  });

  it('returns 500 on unexpected db errors', async () => {
    mockNotification.updateMany.mockRejectedValue(new Error('db fail'));

    const res = await PATCH(req());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

