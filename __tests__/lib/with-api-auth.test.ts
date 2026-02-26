/**
 * Tests for API Authentication HOC Utilities
 * Source: lib/with-api-auth.ts
 *
 * Covers: withAuth, withAdminAuth
 * - User authentication gating (401 when no user)
 * - Admin role gating (403 when not admin)
 * - AuthContext construction and forwarding
 * - Role default to 'USER' when missing
 * - Error handling (500 on auth exceptions)
 * - Handler response pass-through
 * - Null user name handling
 */

// jest.setup.js globally mocks @/lib/with-api-auth, so we must bypass
// that mock to test the real implementation.
jest.mock('@/lib/with-api-auth', () => jest.requireActual('@/lib/with-api-auth'));

// @/lib/auth is already globally mocked in jest.setup.js

import { withAuth, withAdminAuth } from '@/lib/with-api-auth';
import type { AuthContext, AuthenticatedHandler } from '@/lib/with-api-auth';
import { currentUser, currentRole } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockCurrentRole = currentRole as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRequest(url = 'http://localhost:3000/api/test'): NextRequest {
  return new NextRequest(url, { method: 'GET' });
}

/** Parse the JSON body from the mock NextResponse. */
async function parseResponseBody(response: NextResponse): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// withAuth
// ---------------------------------------------------------------------------

describe('withAuth', () => {
  beforeEach(() => {
    mockCurrentUser.mockReset();
    mockCurrentRole.mockReset();
  });

  // Test 1 -----------------------------------------------------------------
  it('returns 401 when no user is authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    mockCurrentRole.mockResolvedValue(null);

    const handler: AuthenticatedHandler = jest.fn();
    const wrapped = withAuth(handler);
    const response = await wrapped(createMockRequest());
    const body = await parseResponseBody(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  // Test 2 -----------------------------------------------------------------
  it('passes auth context to the handler when user is authenticated', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      name: 'Alice',
    });
    mockCurrentRole.mockResolvedValue('USER');

    const handler: AuthenticatedHandler = jest.fn(
      async (_req, _ctx, authContext) =>
        NextResponse.json({ received: authContext }),
    );

    const wrapped = withAuth(handler);
    const request = createMockRequest();
    await wrapped(request);

    expect(handler).toHaveBeenCalledTimes(1);

    // Verify the authContext argument (3rd positional parameter)
    const authCtx = (handler as jest.Mock).mock.calls[0][2] as AuthContext;
    expect(authCtx.user.id).toBe('user-1');
    expect(authCtx.user.email).toBe('alice@example.com');
    expect(authCtx.user.name).toBe('Alice');
    expect(authCtx.user.role).toBe('USER');
    expect(authCtx.session).toBeNull();
  });

  // Test 3 -----------------------------------------------------------------
  it('defaults role to USER when currentRole returns falsy', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-2',
      email: 'bob@example.com',
      name: 'Bob',
    });
    mockCurrentRole.mockResolvedValue(null);

    const handler: AuthenticatedHandler = jest.fn(
      async () => NextResponse.json({ ok: true }),
    );

    const wrapped = withAuth(handler);
    await wrapped(createMockRequest());

    const authCtx = (handler as jest.Mock).mock.calls[0][2] as AuthContext;
    expect(authCtx.user.role).toBe('USER');
  });

  // Test 4 -----------------------------------------------------------------
  it('passes correct user data (id, email, name, role)', async () => {
    const mockUser = {
      id: 'user-42',
      email: 'charlie@example.com',
      name: 'Charlie',
    };
    mockCurrentUser.mockResolvedValue(mockUser);
    mockCurrentRole.mockResolvedValue('ADMIN');

    const handler: AuthenticatedHandler = jest.fn(
      async () => NextResponse.json({ ok: true }),
    );

    const wrapped = withAuth(handler);
    await wrapped(createMockRequest());

    const authCtx = (handler as jest.Mock).mock.calls[0][2] as AuthContext;
    expect(authCtx.user).toEqual({
      id: 'user-42',
      email: 'charlie@example.com',
      name: 'Charlie',
      role: 'ADMIN',
    });
  });

  // Test 5 -----------------------------------------------------------------
  it('returns 500 when currentUser throws an error', async () => {
    mockCurrentUser.mockRejectedValue(new Error('Database connection lost'));
    mockCurrentRole.mockResolvedValue(null);

    const handler: AuthenticatedHandler = jest.fn();
    const wrapped = withAuth(handler);
    const response = await wrapped(createMockRequest());
    const body = await parseResponseBody(response);

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
      },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  // Test 6 -----------------------------------------------------------------
  it('passes through the handler response unchanged', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
    });
    mockCurrentRole.mockResolvedValue('USER');

    const expectedData = { items: [1, 2, 3], total: 3 };
    const handler: AuthenticatedHandler = jest.fn(
      async () => NextResponse.json(expectedData, { status: 200 }),
    );

    const wrapped = withAuth(handler);
    const response = await wrapped(createMockRequest());
    const body = await parseResponseBody(response);

    expect(response.status).toBe(200);
    expect(body).toEqual(expectedData);
  });

  // Test 11 ----------------------------------------------------------------
  it('handles null user name gracefully', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-no-name',
      email: 'noname@example.com',
      name: null,
    });
    mockCurrentRole.mockResolvedValue('USER');

    const handler: AuthenticatedHandler = jest.fn(
      async () => NextResponse.json({ ok: true }),
    );

    const wrapped = withAuth(handler);
    await wrapped(createMockRequest());

    const authCtx = (handler as jest.Mock).mock.calls[0][2] as AuthContext;
    expect(authCtx.user.name).toBeNull();
  });

  // Additional: context merging
  it('merges user into the context parameter passed to the handler', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'merge@example.com',
      name: 'Merge',
    });
    mockCurrentRole.mockResolvedValue('USER');

    const handler: AuthenticatedHandler = jest.fn(
      async () => NextResponse.json({ ok: true }),
    );

    const wrapped = withAuth(handler);
    await wrapped(createMockRequest(), { params: { id: '123' } });

    // Second argument should have both original context props and user
    const ctxArg = (handler as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
    expect(ctxArg).toHaveProperty('params');
    expect(ctxArg).toHaveProperty('user');
  });
});

