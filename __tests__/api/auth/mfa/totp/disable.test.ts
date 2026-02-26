jest.mock('@/lib/auth-rate-limit-middleware', () => ({
  withAuthRateLimit: jest.fn(),
}));

import { POST } from '@/app/api/auth/mfa/totp/disable/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';
import {
  decryptTOTPSecret,
  verifyRecoveryCode,
  verifyTOTPToken,
} from '@/lib/auth/totp';

const mockAuth = auth as jest.Mock;
const mockRateLimit = withAuthRateLimit as jest.Mock;
const mockDecrypt = decryptTOTPSecret as jest.Mock;
const mockVerifyToken = verifyTOTPToken as jest.Mock;
const mockVerifyRecovery = verifyRecoveryCode as jest.Mock;

const RATE_PASS = {
  success: true,
  headers: { 'X-RateLimit-Limit': '10', 'X-RateLimit-Remaining': '9' },
  rateLimitResult: { success: true, limit: 10, remaining: 9, reset: Date.now() + 60000 },
};

describe('api/auth/mfa/totp/disable route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(RATE_PASS);
    mockAuth.mockResolvedValue({ user: { id: 'user-1', email: 'user@test.com' } });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/auth/mfa/totp/disable', {
      method: 'POST',
      body: JSON.stringify({ token: '123456', confirmDisable: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 400 when neither token nor recovery code is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/mfa/totp/disable', {
      method: 'POST',
      body: JSON.stringify({ confirmDisable: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid request data');
  });

  it('disables totp with valid token verification', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      totpSecret: 'enc-secret',
      totpEnabled: true,
      totpVerified: true,
      recoveryCodes: ['code-1'],
      email: 'user@test.com',
    });
    mockDecrypt.mockResolvedValue('secret');
    mockVerifyToken.mockReturnValue(true);
    mockVerifyRecovery.mockResolvedValue({ isValid: false, remainingCodes: ['code-1'] });
    (db.user.update as jest.Mock).mockResolvedValue({});

    const req = new NextRequest('http://localhost:3000/api/auth/mfa/totp/disable', {
      method: 'POST',
      body: JSON.stringify({ token: '123456', confirmDisable: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totpEnabled).toBe(false);
  });
});
