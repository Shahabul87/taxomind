jest.unmock('@/actions/admin/reset');

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

jest.mock('@/data/admin', () => ({
  getAdminAccountByEmail: jest.fn(),
}));

jest.mock('@/lib/tokens', () => ({
  generatePasswordResetToken: jest.fn(),
}));

jest.mock('@/lib/queue/email-queue-simple', () => ({
  queuePasswordResetEmail: jest.fn(),
}));

jest.mock('@/lib/rate-limit-server', () => ({
  rateLimitAuth: jest.fn(),
}));

jest.mock('@/lib/audit/auth-audit', () => ({
  authAuditHelpers: {
    logPasswordResetRequested: jest.fn(),
  },
}));

import { headers } from 'next/headers';
import { reset } from '@/actions/admin/reset';
import { getAdminAccountByEmail } from '@/data/admin';
import { generatePasswordResetToken } from '@/lib/tokens';
import { queuePasswordResetEmail } from '@/lib/queue/email-queue-simple';
import { rateLimitAuth } from '@/lib/rate-limit-server';
import { authAuditHelpers } from '@/lib/audit/auth-audit';

const mockHeaders = headers as jest.Mock;
const mockGetAdminAccountByEmail = getAdminAccountByEmail as jest.Mock;
const mockGeneratePasswordResetToken = generatePasswordResetToken as jest.Mock;
const mockQueuePasswordResetEmail = queuePasswordResetEmail as jest.Mock;
const mockRateLimitAuth = rateLimitAuth as jest.Mock;
const mockAuditHelpers = authAuditHelpers as unknown as {
  logPasswordResetRequested: jest.Mock;
};

describe('admin reset action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaders.mockResolvedValue({
      get: jest.fn((key: string) => (key === 'x-forwarded-for' ? '7.7.7.7, 10.0.0.1' : null)),
    });
    mockRateLimitAuth.mockResolvedValue({
      success: true,
      limit: 3,
      remaining: 2,
      reset: Date.now() + 60_000,
    });
  });

  it('returns validation error for invalid email format', async () => {
    const result = await reset({ email: 'bad-email' });

    expect(result).toEqual({ error: 'Invalid email!' });
  });

  it('returns rate-limit error when throttled', async () => {
    mockRateLimitAuth.mockResolvedValue({
      success: false,
      retryAfter: 45,
      remaining: 0,
      reset: Date.now() + 45_000,
    });

    const result = await reset({ email: 'admin@example.com' });

    expect(result).toEqual({
      error: 'Too many admin password reset attempts. Try again in 45 seconds.',
      retryAfter: 45,
    });
  });

  it('returns generic success when admin account does not exist', async () => {
    mockGetAdminAccountByEmail.mockResolvedValue(null);

    const result = await reset({ email: 'missing-admin@example.com' });

    expect(result).toEqual({
      success: 'If an admin account exists with this email, a reset link has been sent.',
      rateLimitInfo: {
        remaining: 2,
        reset: expect.any(Number),
      },
    });
    expect(mockQueuePasswordResetEmail).not.toHaveBeenCalled();
  });

  it('queues password reset email and logs audit entry for existing admin', async () => {
    mockGetAdminAccountByEmail.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin User',
    });
    mockGeneratePasswordResetToken.mockResolvedValue({
      token: 'admin-reset-token',
      email: 'admin@example.com',
      expires: new Date(Date.now() + 10 * 60_000),
    });

    const result = await reset({ email: 'admin@example.com' });

    expect(mockGeneratePasswordResetToken).toHaveBeenCalledWith('admin@example.com');
    expect(mockQueuePasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userEmail: 'admin@example.com',
        userId: 'admin-1',
        resetToken: 'admin-reset-token',
        ipAddress: '7.7.7.7',
      }),
    );
    expect(mockAuditHelpers.logPasswordResetRequested).toHaveBeenCalledWith('admin@example.com');
    expect(result).toEqual({
      success: 'Admin password reset email sent!',
      rateLimitInfo: {
        remaining: 2,
        reset: expect.any(Number),
      },
    });
  });
});
