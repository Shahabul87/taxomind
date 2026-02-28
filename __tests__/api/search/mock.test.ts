jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET } from '@/app/api/search/mock/route';
import { NextRequest } from 'next/server';

describe('/api/search/mock route', () => {
  it('returns 400 for short search queries', async () => {
    const req = new NextRequest('http://localhost:3000/api/search/mock?q=a');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.totalResults).toBe(0);
  });

  it('returns filtered mock results for valid query', async () => {
    const req = new NextRequest('http://localhost:3000/api/search/mock?q=react');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalResults).toBeGreaterThan(0);
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results[0]).toHaveProperty('type');
  });
});
