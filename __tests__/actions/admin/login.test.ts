jest.unmock('@/actions/admin/login');

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

jest.mock('@/auth.admin', () => ({
  adminSignIn: jest.fn(),
}));

jest.mock('@/data/admin', () => ({
  getAdminAccountByEmail: jest.fn(),
}));

jest.mock('@/data/two-factor-token', () => ({
  getTwoFactorTokenByEmail: jest.fn(),
}));

jest.mock('@/lib/queue/email-queue-simple', () => ({
  queueVerificationEmail: jest.fn(),
  queue2FAEmail: jest.fn(),
}));

jest.mock('@/lib/tokens', () => ({
  generateVerificationToken: jest.fn(),
  generateTwoFactorToken: jest.fn(),
}));

jest.mock('@/data/admin-two-factor-confirmation', () => ({
  getTwoFactorConfirmationByAdminId: jest.fn(),
}));

jest.mock('@/lib/auth/totp', () => ({
  decryptTOTPSecret: jest.fn(),
  verifyTOTPToken: jest.fn(),
  verifyRecoveryCode: jest.fn(),
}));

jest.mock('@/lib/rate-limit-server', () => ({
  rateLimitAuth: jest.fn(),
}));

jest.mock('@/lib/audit/auth-audit', () => ({
  authAuditHelpers: {
    logSignInFailed: jest.fn(),
    logSignInSuccess: jest.fn(),
    logTwoFactorFailed: jest.fn(),
    logTwoFactorVerified: jest.fn(),
  },
}));

