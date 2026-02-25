/**
 * Tests for MFA TOTP Verify Route - app/api/auth/mfa/totp/verify/route.ts
 *
 * Covers: rate limiting, auth, validation, TOTP verification, enable flow
 */

jest.mock('@/lib/auth-rate-limit-middleware', () => ({
  withAuthRateLimit: jest.fn(),
}));

// @/auth, @/lib/db, @/lib/logger, @/lib/auth/totp are globally mocked

import { POST } from '@/app/api/auth/mfa/totp/verify/route';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { verifyTOTPToken, decryptTOTPSecret } from '@/lib/auth/totp';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';

const mockAuth = auth as jest.Mock;
const mockRateLimit = withAuthRateLimit as jest.Mock;
const mockVerifyToken = verifyTOTPToken as jest.Mock;
const mockDecrypt = decryptTOTPSecret as jest.Mock;

function createRequest(token = '123456') {
  return new NextRequest('http://localhost:3000/api/auth/mfa/totp/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
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

describe('POST /api/auth/mfa/totp/verify', () => {
  beforeEach(() => {
    // Default: rate limit passes
    mockRateLimit.mockResolvedValue(RATE_LIMIT_PASS);

    // Default: authenticated user
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    // Default: user has TOTP setup initiated but not verified
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      totpSecret: 'encrypted-secret',
      totpEnabled: false,
      totpVerified: false,
      email: 'test@test.com',
    });

    // Default: decrypt and verify succeed
    mockDecrypt.mockResolvedValue('JBSWY3DPEHPK3PXP');
    mockVerifyToken.mockReturnValue(true);

    // Default: update succeeds
    (db.user.update as jest.Mock).mockResolvedValue({
      totpEnabled: true,
      totpVerified: true,
      isTwoFactorEnabled: true,
    });
  });

  it('returns rate limit response when rate limited', async () => {
    const rateLimitResponse = NextResponse.json(
      { error: 'Rate limited' },
      { status: 429 }
    );
    mockRateLimit.mockResolvedValue(rateLimitResponse);

    const res = await POST(createRequest());

    expect(res.status).toBe(429);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 400 for invalid token format (non-digits)', async () => {
    const res = await POST(createRequest('abcdef'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid token format');
  });

  it('returns 400 for token that is too short', async () => {
    const res = await POST(createRequest('123'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid token format');
  });

  it('returns 404 when user not found in database', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('User not found');
  });

  it('returns 400 when TOTP setup not initiated', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      totpSecret: null,
      totpEnabled: false,
      totpVerified: false,
      email: 'test@test.com',
    });

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('TOTP setup not initiated');
  });

  it('returns 400 when TOTP is already enabled', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      totpSecret: 'encrypted-secret',
      totpEnabled: true,
      totpVerified: true,
      email: 'test@test.com',
    });

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('already enabled');
  });

  it('returns 400 when token is invalid', async () => {
    mockVerifyToken.mockReturnValue(false);

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid verification code');
  });

  it('successfully enables TOTP on valid token', async () => {
    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totpEnabled).toBe(true);
    expect(body.data.setupComplete).toBe(true);

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: {
          totpEnabled: true,
          totpVerified: true,
          isTwoFactorEnabled: true,
        },
      })
    );
  });

  it('returns 500 on decryption error', async () => {
    mockDecrypt.mockRejectedValue(new Error('Decryption failed'));

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('encryption error');
  });
});
