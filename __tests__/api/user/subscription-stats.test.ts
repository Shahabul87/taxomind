/**
 * Tests for User Subscription Stats Route - app/api/user/subscription-stats/route.ts
 *
 * Covers: auth (401), success with various tiers, usage stats,
 * recent usage history, percentage calculations, feature mapping,
 * next reset times, error handling (500)
 */

jest.mock('@/lib/ai/subscription-enforcement', () => ({
  getUserUsageStats: jest.fn(),
}));

// @/lib/auth, @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import { GET } from '@/app/api/user/subscription-stats/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUserUsageStats } from '@/lib/ai/subscription-enforcement';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetUserUsageStats = getUserUsageStats as jest.Mock;

describe('GET /api/user/subscription-stats', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
    });

    mockGetUserUsageStats.mockResolvedValue({
      tier: 'FREE',
      daily: { used: 5, limit: 20, remaining: 15 },
      monthly: { used: 50, limit: 500, remaining: 450 },
    });

    (db.aIUsageMetrics.findMany as jest.Mock).mockResolvedValue([
      {
        date: new Date('2026-02-25'),
        totalGenerations: 10,
        totalTokens: 5000,
      },
      {
        date: new Date('2026-02-24'),
        totalGenerations: 8,
        totalTokens: 4000,
      },
    ]);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ email: 'test@test.com' });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns subscription stats for FREE tier', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.tier).toBe('FREE');
    expect(body.data.tierLabel).toBe('Free Plan');
  });

  it('returns correct daily usage with percentage', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.data.daily.used).toBe(5);
    expect(body.data.daily.limit).toBe(20);
    expect(body.data.daily.remaining).toBe(15);
    expect(body.data.daily.percentage).toBe(25); // 5/20 * 100 = 25
  });

  it('returns correct monthly usage with percentage', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.data.monthly.used).toBe(50);
    expect(body.data.monthly.limit).toBe(500);
    expect(body.data.monthly.remaining).toBe(450);
    expect(body.data.monthly.percentage).toBe(10); // 50/500 * 100 = 10
  });

  it('returns 0 percentage when limit is 0', async () => {
    mockGetUserUsageStats.mockResolvedValue({
      tier: 'FREE',
      daily: { used: 0, limit: 0, remaining: 0 },
      monthly: { used: 0, limit: 0, remaining: 0 },
    });

    const res = await GET();
    const body = await res.json();

    expect(body.data.daily.percentage).toBe(0);
    expect(body.data.monthly.percentage).toBe(0);
  });

  it('returns correct features for FREE tier', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.data.features.chat).toBe(true);
    expect(body.data.features.courseGeneration).toBe(false);
    expect(body.data.features.advancedAnalysis).toBe(false);
    expect(body.data.features.codeReview).toBe(false);
    expect(body.data.features.unlimitedExports).toBe(false);
    expect(body.data.features.prioritySupport).toBe(false);
  });

  it('returns correct features for PROFESSIONAL tier', async () => {
    mockGetUserUsageStats.mockResolvedValue({
      tier: 'PROFESSIONAL',
      daily: { used: 10, limit: 100, remaining: 90 },
      monthly: { used: 200, limit: 5000, remaining: 4800 },
    });

    const res = await GET();
    const body = await res.json();

    expect(body.data.features.chat).toBe(true);
    expect(body.data.features.courseGeneration).toBe(true);
    expect(body.data.features.advancedAnalysis).toBe(true);
    expect(body.data.features.codeReview).toBe(true);
    expect(body.data.features.unlimitedExports).toBe(false);
    expect(body.data.features.prioritySupport).toBe(false);
  });

  it('returns all features for ENTERPRISE tier', async () => {
    mockGetUserUsageStats.mockResolvedValue({
      tier: 'ENTERPRISE',
      daily: { used: 0, limit: 999999, remaining: 999999 },
      monthly: { used: 0, limit: 999999, remaining: 999999 },
    });

    const res = await GET();
    const body = await res.json();

    expect(body.data.features.chat).toBe(true);
    expect(body.data.features.courseGeneration).toBe(true);
    expect(body.data.features.advancedAnalysis).toBe(true);
    expect(body.data.features.codeReview).toBe(true);
    expect(body.data.features.unlimitedExports).toBe(true);
    expect(body.data.features.prioritySupport).toBe(true);
  });

  it('returns correct tier label for STARTER', async () => {
    mockGetUserUsageStats.mockResolvedValue({
      tier: 'STARTER',
      daily: { used: 0, limit: 50, remaining: 50 },
      monthly: { used: 0, limit: 1000, remaining: 1000 },
    });

    const res = await GET();
    const body = await res.json();

    expect(body.data.tierLabel).toBe('Starter Plan');
    expect(body.data.features.courseGeneration).toBe(true);
  });

  it('returns recent usage history from last 7 days', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.data.recentUsage).toHaveLength(2);
    expect(body.data.recentUsage[0].date).toBe('2026-02-25');
    expect(body.data.recentUsage[0].generations).toBe(10);
    expect(body.data.recentUsage[0].tokens).toBe(5000);
    expect(body.data.recentUsage[1].date).toBe('2026-02-24');
    expect(body.data.recentUsage[1].generations).toBe(8);
  });

  it('queries usage metrics with correct date filter and user scope', async () => {
    await GET();

    expect(db.aIUsageMetrics.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          date: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
        orderBy: { date: 'desc' },
        take: 7,
      })
    );
  });

  it('returns empty recent usage when no metrics exist', async () => {
    (db.aIUsageMetrics.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(body.data.recentUsage).toEqual([]);
  });

  it('returns next reset times for daily and monthly', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.data.nextReset).toHaveProperty('daily');
    expect(body.data.nextReset).toHaveProperty('monthly');

    // Daily reset should be tomorrow at midnight
    const dailyReset = new Date(body.data.nextReset.daily);
    const now = new Date();
    expect(dailyReset.getTime()).toBeGreaterThan(now.getTime());

    // Monthly reset should be first day of next month
    const monthlyReset = new Date(body.data.nextReset.monthly);
    expect(monthlyReset.getDate()).toBe(1);
    expect(monthlyReset.getTime()).toBeGreaterThan(now.getTime());
  });

  it('returns 500 when getUserUsageStats throws', async () => {
    mockGetUserUsageStats.mockRejectedValue(new Error('Service unavailable'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch subscription stats');
  });

  it('returns 500 when database query fails', async () => {
    (db.aIUsageMetrics.findMany as jest.Mock).mockRejectedValue(
      new Error('Connection refused')
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('falls back to tier name when label is unknown', async () => {
    mockGetUserUsageStats.mockResolvedValue({
      tier: 'UNKNOWN_TIER',
      daily: { used: 0, limit: 0, remaining: 0 },
      monthly: { used: 0, limit: 0, remaining: 0 },
    });

    const res = await GET();
    const body = await res.json();

    expect(body.data.tierLabel).toBe('UNKNOWN_TIER');
  });
});
