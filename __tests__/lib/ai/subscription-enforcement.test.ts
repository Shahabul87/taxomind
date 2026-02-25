/**
 * Tests for AI Subscription Enforcement System
 * Source: lib/ai/subscription-enforcement.ts
 *
 * Covers: checkAIAccess, recordAIUsage, getUserUsageStats
 * - Admin bypass
 * - Maintenance mode
 * - Feature/tier matrix (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
 * - Daily and monthly usage limits
 * - Usage reset on day/month change
 * - Grace window on enforcement errors
 * - Usage recording with atomic increments
 * - User stats retrieval
 */

// --- Module-level mocks (before imports) ---

jest.mock('@/lib/admin/check-admin', () => ({
  getCurrentAdminSession: jest.fn(),
}));

jest.mock('@/lib/ai/platform-settings-cache', () => ({
  getCachedPlatformAISettings: jest.fn(),
  invalidateSharedPlatformCache: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(() => Promise.resolve()),
}));

// @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import { checkAIAccess, recordAIUsage, getUserUsageStats } from '@/lib/ai/subscription-enforcement';
import { db } from '@/lib/db';
import { getCurrentAdminSession } from '@/lib/admin/check-admin';
import { getCachedPlatformAISettings } from '@/lib/ai/platform-settings-cache';
import {
  MOCK_USER_ID,
  createMockPlatformSettings,
  createMockUserRecord,
} from './_ai-test-helpers';

const mockGetAdminSession = getCurrentAdminSession as jest.Mock;
const mockGetSettings = getCachedPlatformAISettings as jest.Mock;
const mockUserFindUnique = db.user.findUnique as jest.Mock;
const mockUserUpdate = db.user.update as jest.Mock;
const mockTransaction = db.$transaction as jest.Mock;

