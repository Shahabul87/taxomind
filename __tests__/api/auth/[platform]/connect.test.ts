import { GET } from '@/app/api/auth/[platform]/connect/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

function params(platform: string) {
  return { params: Promise.resolve({ platform }) };
}

describe('/api/auth/[platform]/connect route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('redirects to signin when user is not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/auth/twitter/connect');
    const res = await GET(req, params('twitter'));

    expect(res.status).toBe(302);
    expect(String(res.headers.get('location'))).toContain('/auth/signin');
  });

  it('returns 400 for unsupported platform', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/unknown/connect');
    const res = await GET(req, params('unknown'));

    expect(res.status).toBe(400);
  });

  it('returns 500 when platform config is missing credentials', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/twitter/connect');
    const res = await GET(req, params('twitter'));

    expect(res.status).toBe(500);
  });
});
