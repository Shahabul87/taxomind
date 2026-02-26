jest.mock('@prisma/client', () => {
  const prismaMock = {
    socialMediaAccount: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => prismaMock),
  };
});

import { GET } from '@/app/api/auth/[platform]/callback/route';
import { NextRequest } from 'next/server';

function makeReq(platform: string, params: Record<string, string> = {}) {
  const url = new URL(`http://localhost:3000/api/auth/${platform}/callback`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

describe('api/auth/[platform]/callback route', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.GITHUB_CLIENT_ID = 'client-id';
    process.env.GITHUB_CLIENT_SECRET = 'client-secret';
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('redirects with missing_params when code/state missing', async () => {
    const res = await GET(makeReq('github'), { params: Promise.resolve({ platform: 'github' }) });

    expect(res.status).toBe(302);
    expect(String(res.headers.get('location'))).toContain('/profile?error=missing_params');
  });

  it('redirects with platform_not_supported for unknown platform', async () => {
    const state = Buffer.from(JSON.stringify({ userId: 'user-1' })).toString('base64');
    const res = await GET(
      makeReq('unknown', { code: 'abc', state }),
      { params: Promise.resolve({ platform: 'unknown' }) }
    );

    expect(res.status).toBe(302);
    expect(String(res.headers.get('location'))).toContain('/profile?error=platform_not_supported');
  });

  it('redirects with success when callback flow completes', async () => {
    const state = Buffer.from(JSON.stringify({ userId: 'user-1' })).toString('base64');
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token', refresh_token: 'refresh', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, login: 'tester', name: 'Tester', followers: 1, following: 2, public_repos: 3 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      }) as any;

    const res = await GET(
      makeReq('github', { code: 'abc', state }),
      { params: Promise.resolve({ platform: 'github' }) }
    );

    expect(res.status).toBe(302);
    expect(String(res.headers.get('location'))).toContain('/profile?success=platform_connected');
  });
});
