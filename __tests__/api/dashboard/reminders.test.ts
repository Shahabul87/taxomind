/**
 * Tests for Dashboard Reminders Route - app/api/dashboard/reminders/route.ts
 */

import { GET, POST } from '@/app/api/dashboard/reminders/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardReminder) {
  (db as Record<string, unknown>).dashboardReminder = {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardReminder;
  if (!model.count) model.count = jest.fn();
  if (!model.findMany) model.findMany = jest.fn();
  if (!model.create) model.create = jest.fn();
}

const mockReminder = (db as Record<string, any>).dashboardReminder;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/reminders${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Dashboard reminders route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockReminder.count.mockResolvedValue(3);
    mockReminder.findMany.mockResolvedValue([
      { id: 'r1', userId: 'user-1', title: 'Reminder A' },
    ]);
    mockReminder.create.mockResolvedValue({
      id: 'r2',
      userId: 'user-1',
      title: 'Reminder B',
    });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns paginated reminders', async () => {
    const res = await GET(getReq('page=1&limit=2'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagination).toEqual({ page: 1, limit: 2, total: 3 });
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ title: '', remindAt: 'invalid' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates reminder for authenticated user', async () => {
    const res = await POST(postReq({
      title: 'Reminder B',
      remindAt: '2026-03-01T08:00:00.000Z',
      channels: ['IN_APP'],
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockReminder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Reminder B',
        }),
      })
    );
  });

  it('GET returns 500 on unexpected db errors', async () => {
    mockReminder.count.mockRejectedValue(new Error('db fail'));

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

