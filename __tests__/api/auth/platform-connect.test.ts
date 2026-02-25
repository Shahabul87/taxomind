/**
 * Tests for Auth Platform Connect Route - app/api/auth/[platform]/connect/route.ts
 *
 * Covers: auth check, unsupported platform, missing config, OAuth redirect
 *
 * Note: PLATFORM_CONFIGS captures env vars at module load time.
 * jest.setup.js sets GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID,
 * and GOOGLE_CLIENT_SECRET, so those platforms are "configured" in tests.
 * Platforms like twitter/discord have no env vars set in jest.setup.js,
 * so they test the "not configured" path.
 */

// @/auth, @/lib/logger are globally mocked

import { GET } from '@/app/api/auth/[platform]/connect/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';

const mockAuth = auth as jest.Mock;

function createRequest(platform = 'github') {
  return new NextRequest(`http://localhost:3000/api/auth/${platform}/connect`, {
    method: 'GET',
  });
}

function createParams(platform: string) {
  return { params: Promise.resolve({ platform }) };
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

describe('GET /api/auth/[platform]/connect', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });
  });

  it('redirects to signin when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(createRequest(), createParams('github'));

    expect(res.status).toBe(302);
    expect(getLocation(res)).toContain('/auth/signin');
  });

  it('redirects to signin when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const res = await GET(createRequest(), createParams('github'));

    expect(res.status).toBe(302);
    expect(getLocation(res)).toContain('/auth/signin');
  });

  it('returns 400 for unsupported platform', async () => {
    const res = await GET(createRequest('unsupported'), createParams('unsupported'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Platform not supported');
  });

  it('returns 500 when platform credentials are not configured (twitter has no env vars)', async () => {
    // twitter is a supported platform but TWITTER_CLIENT_ID is not set in jest.setup.js
    const res = await GET(createRequest('twitter'), createParams('twitter'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Platform not configured');
  });

  it('returns 500 for discord platform with no env vars configured', async () => {
    // discord is a supported platform but DISCORD_CLIENT_ID is not set in jest.setup.js
    const res = await GET(createRequest('discord'), createParams('discord'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Platform not configured');
  });

  it('redirects to OAuth URL for configured github platform', async () => {
    // GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set in jest.setup.js
    const res = await GET(createRequest('github'), createParams('github'));

    expect(res.status).toBe(302);
    const location = getLocation(res);
    expect(location).toContain('https://github.com/login/oauth/authorize');
    expect(location).toContain('client_id=');
    expect(location).toContain('redirect_uri=');
    expect(location).toContain('state=');
    expect(location).toContain('scope=');
  });

  it('handles platform name case-insensitively', async () => {
    const res = await GET(createRequest('GitHub'), createParams('GitHub'));

    expect(res.status).toBe(302);
    const location = getLocation(res);
    expect(location).toContain('https://github.com/login/oauth/authorize');
  });

  it('includes user id and platform in state parameter', async () => {
    const res = await GET(createRequest('github'), createParams('github'));

    const location = getLocation(res);
    const url = new URL(location);
    const state = url.searchParams.get('state');
    const decoded = JSON.parse(Buffer.from(state!, 'base64').toString());

    expect(decoded.userId).toBe('user-1');
    expect(decoded.platform).toBe('github');
    expect(decoded.timestamp).toBeDefined();
  });

  it('returns 500 on unexpected error', async () => {
    mockAuth.mockRejectedValue(new Error('Auth service unavailable'));

    const res = await GET(createRequest('github'), createParams('github'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Authentication failed');
  });
});
