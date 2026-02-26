jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET } from '@/app/api/social/accounts/check/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/social/accounts/check route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.account.findFirst as jest.Mock).mockResolvedValue({ id: 'a1' });
  });

  it('returns 400 when platform query is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/social/accounts/check');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/social/accounts/check?platform=twitter');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('checks twitter/x connection with OR provider lookup', async () => {
    const req = new NextRequest('http://localhost:3000/api/social/accounts/check?platform=twitter');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.connected).toBe(true);
  });

  it('checks generic provider connection', async () => {
    (db.account.findFirst as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/social/accounts/check?platform=facebook');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.connected).toBe(false);
  });
});
