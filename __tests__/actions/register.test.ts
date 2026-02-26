jest.unmock('@/actions/register');

import { register } from '@/actions/register';
import { getUserByEmail } from '@/data/user';
import { generateVerificationToken } from '@/lib/tokens';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Mock dependencies that the real register function imports
jest.mock('@/data/user');
jest.mock('@/lib/tokens');
jest.mock('@/lib/db');
jest.mock('bcryptjs');

// Mock rate limiting
jest.mock('@/lib/rate-limit-server', () => ({
  rateLimitAuth: jest.fn().mockResolvedValue({
    success: true,
    limit: 5,
    remaining: 4,
    reset: Date.now() + 3600000,
  }),
}));

// Mock email queue (fire-and-forget in register action)
jest.mock('@/lib/queue/email-queue-simple', () => ({
  queueVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

// Mock auth audit helpers
jest.mock('@/lib/audit/auth-audit', () => ({
  authAuditHelpers: {
    logAccountCreated: jest.fn().mockResolvedValue(undefined),
    logSuspiciousActivity: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockGetUserByEmail = getUserByEmail as jest.Mock;
const mockGenerateVerificationToken = generateVerificationToken as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;

// Valid registration data matching RegisterSchema requirements:
// email: valid email, password: 8+ chars with uppercase, lowercase, number, special char
// name: non-empty string, acceptTermsAndPrivacy: true
const validRegistrationData = {
  email: 'newuser@example.com',
  password: 'StrongP@ss1',
  name: 'New User',
  acceptTermsAndPrivacy: true,
};

describe('register action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset rate limiter to always allow
    const { rateLimitAuth } = require('@/lib/rate-limit-server');
    (rateLimitAuth as jest.Mock).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 3600000,
    });

    // Default: bcrypt.hash returns a hashed value
    mockBcryptHash.mockResolvedValue('$2a$10$hashedpassword');

    // Default: no existing user
    mockGetUserByEmail.mockResolvedValue(null);

    // Default: db.user.create succeeds
    (mockDb.user as { create: jest.Mock }).create.mockResolvedValue({
      id: 'new-user-id',
      name: 'New User',
      email: 'newuser@example.com',
      password: '$2a$10$hashedpassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Default: verification token generation succeeds
    mockGenerateVerificationToken.mockResolvedValue({
      token: 'verification-token-123',
      email: 'newuser@example.com',
      expires: new Date(Date.now() + 3600000),
    });

    // Reset audit mock
    const { authAuditHelpers } = require('@/lib/audit/auth-audit');
    (authAuditHelpers.logAccountCreated as jest.Mock).mockResolvedValue(undefined);
    (authAuditHelpers.logSuspiciousActivity as jest.Mock).mockResolvedValue(undefined);

    // Reset email queue mock
    const { queueVerificationEmail } = require('@/lib/queue/email-queue-simple');
    (queueVerificationEmail as jest.Mock).mockResolvedValue(undefined);
  });

  // ─── Test 1: Invalid fields returns error ───────────────────────────
  it('should return error for invalid input fields', async () => {
    const invalidData = {
      email: 'not-an-email',
      password: '123', // Too short, missing required chars
      name: '',        // Empty name
      acceptTermsAndPrivacy: false,
    };

    const result = await register(invalidData);

    expect(result).toEqual({ error: 'Invalid fields!' });
    // Should not proceed to rate limiting or database calls
    const { rateLimitAuth } = require('@/lib/rate-limit-server');
    expect(rateLimitAuth).not.toHaveBeenCalled();
    expect(mockGetUserByEmail).not.toHaveBeenCalled();
  });

  // ─── Test 2: Rate limiting blocks registration ──────────────────────
  it('should return rate limit error when too many attempts', async () => {
    const { rateLimitAuth } = require('@/lib/rate-limit-server');
    (rateLimitAuth as jest.Mock).mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      retryAfter: 60,
      reset: Date.now() + 60000,
    });

    const result = await register(validRegistrationData);

    expect(rateLimitAuth).toHaveBeenCalledWith('register', validRegistrationData.email);
    expect(result).toEqual({
      error: 'Too many registration attempts. Try again in 60 seconds.',
      retryAfter: 60,
    });
    // Should not proceed to database operations
    expect(mockGetUserByEmail).not.toHaveBeenCalled();
    expect(mockBcryptHash).not.toHaveBeenCalled();
  });

  // ─── Test 3: Existing user returns "Email already in use" ───────────
  it('should return error when email is already in use', async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: 'existing-user-id',
      email: 'newuser@example.com',
      name: 'Existing User',
    });

    const result = await register(validRegistrationData);

    expect(mockGetUserByEmail).toHaveBeenCalledWith('newuser@example.com');
    expect(result).toMatchObject({
      error: 'Email already in use!',
    });
    expect(result).toHaveProperty('rateLimitInfo');
    // Should NOT attempt to create a user
    expect((mockDb.user as { create: jest.Mock }).create).not.toHaveBeenCalled();
  });

  // ─── Test 4: Successful registration creates user and sends email ───
  it('should create user, generate token, and queue verification email on success', async () => {
    const result = await register(validRegistrationData);

    // Password should be hashed
    expect(mockBcryptHash).toHaveBeenCalledWith('StrongP@ss1', 10);

    // User should be created in the database
    expect((mockDb.user as { create: jest.Mock }).create).toHaveBeenCalledWith({
      data: {
        name: 'New User',
        email: 'newuser@example.com',
        password: '$2a$10$hashedpassword',
      },
    });

    // Audit log should be called
    const { authAuditHelpers } = require('@/lib/audit/auth-audit');
    expect(authAuditHelpers.logAccountCreated).toHaveBeenCalledWith(
      'new-user-id',
      'newuser@example.com',
      'New User'
    );

    // Verification token should be generated
    expect(mockGenerateVerificationToken).toHaveBeenCalledWith('newuser@example.com');

    // Email should be queued
    const { queueVerificationEmail } = require('@/lib/queue/email-queue-simple');
    expect(queueVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userEmail: 'newuser@example.com',
        userName: 'New User',
        verificationToken: 'verification-token-123',
        userId: 'new-user-id',
      })
    );

    // Should return success
    expect(result).toMatchObject({
      success: 'Confirmation email sent!',
    });
  });

  // ─── Test 5: Verification token generation failure (non-critical) ───
  it('should succeed even when verification token generation fails', async () => {
    mockGenerateVerificationToken.mockRejectedValue(
      new Error('Token generation service unavailable')
    );

    const result = await register(validRegistrationData);

    // Registration should still succeed
    expect(result).toMatchObject({
      success: 'Confirmation email sent!',
    });

    // User should still be created
    expect((mockDb.user as { create: jest.Mock }).create).toHaveBeenCalled();

    // Email should NOT be queued since no token was generated
    const { queueVerificationEmail } = require('@/lib/queue/email-queue-simple');
    expect(queueVerificationEmail).not.toHaveBeenCalled();
  });

  // ─── Test 6: Email queue failure (non-critical) ─────────────────────
  it('should succeed even when email queue fails', async () => {
    const { queueVerificationEmail } = require('@/lib/queue/email-queue-simple');
    (queueVerificationEmail as jest.Mock).mockRejectedValue(
      new Error('Email service unavailable')
    );

    const result = await register(validRegistrationData);

    // Registration should still succeed despite email queue failure
    expect(result).toMatchObject({
      success: 'Confirmation email sent!',
    });

    // User should still be created
    expect((mockDb.user as { create: jest.Mock }).create).toHaveBeenCalled();

    // Token generation should still have been attempted
    expect(mockGenerateVerificationToken).toHaveBeenCalled();
  });

  // ─── Test 7: Audit logging failure (non-critical) ──────────────────
  it('should succeed even when audit logging fails', async () => {
    const { authAuditHelpers } = require('@/lib/audit/auth-audit');
    (authAuditHelpers.logAccountCreated as jest.Mock).mockRejectedValue(
      new Error('Audit service unavailable')
    );

    const result = await register(validRegistrationData);

    // Registration should still succeed despite audit logging failure
    expect(result).toMatchObject({
      success: 'Confirmation email sent!',
    });

    // User should still be created
    expect((mockDb.user as { create: jest.Mock }).create).toHaveBeenCalled();

    // Token generation should still proceed
    expect(mockGenerateVerificationToken).toHaveBeenCalled();
  });

  // ─── Test 8: Prisma P2002 unique constraint error ──────────────────
  it('should return specific error for Prisma P2002 unique constraint violation', async () => {
    (mockDb.user as { create: jest.Mock }).create.mockRejectedValue(
      new Error('Unique constraint failed on the fields: (`email`). Prisma error code: P2002')
    );

    const result = await register(validRegistrationData);

    expect(result).toMatchObject({
      error: 'Email already exists!',
    });
    expect(result).toHaveProperty('rateLimitInfo');
  });

  // ─── Test 9: Prisma P2021 table not found error ────────────────────
  it('should return specific error for Prisma P2021 table not found', async () => {
    (mockDb.user as { create: jest.Mock }).create.mockRejectedValue(
      new Error('The table `User` does not exist in the current database. Prisma error code: P2021')
    );

    const result = await register(validRegistrationData);

    expect(result).toMatchObject({
      error: 'Database table not found. Please contact support.',
    });
    expect(result).toHaveProperty('rateLimitInfo');
  });

  // ─── Test 10: Prisma P2025 record not found error ──────────────────
  it('should return specific error for Prisma P2025 record not found', async () => {
    (mockDb.user as { create: jest.Mock }).create.mockRejectedValue(
      new Error('An operation failed because it depends on records that were not found. P2025')
    );

    const result = await register(validRegistrationData);

    expect(result).toMatchObject({
      error: 'Database record not found.',
    });
    expect(result).toHaveProperty('rateLimitInfo');
  });

  // ─── Test 11: Database connection error ────────────────────────────
  it('should return connection error for database connectivity issues', async () => {
    (mockDb.user as { create: jest.Mock }).create.mockRejectedValue(
      new Error('Can\'t reach database server at `localhost`. Please make sure your database server is running. connection refused')
    );

    const result = await register(validRegistrationData);

    expect(result).toMatchObject({
      error: 'Database connection error. Please try again later.',
    });
    expect(result).toHaveProperty('rateLimitInfo');
  });

  // ─── Test 12: Returns rateLimitInfo on success ─────────────────────
  it('should include rateLimitInfo in successful response', async () => {
    const resetTime = Date.now() + 3600000;
    const { rateLimitAuth } = require('@/lib/rate-limit-server');
    (rateLimitAuth as jest.Mock).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 3,
      reset: resetTime,
    });

    const result = await register(validRegistrationData);

    expect(result).toHaveProperty('success', 'Confirmation email sent!');
    expect(result).toHaveProperty('rateLimitInfo');
    expect(result.rateLimitInfo).toEqual({
      remaining: 3,
      reset: resetTime,
    });
  });

  // ─── Test 13: Returns rateLimitInfo on existing-user error ─────────
  it('should include rateLimitInfo when email is already in use', async () => {
    const resetTime = Date.now() + 3600000;
    const { rateLimitAuth } = require('@/lib/rate-limit-server');
    (rateLimitAuth as jest.Mock).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 2,
      reset: resetTime,
    });

    mockGetUserByEmail.mockResolvedValue({
      id: 'existing-user-id',
      email: 'newuser@example.com',
    });

    const result = await register(validRegistrationData);

    expect(result).toHaveProperty('error', 'Email already in use!');
    expect(result.rateLimitInfo).toEqual({
      remaining: 2,
      reset: resetTime,
    });
  });

  // ─── Test 14: Returns rateLimitInfo on database error ──────────────
  it('should include rateLimitInfo when database error occurs', async () => {
    const resetTime = Date.now() + 3600000;
    const { rateLimitAuth } = require('@/lib/rate-limit-server');
    (rateLimitAuth as jest.Mock).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 1,
      reset: resetTime,
    });

    (mockDb.user as { create: jest.Mock }).create.mockRejectedValue(
      new Error('Something unexpected happened')
    );

    const result = await register(validRegistrationData);

    expect(result).toHaveProperty('error', 'Something went wrong during registration!');
    expect(result.rateLimitInfo).toEqual({
      remaining: 1,
      reset: resetTime,
    });
  });

  // ─── Test 15: Logs suspicious activity on database error ───────────
  it('should log suspicious activity when database error occurs', async () => {
    const dbError = new Error('P2002 unique constraint failed');
    (mockDb.user as { create: jest.Mock }).create.mockRejectedValue(dbError);

    await register(validRegistrationData);

    const { authAuditHelpers } = require('@/lib/audit/auth-audit');
    expect(authAuditHelpers.logSuspiciousActivity).toHaveBeenCalledWith(
      undefined,
      'newuser@example.com',
      'REGISTRATION_ERROR',
      expect.stringContaining('Registration failed:')
    );
  });

  // ─── Test 16: Generic unknown error falls back to default message ──
  it('should return generic error for non-Error exceptions', async () => {
    (mockDb.user as { create: jest.Mock }).create.mockRejectedValue('string error');

    const result = await register(validRegistrationData);

    expect(result).toMatchObject({
      error: 'Something went wrong during registration!',
    });
    expect(result).toHaveProperty('rateLimitInfo');
  });

  // ─── Test 17: Password is hashed before storing ────────────────────
  it('should hash the password with bcrypt before creating user', async () => {
    mockBcryptHash.mockResolvedValue('$2a$10$specifichashedvalue');

    await register(validRegistrationData);

    expect(mockBcryptHash).toHaveBeenCalledWith('StrongP@ss1', 10);
    expect((mockDb.user as { create: jest.Mock }).create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        password: '$2a$10$specifichashedvalue',
      }),
    });
  });

  // ─── Test 18: Missing acceptTermsAndPrivacy returns invalid fields ─
  it('should return error when acceptTermsAndPrivacy is missing', async () => {
    const dataWithoutTerms = {
      email: 'newuser@example.com',
      password: 'StrongP@ss1',
      name: 'New User',
      // acceptTermsAndPrivacy missing
    };

    const result = await register(dataWithoutTerms as Parameters<typeof register>[0]);

    expect(result).toEqual({ error: 'Invalid fields!' });
  });

  // ─── Test 19: Rate limiter receives email as identifier ────────────
  it('should pass email as the rate limit identifier', async () => {
    const { rateLimitAuth } = require('@/lib/rate-limit-server');

    await register(validRegistrationData);

    expect(rateLimitAuth).toHaveBeenCalledWith('register', 'newuser@example.com');
  });

  // ─── Test 20: Connection error with "connect" keyword ──────────────
  it('should handle connection errors with "connect" keyword', async () => {
    (mockDb.user as { create: jest.Mock }).create.mockRejectedValue(
      new Error('Unable to connect to the database')
    );

    const result = await register(validRegistrationData);

    expect(result).toMatchObject({
      error: 'Database connection error. Please try again later.',
    });
  });
});
