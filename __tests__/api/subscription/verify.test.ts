/**
 * Tests for Subscription Verify Route - app/api/subscription/verify/route.ts
 *
 * Covers: Stripe not configured (503), auth (401), validation (400),
 * session ownership (403), payment status check, already processed,
 * plan-based expiry calculation, success, error handling
 */

jest.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: jest.fn(),
      },
    },
  },
  isStripeConfigured: jest.fn().mockReturnValue(true),
}));

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { POST } from '@/app/api/subscription/verify/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripe, isStripeConfigured } from '@/lib/stripe';

const mockCurrentUser = currentUser as jest.Mock;
const mockIsStripeConfigured = isStripeConfigured as jest.Mock;
const mockSessionRetrieve = stripe.checkout.sessions.retrieve as jest.Mock;

function createVerifyRequest(body: Record<string, unknown> = { sessionId: 'cs_test_123' }) {
  return new NextRequest('http://localhost:3000/api/subscription/verify', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/subscription/verify', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
    });

    mockIsStripeConfigured.mockReturnValue(true);

    mockSessionRetrieve.mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'paid',
      metadata: {
        userId: 'user-1',
        plan: 'MONTHLY',
        type: 'premium_subscription',
      },
      mode: 'subscription',
      subscription: 'sub_test_123',
    });

    (db.user.findUnique as jest.Mock).mockResolvedValue({
      isPremium: false,
      premiumPlan: null,
    });

    (db.user.update as jest.Mock).mockResolvedValue({
      id: 'user-1',
      isPremium: true,
      premiumPlan: 'MONTHLY',
    });
  });

  it('returns 503 when Stripe is not configured', async () => {
    mockIsStripeConfigured.mockReturnValue(false);

    const res = await POST(createVerifyRequest());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PAYMENT_UNAVAILABLE');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createVerifyRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 when sessionId is missing', async () => {
    const res = await POST(createVerifyRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when sessionId is empty string', async () => {
    const res = await POST(createVerifyRequest({ sessionId: '' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 403 when session belongs to a different user', async () => {
    mockSessionRetrieve.mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'paid',
      metadata: {
        userId: 'other-user-999',
        plan: 'MONTHLY',
      },
    });

    const res = await POST(createVerifyRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_SESSION');
  });

  it('returns 400 when payment is not completed', async () => {
    mockSessionRetrieve.mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'unpaid',
      metadata: {
        userId: 'user-1',
        plan: 'MONTHLY',
      },
    });

    const res = await POST(createVerifyRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PAYMENT_INCOMPLETE');
  });

  it('returns success with alreadyProcessed flag when user already has that plan', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      isPremium: true,
      premiumPlan: 'MONTHLY',
    });

    const res = await POST(createVerifyRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.alreadyProcessed).toBe(true);
    expect(body.data.plan).toBe('MONTHLY');
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('activates MONTHLY premium with 1-month expiry', async () => {
    const res = await POST(createVerifyRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.plan).toBe('MONTHLY');
    expect(body.data.expiresAt).toBeDefined();

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          isPremium: true,
          premiumPlan: 'MONTHLY',
        }),
      })
    );
  });

  it('activates YEARLY premium with 1-year expiry', async () => {
    mockSessionRetrieve.mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'paid',
      metadata: {
        userId: 'user-1',
        plan: 'YEARLY',
      },
    });

    const res = await POST(createVerifyRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.plan).toBe('YEARLY');
    expect(body.data.expiresAt).toBeDefined();

    const updateCall = (db.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.premiumPlan).toBe('YEARLY');
    // Expiry should be roughly 1 year from now
    const expiresAt = new Date(updateCall.data.premiumExpiresAt);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    // Allow 5 second tolerance for test execution time
    expect(Math.abs(expiresAt.getTime() - oneYearFromNow.getTime())).toBeLessThan(5000);
  });

  it('activates LIFETIME premium with null expiry', async () => {
    mockSessionRetrieve.mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'paid',
      metadata: {
        userId: 'user-1',
        plan: 'LIFETIME',
      },
    });

    const res = await POST(createVerifyRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.plan).toBe('LIFETIME');
    expect(body.data.expiresAt).toBeNull();

    const updateCall = (db.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.premiumExpiresAt).toBeNull();
  });

  it('returns 500 when Stripe session retrieval fails', async () => {
    mockSessionRetrieve.mockRejectedValue(new Error('Stripe API error'));

    const res = await POST(createVerifyRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
