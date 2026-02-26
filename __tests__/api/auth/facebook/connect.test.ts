jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/auth/facebook/connect/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/auth/facebook/connect route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/auth/facebook/connect');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns failure redirect when auth check throws', async () => {
    mockAuth.mockRejectedValueOnce(new Error('auth failure'));
    const req = new NextRequest('http://localhost:3000/api/auth/facebook/connect');
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(String(res.headers.get('location'))).toContain('/profile?error=facebook_connection_failed');
  });
});
