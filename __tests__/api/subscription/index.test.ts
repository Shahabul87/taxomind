/**
 * Tests for Subscription Route - app/api/subscription/route.ts
 *
 * Covers: GET (subscription, usage, features, comparison, invalid action)
 *         POST (upgrade, check_access, record_usage, invalid action)
 *         Auth (401) for both methods, error handling (500)
 */

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
  SubscriptionTier: {},
}));

// @/lib/auth and @/lib/logger are globally mocked in jest.setup.js

import { GET, POST } from '@/app/api/subscription/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { accessController } from '@/lib/tiered-access-control';

const mockCurrentUser = currentUser as jest.Mock;

function createGetRequest(action?: string, extra?: Record<string, string>) {
  const params = new URLSearchParams();
  if (action) params.set('action', action);
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  }
  return new NextRequest(`http://localhost:3000/api/subscription?${params.toString()}`);
}

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/subscription', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/subscription', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createGetRequest('subscription'));

    expect(res.status).toBe(401);
  });

  it('returns subscription data for action=subscription', async () => {
    const mockSubscription = {
      userId: 'user-1',
      tier: 'pro',
      features: ['chat', 'course'],
      isActive: true,
    };
    (accessController.getUserSubscription as jest.Mock).mockResolvedValue(mockSubscription);

    const res = await GET(createGetRequest('subscription'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockSubscription);
    expect(accessController.getUserSubscription).toHaveBeenCalledWith('user-1');
  });

  it('returns usage stats for action=usage', async () => {
    const mockUsage = { daily: 5, monthly: 100 };
    (accessController.getUserUsageStats as jest.Mock).mockResolvedValue(mockUsage);

    const res = await GET(createGetRequest('usage'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockUsage);
    expect(accessController.getUserUsageStats).toHaveBeenCalledWith('user-1');
  });

  it('returns features for specified tier', async () => {
    const mockFeatures = [{ id: 'chat', name: 'Chat' }];
    (accessController.getFeaturesForTier as jest.Mock).mockReturnValue(mockFeatures);

    const res = await GET(createGetRequest('features', { tier: 'enterprise' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockFeatures);
    expect(accessController.getFeaturesForTier).toHaveBeenCalledWith('enterprise');
  });

  it('defaults to basic tier when tier param is not provided', async () => {
    (accessController.getFeaturesForTier as jest.Mock).mockReturnValue([]);

    await GET(createGetRequest('features'));

    expect(accessController.getFeaturesForTier).toHaveBeenCalledWith('basic');
  });

  it('returns tier comparison for action=comparison', async () => {
    const mockComparison = { basic: [], pro: [], enterprise: [] };
    (accessController.getTierComparison as jest.Mock).mockReturnValue(mockComparison);

    const res = await GET(createGetRequest('comparison'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockComparison);
  });

  it('returns 400 for invalid or missing action', async () => {
    const res = await GET(createGetRequest('invalid_action'));

    expect(res.status).toBe(400);
  });

  it('returns 400 when no action is provided', async () => {
    const res = await GET(createGetRequest());

    expect(res.status).toBe(400);
  });

  it('returns 500 on internal error', async () => {
    (accessController.getUserSubscription as jest.Mock).mockRejectedValue(
      new Error('DB connection failed')
    );

    const res = await GET(createGetRequest('subscription'));

    expect(res.status).toBe(500);
  });
});

describe('POST /api/subscription', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createPostRequest({ action: 'upgrade', data: { tier: 'pro' } }));

    expect(res.status).toBe(401);
  });

  it('upgrades subscription to a valid tier', async () => {
    const mockResult = { tier: 'pro', isActive: true };
    (accessController.upgradeSubscription as jest.Mock).mockResolvedValue(mockResult);

    const res = await POST(createPostRequest({
      action: 'upgrade',
      data: { tier: 'pro' },
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockResult);
    expect(accessController.upgradeSubscription).toHaveBeenCalledWith('user-1', 'pro');
  });

  it('returns 400 for invalid tier on upgrade', async () => {
    const res = await POST(createPostRequest({
      action: 'upgrade',
      data: { tier: 'platinum' },
    }));

    expect(res.status).toBe(400);
  });

  it('returns 400 when tier is missing on upgrade', async () => {
    const res = await POST(createPostRequest({
      action: 'upgrade',
      data: {},
    }));

    expect(res.status).toBe(400);
  });

  it('checks feature access with requested usage', async () => {
    const mockAccess = { allowed: true, remaining: 5 };
    (accessController.checkFeatureAccess as jest.Mock).mockResolvedValue(mockAccess);

    const res = await POST(createPostRequest({
      action: 'check_access',
      data: { featureId: 'ai-chat', requestedUsage: 3 },
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockAccess);
    expect(accessController.checkFeatureAccess).toHaveBeenCalledWith('user-1', 'ai-chat', 3);
  });

  it('returns 400 when featureId is missing on check_access', async () => {
    const res = await POST(createPostRequest({
      action: 'check_access',
      data: {},
    }));

    expect(res.status).toBe(400);
  });

  it('records feature usage successfully', async () => {
    (accessController.recordFeatureUsage as jest.Mock).mockResolvedValue(undefined);

    const res = await POST(createPostRequest({
      action: 'record_usage',
      data: { featureId: 'ai-chat', usage: 2 },
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(accessController.recordFeatureUsage).toHaveBeenCalledWith('user-1', 'ai-chat', 2);
  });

  it('returns 400 when featureId is missing on record_usage', async () => {
    const res = await POST(createPostRequest({
      action: 'record_usage',
      data: {},
    }));

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid action in POST', async () => {
    const res = await POST(createPostRequest({
      action: 'invalid',
      data: {},
    }));

    expect(res.status).toBe(400);
  });

  it('returns 500 on internal error', async () => {
    (accessController.upgradeSubscription as jest.Mock).mockRejectedValue(
      new Error('Payment failed')
    );

    const res = await POST(createPostRequest({
      action: 'upgrade',
      data: { tier: 'pro' },
    }));

    expect(res.status).toBe(500);
  });
});
