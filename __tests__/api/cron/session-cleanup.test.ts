jest.mock('@/lib/api/cron-auth', () => ({
  withCronAuth: jest.fn(),
}));

jest.mock('@/lib/auth/session-cleanup', () => ({
  cleanupExpiredSessions: jest.fn(),
  getCleanupStats: jest.fn(),
}));

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/cron/session-cleanup/route';
import { withCronAuth } from '@/lib/api/cron-auth';
import { cleanupExpiredSessions, getCleanupStats } from '@/lib/auth/session-cleanup';

const mockWithCronAuth = withCronAuth as jest.Mock;
const mockCleanupExpiredSessions = cleanupExpiredSessions as jest.Mock;
const mockGetCleanupStats = getCleanupStats as jest.Mock;

describe('/api/cron/session-cleanup route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithCronAuth.mockReturnValue(null);
  });

  it('returns auth response when cron auth blocks', async () => {
    mockWithCronAuth.mockReturnValueOnce(new NextResponse('forbidden', { status: 403 }));

    const req = new NextRequest('http://localhost:3000/api/cron/session-cleanup');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('returns dry-run stats when dry_run=true', async () => {
    mockGetCleanupStats.mockResolvedValue({
      expiredSessions: 5,
      oldLoginAttempts: 11,
    });

    const req = new NextRequest('http://localhost:3000/api/cron/session-cleanup?dry_run=true');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.dryRun).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        expiredSessions: 5,
        oldLoginAttempts: 11,
        timestamp: expect.any(String),
      }),
    );
    expect(mockCleanupExpiredSessions).not.toHaveBeenCalled();
  });

  it('runs cleanup and returns deletion summary', async () => {
    mockCleanupExpiredSessions.mockResolvedValue({
      sessionsDeleted: 7,
      loginAttemptsDeleted: 3,
      errors: [],
    });

    const req = new NextRequest('http://localhost:3000/api/cron/session-cleanup');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        sessionsDeleted: 7,
        loginAttemptsDeleted: 3,
        durationMs: expect.any(Number),
        timestamp: expect.any(String),
      }),
    );
  });

  it('returns 500 when cleanup throws', async () => {
    mockCleanupExpiredSessions.mockRejectedValue(new Error('cleanup failed'));

    const req = new NextRequest('http://localhost:3000/api/cron/session-cleanup');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to run session cleanup');
  });
});