// Ensure crypto.randomUUID is available (used in recordAIUsage for metrics id)
if (!globalThis.crypto?.randomUUID) {
  const nodeCrypto = jest.requireActual('crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => nodeCrypto.randomUUID?.() ?? 'mock-uuid',
    },
    writable: true,
    configurable: true,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupDefaults(userOverrides: Record<string, unknown> = {}) {
  mockGetAdminSession.mockResolvedValue({ isAdmin: false, adminId: null, role: null });
  mockGetSettings.mockResolvedValue(createMockPlatformSettings());
  mockUserFindUnique.mockResolvedValue(createMockUserRecord(userOverrides));
}

// ---------------------------------------------------------------------------
// checkAIAccess
// ---------------------------------------------------------------------------

describe('checkAIAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaults();
  });

  // --- Admin bypass ---

  it('allows admin access unconditionally', async () => {
    mockGetAdminSession.mockResolvedValue({
      isAdmin: true,
      adminId: 'admin-1',
      role: 'ADMIN',
    });

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    expect(result.allowed).toBe(true);
    // Should not even query the user table
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  // --- Maintenance mode ---

  it('returns 503-equivalent when maintenance mode is on', async () => {
    mockGetSettings.mockResolvedValue(
      createMockPlatformSettings({
        maintenanceMode: true,
        maintenanceMessage: 'Scheduled downtime',
      }),
    );

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    expect(result.allowed).toBe(false);
    expect(result.maintenanceMode).toBe(true);
    expect(result.maintenanceMessage).toBe('Scheduled downtime');
  });

  it('returns maintenance without custom message', async () => {
    mockGetSettings.mockResolvedValue(
      createMockPlatformSettings({ maintenanceMode: true, maintenanceMessage: null }),
    );

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    expect(result.allowed).toBe(false);
    expect(result.maintenanceMode).toBe(true);
    expect(result.maintenanceMessage).toBeUndefined();
  });

  // --- User not found ---

  it('denies access when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('User not found');
  });

  // --- hasAIAccess bypass ---

  it('allows access when user has admin-granted hasAIAccess flag', async () => {
    setupDefaults({ hasAIAccess: true, subscriptionTier: 'FREE' });

    const result = await checkAIAccess(MOCK_USER_ID, 'analysis');

    expect(result.allowed).toBe(true);
  });

  // --- Feature/tier matrix: FREE ---

  it('allows FREE tier chat access', async () => {
    setupDefaults({ subscriptionTier: 'FREE' });

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    expect(result.allowed).toBe(true);
  });

  it('denies FREE tier course generation', async () => {
    setupDefaults({ subscriptionTier: 'FREE' });

    const result = await checkAIAccess(MOCK_USER_ID, 'course');

    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
    expect(result.suggestedTier).toBe('STARTER');
  });

  it('denies FREE tier analysis access', async () => {
    setupDefaults({ subscriptionTier: 'FREE' });

    const result = await checkAIAccess(MOCK_USER_ID, 'analysis');

    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
    expect(result.suggestedTier).toBe('PROFESSIONAL');
  });

  it('denies FREE tier code access', async () => {
    setupDefaults({ subscriptionTier: 'FREE' });

    const result = await checkAIAccess(MOCK_USER_ID, 'code');

    expect(result.allowed).toBe(false);
    expect(result.suggestedTier).toBe('PROFESSIONAL');
  });

  // --- Feature/tier matrix: STARTER ---

  it('allows STARTER tier course generation', async () => {
    setupDefaults({ subscriptionTier: 'STARTER' });

    const result = await checkAIAccess(MOCK_USER_ID, 'course');

    expect(result.allowed).toBe(true);
  });

  it('allows STARTER tier chapter/lesson/exam/exercise', async () => {
    setupDefaults({ subscriptionTier: 'STARTER' });

    for (const feature of ['chapter', 'lesson', 'exam', 'exercise'] as const) {
      const result = await checkAIAccess(MOCK_USER_ID, feature);
      expect(result.allowed).toBe(true);
    }
  });

  it('allows STARTER tier skill-roadmap', async () => {
    setupDefaults({ subscriptionTier: 'STARTER' });

    const result = await checkAIAccess(MOCK_USER_ID, 'skill-roadmap');

    expect(result.allowed).toBe(true);
  });

  it('denies STARTER tier analysis feature', async () => {
    setupDefaults({ subscriptionTier: 'STARTER' });

    const result = await checkAIAccess(MOCK_USER_ID, 'analysis');

    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });

  it('denies STARTER tier code feature', async () => {
    setupDefaults({ subscriptionTier: 'STARTER' });

    const result = await checkAIAccess(MOCK_USER_ID, 'code');

    expect(result.allowed).toBe(false);
  });

  // --- Feature/tier matrix: PROFESSIONAL ---

  it('allows PROFESSIONAL tier all features', async () => {
    setupDefaults({ subscriptionTier: 'PROFESSIONAL' });

    for (const feature of ['chat', 'course', 'analysis', 'code', 'other'] as const) {
      const result = await checkAIAccess(MOCK_USER_ID, feature);
      expect(result.allowed).toBe(true);
    }
  });

  // --- Feature/tier matrix: ENTERPRISE ---

  it('allows ENTERPRISE tier all features', async () => {
    setupDefaults({ subscriptionTier: 'ENTERPRISE' });

    for (const feature of ['chat', 'course', 'analysis', 'code', 'other'] as const) {
      const result = await checkAIAccess(MOCK_USER_ID, feature);
      expect(result.allowed).toBe(true);
    }
  });

  // --- Feature/tier matrix: CUSTOM (treated as ENTERPRISE) ---

  it('allows CUSTOM tier all features', async () => {
    setupDefaults({ subscriptionTier: 'CUSTOM' });

    const result = await checkAIAccess(MOCK_USER_ID, 'code');

    expect(result.allowed).toBe(true);
  });

  // --- Premium expired ---

  it('downgrades to FREE when premium has expired', async () => {
    const expiredDate = new Date(Date.now() - 86400000); // Yesterday
    setupDefaults({
      subscriptionTier: 'PROFESSIONAL',
      isPremium: true,
      premiumExpiresAt: expiredDate,
    });
    mockUserUpdate.mockResolvedValue({});

    const result = await checkAIAccess(MOCK_USER_ID, 'analysis');

    // analysis is not available for FREE
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });

  // --- Course approval requirement ---

  it('blocks course generation when requireApprovalForCourses is true for non-ENTERPRISE', async () => {
    setupDefaults({ subscriptionTier: 'STARTER' });
    mockGetSettings.mockResolvedValue(
      createMockPlatformSettings({ requireApprovalForCourses: true }),
    );

    const result = await checkAIAccess(MOCK_USER_ID, 'course');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('admin approval');
  });

  it('allows course generation for ENTERPRISE even with requireApprovalForCourses', async () => {
    setupDefaults({ subscriptionTier: 'ENTERPRISE' });
    mockGetSettings.mockResolvedValue(
      createMockPlatformSettings({ requireApprovalForCourses: true }),
    );

    const result = await checkAIAccess(MOCK_USER_ID, 'course');

    expect(result.allowed).toBe(true);
  });

  // --- Daily chat limit ---

  it('denies when daily chat limit exceeded', async () => {
    setupDefaults({
      subscriptionTier: 'FREE',
      dailyAiUsageCount: 10, // matches freeDailyChatLimit default
      dailyAiUsageResetAt: new Date(), // same day
    });

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Daily chat limit exceeded');
    expect(result.remainingDaily).toBe(0);
  });

  it('allows chat when daily usage is under limit', async () => {
    setupDefaults({
      subscriptionTier: 'FREE',
      dailyAiUsageCount: 5,
      dailyAiUsageResetAt: new Date(),
    });

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    expect(result.allowed).toBe(true);
    expect(result.remainingDaily).toBe(4); // 10 - 5 - 1
  });

  // --- Monthly limit ---

  it('denies when monthly limit exceeded', async () => {
    setupDefaults({
      subscriptionTier: 'FREE',
      monthlyAiUsageCount: 50, // matches freeMonthlyLimit default
      monthlyAiUsageResetAt: new Date(),
    });

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Monthly AI generation limit exceeded');
    expect(result.remainingMonthly).toBe(0);
  });

  it('allows access when monthly usage is under limit', async () => {
    setupDefaults({
      subscriptionTier: 'FREE',
      dailyAiUsageCount: 0,
      monthlyAiUsageCount: 10,
      monthlyAiUsageResetAt: new Date(),
    });

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    expect(result.allowed).toBe(true);
    expect(result.remainingMonthly).toBe(39); // 50 - 10 - 1
  });

  // --- Usage reset on day/month change ---

  it('resets daily count when resetAt is a different day', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setupDefaults({
      subscriptionTier: 'FREE',
      dailyAiUsageCount: 100,
      dailyAiUsageResetAt: yesterday,
      monthlyAiUsageCount: 0,
      monthlyAiUsageResetAt: new Date(),
    });

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    // Daily is reset to 0, so 0 + 1 <= 10 => allowed
    expect(result.allowed).toBe(true);
  });

  it('resets monthly count when resetAt is a different month', async () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    setupDefaults({
      subscriptionTier: 'FREE',
      dailyAiUsageCount: 0,
      dailyAiUsageResetAt: new Date(),
      monthlyAiUsageCount: 999,
      monthlyAiUsageResetAt: lastMonth,
    });

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    // Monthly is reset to 0, so 0 + 1 <= 50 => allowed
    expect(result.allowed).toBe(true);
  });

  it('resets daily count when resetAt is null', async () => {
    setupDefaults({
      subscriptionTier: 'FREE',
      dailyAiUsageCount: 999,
      dailyAiUsageResetAt: null,
      monthlyAiUsageCount: 0,
      monthlyAiUsageResetAt: new Date(),
    });

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    expect(result.allowed).toBe(true);
  });

  // --- requestedUsage parameter ---

  it('respects requestedUsage parameter for limit calculation', async () => {
    setupDefaults({
      subscriptionTier: 'FREE',
      dailyAiUsageCount: 8,
      dailyAiUsageResetAt: new Date(),
    });

    // Requesting 3 uses: 8 + 3 = 11 > 10
    const result = await checkAIAccess(MOCK_USER_ID, 'chat', 3);

    expect(result.allowed).toBe(false);
    expect(result.remainingDaily).toBe(2); // 10 - 8
  });

  // --- Grace window on errors ---

  it('allows request during grace window on enforcement error', async () => {
    mockGetAdminSession.mockRejectedValue(new Error('DB connection failed'));

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    // First error in window => allowed
    expect(result.allowed).toBe(true);
  });

  // --- Suggested upgrade tier ---

  it('suggests STARTER for FREE users at daily chat limit', async () => {
    setupDefaults({
      subscriptionTier: 'FREE',
      dailyAiUsageCount: 10,
      dailyAiUsageResetAt: new Date(),
    });

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    expect(result.suggestedTier).toBe('STARTER');
  });

  it('suggests PROFESSIONAL for STARTER users at monthly limit', async () => {
    setupDefaults({
      subscriptionTier: 'STARTER',
      monthlyAiUsageCount: 500,
      monthlyAiUsageResetAt: new Date(),
    });

    const result = await checkAIAccess(MOCK_USER_ID, 'chat');

    expect(result.suggestedTier).toBe('PROFESSIONAL');
  });
});

