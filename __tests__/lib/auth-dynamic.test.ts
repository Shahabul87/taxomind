/**
 * Tests for lib/auth-dynamic.ts - authenticateApiRoute()
 *
 * Covers:
 * - Cookie-based session token discovery (4 cookie names in priority order)
 * - Authorization header fallback (Bearer token)
 * - Cookie vs header priority
 * - JWT decode via next-auth/jwt decode()
 * - User lookup via db.user.findUnique
 * - emailVerified gating
 * - Graceful error handling (decode failure, DB errors)
 */

// ---------------------------------------------------------------------------
// Module-level mocks (must appear before imports)
// ---------------------------------------------------------------------------

jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      get: jest.fn(),
    }),
  ),
}));

jest.mock('next-auth/jwt', () => ({
  decode: jest.fn(),
}));

// @/lib/db, @/auth, @/lib/logger are globally mocked via jest.setup.js

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { authenticateApiRoute } from '@/lib/auth-dynamic';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';

// Typed mock references
const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockDecode = decode as jest.MockedFunction<typeof decode>;
const mockFindUnique = db.user.findUnique as jest.Mock;

// We need a stable reference to the cookie get function that we can reconfigure per test.
// cookies() returns a promise of a cookie store; we grab the mock get fn from it.
let mockCookieGet: jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Configure mockCookieGet to return a value only for the specified cookie name.
 * All other cookie names return undefined (no value).
 */
function setCookie(name: string, value: string): void {
  mockCookieGet.mockImplementation((cookieName: string) => {
    if (cookieName === name) return { value };
    return undefined;
  });
}

/** Configure mockCookieGet to return nothing for any cookie name. */
function setNoCookies(): void {
  mockCookieGet.mockReturnValue(undefined);
}

/** Build a minimal NextRequest with an Authorization header. */
function requestWithBearer(token: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    headers: { authorization: `Bearer ${token}` },
  });
}

/** Standard decoded JWT payload representing a valid user. */
const VALID_DECODED = { sub: 'user-abc-123', email: 'alice@example.com', name: 'Alice' };

