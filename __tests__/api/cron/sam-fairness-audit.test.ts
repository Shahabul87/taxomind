jest.mock('@/lib/api/cron-auth', () => ({
  withCronAuth: jest.fn(),
}));

jest.mock('@sam-ai/safety', () => ({
  createFairnessAuditor: jest.fn(() => ({
    runFairnessAudit: jest.fn(),
  })),
}));

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/cron/sam-fairness-audit/route';
import { withCronAuth } from '@/lib/api/cron-auth';

const mockWithCronAuth = withCronAuth as jest.Mock;

describe('/api/cron/sam-fairness-audit route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns auth response when cron auth blocks', async () => {
    mockWithCronAuth.mockReturnValueOnce(new NextResponse('forbidden', { status: 403 }));
    const req = new NextRequest('http://localhost:3000/api/cron/sam-fairness-audit');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
