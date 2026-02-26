jest.mock('@/auth.admin', () => ({
  adminHandlers: {
    GET: jest.fn(async () => new Response('admin get', { status: 200 })),
    POST: jest.fn(async () => new Response('admin post', { status: 201 })),
  },
}));

import { GET, POST } from '@/app/api/admin-auth/[...nextauth]/route';

describe('/api/admin-auth/[...nextauth] route', () => {
  it('proxies GET handler from admin auth handlers', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('proxies POST handler from admin auth handlers', async () => {
    const res = await POST();
    expect(res.status).toBe(201);
  });
});
