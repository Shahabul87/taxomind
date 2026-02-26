jest.mock('@/lib/api-protection', () => ({
  withAuth: jest.fn((handler: (...args: any[]) => Promise<Response>) => {
    return async (...args: any[]) => handler(...args);
  }),
}));

import { GET, POST } from '@/app/api/content-governance/bulk-operations/route';
import { NextRequest } from 'next/server';

describe('/api/content-governance/bulk-operations route', () => {
  it('GET returns 501 placeholder response', async () => {
    const req = new NextRequest('http://localhost:3000/api/content-governance/bulk-operations');
    const res = await GET(req);
    expect(res.status).toBe(501);
  });

  it('POST returns 501 placeholder response', async () => {
    const req = new NextRequest('http://localhost:3000/api/content-governance/bulk-operations', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(501);
  });
});
