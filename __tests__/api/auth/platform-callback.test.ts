/**
 * Tests for Auth Platform Callback Route - app/api/auth/[platform]/callback/route.ts
 *
 * Covers: error handling, code/state validation, token exchange, user info, redirect flows
 */

// Mock @prisma/client so the route's `new PrismaClient()` works
jest.mock('@prisma/client', () => {
  const mockPrismaInstance = {
    socialMediaAccount: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaInstance),
    __mockPrismaInstance: mockPrismaInstance,
  };
});

// @/lib/logger is globally mocked

import { GET } from '@/app/api/auth/[platform]/callback/route';
import { NextRequest } from 'next/server';

function createRequest(platform = 'github', searchParams: Record<string, string> = {}) {
  const url = new URL(`http://localhost:3000/api/auth/${platform}/callback`);
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url.toString(), { method: 'GET' });
}

function createParams(platform: string) {
  return { params: Promise.resolve({ platform }) };
}

function createValidState(overrides: Record<string, unknown> = {}) {
  return Buffer.from(JSON.stringify({
    userId: 'user-1',
    platform: 'github',
    timestamp: Date.now(),
    ...overrides,
  })).toString('base64');
}

/**
 * Helper to get the location header as a string.
 * The mock NextResponse.redirect stores URL objects in the headers Map,
 * so we need to convert to string for assertions.
 */
function getLocation(res: { headers: { get: (key: string) => unknown } }): string {
  const loc = res.headers.get('location');
  return String(loc);
}

describe('GET /api/auth/[platform]/callback', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-github-secret';
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('redirects to profile with error when error param is present', async () => {
    const res = await GET(
      createRequest('github', { error: 'access_denied' }),
      createParams('github')
    );

    expect(res.status).toBe(302);
    expect(getLocation(res)).toContain('/profile?error=oauth_cancelled');
  });

  it('redirects to profile with error when code is missing', async () => {
    const res = await GET(
      createRequest('github', { state: createValidState() }),
      createParams('github')
    );

    expect(res.status).toBe(302);
    expect(getLocation(res)).toContain('/profile?error=missing_params');
  });

  it('redirects to profile with error when state is missing', async () => {
    const res = await GET(
      createRequest('github', { code: 'auth-code-123' }),
      createParams('github')
    );

    expect(res.status).toBe(302);
    expect(getLocation(res)).toContain('/profile?error=missing_params');
  });

  it('redirects to profile with error when state is invalid (not valid base64 JSON)', async () => {
    const res = await GET(
      createRequest('github', { code: 'auth-code-123', state: 'not-valid-base64!' }),
      createParams('github')
    );

    expect(res.status).toBe(302);
    expect(getLocation(res)).toContain('/profile?error=invalid_state');
  });

  it('redirects to profile with error for unsupported platform', async () => {
    const res = await GET(
      createRequest('unsupported', { code: 'auth-code', state: createValidState() }),
      createParams('unsupported')
    );

    expect(res.status).toBe(302);
    expect(getLocation(res)).toContain('/profile?error=platform_not_supported');
  });

  it('redirects to profile with token_exchange_failed when token exchange fails', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'invalid_grant', error_description: 'Code expired' }),
    });

    const res = await GET(
      createRequest('github', { code: 'expired-code', state: createValidState() }),
      createParams('github')
    );

    expect(res.status).toBe(302);
    expect(getLocation(res)).toContain('/profile?error=token_exchange_failed');
  });

  it('redirects to profile with user_info_failed when user info fetch fails', async () => {
    // First call: token exchange succeeds
    // Second call: user info fetch fails
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'token-123',
          refresh_token: 'refresh-456',
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'unauthorized' }),
      });

    const res = await GET(
      createRequest('github', { code: 'valid-code', state: createValidState() }),
      createParams('github')
    );

    expect(res.status).toBe(302);
    expect(getLocation(res)).toContain('/profile?error=user_info_failed');
  });

  it('redirects to profile with success on complete flow', async () => {
    // Token exchange
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'access-token-abc',
          refresh_token: 'refresh-token-xyz',
          expires_in: 3600,
        }),
      })
      // User info
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 12345,
          login: 'testuser',
          name: 'Test User',
          avatar_url: 'https://github.com/avatar.jpg',
          followers: 100,
          following: 50,
          public_repos: 25,
        }),
      })
      // Trigger data sync (background call, non-critical)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    const res = await GET(
      createRequest('github', { code: 'valid-code', state: createValidState() }),
      createParams('github')
    );

    expect(res.status).toBe(302);
    expect(getLocation(res)).toContain('/profile?success=platform_connected');
  });

  it('redirects to profile with token_exchange_failed when fetch rejects', async () => {
    // When fetch throws, exchangeCodeForToken catches it and returns { success: false }
    // which routes to token_exchange_failed
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

    const res = await GET(
      createRequest('github', { code: 'valid-code', state: createValidState() }),
      createParams('github')
    );

    expect(res.status).toBe(302);
    expect(getLocation(res)).toContain('/profile?error=token_exchange_failed');
  });
});
