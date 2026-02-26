jest.mock('@/lib/error-handling/error-logger', () => ({
  errorLogger: {
    logError: jest.fn(),
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
}));

import { GET, POST } from '@/app/api/error-log/route';
import { errorLogger } from '@/lib/error-handling/error-logger';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

const mockLogError = errorLogger.logError as jest.Mock;
const mockRateLimit = rateLimit as jest.Mock;

describe('/api/error-log route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 49 });
    mockLogError.mockResolvedValue(undefined);
  });

  it('GET returns 405', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });

  it('POST returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0 });
    const req = new NextRequest('http://localhost:3000/api/error-log', {
      method: 'POST',
      body: JSON.stringify({ message: 'boom' }),
      headers: { 'x-forwarded-for': '1.1.1.1' },
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('POST returns 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-log', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST logs validated error payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-log', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Client crashed',
        stack: 'Error: Client crashed',
        component: 'Widget',
        url: 'https://example.com/page',
        userAgent: 'test-agent',
        context: { action: 'click' },
      }),
      headers: { 'x-real-ip': '2.2.2.2' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockLogError).toHaveBeenCalled();
  });
});
