/**
 * Tests for Auth Debug Route - app/api/auth/debug/route.ts
 *
 * Covers: access control (dev mode, token), config reporting, recommendations
 */

import { GET } from '@/app/api/auth/debug/route';
import { NextRequest } from 'next/server';

function createRequest(queryParams: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/auth/debug');
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url.toString(), { method: 'GET' }) as unknown as Request;
}

describe('GET /api/auth/debug', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset to test defaults
    process.env.NODE_ENV = 'test';
    process.env.AUTH_DEBUG_TOKEN = 'valid-debug-token';
    process.env.AUTH_SECRET = 'test-secret';
    delete process.env.AUTH_URL;
    delete process.env.AUTH_TRUST_HOST;
    process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.GOOGLE_CLIENT_ID = 'test-google-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret';
    process.env.GITHUB_CLIENT_ID = 'test-github-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-github-secret';
  });

  afterEach(() => {
    // Restore original env
    Object.keys(process.env).forEach((key) => {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  });

  it('returns 401 in production without valid debug token', async () => {
    process.env.NODE_ENV = 'production';

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 401 in production with invalid token', async () => {
    process.env.NODE_ENV = 'production';

    const res = await GET(createRequest({ token: 'wrong-token' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 200 in development mode without token', async () => {
    process.env.NODE_ENV = 'development';

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.environment).toBe('development');
    expect(body.auth).toBeDefined();
    expect(body.urls).toBeDefined();
    expect(body.oauth).toBeDefined();
  });

  it('returns 200 in production with valid AUTH_DEBUG_TOKEN', async () => {
    process.env.NODE_ENV = 'production';

    const res = await GET(createRequest({ token: 'valid-debug-token' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.environment).toBe('production');
  });

  it('returns config with SET/MISSING status for secrets (no actual secrets leaked)', async () => {
    process.env.NODE_ENV = 'development';

    const res = await GET(createRequest());
    const body = await res.json();

    // Secrets should show SET/MISSING, never the actual value
    expect(body.auth.AUTH_SECRET).toBe('SET');
    expect(body.auth.NEXTAUTH_SECRET).toBe('SET');
    expect(body.oauth.google.clientId).toBe('SET');
    expect(body.oauth.google.clientSecret).toBe('SET');
    expect(body.oauth.github.clientId).toBe('SET');
    expect(body.oauth.github.clientSecret).toBe('SET');
  });

  it('shows MISSING for unset credentials', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.AUTH_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;

    const res = await GET(createRequest());
    const body = await res.json();

    expect(body.auth.AUTH_SECRET).toBe('MISSING');
    expect(body.oauth.google.clientId).toBe('MISSING');
  });

  it('generates recommendations for missing AUTH_TRUST_HOST', async () => {
    process.env.NODE_ENV = 'development';

    const res = await GET(createRequest());
    const body = await res.json();

    // AUTH_TRUST_HOST not set in test env, so recommendation should exist
    expect(body.recommendations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('AUTH_TRUST_HOST')
      ])
    );
  });

  it('generates URL mismatch warning when domains differ', async () => {
    process.env.NODE_ENV = 'development';
    process.env.AUTH_URL = 'https://auth.example.com';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.different.com';

    const res = await GET(createRequest());
    const body = await res.json();

    expect(body.recommendations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('URL mismatch')
      ])
    );
  });

  it('reports good config when all values are properly set', async () => {
    process.env.NODE_ENV = 'development';
    process.env.AUTH_TRUST_HOST = 'true';
    process.env.AUTH_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const res = await GET(createRequest());
    const body = await res.json();

    expect(body.recommendations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('looks correct')
      ])
    );
  });

  it('includes timestamp in response', async () => {
    process.env.NODE_ENV = 'development';

    const res = await GET(createRequest());
    const body = await res.json();

    expect(body.timestamp).toBeDefined();
    // Verify it is a valid ISO date string
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});
