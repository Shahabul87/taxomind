/**
 * Tests for Analytics Page Load Route - app/api/analytics/page-load/route.ts
 *
 * Covers: POST (record page load metrics), GET (fetch aggregated metrics)
 * Auth: No auth required for POST, no auth for GET
 */

jest.mock('@/lib/performance-monitoring', () => ({
  performanceMonitoring: {
    traceDatabaseQuery: jest.fn((_op: string, _model: string, fn: () => Promise<unknown>) => fn()),
  },
}));

jest.mock('@/lib/utils/api-response', () => ({
  successResponse: jest.fn((data: unknown) => {
    const { NextResponse } = jest.requireMock('next/server');
    return NextResponse.json({ success: true, data }, { status: 200 });
  }),
  apiErrors: {
    validationError: jest.fn((details: unknown) => {
      const { NextResponse } = jest.requireMock('next/server');
      return NextResponse.json({ success: false, error: 'Validation error', details }, { status: 400 });
    }),
    internal: jest.fn(() => {
      const { NextResponse } = jest.requireMock('next/server');
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }),
  },
}));

import { POST, GET } from '@/app/api/analytics/page-load/route';
import { NextRequest } from 'next/server';

describe('POST /api/analytics/page-load', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records page load event with valid data', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/page-load', {
      method: 'POST',
      body: JSON.stringify({
        ttfb: 200,
        loadComplete: 1500,
        url: '/dashboard',
        timestamp: Date.now(),
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns validation error when ttfb is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/page-load', {
      method: 'POST',
      body: JSON.stringify({
        loadComplete: 1500,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns validation error when loadComplete is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/page-load', {
      method: 'POST',
      body: JSON.stringify({
        ttfb: 200,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('detects slow page loads and generates alerts', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/page-load', {
      method: 'POST',
      body: JSON.stringify({
        ttfb: 1000,
        loadComplete: 4000,
        domInteractive: 2500,
        url: '/slow-page',
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.alerts).toBeGreaterThan(0);
  });

  it('records full timing data', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/page-load', {
      method: 'POST',
      body: JSON.stringify({
        dns: 10,
        tcp: 20,
        ssl: 30,
        ttfb: 100,
        download: 50,
        domInteractive: 500,
        domComplete: 800,
        loadComplete: 1000,
        url: '/full-page',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('returns 500 on unexpected error', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/page-load', {
      method: 'POST',
      body: 'invalid-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/analytics/page-load', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns aggregated metrics with default timeframe', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/page-load');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.timeframe).toBe('24h');
  });

  it('supports custom timeframe parameter', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/page-load?timeframe=7d');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.timeframe).toBe('7d');
  });

  it('returns page-specific metrics when url filter applied', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/page-load?url=/dashboard'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.pageSpecific).toBeDefined();
    expect(data.data.pageSpecific.url).toBe('/dashboard');
  });
});
