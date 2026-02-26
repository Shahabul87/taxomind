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

import { POST } from '@/app/api/webhook/route';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { queueManager } from '@/lib/queue/queue-manager';
import { stripe } from '@/lib/stripe';

const mockHeaders = headers as jest.Mock;
const mockConstructEvent = stripe.webhooks.constructEvent as jest.Mock;
const mockAddJob = queueManager.addJob as jest.Mock;

describe('api/webhook route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        ...(globalThis.crypto || {}),
        randomUUID: jest.fn(() => 'uuid-webhook-1'),
      },
      configurable: true,
    });

    if (!(db as any).webhookEvent) {
      (db as any).webhookEvent = { upsert: jest.fn() };
    }

    mockHeaders.mockResolvedValue({
      get: jest.fn().mockReturnValue('sig_test'),
    });
    mockConstructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
    });
    ((db as any).webhookEvent.upsert as jest.Mock).mockResolvedValue({
      id: 'webhook-1',
      processed: false,
    });
    mockAddJob.mockResolvedValue(undefined);
  });

  it('returns 500 when webhook secret is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const res = await POST(new Request('http://localhost:3000/api/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(500);
  });

  it('returns 400 when Stripe signature is missing', async () => {
    mockHeaders.mockResolvedValueOnce({
      get: jest.fn().mockReturnValue(null),
    });

    const res = await POST(new Request('http://localhost:3000/api/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(400);
  });

  it('queues webhook event when signature and event are valid', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/webhook', {
        method: 'POST',
        body: '{"id":"evt_1"}',
      })
    );

    expect(res.status).toBe(200);
    expect((db as any).webhookEvent.upsert).toHaveBeenCalled();
    expect(mockAddJob).toHaveBeenCalledWith(
      'webhook',
      'process-webhook',
      expect.objectContaining({ webhookEventId: 'webhook-1' }),
      { priority: 100 }
    );
  });
});
