jest.unmock('@/actions/login');

import { login } from '@/actions/login';
import { getUserByEmail } from '@/data/user';
import { generateVerificationToken, generateTwoFactorToken } from '@/lib/tokens';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Mock dependencies that the real login function imports
jest.mock('@/data/user');
jest.mock('@/lib/tokens');
jest.mock('@/data/two-factor-token');
jest.mock('@/data/two-factor-confirmation');
jest.mock('@/lib/db');
jest.mock('bcryptjs');
jest.mock('@/auth', () => ({
  signIn: jest.fn(),
}));

// Mock rate limiting - the real login function calls rateLimitAuth
jest.mock('@/lib/rate-limit-server', () => ({
  rateLimitAuth: jest.fn().mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 3600000,
  }),
}));

// Mock email queue (real function uses queueVerificationEmail and queue2FAEmail)
jest.mock('@/lib/queue/email-queue-simple', () => ({
  queueVerificationEmail: jest.fn().mockResolvedValue(undefined),
  queue2FAEmail: jest.fn().mockResolvedValue(undefined),
}));

// Mock brute force protection (dynamically imported in login action)
jest.mock('@/lib/auth/brute-force-protection', () => ({
  incrementFailedAttempts: jest.fn().mockResolvedValue({ locked: false, attempts: 0 }),
  resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
  recordLoginAttempt: jest.fn().mockResolvedValue(undefined),
}));

const mockGetUserByEmail = getUserByEmail as jest.Mock;
const mockGenerateVerificationToken = generateVerificationToken as jest.Mock;
const mockGenerateTwoFactorToken = generateTwoFactorToken as jest.Mock;
const mockGetTwoFactorConfirmationByUserId = getTwoFactorConfirmationByUserId as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;

