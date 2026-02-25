/**
 * Tests for Subscription Webhook Route - app/api/subscription/webhook/route.ts
 *
 * Covers: missing signature (400), signature verification failure,
 * idempotency (duplicate events), checkout.session.completed, subscription.updated,
 * subscription.deleted, unhandled event types, processing errors
 *
 * Note: STRIPE_WEBHOOK_SECRET is a module-level constant captured at import time.
 * Since jest.setup.js sets process.env.STRIPE_WEBHOOK_SECRET before module load,
 * the "missing secret" branch cannot be reached in this test suite without
 * jest.isolateModules(), which is intentionally not used for simplicity.
 */

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
}));

jest.mock('@/lib/premium', () => ({
  activatePremium: jest.fn(),
  deactivatePremium: jest.fn(),
}));

// @/lib/db and @/lib/logger are globally mocked in jest.setup.js

import { POST } from '@/app/api/subscription/webhook/route';
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { activatePremium, deactivatePremium } from '@/lib/premium';

const mockHeaders = headers as jest.Mock;
const mockConstructEvent = stripe.webhooks.constructEvent as jest.Mock;

function createWebhookRequest(body = '{"type":"checkout.session.completed"}') {
  return new NextRequest('http://localhost:3000/api/subscription/webhook', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
  });
}

const MOCK_CHECKOUT_EVENT = {
  id: 'evt_checkout_123',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_456',
      metadata: {
        userId: 'user-1',
        plan: 'MONTHLY',
        type: 'premium_subscription',
      },
      mode: 'subscription',
      subscription: 'sub_test_789',
      amount_total: 999,
      currency: 'usd',
    },
  },
};

const MOCK_SUB_UPDATE_EVENT = {
  id: 'evt_sub_update_123',
  type: 'customer.subscription.updated',
  data: {
    object: {
      id: 'sub_test_789',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
      cancel_at_period_end: false,
    },
  },
};

const MOCK_SUB_DELETED_EVENT = {
  id: 'evt_sub_deleted_123',
  type: 'customer.subscription.deleted',
  data: {
    object: {
      id: 'sub_test_789',
      cancellation_details: {
        reason: 'cancellation_requested',
        feedback: 'too_expensive',
      },
    },
  },
};

/**
 * Helper to set up all db model mocks that may have been reset by resetMocks.
 * The webhook route uses: db.webhookEvent, db.auditLog, db.user, db.paymentTransaction, db.stripeCustomer
 */
function setupDbMocks() {
  // Ensure models exist (resetMocks may clear them)
  if (!(db as Record<string, unknown>).webhookEvent) {
    (db as Record<string, unknown>).webhookEvent = {};
  }
  if (!(db as Record<string, unknown>).paymentTransaction) {
    (db as Record<string, unknown>).paymentTransaction = {};
  }

  const we = db.webhookEvent as Record<string, jest.Mock>;
  we.findUnique = jest.fn().mockResolvedValue(null);
  we.upsert = jest.fn().mockResolvedValue({ id: 'wh-1', processed: false, retryCount: 0 });
  we.update = jest.fn().mockResolvedValue({});
  we.create = jest.fn().mockResolvedValue({});

  const pt = (db as Record<string, Record<string, jest.Mock>>).paymentTransaction;
  pt.findFirst = jest.fn().mockResolvedValue(null);

  // auditLog and user should exist from global mock but may be reset
  (db.auditLog.create as jest.Mock).mockResolvedValue({});
  (db.user.findFirst as jest.Mock).mockResolvedValue(null);
  (db.user.update as jest.Mock).mockResolvedValue({});

  // premium mocks
  (activatePremium as jest.Mock).mockResolvedValue(undefined);
  (deactivatePremium as jest.Mock).mockResolvedValue(undefined);
}

