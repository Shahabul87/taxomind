jest.mock('@/lib/auth-rate-limit-middleware', () => ({
  withAuthRateLimit: jest.fn(),
}));

import { GET, POST } from '@/app/api/auth/mfa/recovery-codes/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';
import {
  decryptTOTPSecret,
  encryptRecoveryCodes,
  generateRecoveryCodes,
  verifyTOTPToken,
} from '@/lib/auth/totp';

const mockAuth = auth as jest.Mock;
const mockRateLimit = withAuthRateLimit as jest.Mock;
const mockDecrypt = decryptTOTPSecret as jest.Mock;
const mockEncrypt = encryptRecoveryCodes as jest.Mock;
const mockGenerate = generateRecoveryCodes as jest.Mock;
const mockVerify = verifyTOTPToken as jest.Mock;

const RATE_PASS = {
  success: true,
  headers: { 'X-RateLimit-Limit': '10', 'X-RateLimit-Remaining': '9' },
  rateLimitResult: { success: true, limit: 10, remaining: 9, reset: Date.now() + 60000 },
};

describe('api/auth/mfa/recovery-codes route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(RATE_PASS);
    mockAuth.mockResolvedValue({ user: { id: 'user-1', email: 'user@test.com' } });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/auth/mfa/recovery-codes'));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('POST returns 400 for invalid token format', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/mfa/recovery-codes', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc', confirmRegenerate: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid request data');
  });

  it('POST regenerates recovery codes on valid verification', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      totpSecret: 'encrypted-secret',
      totpEnabled: true,
      totpVerified: true,
      recoveryCodes: ['old-1'],
      email: 'user@test.com',
    });
    mockDecrypt.mockResolvedValue('secret');
    mockVerify.mockReturnValue(true);
    mockGenerate.mockReturnValue(['NEW-1', 'NEW-2']);
    mockEncrypt.mockResolvedValue('enc-new');
    (db.user.update as jest.Mock).mockResolvedValue({});

    const req = new NextRequest('http://localhost:3000/api/auth/mfa/recovery-codes', {
      method: 'POST',
      body: JSON.stringify({ token: '123456', confirmRegenerate: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.recoveryCodes).toEqual(['NEW-1', 'NEW-2']);
  });
});
