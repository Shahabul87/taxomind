/**
 * Tests for Dashboard Notifications Clear-All Route - app/api/dashboard/notifications/clear-all/route.ts
 */

import { DELETE } from '@/app/api/dashboard/notifications/clear-all/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardNotification) {
  (db as Record<string, unknown>).dashboardNotification = {
    deleteMany: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardNotification;
  if (!model.deleteMany) model.deleteMany = jest.fn();
}

const mockNotification = (db as Record<string, any>).dashboardNotification;

function req() {
  return new NextRequest('http://localhost:3000/api/dashboard/notifications/clear-all', {
    method: 'DELETE',
  });
}

describe('Dashboard notifications clear-all route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockNotification.deleteMany.mockResolvedValue({ count: 4 });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await DELETE(req());
    expect(res.status).toBe(401);
  });

  it('deletes read notifications and returns count', async () => {
    const res = await DELETE(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.count).toBe(4);
    expect(mockNotification.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: true },
    });
  });

  it('returns 500 on unexpected db errors', async () => {
    mockNotification.deleteMany.mockRejectedValue(new Error('db fail'));

    const res = await DELETE(req());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

