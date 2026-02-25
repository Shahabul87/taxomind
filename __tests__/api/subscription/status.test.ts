/**
 * Tests for Subscription Status Route - app/api/subscription/status/route.ts
 *
 * Covers: auth (401), success with premium user, success with free user,
 * error handling (500), data shape validation
 */

jest.mock('@/lib/premium', () => ({
  checkPremiumAccess: jest.fn(),
  getRemainingFreeUsage: jest.fn(),
  getAvailableFeatures: jest.fn(),
}));

// @/lib/auth and @/lib/logger are globally mocked in jest.setup.js

import { GET } from '@/app/api/subscription/status/route';
import { currentUser } from '@/lib/auth';
import {
  checkPremiumAccess,
  getRemainingFreeUsage,
  getAvailableFeatures,
} from '@/lib/premium';

const mockCurrentUser = currentUser as jest.Mock;
const mockCheckPremiumAccess = checkPremiumAccess as jest.Mock;
const mockGetRemainingFreeUsage = getRemainingFreeUsage as jest.Mock;
const mockGetAvailableFeatures = getAvailableFeatures as jest.Mock;

describe('GET /api/subscription/status', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
    });

    mockCheckPremiumAccess.mockResolvedValue({
      isPremium: false,
      plan: null,
      expiresAt: null,
      daysRemaining: null,
      isExpired: false,
    });

    mockGetRemainingFreeUsage.mockResolvedValue(10);

    mockGetAvailableFeatures.mockResolvedValue({
      chat: true,
      courseGeneration: false,
      advancedAnalysis: false,
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ email: 'test@test.com' });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns subscription status for free user', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isPremium).toBe(false);
    expect(body.data.samAi.remainingFreeUsage).toBe(10);
    expect(body.data.samAi.isUnlimited).toBe(false);
    expect(body.data.samAi.features).toEqual({
      chat: true,
      courseGeneration: false,
      advancedAnalysis: false,
    });
  });

  it('returns subscription status for premium user with unlimited SAM AI', async () => {
    mockCheckPremiumAccess.mockResolvedValue({
      isPremium: true,
      plan: 'MONTHLY',
      expiresAt: '2026-03-25T00:00:00.000Z',
      daysRemaining: 28,
      isExpired: false,
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isPremium).toBe(true);
    expect(body.data.plan).toBe('MONTHLY');
    expect(body.data.daysRemaining).toBe(28);
    expect(body.data.samAi.remainingFreeUsage).toBeNull();
    expect(body.data.samAi.isUnlimited).toBe(true);
  });

  it('returns expired subscription status', async () => {
    mockCheckPremiumAccess.mockResolvedValue({
      isPremium: false,
      plan: 'MONTHLY',
      expiresAt: '2026-01-01T00:00:00.000Z',
      daysRemaining: 0,
      isExpired: true,
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isExpired).toBe(true);
    expect(body.data.isPremium).toBe(false);
  });

  it('calls all three data functions in parallel with user id', async () => {
    await GET();

    expect(mockCheckPremiumAccess).toHaveBeenCalledWith('user-1');
    expect(mockGetRemainingFreeUsage).toHaveBeenCalledWith('user-1');
    expect(mockGetAvailableFeatures).toHaveBeenCalledWith('user-1');
  });

  it('returns 500 when checkPremiumAccess throws', async () => {
    mockCheckPremiumAccess.mockRejectedValue(new Error('Database error'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Failed to get subscription status');
  });

  it('returns 500 when getAvailableFeatures throws', async () => {
    mockGetAvailableFeatures.mockRejectedValue(new Error('Service unavailable'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('returns correct data shape with all expected fields', async () => {
    mockCheckPremiumAccess.mockResolvedValue({
      isPremium: true,
      plan: 'YEARLY',
      expiresAt: '2027-02-25T00:00:00.000Z',
      daysRemaining: 365,
      isExpired: false,
    });

    const res = await GET();
    const body = await res.json();

    expect(body.data).toHaveProperty('isPremium');
    expect(body.data).toHaveProperty('plan');
    expect(body.data).toHaveProperty('expiresAt');
    expect(body.data).toHaveProperty('daysRemaining');
    expect(body.data).toHaveProperty('isExpired');
    expect(body.data).toHaveProperty('samAi');
    expect(body.data.samAi).toHaveProperty('remainingFreeUsage');
    expect(body.data.samAi).toHaveProperty('isUnlimited');
    expect(body.data.samAi).toHaveProperty('features');
  });
});
