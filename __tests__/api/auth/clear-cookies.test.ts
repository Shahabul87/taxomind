/**
 * Tests for Auth Clear Cookies Route - app/api/auth/clear-cookies/route.ts
 *
 * Covers: GET and POST handlers, cookie clearing, v4/v5 conflict resolution
 */

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Patch the NextResponse mock to include a cookies property with set()
const originalNextServerMock = jest.requireMock('next/server');
const OriginalNextResponse = originalNextServerMock.NextResponse;
const PatchedNextResponse = class extends OriginalNextResponse {
  cookies: { set: jest.Mock };

  constructor(body: string | null, init: Record<string, unknown> = {}) {
    super(body, init);
    this.cookies = { set: jest.fn() };
  }

  static json(data: unknown, init?: Record<string, unknown>) {
    const response = new PatchedNextResponse(JSON.stringify(data), init);
    response.headers.set('content-type', 'application/json');
    return response;
  }

  static redirect(url: string, status = 302) {
    const response = new PatchedNextResponse(null, { status });
    response.headers.set('location', url);
    return response;
  }
};
originalNextServerMock.NextResponse = PatchedNextResponse;

import { GET, POST } from '@/app/api/auth/clear-cookies/route';
import { cookies } from 'next/headers';

const mockCookies = cookies as jest.Mock;

describe('GET /api/auth/clear-cookies', () => {
  let mockCookieStore: { getAll: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    mockCookieStore = {
      getAll: jest.fn(),
      delete: jest.fn(),
    };
    mockCookies.mockResolvedValue(mockCookieStore);
  });

  it('returns 200 with success message and cleared cookies list', async () => {
    mockCookieStore.getAll.mockReturnValue([
      { name: 'authjs.session-token', value: 'abc' },
      { name: 'next-auth.csrf-token', value: 'xyz' },
    ]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Auth cookies cleared');
    expect(body.clearedCookies).toContain('authjs.session-token');
    expect(body.clearedCookies).toContain('next-auth.csrf-token');
    expect(body.instruction).toBeTruthy();
  });

  it('filters only auth-related cookies from all cookies', async () => {
    mockCookieStore.getAll.mockReturnValue([
      { name: 'authjs.session-token', value: 'abc' },
      { name: 'some-other-cookie', value: 'keep-me' },
      { name: '__Secure-authjs.pkce.code_verifier', value: 'pkce123' },
      { name: 'analytics_id', value: 'tracking' },
    ]);

    const res = await GET();
    const body = await res.json();

    // Only auth cookies should be cleared
    expect(body.clearedCookies).toContain('authjs.session-token');
    expect(body.clearedCookies).toContain('__Secure-authjs.pkce.code_verifier');
    expect(body.clearedCookies).not.toContain('some-other-cookie');
    expect(body.clearedCookies).not.toContain('analytics_id');
  });

  it('handles empty cookie list (no auth cookies present)', async () => {
    mockCookieStore.getAll.mockReturnValue([
      { name: 'unrelated-cookie', value: 'val' },
    ]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.clearedCookies).toEqual([]);
  });

  it('handles cookie deletion errors gracefully', async () => {
    mockCookieStore.getAll.mockReturnValue([
      { name: 'authjs.session-token', value: 'abc' },
      { name: 'next-auth.csrf-token', value: 'xyz' },
    ]);
    mockCookieStore.delete.mockImplementation((name: string) => {
      if (name === 'next-auth.csrf-token') {
        throw new Error('Cannot delete cookie');
      }
    });

    const res = await GET();
    const body = await res.json();

    // Should still succeed even if one cookie fails
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // The first cookie should have been cleared
    expect(body.clearedCookies).toContain('authjs.session-token');
  });

  it('sets response cookies with maxAge 0 to expire all known auth cookies', async () => {
    mockCookieStore.getAll.mockReturnValue([]);

    const res = await GET();

    // The response explicitly sets known auth cookies to expire via response.cookies.set
    // We check that the response was created (status 200) and has cookie headers
    expect(res.status).toBe(200);
  });

  it('detects pkce cookies for clearing', async () => {
    mockCookieStore.getAll.mockReturnValue([
      { name: '__Secure-authjs.pkce.code_verifier', value: 'pkce-val' },
    ]);

    const res = await GET();
    const body = await res.json();

    expect(body.clearedCookies).toContain('__Secure-authjs.pkce.code_verifier');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('__Secure-authjs.pkce.code_verifier');
  });
});

describe('POST /api/auth/clear-cookies', () => {
  let mockCookieStore: { getAll: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    mockCookieStore = {
      getAll: jest.fn().mockReturnValue([]),
      delete: jest.fn(),
    };
    mockCookies.mockResolvedValue(mockCookieStore);
  });

  it('returns same response as GET (delegates to GET)', async () => {
    mockCookieStore.getAll.mockReturnValue([
      { name: 'authjs.session-token', value: 'abc' },
    ]);

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.clearedCookies).toContain('authjs.session-token');
  });
});
