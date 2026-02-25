/**
 * Tests for Subscription Checkout Route - app/api/subscription/checkout/route.ts
 *
 * Covers: auth, Stripe config, validation, duplicate prevention, fraud check, session creation
 */

jest.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_new_123' }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_session',
          url: 'https://checkout.stripe.com/pay/cs_test_session',
        }),
      },
    },
  },
  isStripeConfigured: jest.fn().mockReturnValue(true),
}));

jest.mock('@/lib/payment/rate-limit', () => ({
  checkAndEnforceRateLimit: jest.fn().mockReturnValue(null),
  paymentRateLimitPresets: {
    subscriptionCheckout: { windowMs: 60000, maxRequests: 5 },
    subscriptionManagement: { windowMs: 60000, maxRequests: 10 },
  },
  checkPaymentRateLimit: jest.fn().mockReturnValue({
    allowed: true,
    remaining: 4,
    limit: 5,
    reset: Date.now() + 60000,
  }),
  createRateLimitHeaders: jest.fn().mockReturnValue({
    'X-RateLimit-Limit': '5',
    'X-RateLimit-Remaining': '4',
  }),
}));

jest.mock('@/lib/payment/fraud-detection', () => ({
  checkSubscriptionFraud: jest.fn().mockResolvedValue({
    allowed: true,
    riskScore: 10,
    flags: [],
  }),
}));

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked

import { POST } from '@/app/api/subscription/checkout/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { isStripeConfigured } from '@/lib/stripe';
import { checkSubscriptionFraud } from '@/lib/payment/fraud-detection';
import { checkAndEnforceRateLimit } from '@/lib/payment/rate-limit';

const mockCurrentUser = currentUser as jest.Mock;
const mockIsStripeConfigured = isStripeConfigured as jest.Mock;
const mockFraudCheck = checkSubscriptionFraud as jest.Mock;
const mockRateLimit = checkAndEnforceRateLimit as jest.Mock;

function createCheckoutRequest(plan = 'MONTHLY') {
  return new NextRequest('http://localhost:3000/api/subscription/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/subscription/checkout', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
    });
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      isPremium: false,
      premiumPlan: null,
      premiumExpiresAt: null,
    });
    (db.stripeCustomer.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      stripeCustomerId: 'cus_existing_123',
    });
    mockIsStripeConfigured.mockReturnValue(true);
    mockFraudCheck.mockResolvedValue({ allowed: true, riskScore: 10, flags: [] });
    mockRateLimit.mockReturnValue(null);
  });

  it('returns 503 when Stripe is not configured', async () => {
    mockIsStripeConfigured.mockReturnValue(false);

    const res = await POST(createCheckoutRequest());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error.code).toBe('PAYMENT_UNAVAILABLE');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createCheckoutRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 for invalid plan', async () => {
    const req = new NextRequest('http://localhost:3000/api/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'INVALID_PLAN' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when user already has lifetime premium', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      isPremium: true,
      premiumPlan: 'LIFETIME',
      premiumExpiresAt: null,
    });

    const res = await POST(createCheckoutRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('ALREADY_LIFETIME');
  });

  it('returns 403 when fraud check fails', async () => {
    mockFraudCheck.mockResolvedValue({
      allowed: false,
      riskScore: 90,
      flags: ['rapid_attempts'],
    });

    const res = await POST(createCheckoutRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('CHECKOUT_BLOCKED');
  });

  it('creates checkout session for MONTHLY plan (subscription mode)', async () => {
    const res = await POST(createCheckoutRequest('MONTHLY'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.url).toContain('stripe.com');
    expect(body.data.sessionId).toBe('cs_test_session');
  });

  it('creates checkout session for YEARLY plan', async () => {
    const res = await POST(createCheckoutRequest('YEARLY'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('creates checkout session for LIFETIME plan (payment mode)', async () => {
    const res = await POST(createCheckoutRequest('LIFETIME'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('creates a new Stripe customer if none exists', async () => {
    (db.stripeCustomer.findUnique as jest.Mock).mockResolvedValue(null);
    (db.stripeCustomer.create as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      stripeCustomerId: 'cus_new_123',
    });

    const { stripe } = require('@/lib/stripe');

    const res = await POST(createCheckoutRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(stripe.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@test.com',
        metadata: { userId: 'user-1' },
      })
    );
  });

  it('returns rate limit response when rate limited', async () => {
    const { NextResponse } = require('next/server');
    const rateLimitResponse = NextResponse.json(
      { error: 'Rate limited' },
      { status: 429 }
    );
    mockRateLimit.mockReturnValue(rateLimitResponse);

    const res = await POST(createCheckoutRequest());

    expect(res.status).toBe(429);
  });
});
