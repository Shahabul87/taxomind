jest.mock('@/lib/api-protection', () => ({
  withAuth: jest.fn((handler: (...args: any[]) => Promise<Response>) => {
    return async (...args: any[]) => handler(...args);
  }),
}));

import { GET } from '@/app/api/content-governance/analytics/route';
import { NextRequest } from 'next/server';

describe('/api/content-governance/analytics route', () => {
  it('returns 501 placeholder response', async () => {
    const req = new NextRequest('http://localhost:3000/api/content-governance/analytics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(501);
    expect(body.error).toContain('not yet implemented');
  });
});
