/**
 * Subscription Gate Unit Tests
 *
 * Tests the unified subscription gate middleware that enforces
 * tier-based access control across all AI routes.
 */

import { SubscriptionTier } from '@prisma/client';

// ---------------------------------------------------------------------------
// Mocks — declared before imports so jest.mock hoists them
// ---------------------------------------------------------------------------

const mockGetCurrentAdminSession = jest.fn();
const mockCheckAIAccess = jest.fn();

jest.mock('@/lib/admin/check-admin', () => ({
  getCurrentAdminSession: (...args: unknown[]) => mockGetCurrentAdminSession(...args),
}));

jest.mock('../subscription-enforcement', () => ({
  checkAIAccess: (...args: unknown[]) => mockCheckAIAccess(...args),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import {
  withSubscriptionGate,
  type SubscriptionCategory,
  type SubscriptionGateResult,
} from '../subscription-gate';
import { db } from '@/lib/db';

// Use the global mock's db functions directly (avoids moduleNameMapper conflict
// where the cached subscription-gate module references the global mock, not
// a custom jest.mock factory).
const mockFindUniqueUser = db.user.findUnique as jest.Mock;
const mockUpdateUser = db.user.update as jest.Mock;
const mockFindFirstEnrollment = db.enrollment.findFirst as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<{
  id: string;
  hasAIAccess: boolean;
  subscriptionTier: SubscriptionTier;
  isPremium: boolean;
  premiumExpiresAt: Date | null;
}> = {}) {
  return {
    id: 'user-1',
    hasAIAccess: false,
    subscriptionTier: 'FREE' as SubscriptionTier,
    isPremium: false,
    premiumExpiresAt: null,
    ...overrides,
  };
}

function setupDefaults(userOverrides?: Parameters<typeof makeUser>[0]) {
  mockGetCurrentAdminSession.mockResolvedValue({ isAdmin: false });
  mockFindUniqueUser.mockResolvedValue(makeUser(userOverrides));
  mockUpdateUser.mockResolvedValue({});
  mockFindFirstEnrollment.mockResolvedValue(null);
  mockCheckAIAccess.mockResolvedValue({
    allowed: true,
    remainingDaily: 10,
    remainingMonthly: 100,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('withSubscriptionGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Read-only — always allowed
  // -----------------------------------------------------------------------

  describe('read-only category', () => {
    it('allows any user regardless of tier', async () => {
      // No mocks needed — read-only short-circuits
      const result = await withSubscriptionGate('user-1', { category: 'read-only' });
      expect(result.allowed).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('does not query the database', async () => {
      await withSubscriptionGate('user-1', { category: 'read-only' });
      expect(mockFindUniqueUser).not.toHaveBeenCalled();
      expect(mockCheckAIAccess).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Tool execution — standalone vs AI-powered
  // -----------------------------------------------------------------------

  describe('tool-execution category', () => {
    it('allows standalone tools (isAIPowered=false) without any checks', async () => {
      const result = await withSubscriptionGate('user-1', {
        category: 'tool-execution',
        isAIPowered: false,
      });
      expect(result.allowed).toBe(true);
      expect(mockFindUniqueUser).not.toHaveBeenCalled();
    });

    it('blocks AI-powered tools for FREE tier', async () => {
      setupDefaults({ subscriptionTier: 'FREE' });

      const result = await withSubscriptionGate('user-1', {
        category: 'tool-execution',
        isAIPowered: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.response).toBeDefined();
      const body = await result.response!.json();
      expect(body.code).toBe('SUBSCRIPTION_REQUIRED');
    });

    it('allows AI-powered tools for STARTER tier', async () => {
      setupDefaults({ subscriptionTier: 'STARTER' });

      const result = await withSubscriptionGate('user-1', {
        category: 'tool-execution',
        isAIPowered: true,
      });

      expect(result.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Admin bypass
  // -----------------------------------------------------------------------

  describe('admin bypass', () => {
    it('allows admin users for any category', async () => {
      mockGetCurrentAdminSession.mockResolvedValue({
        isAdmin: true,
        adminId: 'admin-1',
        role: 'SUPER_ADMIN',
      });

      const categories: SubscriptionCategory[] = [
        'generation',
        'analysis',
        'chat',
        'premium-feature',
        'tool-execution',
      ];

      for (const category of categories) {
        const result = await withSubscriptionGate('user-1', { category });
        expect(result.allowed).toBe(true);
      }

      // Admin bypass skips user DB lookup
      expect(mockFindUniqueUser).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // hasAIAccess bypass
  // -----------------------------------------------------------------------

  describe('hasAIAccess bypass', () => {
    it('allows users with hasAIAccess=true regardless of tier', async () => {
      setupDefaults({
        subscriptionTier: 'FREE',
        hasAIAccess: true,
      });

      const result = await withSubscriptionGate('user-1', { category: 'generation' });

      expect(result.allowed).toBe(true);
      expect(result.tier).toBe('FREE');
    });
  });

  // -----------------------------------------------------------------------
  // User not found
  // -----------------------------------------------------------------------

  describe('user not found', () => {
    it('returns 404 when user does not exist', async () => {
      mockGetCurrentAdminSession.mockResolvedValue({ isAdmin: false });
      mockFindUniqueUser.mockResolvedValue(null);

      const result = await withSubscriptionGate('nonexistent', { category: 'chat' });

      expect(result.allowed).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.response!.status).toBe(404);
    });
  });

  // -----------------------------------------------------------------------
  // Expired premium handling
  // -----------------------------------------------------------------------

  describe('expired premium', () => {
    it('downgrades expired premium user to FREE tier', async () => {
      const pastDate = new Date(Date.now() - 86_400_000); // yesterday
      setupDefaults({
        subscriptionTier: 'STARTER',
        isPremium: true,
        premiumExpiresAt: pastDate,
      });

      const result = await withSubscriptionGate('user-1', { category: 'generation' });

      // Generation requires STARTER; expired premium → effective FREE → blocked
      expect(result.allowed).toBe(false);
      expect(result.tier).toBe('FREE');
    });

    it('keeps active premium users at their tier', async () => {
      const futureDate = new Date(Date.now() + 86_400_000 * 30); // 30 days from now
      setupDefaults({
        subscriptionTier: 'STARTER',
        isPremium: true,
        premiumExpiresAt: futureDate,
      });

      const result = await withSubscriptionGate('user-1', { category: 'generation' });

      expect(result.allowed).toBe(true);
      expect(result.tier).toBe('STARTER');
    });
  });

  // -----------------------------------------------------------------------
  // Generation category (STARTER+)
  // -----------------------------------------------------------------------

  describe('generation category', () => {
    it('blocks FREE tier users', async () => {
      setupDefaults({ subscriptionTier: 'FREE' });

      const result = await withSubscriptionGate('user-1', { category: 'generation' });

      expect(result.allowed).toBe(false);
      const body = await result.response!.json();
      expect(body.code).toBe('SUBSCRIPTION_REQUIRED');
      expect(body.suggestedTier).toBe('STARTER');
    });

    it('allows STARTER tier users', async () => {
      setupDefaults({ subscriptionTier: 'STARTER' });

      const result = await withSubscriptionGate('user-1', { category: 'generation' });
      expect(result.allowed).toBe(true);
    });

    it('allows PROFESSIONAL tier users', async () => {
      setupDefaults({ subscriptionTier: 'PROFESSIONAL' });

      const result = await withSubscriptionGate('user-1', { category: 'generation' });
      expect(result.allowed).toBe(true);
    });

    it('allows ENTERPRISE tier users', async () => {
      setupDefaults({ subscriptionTier: 'ENTERPRISE' });

      const result = await withSubscriptionGate('user-1', { category: 'generation' });
      expect(result.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Analysis category (STARTER+ with enrollment bypass)
  // -----------------------------------------------------------------------

  describe('analysis category', () => {
    it('blocks FREE tier users without enrollment', async () => {
      setupDefaults({ subscriptionTier: 'FREE' });

      const result = await withSubscriptionGate('user-1', { category: 'analysis' });

      expect(result.allowed).toBe(false);
    });

    it('allows FREE tier users with enrollment bypass', async () => {
      setupDefaults({ subscriptionTier: 'FREE' });
      mockFindFirstEnrollment.mockResolvedValue({ id: 'enrollment-1' });

      const result = await withSubscriptionGate('user-1', {
        category: 'analysis',
        courseId: 'course-1',
      });

      expect(result.allowed).toBe(true);
    });

    it('still checks usage limits even with enrollment bypass', async () => {
      setupDefaults({ subscriptionTier: 'FREE' });
      mockFindFirstEnrollment.mockResolvedValue({ id: 'enrollment-1' });
      mockCheckAIAccess.mockResolvedValue({
        allowed: false,
        reason: 'Daily limit exceeded',
        remainingDaily: 0,
        remainingMonthly: 5,
        suggestedTier: 'STARTER',
      });

      const result = await withSubscriptionGate('user-1', {
        category: 'analysis',
        courseId: 'course-1',
      });

      expect(result.allowed).toBe(false);
      const body = await result.response!.json();
      expect(body.code).toBe('USAGE_LIMIT_EXCEEDED');
    });

    it('does not bypass for non-enrolled users even with courseId', async () => {
      setupDefaults({ subscriptionTier: 'FREE' });
      mockFindFirstEnrollment.mockResolvedValue(null);

      const result = await withSubscriptionGate('user-1', {
        category: 'analysis',
        courseId: 'course-1',
      });

      // No enrollment → falls through to tier check → FREE < STARTER → blocked
      expect(result.allowed).toBe(false);
    });

    it('allows STARTER tier users without enrollment', async () => {
      setupDefaults({ subscriptionTier: 'STARTER' });

      const result = await withSubscriptionGate('user-1', { category: 'analysis' });
      expect(result.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Chat category (FREE with limits)
  // -----------------------------------------------------------------------

  describe('chat category', () => {
    it('allows FREE tier users', async () => {
      setupDefaults({ subscriptionTier: 'FREE' });

      const result = await withSubscriptionGate('user-1', { category: 'chat' });
      expect(result.allowed).toBe(true);
    });

    it('blocks when usage limits are exhausted', async () => {
      setupDefaults({ subscriptionTier: 'FREE' });
      mockCheckAIAccess.mockResolvedValue({
        allowed: false,
        reason: 'Daily chat limit exceeded',
        remainingDaily: 0,
        remainingMonthly: 0,
        suggestedTier: 'STARTER',
      });

      const result = await withSubscriptionGate('user-1', { category: 'chat' });

      expect(result.allowed).toBe(false);
      expect(result.response!.status).toBe(429);
    });
  });

  // -----------------------------------------------------------------------
  // Premium feature category (PROFESSIONAL+)
  // -----------------------------------------------------------------------

  describe('premium-feature category', () => {
    it('blocks FREE tier users', async () => {
      setupDefaults({ subscriptionTier: 'FREE' });

      const result = await withSubscriptionGate('user-1', { category: 'premium-feature' });

      expect(result.allowed).toBe(false);
      const body = await result.response!.json();
      expect(body.suggestedTier).toBe('PROFESSIONAL');
    });

    it('blocks STARTER tier users', async () => {
      setupDefaults({ subscriptionTier: 'STARTER' });

      const result = await withSubscriptionGate('user-1', { category: 'premium-feature' });

      expect(result.allowed).toBe(false);
    });

    it('allows PROFESSIONAL tier users', async () => {
      setupDefaults({ subscriptionTier: 'PROFESSIONAL' });

      const result = await withSubscriptionGate('user-1', { category: 'premium-feature' });
      expect(result.allowed).toBe(true);
    });

    it('allows ENTERPRISE tier users', async () => {
      setupDefaults({ subscriptionTier: 'ENTERPRISE' });

      const result = await withSubscriptionGate('user-1', { category: 'premium-feature' });
      expect(result.allowed).toBe(true);
    });

    it('allows CUSTOM tier users', async () => {
      setupDefaults({ subscriptionTier: 'CUSTOM' });

      const result = await withSubscriptionGate('user-1', { category: 'premium-feature' });
      expect(result.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Usage limit delegation
  // -----------------------------------------------------------------------

  describe('usage limit checks', () => {
    it('delegates to checkAIAccess after tier check passes', async () => {
      setupDefaults({ subscriptionTier: 'STARTER' });

      await withSubscriptionGate('user-1', { category: 'generation' });

      expect(mockCheckAIAccess).toHaveBeenCalledWith('user-1', 'course');
    });

    it('maps analysis category to analysis feature type', async () => {
      setupDefaults({ subscriptionTier: 'STARTER' });

      await withSubscriptionGate('user-1', { category: 'analysis' });

      expect(mockCheckAIAccess).toHaveBeenCalledWith('user-1', 'analysis');
    });

    it('maps chat category to chat feature type', async () => {
      setupDefaults({ subscriptionTier: 'FREE' });

      await withSubscriptionGate('user-1', { category: 'chat' });

      expect(mockCheckAIAccess).toHaveBeenCalledWith('user-1', 'chat');
    });

    it('returns usage limit response when limits exhausted', async () => {
      setupDefaults({ subscriptionTier: 'STARTER' });
      mockCheckAIAccess.mockResolvedValue({
        allowed: false,
        reason: 'Monthly generation limit exceeded',
        remainingDaily: 5,
        remainingMonthly: 0,
        suggestedTier: 'PROFESSIONAL',
      });

      const result = await withSubscriptionGate('user-1', { category: 'generation' });

      expect(result.allowed).toBe(false);
      expect(result.response!.status).toBe(429);
      const body = await result.response!.json();
      expect(body.code).toBe('USAGE_LIMIT_EXCEEDED');
      expect(body.remainingMonthly).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Error handling (fail-open)
  // -----------------------------------------------------------------------

  describe('error handling', () => {
    it('fails open when an error occurs', async () => {
      mockGetCurrentAdminSession.mockRejectedValue(new Error('DB connection lost'));

      const result = await withSubscriptionGate('user-1', { category: 'generation' });

      expect(result.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Tier ordering
  // -----------------------------------------------------------------------

  describe('tier ordering', () => {
    const tierTests: Array<{
      tier: SubscriptionTier;
      category: SubscriptionCategory;
      expected: boolean;
    }> = [
      // Generation (requires STARTER)
      { tier: 'FREE', category: 'generation', expected: false },
      { tier: 'STARTER', category: 'generation', expected: true },
      { tier: 'PROFESSIONAL', category: 'generation', expected: true },
      { tier: 'ENTERPRISE', category: 'generation', expected: true },
      { tier: 'CUSTOM', category: 'generation', expected: true },

      // Premium feature (requires PROFESSIONAL)
      { tier: 'FREE', category: 'premium-feature', expected: false },
      { tier: 'STARTER', category: 'premium-feature', expected: false },
      { tier: 'PROFESSIONAL', category: 'premium-feature', expected: true },
      { tier: 'ENTERPRISE', category: 'premium-feature', expected: true },
      { tier: 'CUSTOM', category: 'premium-feature', expected: true },

      // Chat (requires FREE — everyone passes)
      { tier: 'FREE', category: 'chat', expected: true },
      { tier: 'STARTER', category: 'chat', expected: true },
    ];

    it.each(tierTests)(
      '$tier tier + $category → allowed=$expected',
      async ({ tier, category, expected }) => {
        setupDefaults({ subscriptionTier: tier });

        const result = await withSubscriptionGate('user-1', { category });

        expect(result.allowed).toBe(expected);
      },
    );
  });
});
