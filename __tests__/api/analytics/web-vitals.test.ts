jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

jest.mock('@/lib/performance-monitoring', () => ({
  performanceMonitoring: {
    traceDatabaseQuery: jest.fn((_op: string, _model: string, fn: () => Promise<unknown>) => fn()),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/analytics/web-vitals/route';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { performanceMonitoring } from '@/lib/performance-monitoring';
import { NextRequest, NextResponse } from 'next/server';

const mockRateLimit = withRateLimit as jest.Mock;
const mockTrace = performanceMonitoring.traceDatabaseQuery as jest.Mock;

describe('/api/analytics/web-vitals route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockTrace.mockImplementation((_op: string, _model: string, fn: () => Promise<unknown>) => fn());
  });

  it('POST returns rate-limit response when blocked', async () => {
    mockRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: 'rate limited' }, { status: 429 })
    );

    const req = new NextRequest('http://localhost:3000/api/analytics/web-vitals', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('POST returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/web-vitals', {
      method: 'POST',
      body: JSON.stringify({ name: 'LCP' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Missing required fields');
  });

  it('POST stores valid web vitals event', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'x-session-id': 's-1' },
      body: JSON.stringify({
        name: 'LCP',
        value: 1800,
        rating: 'good',
        delta: 100,
        id: 'metric-1',
        navigationType: 'navigate',
        timestamp: new Date().toISOString(),
        url: '/dashboard',
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('GET returns aggregated web vitals', async () => {
    mockTrace.mockResolvedValueOnce([
      { name: 'LCP', value: 1000, rating: 'good' },
      { name: 'LCP', value: 2500, rating: 'needs-improvement' },
      { name: 'FID', value: 120, rating: 'poor' },
    ]);

    const req = new NextRequest('http://localhost:3000/api/analytics/web-vitals?timeframe=24h');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.timeframe).toBe('24h');
    expect(body.total).toBe(3);
    expect(Array.isArray(body.metrics)).toBe(true);
  });

  it('GET returns 500 on unexpected failure', async () => {
    mockTrace.mockRejectedValueOnce(new Error('query fail'));

    const req = new NextRequest('http://localhost:3000/api/analytics/web-vitals');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
