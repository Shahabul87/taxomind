jest.mock('@/lib/api/cron-auth', () => ({
  withCronAuth: jest.fn(),
}));

jest.mock('@/lib/sam/taxomind-context', () => ({
  getStore: jest.fn(),
  getPracticeStores: jest.fn(() => ({
    spacedRepetition: {},
  })),
}));

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/cron/sam-mastery-decay/route';
import { withCronAuth } from '@/lib/api/cron-auth';

const mockWithCronAuth = withCronAuth as jest.Mock;

describe('/api/cron/sam-mastery-decay route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns auth response when cron auth blocks', async () => {
    mockWithCronAuth.mockReturnValueOnce(new NextResponse('forbidden', { status: 403 }));
    const req = new NextRequest('http://localhost:3000/api/cron/sam-mastery-decay');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
