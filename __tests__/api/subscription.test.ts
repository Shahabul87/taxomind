jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/tiered-access-control', () => ({
  accessController: {
    getUserSubscription: jest.fn(),
    getUserUsageStats: jest.fn(),
    getFeaturesForTier: jest.fn(),
    getTierComparison: jest.fn(),
    upgradeSubscription: jest.fn(),
    checkFeatureAccess: jest.fn(),
    recordFeatureUsage: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/subscription/route';
import { currentUser } from '@/lib/auth';
import { accessController } from '@/lib/tiered-access-control';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockAccess = accessController as unknown as Record<string, jest.Mock>;

describe('/api/subscription route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockAccess.getUserSubscription.mockResolvedValue({ tier: 'basic' });
    mockAccess.upgradeSubscription.mockResolvedValue({ tier: 'pro' });
    mockAccess.recordFeatureUsage.mockResolvedValue(undefined);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/subscription?action=subscription');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('GET returns subscription for valid action', async () => {
    const req = new NextRequest('http://localhost:3000/api/subscription?action=subscription');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tier).toBe('basic');
  });

  it('POST upgrades subscription when payload is valid', async () => {
    const req = new NextRequest('http://localhost:3000/api/subscription', {
      method: 'POST',
      body: JSON.stringify({ action: 'upgrade', data: { tier: 'pro' } }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tier).toBe('pro');
  });
});