jest.mock('@/lib/db', () => ({
  db: {
    adminAccount: {
      update: jest.fn(),
    },
    twoFactorToken: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    adminTwoFactorConfirmation: {
      delete: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/passwordUtils', () => ({
  verifyPassword: jest.fn(),
  needsRehashing: jest.fn(),
  hashPassword: jest.fn(),
}));

import { headers } from 'next/headers';
import { login } from '@/actions/admin/login';
import { adminSignIn } from '@/auth.admin';
import { getAdminAccountByEmail } from '@/data/admin';
import { rateLimitAuth } from '@/lib/rate-limit-server';
import { generateVerificationToken, generateTwoFactorToken } from '@/lib/tokens';
import { queueVerificationEmail, queue2FAEmail } from '@/lib/queue/email-queue-simple';
import { authAuditHelpers } from '@/lib/audit/auth-audit';
import { verifyPassword, needsRehashing } from '@/lib/passwordUtils';

const mockHeaders = headers as jest.Mock;
const mockAdminSignIn = adminSignIn as jest.Mock;
const mockGetAdminAccountByEmail = getAdminAccountByEmail as jest.Mock;
const mockRateLimitAuth = rateLimitAuth as jest.Mock;
const mockGenerateVerificationToken = generateVerificationToken as jest.Mock;
const mockGenerateTwoFactorToken = generateTwoFactorToken as jest.Mock;
const mockQueueVerificationEmail = queueVerificationEmail as jest.Mock;
const mockQueue2FAEmail = queue2FAEmail as jest.Mock;
const mockVerifyPassword = verifyPassword as jest.Mock;
const mockNeedsRehashing = needsRehashing as jest.Mock;
const mockAuthAuditHelpers = authAuditHelpers as unknown as {
  logSignInFailed: jest.Mock;
  logSignInSuccess: jest.Mock;
  logTwoFactorFailed: jest.Mock;
  logTwoFactorVerified: jest.Mock;
};

const baseAdmin = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  password: 'hashed-password',
  role: 'ADMIN',
  emailVerified: new Date(),
  isTwoFactorEnabled: false,
  totpEnabled: false,
  totpVerified: false,
  totpSecret: null,
  recoveryCodes: null,
};

describe('admin login action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockHeaders.mockResolvedValue({
      get: jest.fn((key: string) => (key === 'x-forwarded-for' ? '1.2.3.4, 10.0.0.2' : null)),
    });

    mockRateLimitAuth.mockResolvedValue({
      success: true,
      limit: 3,
      remaining: 2,
      reset: Date.now() + 60_000,
    });

    mockGetAdminAccountByEmail.mockResolvedValue(baseAdmin);
    mockVerifyPassword.mockResolvedValue(true);
    mockNeedsRehashing.mockReturnValue(false);
    mockAdminSignIn.mockResolvedValue(undefined);
  });

  it('returns validation error for invalid input', async () => {
    const result = await login({ email: 'bad-email', password: '' });

    expect(result).toEqual({ error: 'Invalid fields!' });
  });

  it('returns rate limit error when admin login is throttled', async () => {
    mockRateLimitAuth.mockResolvedValue({
      success: false,
      limit: 3,
      remaining: 0,
      retryAfter: 30,
      reset: Date.now() + 30_000,
    });

    const result = await login({ email: 'admin@example.com', password: 'pass123' });

    expect(result).toEqual({
      error: 'Too many admin login attempts. Try again in 30 seconds.',
      retryAfter: 30,
    });
    expect(mockAuthAuditHelpers.logSignInFailed).toHaveBeenCalled();
  });

  it('returns invalid admin credentials when admin is missing', async () => {
    mockGetAdminAccountByEmail.mockResolvedValue(null);

    const result = await login({ email: 'missing@example.com', password: 'pass123' });

    expect(result).toEqual({ error: 'Invalid admin credentials!' });
  });

  it('queues verification email when admin email is not verified', async () => {
    mockGetAdminAccountByEmail.mockResolvedValue({
      ...baseAdmin,
      emailVerified: null,
    });
    mockGenerateVerificationToken.mockResolvedValue({
      token: 'verify-token',
      email: 'admin@example.com',
      expires: new Date(Date.now() + 10 * 60_000),
    });

    const result = await login({ email: 'admin@example.com', password: 'pass123' });

    expect(mockGenerateVerificationToken).toHaveBeenCalledWith('admin@example.com');
    expect(mockQueueVerificationEmail).toHaveBeenCalled();
    expect(result).toEqual({ success: 'Admin verification email sent!' });
  });

  it('initiates 2FA flow when enabled and no code is provided', async () => {
    mockGetAdminAccountByEmail.mockResolvedValue({
      ...baseAdmin,
      isTwoFactorEnabled: true,
      totpEnabled: false,
      totpVerified: false,
    });
    mockGenerateTwoFactorToken.mockResolvedValue({
      token: '123456',
      email: 'admin@example.com',
      expires: new Date(Date.now() + 10 * 60_000),
    });

    const result = await login({ email: 'admin@example.com', password: 'pass123' });

    expect(mockGenerateTwoFactorToken).toHaveBeenCalledWith('admin@example.com');
    expect(mockQueue2FAEmail).toHaveBeenCalled();
    expect(result).toEqual({ twoFactor: true, totpEnabled: false });
  });

  it('returns success and redirect metadata for valid admin credentials', async () => {
    const result = await login(
      { email: 'admin@example.com', password: 'pass123' },
      '/dashboard/admin/custom',
    );

    expect(mockVerifyPassword).toHaveBeenCalledWith('pass123', baseAdmin.password);
    expect(mockAdminSignIn).toHaveBeenCalledWith('credentials', {
      email: 'admin@example.com',
      password: 'pass123',
      redirectTo: '/dashboard/admin/custom',
    });
    expect(mockAuthAuditHelpers.logSignInSuccess).toHaveBeenCalledWith(
      baseAdmin.id,
      baseAdmin.email,
      'credentials',
      { userRole: baseAdmin.role },
    );
    expect(result).toEqual({
      success: 'Admin authenticated!',
      redirectTo: '/dashboard/admin/custom',
      rateLimitInfo: {
        remaining: 2,
        reset: expect.any(Number),
      },
    });
  });
});
