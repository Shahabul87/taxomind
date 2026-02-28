jest.mock('@/lib/api/cron-auth', () => ({
  withCronAuth: jest.fn(),
}));

jest.mock('@sam-ai/agentic', () => ({
  createCheckInScheduler: jest.fn(),
  CheckInStatus: {
    SENT: 'sent',
    PENDING: 'pending',
    EXPIRED: 'expired',
  },
  NotificationChannel: {
    IN_APP: 'in_app',
  },
}));

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/cron/sam-checkins/route';
import { withCronAuth } from '@/lib/api/cron-auth';

const mockWithCronAuth = withCronAuth as jest.Mock;

describe('/api/cron/sam-checkins route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns auth response when cron auth blocks', async () => {
    mockWithCronAuth.mockReturnValueOnce(new NextResponse('forbidden', { status: 403 }));
    const req = new NextRequest('http://localhost:3000/api/cron/sam-checkins');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
