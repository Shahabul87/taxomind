jest.unmock('@/actions/resend-verification');

import { resendVerification } from '@/actions/resend-verification';
import { getUserByEmail } from '@/data/user';
import { generateVerificationToken } from '@/lib/tokens';
import { queueVerificationEmail } from '@/lib/queue/email-queue-simple';
import { db } from '@/lib/db';

// Mock rate limiting - default to allowing requests
jest.mock('@/lib/rate-limit-server', () => ({
  rateLimitAuth: jest.fn().mockResolvedValue({
    success: true,
    limit: 3,
    remaining: 2,
    reset: Date.now() + 900000,
  }),
}));

// Mock email queue
jest.mock('@/lib/queue/email-queue-simple', () => ({
  queueVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

const mockGetUserByEmail = getUserByEmail as jest.Mock;
const mockGenerateVerificationToken = generateVerificationToken as jest.Mock;
const mockQueueVerificationEmail = queueVerificationEmail as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;

describe('resendVerification action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset rate limiter to allow by default
    const { rateLimitAuth } = require('@/lib/rate-limit-server');
    (rateLimitAuth as jest.Mock).mockResolvedValue({
      success: true,
      limit: 3,
      remaining: 2,
      reset: Date.now() + 900000,
    });

    // Default: no recent token found
    (mockDb.verificationToken.findFirst as jest.Mock).mockResolvedValue(null);

    // Default: token generation succeeds
    mockGenerateVerificationToken.mockResolvedValue({
      email: 'test@example.com',
      token: 'new-verification-token',
      expires: new Date(Date.now() + 3600000),
    });

    // Default: email queue succeeds
    mockQueueVerificationEmail.mockResolvedValue(undefined);
  });

  // -------------------------------------------------------
  // 1. Invalid email format
  // -------------------------------------------------------
  it('should return error for invalid email format', async () => {
    const result = await resendVerification({ email: 'not-an-email' });

    expect(result).toEqual({ error: 'Invalid email address!' });
    expect(mockGetUserByEmail).not.toHaveBeenCalled();
  });

  it('should return error for empty email string', async () => {
    const result = await resendVerification({ email: '' });

    expect(result).toEqual({ error: 'Invalid email address!' });
    expect(mockGetUserByEmail).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // 2. Rate limited
  // -------------------------------------------------------
  it('should return rate limit error when too many attempts', async () => {
    const { rateLimitAuth } = require('@/lib/rate-limit-server');
    (rateLimitAuth as jest.Mock).mockResolvedValue({
      success: false,
      retryAfter: 120,
      limit: 3,
      remaining: 0,
      reset: Date.now() + 120000,
    });

    const result = await resendVerification({ email: 'user@example.com' });

    expect(result).toEqual({
      error: 'Too many resend attempts. Please try again in 120 seconds.',
      retryAfter: 120,
    });
    // Should not proceed to user lookup
    expect(mockGetUserByEmail).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // 3. User not found - generic success for security
  // -------------------------------------------------------
  it('should return generic success when user not found (security)', async () => {
    mockGetUserByEmail.mockResolvedValue(null);

    const result = await resendVerification({ email: 'nonexistent@example.com' });

    expect(result).toEqual({
      success: 'If an account exists with this email, a verification link has been sent.',
    });
    // Should NOT reveal that the user does not exist
    expect(result).not.toHaveProperty('error');
    expect(mockGenerateVerificationToken).not.toHaveBeenCalled();
  });

  it('should return generic success when user exists but has no email field', async () => {
    mockGetUserByEmail.mockResolvedValue({ id: 'user-1', email: null });

    const result = await resendVerification({ email: 'noemail@example.com' });

    expect(result).toEqual({
      success: 'If an account exists with this email, a verification link has been sent.',
    });
    expect(mockGenerateVerificationToken).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // 4. Already verified email
  // -------------------------------------------------------
  it('should return already verified response when email is verified', async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'verified@example.com',
      emailVerified: new Date(),
    });

    const result = await resendVerification({ email: 'verified@example.com' });

    expect(result).toEqual({
      success: 'Your email is already verified. You can log in now.',
      alreadyVerified: true,
    });
    // Should NOT attempt to generate a token or send email
    expect(mockGenerateVerificationToken).not.toHaveBeenCalled();
    expect(mockQueueVerificationEmail).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // 5. Recent token exists (2-minute cooldown)
  // -------------------------------------------------------
  it('should return recently sent error when token was created within 2 minutes', async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: null,
    });

    (mockDb.verificationToken.findFirst as jest.Mock).mockResolvedValue({
      id: 'token-1',
      email: 'test@example.com',
      token: 'recent-token',
      expires: new Date(Date.now() + 60000), // still valid
    });

    const result = await resendVerification({ email: 'test@example.com' });

    expect(result).toEqual({
      error: 'A verification email was recently sent. Please check your inbox or wait 2 minutes before requesting another.',
      recentlySent: true,
    });
    expect(mockGenerateVerificationToken).not.toHaveBeenCalled();
    expect(mockQueueVerificationEmail).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // 6. Successful resend
  // -------------------------------------------------------
  it('should successfully generate token and queue email for unverified user', async () => {
    const mockExpires = new Date(Date.now() + 3600000);
    mockGetUserByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      emailVerified: null,
    });

    mockGenerateVerificationToken.mockResolvedValue({
      email: 'jane@example.com',
      token: 'fresh-verification-token',
      expires: mockExpires,
    });

    const result = await resendVerification({ email: 'jane@example.com' });

    expect(result).toEqual({
      success: 'Verification email sent! Please check your inbox and spam folder.',
      emailSent: true,
    });
    expect(mockGenerateVerificationToken).toHaveBeenCalledWith('jane@example.com');
    expect(mockQueueVerificationEmail).toHaveBeenCalledTimes(1);
    expect(mockQueueVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userEmail: 'jane@example.com',
        userName: 'Jane Doe',
        verificationToken: 'fresh-verification-token',
        expiresAt: mockExpires,
        userId: 'user-1',
        isResend: true,
      })
    );
  });

  it('should use fallback name "User" when user has no name', async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: 'user-2',
      name: null,
      email: 'noname@example.com',
      emailVerified: null,
    });

    mockGenerateVerificationToken.mockResolvedValue({
      email: 'noname@example.com',
      token: 'token-abc',
      expires: new Date(),
    });

    await resendVerification({ email: 'noname@example.com' });

    expect(mockQueueVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userName: 'User',
      })
    );
  });

  // -------------------------------------------------------
  // 7. Token generation error
  // -------------------------------------------------------
  it('should return generic error when token generation fails', async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: null,
    });

    mockGenerateVerificationToken.mockRejectedValue(
      new Error('Database connection lost')
    );

    const result = await resendVerification({ email: 'test@example.com' });

    expect(result).toEqual({
      error: 'Something went wrong. Please try again later.',
    });
    expect(mockQueueVerificationEmail).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // 8. Email queue error
  // -------------------------------------------------------
  it('should return generic error when email queue fails', async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: null,
    });

    mockQueueVerificationEmail.mockRejectedValue(
      new Error('Email service unavailable')
    );

    const result = await resendVerification({ email: 'test@example.com' });

    expect(result).toEqual({
      error: 'Something went wrong. Please try again later.',
    });
  });

  // -------------------------------------------------------
  // 9. Rate limit info returned (retryAfter value)
  // -------------------------------------------------------
  it('should include retryAfter from rate limit result in the error response', async () => {
    const { rateLimitAuth } = require('@/lib/rate-limit-server');
    (rateLimitAuth as jest.Mock).mockResolvedValue({
      success: false,
      retryAfter: 45,
      limit: 3,
      remaining: 0,
      reset: Date.now() + 45000,
    });

    const result = await resendVerification({ email: 'test@example.com' });

    expect(result.retryAfter).toBe(45);
    expect(result.error).toContain('45 seconds');
  });

  it('should call rateLimitAuth with verify endpoint and user email', async () => {
    const { rateLimitAuth } = require('@/lib/rate-limit-server');
    mockGetUserByEmail.mockResolvedValue(null);

    await resendVerification({ email: 'check@example.com' });

    expect(rateLimitAuth).toHaveBeenCalledWith('verify', 'check@example.com');
  });

  // -------------------------------------------------------
  // 10. isResend flag passed to email queue
  // -------------------------------------------------------
  it('should always pass isResend: true to the email queue', async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'resend@example.com',
      emailVerified: null,
    });

    mockGenerateVerificationToken.mockResolvedValue({
      email: 'resend@example.com',
      token: 'resend-token',
      expires: new Date(),
    });

    await resendVerification({ email: 'resend@example.com' });

    const queueCall = mockQueueVerificationEmail.mock.calls[0][0];
    expect(queueCall.isResend).toBe(true);
  });

  // -------------------------------------------------------
  // Additional edge cases
  // -------------------------------------------------------
  it('should pass a timestamp to the email queue', async () => {
    const beforeCall = new Date();

    mockGetUserByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'time@example.com',
      emailVerified: null,
    });

    mockGenerateVerificationToken.mockResolvedValue({
      email: 'time@example.com',
      token: 'time-token',
      expires: new Date(),
    });

    await resendVerification({ email: 'time@example.com' });

    const queueCall = mockQueueVerificationEmail.mock.calls[0][0];
    expect(queueCall.timestamp).toBeInstanceOf(Date);
    expect(queueCall.timestamp.getTime()).toBeGreaterThanOrEqual(
      beforeCall.getTime()
    );
  });

  it('should query verificationToken with correct email and time window', async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'query@example.com',
      emailVerified: null,
    });

    const beforeCall = Date.now();
    await resendVerification({ email: 'query@example.com' });

    expect(mockDb.verificationToken.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: 'query@example.com',
          expires: expect.objectContaining({
            gt: expect.any(Date),
          }),
        }),
        orderBy: { expires: 'desc' },
      })
    );

    // Verify the 2-minute window calculation is reasonable
    const callArgs = (mockDb.verificationToken.findFirst as jest.Mock).mock.calls[0][0];
    const gtDate = callArgs.where.expires.gt as Date;
    const twoMinutesAgo = beforeCall - 2 * 60 * 1000;
    // Allow 1 second of tolerance for test execution time
    expect(Math.abs(gtDate.getTime() - twoMinutesAgo)).toBeLessThan(1000);
  });
});
