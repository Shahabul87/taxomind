/**
 * Tests for 2FA Verification Route - app/api/auth/2fa/route.ts
 *
 * Covers: rate limiting, validation, token verification, confirmation creation
 */

jest.mock('@/lib/auth-rate-limit-middleware', () => ({
  withAuthRateLimit: jest.fn(),
}));

jest.mock('@/data/user', () => ({
  getUserByEmail: jest.fn(),
}));

jest.mock('@/data/two-factor-token', () => ({
  getTwoFactorTokenByToken: jest.fn(),
}));

jest.mock('@/data/two-factor-confirmation', () => ({
  getTwoFactorConfirmationByUserId: jest.fn(),
}));

// @/lib/db, @/lib/logger are globally mocked

import { POST } from '@/app/api/auth/2fa/route';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserByEmail } from '@/data/user';
import { getTwoFactorTokenByToken } from '@/data/two-factor-token';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';

const mockRateLimit = withAuthRateLimit as jest.Mock;
const mockGetUserByEmail = getUserByEmail as jest.Mock;
const mockGetTokenByToken = getTwoFactorTokenByToken as jest.Mock;
const mockGetConfirmation = getTwoFactorConfirmationByUserId as jest.Mock;

function createRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost:3000/api/auth/2fa', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const RATE_LIMIT_PASS = {
  success: true,
  headers: {
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': '9',
  },
  rateLimitResult: { success: true, limit: 10, remaining: 9, reset: Date.now() + 60000 },
};

describe('POST /api/auth/2fa', () => {
  beforeEach(() => {
    // Default: rate limit passes
    mockRateLimit.mockResolvedValue(RATE_LIMIT_PASS);

    // Default: user exists with 2FA enabled
    mockGetUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      isTwoFactorEnabled: true,
    });

    // Default: valid token
    mockGetTokenByToken.mockResolvedValue({
      id: 'token-1',
      email: 'test@test.com',
      token: '123456',
      expires: new Date(Date.now() + 300000), // 5 min from now
    });

    // Default: no existing confirmation
    mockGetConfirmation.mockResolvedValue(null);

    // Default: DB operations succeed
    (db.twoFactorToken.delete as jest.Mock).mockResolvedValue({});
    (db.twoFactorConfirmation.delete as jest.Mock).mockResolvedValue({});
    (db.twoFactorConfirmation.create as jest.Mock).mockResolvedValue({
      id: 'conf-1',
      userId: 'user-1',
    });
  });

  it('returns rate limit response when rate limited', async () => {
    const rateLimitResponse = NextResponse.json(
      { error: 'Rate limited' },
      { status: 429 }
    );
    mockRateLimit.mockResolvedValue(rateLimitResponse);

    const res = await POST(createRequest({ email: 'test@test.com', token: '123456' }));

    expect(res.status).toBe(429);
  });

  it('returns 400 for invalid body (missing fields)', async () => {
    const res = await POST(createRequest({ email: 'not-an-email' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid fields');
  });

  it('returns 400 for invalid body (token too short)', async () => {
    const res = await POST(createRequest({ email: 'test@test.com', token: '12' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid fields');
  });

  it('returns 404 when user is not found', async () => {
    mockGetUserByEmail.mockResolvedValue(null);

    const res = await POST(createRequest({ email: 'missing@test.com', token: '123456' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('User not found');
  });

  it('returns 400 when 2FA is not enabled for user', async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      isTwoFactorEnabled: false,
    });

    const res = await POST(createRequest({ email: 'test@test.com', token: '123456' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('not enabled');
  });

  it('returns 400 when token is invalid (not found)', async () => {
    mockGetTokenByToken.mockResolvedValue(null);

    const res = await POST(createRequest({ email: 'test@test.com', token: '999999' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid code');
  });

  it('returns 400 when token email does not match', async () => {
    mockGetTokenByToken.mockResolvedValue({
      id: 'token-1',
      email: 'other@test.com',
      token: '123456',
      expires: new Date(Date.now() + 300000),
    });

    const res = await POST(createRequest({ email: 'test@test.com', token: '123456' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid code');
  });

  it('returns 400 when token has expired', async () => {
    mockGetTokenByToken.mockResolvedValue({
      id: 'token-1',
      email: 'test@test.com',
      token: '123456',
      expires: new Date(Date.now() - 60000), // 1 minute ago
    });

    const res = await POST(createRequest({ email: 'test@test.com', token: '123456' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('expired');
  });

  it('returns 200 on success and creates confirmation', async () => {
    const res = await POST(createRequest({ email: 'test@test.com', token: '123456' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toContain('verified');

    // Verify token was deleted
    expect(db.twoFactorToken.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'token-1' },
      })
    );

    // Verify confirmation was created
    expect(db.twoFactorConfirmation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: 'user-1' },
      })
    );
  });

  it('deletes existing confirmation before creating a new one', async () => {
    mockGetConfirmation.mockResolvedValue({
      id: 'existing-conf',
      userId: 'user-1',
    });

    const res = await POST(createRequest({ email: 'test@test.com', token: '123456' }));
    const body = await res.json();

    expect(res.status).toBe(200);

    // Verify old confirmation was deleted
    expect(db.twoFactorConfirmation.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'existing-conf' },
      })
    );

    // Verify new confirmation was created
    expect(db.twoFactorConfirmation.create).toHaveBeenCalled();
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUserByEmail.mockRejectedValue(new Error('Database error'));

    const res = await POST(createRequest({ email: 'test@test.com', token: '123456' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Internal server error');
  });
});
