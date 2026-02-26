jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { POST } from '@/app/api/log-error/route';
import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';

describe('/api/log-error route', () => {
  it('logs client error payload and returns success', async () => {
    const req = new NextRequest('http://localhost:3000/api/log-error', {
      method: 'POST',
      body: JSON.stringify({
        message: 'boom',
        digest: 'd-1',
        page: '/dashboard',
        timestamp: '2026-02-26T00:00:00.000Z',
      }),
      headers: { 'user-agent': 'jest-agent' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect((logger.error as jest.Mock).mock.calls[0][0]).toBe('Client error report');
  });

  it('handles invalid JSON body gracefully', async () => {
    const requestLike = {
      json: jest.fn().mockRejectedValue(new Error('bad json')),
      headers: {
        get: jest.fn(() => null),
      },
    } as unknown as Request;

    const res = await POST(requestLike);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
