jest.mock('@/lib/api/cron-auth', () => ({
  withCronAuth: jest.fn(),
}));

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/cron/practice-leaderboard/route';
import { withCronAuth } from '@/lib/api/cron-auth';

const mockWithCronAuth = withCronAuth as jest.Mock;

describe('/api/cron/practice-leaderboard route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns auth response when cron auth blocks', async () => {
    mockWithCronAuth.mockReturnValueOnce(new NextResponse('forbidden', { status: 403 }));
    const req = new NextRequest('http://localhost:3000/api/cron/practice-leaderboard');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
