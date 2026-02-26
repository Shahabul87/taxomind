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

import { POST } from '@/app/api/analytics/events/route';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

const mockRateLimit = withRateLimit as jest.Mock;

function req(body: unknown) {
  return new NextRequest('http://localhost:3000/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/analytics/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
  });

  it('returns rate-limit response when blocked', async () => {
    mockRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: 'too many requests' }, { status: 429 })
    );

    const res = await POST(req({ event: 'page_view' }));
    expect(res.status).toBe(429);
  });

  it('accepts batch event payload format', async () => {
    const res = await POST(req({
      events: [
        {
          eventType: 'ui',
          eventName: 'click_button',
          properties: { button: 'start' },
          timestamp: new Date().toISOString(),
          sessionId: 'session-1',
        },
      ],
      sessionId: 'session-1',
      timestamp: new Date().toISOString(),
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.processed).toBe(1);
  });

  it('accepts legacy single-event payload format', async () => {
    const res = await POST(req({
      event: 'page_view',
      properties: { page: '/dashboard' },
      page: '/dashboard',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 400 for unsupported payload format', async () => {
    const res = await POST(req({ foo: 'bar' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_FORMAT');
  });

  it('returns 500 on unexpected parsing/runtime errors', async () => {
    const res = await POST(req('{invalid-json'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