/** Standard DB user record returned by findUnique. */
const DB_USER = {
  id: 'user-abc-123',
  email: 'alice@example.com',
  name: 'Alice',
  emailVerified: new Date('2025-01-01'),
};

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('authenticateApiRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Rebuild the mock cookie store for each test so clearAllMocks does not
    // destroy the reference that the source module will see.
    mockCookieGet = jest.fn();
    mockCookies.mockResolvedValue({ get: mockCookieGet } as never);

    setNoCookies();
    mockDecode.mockResolvedValue(null as never);
    mockFindUnique.mockResolvedValue(null);
  });

  // -----------------------------------------------------------------------
  // 1. No cookie, no Authorization header
  // -----------------------------------------------------------------------
  it('returns null when no session cookie and no Authorization header are present', async () => {
    const result = await authenticateApiRoute();
    expect(result).toBeNull();
    // decode should never be called when there is no token
    expect(mockDecode).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 2. Finds token in "authjs.session-token"
  // -----------------------------------------------------------------------
  it('finds token in authjs.session-token cookie', async () => {
    setCookie('authjs.session-token', 'tok-authjs');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue(DB_USER);

    const result = await authenticateApiRoute();

    expect(mockDecode).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok-authjs' }),
    );
    expect(result).toEqual({
      id: 'user-abc-123',
      email: 'alice@example.com',
      name: 'Alice',
    });
  });

  // -----------------------------------------------------------------------
  // 3. Finds token in "__Secure-authjs.session-token"
  // -----------------------------------------------------------------------
  it('finds token in __Secure-authjs.session-token cookie', async () => {
    setCookie('__Secure-authjs.session-token', 'tok-secure-authjs');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue(DB_USER);

    const result = await authenticateApiRoute();

    expect(mockDecode).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok-secure-authjs' }),
    );
    expect(result).toEqual({
      id: 'user-abc-123',
      email: 'alice@example.com',
      name: 'Alice',
    });
  });

  // -----------------------------------------------------------------------
  // 4. Finds token in legacy "next-auth.session-token"
  // -----------------------------------------------------------------------
  it('finds token in legacy next-auth.session-token cookie', async () => {
    setCookie('next-auth.session-token', 'tok-legacy');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue(DB_USER);

    const result = await authenticateApiRoute();

    expect(mockDecode).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok-legacy' }),
    );
    expect(result).not.toBeNull();
    expect(result?.id).toBe('user-abc-123');
  });

  // -----------------------------------------------------------------------
  // 5. Finds token in legacy "__Secure-next-auth.session-token"
  // -----------------------------------------------------------------------
  it('finds token in legacy __Secure-next-auth.session-token cookie', async () => {
    setCookie('__Secure-next-auth.session-token', 'tok-legacy-secure');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue(DB_USER);

    const result = await authenticateApiRoute();

    expect(mockDecode).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok-legacy-secure' }),
    );
    expect(result).not.toBeNull();
    expect(result?.id).toBe('user-abc-123');
  });

  // -----------------------------------------------------------------------
  // 6. Extracts Bearer token from Authorization header
  // -----------------------------------------------------------------------
  it('extracts Bearer token from Authorization header when no cookie exists', async () => {
    setNoCookies();
    const request = requestWithBearer('bearer-tok-123');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue(DB_USER);

    const result = await authenticateApiRoute(request);

    expect(mockDecode).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'bearer-tok-123' }),
    );
    expect(result).toEqual({
      id: 'user-abc-123',
      email: 'alice@example.com',
      name: 'Alice',
    });
  });

  // -----------------------------------------------------------------------
  // 7. Prefers cookie over Authorization header
  // -----------------------------------------------------------------------
  it('prefers cookie token over Authorization header when both are present', async () => {
    setCookie('authjs.session-token', 'cookie-token');
    const request = requestWithBearer('header-token');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue(DB_USER);

    await authenticateApiRoute(request);

    // decode should receive the cookie token, not the header token
    expect(mockDecode).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'cookie-token' }),
    );
    expect(mockDecode).not.toHaveBeenCalledWith(
      expect.objectContaining({ token: 'header-token' }),
    );
  });

  // -----------------------------------------------------------------------
  // 8. Returns null when JWT decode returns null
  // -----------------------------------------------------------------------
  it('returns null when JWT decode returns null (invalid token)', async () => {
    setCookie('authjs.session-token', 'bad-token');
    mockDecode.mockResolvedValue(null);

    const result = await authenticateApiRoute();

    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 9. Returns null when decoded JWT has no sub field
  // -----------------------------------------------------------------------
  it('returns null when decoded JWT is missing the sub field', async () => {
    setCookie('authjs.session-token', 'no-sub-token');
    mockDecode.mockResolvedValue({ email: 'nobody@example.com' }); // no sub

    const result = await authenticateApiRoute();

    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 10. Returns null when user not found in DB
  // -----------------------------------------------------------------------
  it('returns null when the user is not found in the database', async () => {
    setCookie('authjs.session-token', 'valid-token');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue(null);

    const result = await authenticateApiRoute();

    expect(result).toBeNull();
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-abc-123' },
      }),
    );
  });

  // -----------------------------------------------------------------------
  // 11. Returns full user data on success
  // -----------------------------------------------------------------------
  it('returns { id, email, name } when authentication succeeds', async () => {
    setCookie('authjs.session-token', 'good-token');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue(DB_USER);

    const result = await authenticateApiRoute();

    expect(result).toEqual({
      id: 'user-abc-123',
      email: 'alice@example.com',
      name: 'Alice',
    });
  });

  // -----------------------------------------------------------------------
  // 12. Returns email as empty string when user.email is null
  // -----------------------------------------------------------------------
  it('returns empty string for email when user.email is null', async () => {
    setCookie('authjs.session-token', 'token');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue({
      ...DB_USER,
      email: null,
    });

    const result = await authenticateApiRoute();

    expect(result).not.toBeNull();
    expect(result?.email).toBe('');
  });

  // -----------------------------------------------------------------------
  // 13. Returns name as undefined when user.name is falsy
  // -----------------------------------------------------------------------
  it('returns name as undefined when user.name is empty string', async () => {
    setCookie('authjs.session-token', 'token');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue({
      ...DB_USER,
      name: '',
    });

    const result = await authenticateApiRoute();

    expect(result).not.toBeNull();
    expect(result?.name).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // 14. Handles decode throwing an error gracefully
  // -----------------------------------------------------------------------
  it('returns null when decode() throws an error', async () => {
    setCookie('authjs.session-token', 'crash-token');
    mockDecode.mockRejectedValue(new Error('JWT decode explosion'));

    const result = await authenticateApiRoute();

    expect(result).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 15. Handles database error gracefully
  // -----------------------------------------------------------------------
  it('returns null when db.user.findUnique throws an error', async () => {
    setCookie('authjs.session-token', 'valid-token');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockRejectedValue(new Error('Database connection lost'));

    const result = await authenticateApiRoute();

    expect(result).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 16. Returns null when user email is not verified
  // -----------------------------------------------------------------------
  it('returns null when user emailVerified is null', async () => {
    setCookie('authjs.session-token', 'valid-token');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue({
      ...DB_USER,
      emailVerified: null,
    });

    const result = await authenticateApiRoute();

    expect(result).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 17. Passes NEXTAUTH_SECRET and salt to decode
  // -----------------------------------------------------------------------
  it('passes NEXTAUTH_SECRET and salt env vars to decode', async () => {
    setCookie('authjs.session-token', 'any-token');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue(DB_USER);

    await authenticateApiRoute();

    expect(mockDecode).toHaveBeenCalledWith(
      expect.objectContaining({
        secret: process.env.NEXTAUTH_SECRET,
        salt: expect.any(String),
      }),
    );
  });

  // -----------------------------------------------------------------------
  // 18. Cookie priority: first matching cookie wins
  // -----------------------------------------------------------------------
  it('uses the first matching cookie name in priority order', async () => {
    // Simulate both __Secure-authjs and authjs cookies being present.
    // __Secure-authjs.session-token is checked first.
    mockCookieGet.mockImplementation((cookieName: string) => {
      if (cookieName === '__Secure-authjs.session-token') return { value: 'secure-tok' };
      if (cookieName === 'authjs.session-token') return { value: 'plain-tok' };
      return undefined;
    });
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue(DB_USER);

    await authenticateApiRoute();

    expect(mockDecode).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'secure-tok' }),
    );
  });

  // -----------------------------------------------------------------------
  // 19. Does not fall back to header when cookie exists but has empty value
  // -----------------------------------------------------------------------
  it('skips cookies with no value and falls through to Authorization header', async () => {
    // Cookie exists but has no value property (undefined)
    mockCookieGet.mockReturnValue({ value: '' });
    const request = requestWithBearer('fallback-bearer');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue(DB_USER);

    const result = await authenticateApiRoute(request);

    // Empty string is falsy for token?.value check, so it should skip cookies
    // and fall through to the bearer header
    expect(mockDecode).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'fallback-bearer' }),
    );
    expect(result).not.toBeNull();
  });

  // -----------------------------------------------------------------------
  // 20. Does not use Authorization header when request is undefined
  // -----------------------------------------------------------------------
  it('returns null when no cookie found and request is undefined', async () => {
    setNoCookies();

    const result = await authenticateApiRoute(undefined);

    expect(result).toBeNull();
    expect(mockDecode).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 21. Ignores non-Bearer Authorization header schemes
  // -----------------------------------------------------------------------
  it('ignores Authorization header that does not start with Bearer', async () => {
    setNoCookies();
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    });

    const result = await authenticateApiRoute(request);

    expect(result).toBeNull();
    expect(mockDecode).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 22. Calls findUnique with correct select fields
  // -----------------------------------------------------------------------
  it('selects id, email, name, and emailVerified from the database', async () => {
    setCookie('authjs.session-token', 'tok');
    mockDecode.mockResolvedValue(VALID_DECODED);
    mockFindUnique.mockResolvedValue(DB_USER);

    await authenticateApiRoute();

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-abc-123' },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });
  });
});
