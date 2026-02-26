jest.mock('@/lib/api-protection', () => ({
  withAuth: jest.fn((handler: (...args: any[]) => Promise<Response>) => {
    return async (...args: any[]) => handler(...args);
  }),
}));

import { GET, PATCH } from '@/app/api/content-governance/approvals/[approvalId]/route';
import { NextRequest } from 'next/server';

describe('/api/content-governance/approvals/[approvalId] route', () => {
  it('GET returns 501 placeholder response', async () => {
    const req = new NextRequest('http://localhost:3000/api/content-governance/approvals/ap-1');
    const res = await GET(req, { params: Promise.resolve({ approvalId: 'ap-1' }) });
    expect(res.status).toBe(501);
  });

  it('PATCH returns 501 placeholder response', async () => {
    const req = new NextRequest('http://localhost:3000/api/content-governance/approvals/ap-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, { params: Promise.resolve({ approvalId: 'ap-1' }) });
    expect(res.status).toBe(501);
  });
});
