jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { POST } from '@/app/api/analytics/batch/route';
import { currentUser } from '@/lib/auth';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockRateLimit = withRateLimit as jest.Mock;

function req(body: unknown) {
  return new NextRequest('http://localhost:3000/api/analytics/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/analytics/batch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns rate-limit response when blocked', async () => {
    mockRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: 'too many requests' }, { status: 429 })
    );

    const res = await POST(req({ events: [] }));
    expect(res.status).toBe(429);
  });

  it('returns 400 for invalid empty batch', async () => {
    const res = await POST(req({ events: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when batch size exceeds limit', async () => {
    const events = new Array(101).fill(0).map((_, i) => ({
      eventType: 'click',
      eventCategory: 'user_interaction',
      properties: {},
      timestamp: new Date(),
      sessionId: `s-${i}`,
    }));

    const res = await POST(req({ events }));
    expect(res.status).toBe(400);
  });

  it('processes valid events and returns success counts', async () => {
    const events = [
      {
        eventType: 'click',
        eventCategory: 'user_interaction',
        properties: {},
        timestamp: new Date(),
        sessionId: 's-1',
      },
      {
        eventType: 'generate',
        eventCategory: 'ai_generation',
        properties: {},
        timestamp: new Date(),
        sessionId: 's-2',
      },
    ];

    const res = await POST(req({ events }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.processed).toBe(2);
    expect(body.successful).toBe(2);
    expect(body.failed).toBe(0);
  });

  it('counts failed events in mixed batches', async () => {
    const events = [
      {
        eventType: 'click',
        eventCategory: 'user_interaction',
        properties: {},
        timestamp: new Date(),
        sessionId: 's-1',
      },
      {
        eventType: 'broken',
        eventCategory: 'error',
        properties: {},
        timestamp: new Date(),
      },
    ];

    const res = await POST(req({ events }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.successful).toBe(1);
    expect(body.failed).toBe(1);
  });

  it('returns success:false payload when processing throws unexpectedly', async () => {
    const badReq = req('{invalid-json');
    const res = await POST(badReq);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