// ---------------------------------------------------------------------------
// withAdminAuth
// ---------------------------------------------------------------------------

describe('withAdminAuth', () => {
  beforeEach(() => {
    mockCurrentUser.mockReset();
    mockCurrentRole.mockReset();
  });

  // Test 7 -----------------------------------------------------------------
  it('returns 401 when no user is authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    mockCurrentRole.mockResolvedValue(null);

    const handler: AuthenticatedHandler = jest.fn();
    const wrapped = withAdminAuth(handler);
    const response = await wrapped(createMockRequest());
    const body = await parseResponseBody(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  // Test 8 -----------------------------------------------------------------
  it('returns 403 when user is not an admin', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Regular User',
    });
    mockCurrentRole.mockResolvedValue('USER');

    const handler: AuthenticatedHandler = jest.fn();
    const wrapped = withAdminAuth(handler);
    const response = await wrapped(createMockRequest());
    const body = await parseResponseBody(response);

    expect(response.status).toBe(403);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  // Test 9 -----------------------------------------------------------------
  it('allows admin access and calls the handler', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin User',
    });
    mockCurrentRole.mockResolvedValue('ADMIN');

    const handler: AuthenticatedHandler = jest.fn(
      async () => NextResponse.json({ admin: true }, { status: 200 }),
    );

    const wrapped = withAdminAuth(handler);
    const response = await wrapped(createMockRequest());
    const body = await parseResponseBody(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({ admin: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  // Test 10 ----------------------------------------------------------------
  it('passes correct auth context to the handler', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'admin-2',
      email: 'super@example.com',
      name: 'Super Admin',
    });
    mockCurrentRole.mockResolvedValue('ADMIN');

    const handler: AuthenticatedHandler = jest.fn(
      async () => NextResponse.json({ ok: true }),
    );

    const wrapped = withAdminAuth(handler);
    await wrapped(createMockRequest());

    const authCtx = (handler as jest.Mock).mock.calls[0][2] as AuthContext;
    expect(authCtx.user).toEqual({
      id: 'admin-2',
      email: 'super@example.com',
      name: 'Super Admin',
      role: 'ADMIN',
    });
    expect(authCtx.session).toBeNull();
  });

  // Test 12 ----------------------------------------------------------------
  it('returns 500 when auth throws an error', async () => {
    mockCurrentUser.mockRejectedValue(new Error('Session store unavailable'));
    mockCurrentRole.mockResolvedValue(null);

    const handler: AuthenticatedHandler = jest.fn();
    const wrapped = withAdminAuth(handler);
    const response = await wrapped(createMockRequest());
    const body = await parseResponseBody(response);

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
      },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  // Additional: 403 for null role (not ADMIN)
  it('returns 403 when role is null (not ADMIN)', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'nullrole@example.com',
      name: 'Null Role',
    });
    mockCurrentRole.mockResolvedValue(null);

    const handler: AuthenticatedHandler = jest.fn();
    const wrapped = withAdminAuth(handler);
    const response = await wrapped(createMockRequest());

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  // Additional: handles null name for admin
  it('handles null user name for admin users', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'admin-no-name',
      email: 'admin-anon@example.com',
      name: undefined,
    });
    mockCurrentRole.mockResolvedValue('ADMIN');

    const handler: AuthenticatedHandler = jest.fn(
      async () => NextResponse.json({ ok: true }),
    );

    const wrapped = withAdminAuth(handler);
    await wrapped(createMockRequest());

    const authCtx = (handler as jest.Mock).mock.calls[0][2] as AuthContext;
    expect(authCtx.user.name).toBeNull();
  });
});
