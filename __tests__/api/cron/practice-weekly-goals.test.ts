jest.mock('@/lib/api/cron-auth', () => ({
  withCronAuth: jest.fn(),
}));

jest.mock('@/lib/sam/taxomind-context', () => ({
  getPracticeStores: jest.fn(() => ({
    practiceGoal: {
      resetWeeklyGoals: jest.fn().mockResolvedValue(4),
    },
  })),
}));

import { GET } from '@/app/api/cron/practice-weekly-goals/route';
import { withCronAuth } from '@/lib/api/cron-auth';
import { NextRequest, NextResponse } from 'next/server';

const mockWithCronAuth = withCronAuth as jest.Mock;

describe('/api/cron/practice-weekly-goals route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithCronAuth.mockReturnValue(null);
  });

  it('returns auth response when cron auth blocks', async () => {
    mockWithCronAuth.mockReturnValueOnce(new NextResponse('forbidden', { status: 403 }));
    const req = new NextRequest('http://localhost:3000/api/cron/practice-weekly-goals');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('resets weekly goals and returns stats', async () => {
    const req = new NextRequest('http://localhost:3000/api/cron/practice-weekly-goals');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.stats.goalsReset).toBe(4);
  });
});
