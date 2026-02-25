/**
 * Tests for Auth Clear Session Route - app/api/auth/clear-session/route.ts
 *
 * Covers: cookie clearing, success response, error handling
 */

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import { GET } from '@/app/api/auth/clear-session/route';
import { cookies } from 'next/headers';

const mockCookies = cookies as jest.Mock;

describe('GET /api/auth/clear-session', () => {
  let mockCookieStore: { delete: jest.Mock };

  beforeEach(() => {
    mockCookieStore = {
      delete: jest.fn(),
    };
    mockCookies.mockResolvedValue(mockCookieStore);
  });

  it('returns 200 with success message', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Auth session cleared');
  });

  it('attempts to delete all auth-related cookies', async () => {
    await GET();

    // The route attempts to delete 11 known auth cookie names
    const expectedCookies = [
      'authjs.session-token',
      'authjs.csrf-token',
      'authjs.callback-url',
      '__Secure-authjs.session-token',
      '__Secure-authjs.csrf-token',
      '__Secure-authjs.callback-url',
      '__Host-authjs.csrf-token',
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.csrf-token',
    ];

    for (const cookieName of expectedCookies) {
      expect(mockCookieStore.delete).toHaveBeenCalledWith(cookieName);
    }
  });

  it('includes Set-Cookie headers for expiring cookies', async () => {
    const res = await GET();

    // The response should have Set-Cookie headers as backup
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  });

  it('handles cookie deletion errors gracefully', async () => {
    // Some cookies may not exist, the route catches and ignores errors
    mockCookieStore.delete.mockImplementation((name: string) => {
      if (name === 'authjs.session-token') {
        throw new Error('Cookie not found');
      }
    });

    const res = await GET();
    const body = await res.json();

    // Should still return success even if some cookies fail to delete
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns correct content type', async () => {
    const res = await GET();

    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
