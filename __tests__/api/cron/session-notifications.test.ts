jest.mock('@/lib/api/cron-auth', () => ({
  withCronAuth: jest.fn(),
}));

jest.mock('@/lib/sam/notifications', () => ({
  sendPushToUser: jest.fn(),
  isPushAvailable: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/cron/session-notifications/route';
import { withCronAuth } from '@/lib/api/cron-auth';
import { db } from '@/lib/db';
import { isPushAvailable, sendPushToUser } from '@/lib/sam/notifications';
import { logger } from '@/lib/logger';

const mockWithCronAuth = withCronAuth as jest.Mock;
const mockDb = db as Record<string, any>;
const mockIsPushAvailable = isPushAvailable as jest.Mock;
const mockSendPushToUser = sendPushToUser as jest.Mock;
const mockLogger = logger as unknown as { info: jest.Mock; error: jest.Mock };

describe('/api/cron/session-notifications route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (typeof (globalThis.Response as any).json !== 'function') {
      (globalThis as any).Response = class extends Response {
        static json(body: unknown, init?: ResponseInit) {
          return NextResponse.json(body, init);
        }
      };
    }
    mockWithCronAuth.mockReturnValue(null);
    mockIsPushAvailable.mockReturnValue(true);
    // @/lib/db is globally mapped to __mocks__/db.js; add model needed by this route.
    mockDb.dashboardStudySession = {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };
  });

  it('returns auth response when cron auth blocks', async () => {
    mockWithCronAuth.mockReturnValueOnce(new NextResponse('forbidden', { status: 403 }));

    const req = new NextRequest('http://localhost:3000/api/cron/session-notifications');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('returns not-configured response when push is unavailable', async () => {
    mockIsPushAvailable.mockReturnValue(false);

    const req = new NextRequest('http://localhost:3000/api/cron/session-notifications');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: false,
      message: 'Push notifications not configured',
    });
  });

  it('sends notification and marks session as notified when within notify window', async () => {
    const now = new Date();
    mockDb.dashboardStudySession.findMany.mockResolvedValue([
      {
        id: 'session-1',
        userId: 'user-1',
        courseId: 'course-1',
        title: 'Math Revision',
        startTime: new Date(now.getTime() + 5 * 60 * 1000),
        notifyMinutesBefore: 10,
        user: { id: 'user-1', name: 'Alice' },
        course: { title: 'Math' },
      },
    ]);
    mockSendPushToUser.mockResolvedValue({ success: true });

    const req = new NextRequest('http://localhost:3000/api/cron/session-notifications');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.sent).toBe(1);
    expect(mockSendPushToUser).toHaveBeenCalledTimes(1);
    expect(mockDb.dashboardStudySession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { notificationSentAt: expect.any(Date) },
    });
  });

  it('skips sessions when notification window has not started', async () => {
    const now = new Date();
    mockDb.dashboardStudySession.findMany.mockResolvedValue([
      {
        id: 'session-2',
        userId: 'user-2',
        courseId: 'course-2',
        title: 'Physics Practice',
        startTime: new Date(now.getTime() + 45 * 60 * 1000),
        notifyMinutesBefore: 10,
        user: { id: 'user-2', name: 'Bob' },
        course: { title: 'Physics' },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/cron/session-notifications');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.skipped).toBe(1);
    expect(body.sent).toBe(0);
    expect(mockSendPushToUser).not.toHaveBeenCalled();
  });

  it('returns 500 when top-level job fails', async () => {
    mockDb.dashboardStudySession.findMany.mockRejectedValue(new Error('db failed'));

    const req = new NextRequest('http://localhost:3000/api/cron/session-notifications');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('db failed');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