describe('login action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset rate limiter to always allow
    const { rateLimitAuth } = require('@/lib/rate-limit-server');
    (rateLimitAuth as jest.Mock).mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 3600000,
    });
  });

  it('should return error for invalid input', async () => {
    const invalidData = {
      email: 'invalid-email',
      password: '123', // Too short
    };

    const result = await login(invalidData);

    expect(result).toEqual({
      error: 'Invalid fields!',
    });
  });

  it('should return error for non-existent user (security-hardened message)', async () => {
    mockGetUserByEmail.mockResolvedValue(null);

    const result = await login({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    // The real function returns "Invalid credentials!" for security
    // (does not reveal whether email exists)
    expect(result).toEqual({
      error: 'Invalid credentials!',
    });
  });

  it('should return email verification error for unverified user', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Unverified User',
      email: 'unverified@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: null,
      isTwoFactorEnabled: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);

    // The real function checks db.verificationToken.findFirst for a recent token.
    // If no recent token found, it generates a new one and queues an email.
    (mockDb.verificationToken as { findFirst: jest.Mock }).findFirst.mockResolvedValue(null);

    mockGenerateVerificationToken.mockResolvedValue({
      token: 'verification-token',
      email: mockUser.email,
      expires: new Date(Date.now() + 3600000),
    });

    const result = await login({
      email: 'unverified@example.com',
      password: 'password123',
    });

    // The real function generates a new verification token when no recent one exists
    expect(mockGenerateVerificationToken).toHaveBeenCalledWith(mockUser.email);

    // The real function uses queueVerificationEmail (not sendVerificationEmail)
    const { queueVerificationEmail } = require('@/lib/queue/email-queue-simple');
    expect(queueVerificationEmail).toHaveBeenCalled();

    // The real function returns a structured error with code and resend URL
    expect(result).toEqual({
      error: 'Please verify your email address before logging in.',
      code: 'EMAIL_NOT_VERIFIED',
      resendUrl: '/auth/resend-verification',
      email: mockUser.email,
    });
  });

  it('should skip resend if recent verification token exists', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Unverified User',
      email: 'unverified@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: null,
      isTwoFactorEnabled: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);

    // A recent token already exists, so no new token should be generated
    (mockDb.verificationToken as { findFirst: jest.Mock }).findFirst.mockResolvedValue({
      token: 'existing-token',
      email: mockUser.email,
      expires: new Date(Date.now() + 300000),
    });

    const result = await login({
      email: 'unverified@example.com',
      password: 'password123',
    });

    // Should NOT generate a new token since a recent one exists
    expect(mockGenerateVerificationToken).not.toHaveBeenCalled();

    // Should still return the same error
    expect(result).toEqual({
      error: 'Please verify your email address before logging in.',
      code: 'EMAIL_NOT_VERIFIED',
      resendUrl: '/auth/resend-verification',
      email: mockUser.email,
    });
  });

  it('should return error with remaining attempts for incorrect password', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(false);

    // The real function dynamically imports brute-force-protection and
    // calls incrementFailedAttempts, which returns { locked: false, attempts: 0 }
    // The code computes remainingAttempts = 5 - attempts = 5
    const { incrementFailedAttempts } = require('@/lib/auth/brute-force-protection');
    (incrementFailedAttempts as jest.Mock).mockResolvedValue({ locked: false, attempts: 0 });

    const result = await login({
      email: 'user@example.com',
      password: 'wrongpassword',
    });

    // With 0 failed attempts, remainingAttempts = 5 - 0 = 5
    expect(result).toEqual({
      error: 'Invalid credentials! 5 attempts remaining.',
    });
  });

  it('should lock account after max failed attempts', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(false);

    const { incrementFailedAttempts } = require('@/lib/auth/brute-force-protection');
    (incrementFailedAttempts as jest.Mock).mockResolvedValue({ locked: true, attempts: 5 });

    const result = await login({
      email: 'user@example.com',
      password: 'wrongpassword',
    });

    expect(result).toEqual({
      error: 'Account locked due to too many failed attempts. Try again in 15 minutes.',
    });
  });

  it('should send 2FA token for user with 2FA enabled', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'twofactor@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: true,
      totpEnabled: false,
      totpVerified: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockGenerateTwoFactorToken.mockResolvedValue({
      token: '123456',
      email: mockUser.email,
      expires: new Date(Date.now() + 600000),
    });

    const result = await login({
      email: 'twofactor@example.com',
      password: 'password123',
    });

    // The real function generates a 2FA token and queues the email
    expect(mockGenerateTwoFactorToken).toHaveBeenCalledWith(mockUser.email);

    const { queue2FAEmail } = require('@/lib/queue/email-queue-simple');
    expect(queue2FAEmail).toHaveBeenCalled();

    // The real function returns twoFactor: true and totpEnabled status
    expect(result).toEqual({
      twoFactor: true,
      totpEnabled: false,
    });
  });

  it('should validate email-based 2FA code and login successfully', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'twofactor@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: true,
      totpEnabled: false,
      totpVerified: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);

    // The real function looks up code via db.twoFactorToken.findFirst({ where: { token: code } })
    (mockDb.twoFactorToken as { findFirst: jest.Mock }).findFirst.mockResolvedValue({
      id: 'token-1',
      token: '123456',
      email: mockUser.email,
      expires: new Date(Date.now() + 3600000), // Not expired
    });

    // Mock token deletion
    (mockDb.twoFactorToken as { delete: jest.Mock }).delete.mockResolvedValue({});

    // Mock existing confirmation lookup and creation
    mockGetTwoFactorConfirmationByUserId.mockResolvedValue(null);
    (mockDb.twoFactorConfirmation as { create: jest.Mock }).create.mockResolvedValue({
      id: 'conf-1',
      userId: mockUser.id,
    });

    const result = await login({
      email: 'twofactor@example.com',
      password: 'password123',
      code: '123456',
    });

    // After 2FA validation, the function proceeds to password check and returns success
    expect(result).toMatchObject({
      success: 'Logged in!',
      email: mockUser.email,
      requiresSignIn: true,
    });
  });

  it('should return error for invalid 2FA code', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'twofactor@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: true,
      totpEnabled: false,
      totpVerified: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);

    // No matching token found in the database for this code
    (mockDb.twoFactorToken as { findFirst: jest.Mock }).findFirst.mockResolvedValue(null);

    const result = await login({
      email: 'twofactor@example.com',
      password: 'password123',
      code: '999999', // Wrong code
    });

    expect(result).toEqual({
      error: 'Invalid code!',
    });
  });

  it('should return error for expired 2FA code', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'twofactor@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: true,
      totpEnabled: false,
      totpVerified: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);

    // Token exists but is expired
    (mockDb.twoFactorToken as { findFirst: jest.Mock }).findFirst.mockResolvedValue({
      id: 'token-1',
      token: '123456',
      email: mockUser.email,
      expires: new Date(Date.now() - 3600000), // Expired
    });

    const result = await login({
      email: 'twofactor@example.com',
      password: 'password123',
      code: '123456',
    });

    // The real function treats expired tokens the same as invalid - "Invalid code!"
    expect(result).toEqual({
      error: 'Invalid code!',
    });
  });

  it('should successfully login user without 2FA', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'regular@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);

    const result = await login({
      email: 'regular@example.com',
      password: 'password123',
    });

    // The real function does NOT call signIn directly.
    // It returns success with requiresSignIn flag for the client.
    expect(result).toMatchObject({
      success: 'Logged in!',
      email: mockUser.email,
      requiresSignIn: true,
    });
    expect(result).toHaveProperty('rateLimitInfo');
  });

  it('should successfully login with callback URL', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'regular@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);

    const result = await login(
      {
        email: 'regular@example.com',
        password: 'password123',
      },
      '/dashboard'
    );

    // The real function returns success (callbackUrl is not used in the response)
    expect(result).toMatchObject({
      success: 'Logged in!',
      email: mockUser.email,
      requiresSignIn: true,
    });
  });

  it('should return error for OAuth account (no password)', async () => {
    // OAuth user has no password field set
    mockGetUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'oauth@example.com',
      password: null, // OAuth accounts have no password
      emailVerified: new Date(),
    });

    const result = await login({
      email: 'oauth@example.com',
      password: 'password123',
    });

    // Security-hardened: same message as non-existent user
    expect(result).toEqual({
      error: 'Invalid credentials!',
    });
  });

  it('should propagate database errors (no silent swallowing)', async () => {
    mockGetUserByEmail.mockRejectedValue(new Error('Database error'));

    // The real login function has no try/catch wrapper, so errors propagate
    await expect(
      login({
        email: 'user@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('Database error');
  });

  it('should return rate limit error when too many attempts', async () => {
    const { rateLimitAuth } = require('@/lib/rate-limit-server');
    (rateLimitAuth as jest.Mock).mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      retryAfter: 120,
      reset: Date.now() + 120000,
    });

    const result = await login({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result).toEqual({
      error: 'Too many login attempts. Try again in 120 seconds.',
      retryAfter: 120,
    });
  });
});
