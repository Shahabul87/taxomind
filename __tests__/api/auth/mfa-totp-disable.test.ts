/**
 * Tests for MFA TOTP Disable Route - app/api/auth/mfa/totp/disable/route.ts
 *
 * Covers: rate limiting, auth, validation, TOTP token disable, recovery code disable
 */

jest.mock('@/lib/auth-rate-limit-middleware', () => ({
  withAuthRateLimit: jest.fn(),
}));

// @/auth, @/lib/db, @/lib/logger, @/lib/auth/totp are globally mocked

import { POST } from '@/app/api/auth/mfa/totp/disable/route';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  decryptTOTPSecret,
  verifyTOTPToken,
  verifyRecoveryCode,
} from '@/lib/auth/totp';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';

const mockAuth = auth as jest.Mock;
const mockRateLimit = withAuthRateLimit as jest.Mock;
const mockDecrypt = decryptTOTPSecret as jest.Mock;
const mockVerifyToken = verifyTOTPToken as jest.Mock;
const mockVerifyRecovery = verifyRecoveryCode as jest.Mock;

function createRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost:3000/api/auth/mfa/totp/disable', {
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

describe('POST /api/auth/mfa/totp/disable', () => {
  beforeEach(() => {
    // Default: rate limit passes
    mockRateLimit.mockResolvedValue(RATE_LIMIT_PASS);

    // Default: authenticated user
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    // Default: user has TOTP enabled
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      totpSecret: 'encrypted-secret',
      totpEnabled: true,
      totpVerified: true,
      recoveryCodes: ['code-1', 'code-2'],
      email: 'test@test.com',
    });

    // Default: decrypt and verify succeed
    mockDecrypt.mockResolvedValue('JBSWY3DPEHPK3PXP');
    mockVerifyToken.mockReturnValue(true);
    mockVerifyRecovery.mockResolvedValue({ isValid: true, remainingCodes: ['code-2'] });

    // Default: update succeeds
    (db.user.update as jest.Mock).mockResolvedValue({
      totpSecret: null,
      totpEnabled: false,
      totpVerified: false,
      isTwoFactorEnabled: false,
    });
  });

  it('returns rate limit response when rate limited', async () => {
    const rateLimitResponse = NextResponse.json(
      { error: 'Rate limited' },
      { status: 429 }
    );
    mockRateLimit.mockResolvedValue(rateLimitResponse);

    const res = await POST(createRequest({ token: '123456', confirmDisable: true }));

    expect(res.status).toBe(429);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(createRequest({ token: '123456', confirmDisable: true }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 400 for invalid body (no token or recovery code)', async () => {
    const res = await POST(createRequest({ confirmDisable: true }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid request data');
  });

  it('returns 400 when confirmDisable is false', async () => {
    const res = await POST(createRequest({ token: '123456', confirmDisable: false }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Confirmation required');
  });

  it('returns 404 when user not found in database', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createRequest({ token: '123456', confirmDisable: true }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('User not found');
  });

  it('returns 400 when TOTP is not currently enabled', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      totpSecret: 'encrypted-secret',
      totpEnabled: false,
      totpVerified: false,
      recoveryCodes: [],
      email: 'test@test.com',
    });

    const res = await POST(createRequest({ token: '123456', confirmDisable: true }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('TOTP is not currently enabled');
  });

  it('returns 400 when verification fails (invalid TOTP token)', async () => {
    mockVerifyToken.mockReturnValue(false);

    const res = await POST(createRequest({ token: '999999', confirmDisable: true }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid verification code');
  });

  it('successfully disables TOTP with valid token', async () => {
    const res = await POST(createRequest({ token: '123456', confirmDisable: true }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totpEnabled).toBe(false);
    expect(body.data.totpVerified).toBe(false);
    expect(body.data.twoFactorEnabled).toBe(false);

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          totpSecret: null,
          totpEnabled: false,
          totpVerified: false,
          isTwoFactorEnabled: false,
        }),
      })
    );
  });

  it('successfully disables TOTP with recovery code', async () => {
    mockVerifyToken.mockReturnValue(false); // TOTP token check not used
    mockVerifyRecovery.mockResolvedValue({ isValid: true, remainingCodes: ['code-2'] });

    const res = await POST(createRequest({ recoveryCode: 'ABCD-1234-EFGH', confirmDisable: true }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totpEnabled).toBe(false);

    // Verify that recovery codes are updated (remaining codes passed in)
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recoveryCodes: ['code-2'],
        }),
      })
    );
  });

  it('returns 500 on decryption error', async () => {
    mockDecrypt.mockRejectedValue(new Error('Decryption failed'));

    const res = await POST(createRequest({ token: '123456', confirmDisable: true }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to verify TOTP token');
  });
});
