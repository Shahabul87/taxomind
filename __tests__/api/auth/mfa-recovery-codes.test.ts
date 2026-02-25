/**
 * Tests for MFA Recovery Codes Route - app/api/auth/mfa/recovery-codes/route.ts
 *
 * Covers: POST (regenerate recovery codes), GET (recovery codes status)
 */

jest.mock('@/lib/auth-rate-limit-middleware', () => ({
  withAuthRateLimit: jest.fn(),
}));

// @/auth, @/lib/db, @/lib/logger, @/lib/auth/totp are globally mocked

import { POST, GET } from '@/app/api/auth/mfa/recovery-codes/route';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  generateRecoveryCodes,
  encryptRecoveryCodes,
  decryptTOTPSecret,
  verifyTOTPToken,
} from '@/lib/auth/totp';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';

const mockAuth = auth as jest.Mock;
const mockRateLimit = withAuthRateLimit as jest.Mock;
const mockDecrypt = decryptTOTPSecret as jest.Mock;
const mockVerifyToken = verifyTOTPToken as jest.Mock;
const mockGenerateCodes = generateRecoveryCodes as jest.Mock;
const mockEncryptCodes = encryptRecoveryCodes as jest.Mock;

function createPostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost:3000/api/auth/mfa/recovery-codes', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createGetRequest() {
  return new NextRequest('http://localhost:3000/api/auth/mfa/recovery-codes', {
    method: 'GET',
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

// ============================================================
// POST /api/auth/mfa/recovery-codes
// ============================================================
describe('POST /api/auth/mfa/recovery-codes', () => {
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
      recoveryCodes: ['old-code-1', 'old-code-2'],
      email: 'test@test.com',
    });

    // Default: decrypt and verify succeed
    mockDecrypt.mockResolvedValue('JBSWY3DPEHPK3PXP');
    mockVerifyToken.mockReturnValue(true);

    // Default: generate new codes
    mockGenerateCodes.mockReturnValue(['NEW-CODE-1', 'NEW-CODE-2', 'NEW-CODE-3']);
    mockEncryptCodes.mockResolvedValue('encrypted-new-codes');

    // Default: update succeeds
    (db.user.update as jest.Mock).mockResolvedValue({});
  });

  it('returns rate limit response when rate limited', async () => {
    const rateLimitResponse = NextResponse.json(
      { error: 'Rate limited' },
      { status: 429 }
    );
    mockRateLimit.mockResolvedValue(rateLimitResponse);

    const res = await POST(createPostRequest({ token: '123456', confirmRegenerate: true }));

    expect(res.status).toBe(429);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(createPostRequest({ token: '123456', confirmRegenerate: true }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 400 for invalid request body', async () => {
    const res = await POST(createPostRequest({ token: 'abc', confirmRegenerate: true }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid request data');
  });

  it('returns 400 when confirmRegenerate is false', async () => {
    const res = await POST(createPostRequest({ token: '123456', confirmRegenerate: false }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Confirmation required');
  });

  it('returns 404 when user is not found in database', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createPostRequest({ token: '123456', confirmRegenerate: true }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('User not found');
  });

  it('returns 400 when TOTP is not enabled', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      totpSecret: null,
      totpEnabled: false,
      totpVerified: false,
      recoveryCodes: [],
      email: 'test@test.com',
    });

    const res = await POST(createPostRequest({ token: '123456', confirmRegenerate: true }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('TOTP must be enabled');
  });

  it('returns 400 when TOTP token is invalid', async () => {
    mockVerifyToken.mockReturnValue(false);

    const res = await POST(createPostRequest({ token: '123456', confirmRegenerate: true }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid verification code');
  });

  it('returns 200 with new recovery codes on success', async () => {
    const res = await POST(createPostRequest({ token: '123456', confirmRegenerate: true }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.recoveryCodes).toEqual(['NEW-CODE-1', 'NEW-CODE-2', 'NEW-CODE-3']);
    expect(body.data.totalCodes).toBe(3);
    expect(body.data.warning).toBeDefined();

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { recoveryCodes: 'encrypted-new-codes' },
      })
    );
  });

  it('returns 500 on decryption error', async () => {
    mockDecrypt.mockRejectedValue(new Error('Decryption failed'));

    const res = await POST(createPostRequest({ token: '123456', confirmRegenerate: true }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('encryption error');
  });
});

// ============================================================
// GET /api/auth/mfa/recovery-codes
// ============================================================
describe('GET /api/auth/mfa/recovery-codes', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    (db.user.findUnique as jest.Mock).mockResolvedValue({
      totpEnabled: true,
      totpVerified: true,
      recoveryCodes: ['code-1', 'code-2', 'code-3'],
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 404 when user is not found', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('User not found');
  });

  it('returns 200 with recovery codes status', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totpEnabled).toBe(true);
    expect(body.data.totpVerified).toBe(true);
    expect(body.data.recoveryCodesCount).toBe(3);
    expect(body.data.canRegenerateRecoveryCodes).toBe(true);
  });

  it('returns 200 with zero codes when user has none', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      totpEnabled: false,
      totpVerified: false,
      recoveryCodes: null,
    });

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.recoveryCodesCount).toBe(0);
    expect(body.data.canRegenerateRecoveryCodes).toBe(false);
  });
});
