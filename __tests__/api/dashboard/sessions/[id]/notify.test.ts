/**
 * Tests for Session Notify Route - app/api/dashboard/sessions/[id]/notify/route.ts
 */

import { POST } from '@/app/api/dashboard/sessions/[id]/notify/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardStudySession) {
  (db as Record<string, unknown>).dashboardStudySession = {
    findFirst: jest.fn(),
    update: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardStudySession;
  if (!model.findFirst) model.findFirst = jest.fn();
  if (!model.update) model.update = jest.fn();
}

const mockSession = (db as Record<string, any>).dashboardStudySession;
const params = { params: Promise.resolve({ id: 's1' }) };

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/sessions/s1/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Session notify route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockSession.findFirst.mockResolvedValue({
      id: 's1',
      userId: 'user-1',
      title: 'Session',
      startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      notificationSentAt: new Date(),
    });
    mockSession.update.mockResolvedValue({
      id: 's1',
      title: 'Session',
      startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      notifyEnabled: true,
      notifyMinutesBefore: 10,
      notificationSentAt: null,
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(postReq({ enabled: true }), params);
    expect(res.status).toBe(401);
  });

  it('returns 404 when session is not found', async () => {
    mockSession.findFirst.mockResolvedValue(null);

    const res = await POST(postReq({ enabled: true }), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ enabled: true, minutesBefore: 1 }), params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when enabling notifications for past sessions', async () => {
    mockSession.findFirst.mockResolvedValue({
      id: 's1',
      userId: 'user-1',
      title: 'Past',
      startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      notificationSentAt: null,
    });

    const res = await POST(postReq({ enabled: true, minutesBefore: 15 }), params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('enables notifications for future sessions', async () => {
    const res = await POST(postReq({ enabled: true, minutesBefore: 10 }), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('10 minutes');
    expect(mockSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({
          notifyEnabled: true,
          notifyMinutesBefore: 10,
          notificationSentAt: null,
        }),
      })
    );
  });

  it('disables notifications', async () => {
    const res = await POST(postReq({ enabled: false }), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('disabled');
  });
});

