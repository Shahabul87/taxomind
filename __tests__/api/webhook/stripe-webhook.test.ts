/**
 * Tests for Stripe Webhook Route - app/api/webhook/route.ts
 *
 * Covers: signature verification, idempotency, event queueing, error handling
 */

// --- Mocks (hoisted before imports) ---

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}));

jest.mock('@/lib/queue/queue-manager', () => ({
  queueManager: {
    addJob: jest.fn(),
  },
}));

// @/lib/db and @/lib/logger are globally mocked in jest.setup.js

import { POST } from '@/app/api/webhook/route';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { queueManager } from '@/lib/queue/queue-manager';

// --- Helpers ---

const mockHeaders = headers as jest.Mock;
const mockConstructEvent = stripe.webhooks.constructEvent as jest.Mock;
const mockAddJob = queueManager.addJob as jest.Mock;

// webhookEvent may not be in the global mock — add it
if (!db.webhookEvent) {
  (db as Record<string, unknown>).webhookEvent = {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
}
const mockUpsert = db.webhookEvent.upsert as jest.Mock;

function createWebhookRequest(body = '{"type":"checkout.session.completed"}') {
  return new Request('http://localhost:3000/api/webhook', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
  });
}

const MOCK_EVENT = {
  id: 'evt_test_123',
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_test_456' } },
};

// --- Tests ---

describe('POST /api/webhook (Stripe)', () => {
  beforeAll(() => {
    // Polyfill crypto.randomUUID for jsdom (route uses it for IDs)
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
    // Default: headers returns a valid signature
    mockHeaders.mockResolvedValue({
      get: jest.fn().mockReturnValue('sig_test_header'),
    });

    // Default: constructEvent succeeds
    mockConstructEvent.mockReturnValue(MOCK_EVENT);

    // Default: event is new (not yet processed)
    mockUpsert.mockResolvedValue({
      id: 'wh-1',
      processed: false,
      retryCount: 0,
    });

    // Default: queue accepts job
    mockAddJob.mockResolvedValue(undefined);
  });

  it('returns 200 and queues a new webhook event', async () => {
    const req = createWebhookRequest();
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockConstructEvent).toHaveBeenCalledWith(
      expect.any(String),
      'sig_test_header',
      process.env.STRIPE_WEBHOOK_SECRET
    );
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          provider_eventId: {
            provider: 'stripe',
            eventId: 'evt_test_123',
          },
        },
      })
    );
    expect(mockAddJob).toHaveBeenCalledWith(
      'webhook',
      'process-webhook',
      expect.objectContaining({
        provider: 'stripe',
        eventType: 'checkout.session.completed',
      }),
      { priority: 100 }
    );
  });

  it('returns 200 without re-queuing an already-processed event', async () => {
    mockUpsert.mockResolvedValue({
      id: 'wh-1',
      processed: true,
      retryCount: 1,
    });

    const req = createWebhookRequest();
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockAddJob).not.toHaveBeenCalled();
  });

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const req = createWebhookRequest();
    const res = await POST(req);

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain('Invalid signature');
  });

  it('returns 500 on processing errors after signature validation', async () => {
    mockUpsert.mockRejectedValue(new Error('Unexpected error'));

    const req = createWebhookRequest();
    const res = await POST(req);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('unexpected error occurred');
  });

  it('includes the event type in the upsert create payload', async () => {
    const req = createWebhookRequest();
    await POST(req);

    expect(mockUpsert).toHaveBeenCalled();
    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall.create.eventType).toBe('checkout.session.completed');
    expect(upsertCall.create.provider).toBe('stripe');
    expect(upsertCall.create.processed).toBe(false);
  });

  it('increments retryCount on duplicate event', async () => {
    const req = createWebhookRequest();
    await POST(req);

    expect(mockUpsert).toHaveBeenCalled();
    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall.update.retryCount).toEqual({ increment: 1 });
  });
});
