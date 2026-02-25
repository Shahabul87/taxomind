/**
 * Tests for Subscription Cancel Route - app/api/subscription/cancel/route.ts
 *
 * Covers: POST (cancel subscription), GET (cancellation status)
 */

jest.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: jest.fn(),
      update: jest.fn(),
    },
  },
  isStripeConfigured: jest.fn().mockReturnValue(true),
}));

jest.mock('@/lib/payment/rate-limit', () => ({
  checkAndEnforceRateLimit: jest.fn().mockReturnValue(null),
  paymentRateLimitPresets: {
    subscriptionManagement: { windowMs: 60000, maxRequests: 10 },
  },
}));

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked

import { POST, GET } from '@/app/api/subscription/cancel/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripe, isStripeConfigured } from '@/lib/stripe';

const mockCurrentUser = currentUser as jest.Mock;
const mockIsStripeConfigured = isStripeConfigured as jest.Mock;
const mockRetrieve = stripe.subscriptions.retrieve as jest.Mock;
const mockUpdate = stripe.subscriptions.update as jest.Mock;

function createRequest(method = 'POST') {
  return new NextRequest('http://localhost:3000/api/subscription/cancel', {
    method,
  });
}

const MOCK_PERIOD_END = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days from now

describe('POST /api/subscription/cancel', () => {
  beforeAll(() => {
    // Polyfill crypto.randomUUID for jsdom (route uses it for audit log IDs)
    if (typeof globalThis.crypto?.randomUUID !== 'function') {
      const nodeCrypto = require('crypto');
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: () => nodeCrypto.randomUUID(),
        configurable: true,
        writable: true,
      });
    }
  });

  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockIsStripeConfigured.mockReturnValue(true);
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      isPremium: true,
      premiumPlan: 'MONTHLY',
      premiumStripeSubscriptionId: 'sub_test_123',
      premiumExpiresAt: new Date(Date.now() + 86400000 * 30),
    });
    mockRetrieve.mockResolvedValue({
      id: 'sub_test_123',
      cancel_at_period_end: false,
      current_period_end: MOCK_PERIOD_END,
      status: 'active',
    });
    mockUpdate.mockResolvedValue({
      id: 'sub_test_123',
      cancel_at_period_end: true,
      current_period_end: MOCK_PERIOD_END,
    });
    (db.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });
  });

  it('returns 503 when Stripe is not configured', async () => {
    mockIsStripeConfigured.mockReturnValue(false);

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error.code).toBe('PAYMENT_UNAVAILABLE');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 when user has no active subscription', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      isPremium: false,
      premiumPlan: null,
      premiumStripeSubscriptionId: null,
    });

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('NOT_SUBSCRIBED');
  });

  it('returns 400 when user has a lifetime plan', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      isPremium: true,
      premiumPlan: 'LIFETIME',
      premiumStripeSubscriptionId: 'sub_test_123',
    });

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('LIFETIME_PLAN');
  });

  it('returns 400 when no Stripe subscription ID exists', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      isPremium: true,
      premiumPlan: 'MONTHLY',
      premiumStripeSubscriptionId: null,
    });

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('NO_SUBSCRIPTION_ID');
  });

  it('returns 400 when subscription is already cancelled', async () => {
    mockRetrieve.mockResolvedValue({
      id: 'sub_test_123',
      cancel_at_period_end: true,
      current_period_end: MOCK_PERIOD_END,
      status: 'active',
    });

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('ALREADY_CANCELLED');
  });

  it('successfully cancels a subscription at period end', async () => {
    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('cancelled');
    expect(body.data.cancelAt).toBeDefined();

    expect(mockUpdate).toHaveBeenCalledWith('sub_test_123', {
      cancel_at_period_end: true,
    });
  });

  it('creates an audit log entry on cancellation', async () => {
    await POST(createRequest());

    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          action: 'UPDATE',
          entityType: 'PremiumSubscription',
          entityId: 'sub_test_123',
        }),
      })
    );
  });

  it('returns 500 on unexpected errors', async () => {
    mockRetrieve.mockRejectedValue(new Error('Stripe API down'));

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('GET /api/subscription/cancel', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createRequest('GET'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns non-premium status when user has no subscription', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      isPremium: false,
      premiumPlan: null,
      premiumStripeSubscriptionId: null,
    });

    const res = await GET(createRequest('GET'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.isPremium).toBe(false);
    expect(body.data.isCancelled).toBe(false);
  });

  it('returns subscription status with cancellation info', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      isPremium: true,
      premiumPlan: 'MONTHLY',
      premiumStripeSubscriptionId: 'sub_test_123',
      premiumExpiresAt: new Date(),
    });
    mockRetrieve.mockResolvedValue({
      id: 'sub_test_123',
      cancel_at_period_end: true,
      cancel_at: MOCK_PERIOD_END,
      current_period_end: MOCK_PERIOD_END,
      status: 'active',
    });

    const res = await GET(createRequest('GET'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.isPremium).toBe(true);
    expect(body.data.plan).toBe('MONTHLY');
    expect(body.data.isCancelled).toBe(true);
    expect(body.data.status).toBe('active');
  });

  it('returns 500 on unexpected errors', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      isPremium: true,
      premiumPlan: 'MONTHLY',
      premiumStripeSubscriptionId: 'sub_test_123',
    });
    mockRetrieve.mockRejectedValue(new Error('Stripe error'));

    const res = await GET(createRequest('GET'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
