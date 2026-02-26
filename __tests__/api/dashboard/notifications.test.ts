/**
 * Tests for Dashboard Notifications Route - app/api/dashboard/notifications/route.ts
 */

import { GET, POST } from '@/app/api/dashboard/notifications/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardNotification) {
  (db as Record<string, unknown>).dashboardNotification = {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardNotification;
  if (!model.count) model.count = jest.fn();
  if (!model.findMany) model.findMany = jest.fn();
  if (!model.create) model.create = jest.fn();
}

const mockNotification = (db as Record<string, any>).dashboardNotification;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/notifications${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Dashboard notifications route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockNotification.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(6);
    mockNotification.findMany.mockResolvedValue([
      { id: 'n1', userId: 'user-1', category: 'DONE', read: false },
    ]);
    mockNotification.create.mockResolvedValue({
      id: 'n2',
      userId: 'user-1',
      type: 'IN_APP',
      category: 'UPCOMING',
      title: 'Reminder',
    });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns notifications, pagination, and category counts', async () => {
    const res = await GET(getReq('page=2&limit=5&category=DONE&read=false&timeRange=7d'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagination).toEqual({ page: 2, limit: 5, total: 12 });
    expect(body.metadata.counts).toEqual({
      done: 2,
      missed: 3,
      upcoming: 4,
      achievements: 5,
      unread: 6,
    });
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ type: 'NOPE', category: 'DONE', title: '' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates notification for authenticated user', async () => {
    const res = await POST(postReq({
      type: 'IN_APP',
      category: 'UPCOMING',
      title: 'Reminder',
      actionable: true,
      actionUrl: '/dashboard',
      actionLabel: 'Open',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'IN_APP',
          category: 'UPCOMING',
        }),
      })
    );
  });

  it('GET returns 500 on unexpected errors', async () => {
    mockNotification.count.mockReset();
    mockNotification.count.mockRejectedValue(new Error('db fail'));

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