// ---------------------------------------------------------------------------
// recordAIUsage
// ---------------------------------------------------------------------------

describe('recordAIUsage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindUnique.mockResolvedValue({
      dailyAiUsageResetAt: new Date(),
      monthlyAiUsageResetAt: new Date(),
    });
    // $transaction passes the mock client to the callback
    mockTransaction.mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) => {
      return fn(db);
    });
    mockUserUpdate.mockResolvedValue({});
    (db.aIUsageMetrics.upsert as jest.Mock).mockResolvedValue({});
    (db.platformAIUsageSummary.upsert as jest.Mock).mockResolvedValue({});
    mockGetSettings.mockResolvedValue(createMockPlatformSettings());
  });

  it('increments daily and monthly counters atomically', async () => {
    await recordAIUsage(MOCK_USER_ID, 'chat', 1);

    expect(mockTransaction).toHaveBeenCalled();
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: MOCK_USER_ID },
        data: expect.objectContaining({
          dailyAiUsageCount: { increment: 1 },
          monthlyAiUsageCount: { increment: 1 },
        }),
      }),
    );
  });

  it('resets daily counter when day has changed', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    mockUserFindUnique.mockResolvedValue({
      dailyAiUsageResetAt: yesterday,
      monthlyAiUsageResetAt: new Date(),
    });

    await recordAIUsage(MOCK_USER_ID, 'chat', 1);

    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dailyAiUsageCount: 1, // reset to usage amount, not increment
        }),
      }),
    );
  });

  it('resets monthly counter when month has changed', async () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    mockUserFindUnique.mockResolvedValue({
      dailyAiUsageResetAt: new Date(),
      monthlyAiUsageResetAt: lastMonth,
    });

    await recordAIUsage(MOCK_USER_ID, 'chat', 1);

    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monthlyAiUsageCount: 1, // reset
        }),
      }),
    );
  });

  it('does nothing when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await recordAIUsage(MOCK_USER_ID, 'chat');

    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('upserts AI usage metrics with feature-specific counters', async () => {
    await recordAIUsage(MOCK_USER_ID, 'course', 1, {
      provider: 'anthropic',
      model: 'claude-sonnet',
      tokensUsed: 500,
      cost: 0.01,
    });

    expect(mockTransaction).toHaveBeenCalled();
    expect((db.aIUsageMetrics.upsert as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          totalGenerations: { increment: 1 },
          courseGenerations: { increment: 1 },
        }),
        create: expect.objectContaining({
          courseGenerations: 1,
        }),
      }),
    );
  });

  it('does not throw on recording failure', async () => {
    mockUserFindUnique.mockRejectedValue(new Error('DB error'));

    // Should not throw
    await expect(recordAIUsage(MOCK_USER_ID, 'chat')).resolves.toBeUndefined();
  });

  it('passes metadata tokens and cost to the upsert', async () => {
    await recordAIUsage(MOCK_USER_ID, 'chat', 1, {
      tokensUsed: 1000,
      cost: 0.05,
    });

    expect((db.aIUsageMetrics.upsert as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          totalTokens: { increment: 1000 },
          totalCost: { increment: 0.05 },
        }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// getUserUsageStats
// ---------------------------------------------------------------------------

describe('getUserUsageStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSettings.mockResolvedValue(createMockPlatformSettings());
  });

  it('returns correct stats for FREE tier', async () => {
    mockUserFindUnique.mockResolvedValue({
      subscriptionTier: 'FREE',
      dailyAiUsageCount: 3,
      dailyAiUsageResetAt: new Date(),
      monthlyAiUsageCount: 20,
      monthlyAiUsageResetAt: new Date(),
    });

    const stats = await getUserUsageStats(MOCK_USER_ID);

    expect(stats.tier).toBe('FREE');
    expect(stats.daily).toEqual({ used: 3, limit: 10, remaining: 7 });
    expect(stats.monthly).toEqual({ used: 20, limit: 50, remaining: 30 });
  });

  it('returns correct stats for PROFESSIONAL tier', async () => {
    mockUserFindUnique.mockResolvedValue({
      subscriptionTier: 'PROFESSIONAL',
      dailyAiUsageCount: 50,
      dailyAiUsageResetAt: new Date(),
      monthlyAiUsageCount: 500,
      monthlyAiUsageResetAt: new Date(),
    });

    const stats = await getUserUsageStats(MOCK_USER_ID);

    expect(stats.tier).toBe('PROFESSIONAL');
    expect(stats.daily).toEqual({ used: 50, limit: 1000, remaining: 950 });
    expect(stats.monthly).toEqual({ used: 500, limit: 2000, remaining: 1500 });
  });

  it('resets daily usage for new day', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    mockUserFindUnique.mockResolvedValue({
      subscriptionTier: 'FREE',
      dailyAiUsageCount: 8,
      dailyAiUsageResetAt: yesterday,
      monthlyAiUsageCount: 20,
      monthlyAiUsageResetAt: new Date(),
    });

    const stats = await getUserUsageStats(MOCK_USER_ID);

    expect(stats.daily.used).toBe(0);
    expect(stats.daily.remaining).toBe(10);
  });

  it('resets monthly usage for new month', async () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    mockUserFindUnique.mockResolvedValue({
      subscriptionTier: 'FREE',
      dailyAiUsageCount: 0,
      dailyAiUsageResetAt: new Date(),
      monthlyAiUsageCount: 45,
      monthlyAiUsageResetAt: lastMonth,
    });

    const stats = await getUserUsageStats(MOCK_USER_ID);

    expect(stats.monthly.used).toBe(0);
    expect(stats.monthly.remaining).toBe(50);
  });

  it('throws when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await expect(getUserUsageStats(MOCK_USER_ID)).rejects.toThrow('User not found');
  });

  it('returns ENTERPRISE limits for ENTERPRISE tier', async () => {
    mockUserFindUnique.mockResolvedValue({
      subscriptionTier: 'ENTERPRISE',
      dailyAiUsageCount: 100,
      dailyAiUsageResetAt: new Date(),
      monthlyAiUsageCount: 1000,
      monthlyAiUsageResetAt: new Date(),
    });

    const stats = await getUserUsageStats(MOCK_USER_ID);

    expect(stats.daily.limit).toBe(10000);
    expect(stats.monthly.limit).toBe(10000);
  });
});
