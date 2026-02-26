jest.mock('@/lib/auth-rate-limit-middleware', () => ({
  withAuthRateLimit: jest.fn(),
}));

jest.mock('@/lib/auth/totp', () => ({
  createTOTPSetup: jest.fn(),
  encryptTOTPSecret: jest.fn(),
  encryptRecoveryCodes: jest.fn(),
  validateTOTPSetup: jest.fn(),
}));

import { GET, POST } from '@/app/api/auth/mfa/totp/setup/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';
import {
  createTOTPSetup,
  encryptRecoveryCodes,
  encryptTOTPSecret,
  validateTOTPSetup,
} from '@/lib/auth/totp';

const mockAuth = auth as jest.Mock;
const mockRateLimit = withAuthRateLimit as jest.Mock;
const mockCreateSetup = createTOTPSetup as jest.Mock;
const mockEncryptSecret = encryptTOTPSecret as jest.Mock;
const mockEncryptCodes = encryptRecoveryCodes as jest.Mock;
const mockValidateSetup = validateTOTPSetup as jest.Mock;

const RATE_PASS = {
  success: true,
  headers: { 'X-RateLimit-Limit': '10', 'X-RateLimit-Remaining': '9' },
  rateLimitResult: { success: true, limit: 10, remaining: 9, reset: Date.now() + 60000 },
};

describe('api/auth/mfa/totp/setup route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(RATE_PASS);
    mockAuth.mockResolvedValue({ user: { id: 'user-1', email: 'user@test.com' } });
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/auth/mfa/totp/setup', { method: 'POST' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('POST initiates setup successfully', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      totpEnabled: false,
      totpVerified: false,
      totpSecret: null,
    });
    mockCreateSetup.mockResolvedValue({
      secret: 'secret',
      qrCodeUrl: 'data:image/png;base64,abc',
      backupCodes: ['CODE-1', 'CODE-2'],
    });
    mockValidateSetup.mockReturnValue({ isValid: true, errors: [] });
    mockEncryptSecret.mockResolvedValue('enc-secret');
    mockEncryptCodes.mockResolvedValue(['enc-code-1', 'enc-code-2']);
    (db.user.update as jest.Mock).mockResolvedValue({});

    const req = new NextRequest('http://localhost:3000/api/auth/mfa/totp/setup', { method: 'POST' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.setupComplete).toBe(false);
    expect(body.data.backupCodes).toHaveLength(2);
  });

  it('GET returns user setup status', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      totpEnabled: true,
      totpVerified: true,
      isTwoFactorEnabled: true,
      recoveryCodes: ['code-1'],
    });

    const res = await GET(new NextRequest('http://localhost:3000/api/auth/mfa/totp/setup'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totpEnabled).toBe(true);
  });
});