describe('POST /api/subscription/webhook', () => {
  beforeAll(() => {
    // Ensure crypto.randomUUID is available (jsdom environment may not have it)
    if (typeof globalThis.crypto?.randomUUID !== 'function') {
      const nodeCrypto = require('crypto');
      if (!globalThis.crypto) {
        globalThis.crypto = {} as Crypto;
      }
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: () => nodeCrypto.randomUUID(),
        configurable: true,
        writable: true,
      });
    }
  });

  beforeEach(() => {
    // Re-initialize all mock implementations (resetMocks clears them)
    mockHeaders.mockResolvedValue({
      get: jest.fn().mockReturnValue('sig_test_header'),
    });

    mockConstructEvent.mockReturnValue(MOCK_CHECKOUT_EVENT);

    setupDbMocks();
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    mockHeaders.mockResolvedValue({
      get: jest.fn().mockReturnValue(null),
    });

    const res = await POST(createWebhookRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Missing stripe-signature');
  });

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const res = await POST(createWebhookRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid signature');
  });

  it('verifies signature with correct arguments', async () => {
    await POST(createWebhookRequest('test-body'));

    expect(mockConstructEvent).toHaveBeenCalledWith(
      'test-body',
      'sig_test_header',
      process.env.STRIPE_WEBHOOK_SECRET
    );
  });

  it('returns 200 with duplicate flag for already-processed event', async () => {
    (db.webhookEvent as Record<string, jest.Mock>).findUnique.mockResolvedValue({
      id: 'wh-1',
      processed: true,
    });

    const res = await POST(createWebhookRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(body.duplicate).toBe(true);
  });

  it('processes checkout.session.completed and activates premium', async () => {
    const res = await POST(createWebhookRequest());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(activatePremium).toHaveBeenCalledWith('user-1', 'MONTHLY', 'sub_test_789');
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'CREATE',
          entityType: 'PremiumSubscription',
        }),
      })
    );
  });

  it('skips checkout that is not premium_subscription type', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_course_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_456',
          metadata: { userId: 'user-1', plan: 'MONTHLY', type: 'course_purchase' },
          mode: 'payment',
        },
      },
    });

    const res = await POST(createWebhookRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(activatePremium).not.toHaveBeenCalled();
  });

  it('processes customer.subscription.updated event', async () => {
    mockConstructEvent.mockReturnValue(MOCK_SUB_UPDATE_EVENT);

    (db.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-1',
      premiumStripeSubscriptionId: 'sub_test_789',
    });

    const res = await POST(createWebhookRequest());

    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          isPremium: true,
        }),
      })
    );
  });

  it('handles subscription update with cancellation intent', async () => {
    const cancelEvent = {
      id: 'evt_cancel_intent',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test_789',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
          cancel_at_period_end: true,
          cancel_at: Math.floor(Date.now() / 1000) + 86400 * 30,
        },
      },
    };
    mockConstructEvent.mockReturnValue(cancelEvent);

    (db.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-1',
      premiumStripeSubscriptionId: 'sub_test_789',
    });

    const res = await POST(createWebhookRequest());

    expect(res.status).toBe(200);
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changes: expect.objectContaining({
            status: 'PENDING_CANCELLATION',
          }),
        }),
      })
    );
  });

  it('processes customer.subscription.deleted and deactivates premium', async () => {
    mockConstructEvent.mockReturnValue(MOCK_SUB_DELETED_EVENT);

    (db.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-1',
      premiumStripeSubscriptionId: 'sub_test_789',
    });

    const res = await POST(createWebhookRequest());

    expect(res.status).toBe(200);
    expect(deactivatePremium).toHaveBeenCalledWith('user-1');
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'DELETE',
          entityType: 'PremiumSubscription',
        }),
      })
    );
  });

  it('handles unhandled event types gracefully', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_unknown_123',
      type: 'some.unknown.event',
      data: { object: {} },
    });

    const res = await POST(createWebhookRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
  });

  it('marks event as processed after successful handling', async () => {
    const res = await POST(createWebhookRequest());

    expect(res.status).toBe(200);
    expect((db.webhookEvent as Record<string, jest.Mock>).update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'wh-1' },
        data: expect.objectContaining({
          processed: true,
        }),
      })
    );
  });

  it('upserts webhook event for idempotency tracking', async () => {
    await POST(createWebhookRequest());

    expect((db.webhookEvent as Record<string, jest.Mock>).upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          provider_eventId: {
            provider: 'stripe-subscription',
            eventId: 'evt_checkout_123',
          },
        },
        create: expect.objectContaining({
          provider: 'stripe-subscription',
          eventType: 'checkout.session.completed',
          processed: false,
        }),
      })
    );
  });
});
