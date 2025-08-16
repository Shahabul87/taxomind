import { login } from '@/actions/login';
import { getUserByEmail } from '@/data/user';
import { sendVerificationEmail, sendTwoFactorTokenEmail } from '@/lib/mail';
import { generateVerificationToken, generateTwoFactorToken } from '@/lib/tokens';
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { LoginSchema } from '@/schemas';

// Mock dependencies
jest.mock('@/data/user');
jest.mock('@/lib/mail');
jest.mock('@/lib/tokens');
jest.mock('@/data/two-factor-token');
jest.mock('@/data/two-factor-confirmation');
jest.mock('@/lib/db');
jest.mock('bcryptjs');
jest.mock('@/auth', () => ({
  signIn: jest.fn(),
}));

const mockGetUserByEmail = getUserByEmail as jest.Mock;
const mockSendVerificationEmail = sendVerificationEmail as jest.Mock;
const mockSendTwoFactorTokenEmail = sendTwoFactorTokenEmail as jest.Mock;
const mockGenerateVerificationToken = generateVerificationToken as jest.Mock;
const mockGenerateTwoFactorToken = generateTwoFactorToken as jest.Mock;
const mockGetTwoFactorTokenByEmail = getTwoFactorTokenByEmail as jest.Mock;
const mockGetTwoFactorConfirmationByUserId = getTwoFactorConfirmationByUserId as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockSignIn = require('@/auth').signIn;

describe('login action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('should return error for non-existent user', async () => {
    mockGetUserByEmail.mockResolvedValue(null);

    const result = await login({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    expect(result).toEqual({
      error: 'Email does not exist!',
    });
  });

  it('should send verification email for unverified user', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'unverified@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: null,
      isTwoFactorEnabled: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateVerificationToken.mockResolvedValue({
      token: 'verification-token',
      email: mockUser.email,
    });

    const result = await login({
      email: 'unverified@example.com',
      password: 'password123',
    });

    expect(mockGenerateVerificationToken).toHaveBeenCalledWith(mockUser.email);
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      mockUser.email,
      'verification-token'
    );
    expect(result).toEqual({
      success: 'Confirmation email sent!',
    });
  });

  it('should return error for incorrect password', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(false);

    const result = await login({
      email: 'user@example.com',
      password: 'wrongpassword',
    });

    expect(result).toEqual({
      error: 'Invalid credentials!',
    });
  });

  it('should send 2FA token for user with 2FA enabled', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'twofactor@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: true,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateTwoFactorToken.mockResolvedValue({
      token: '123456',
      email: mockUser.email,
    });

    const result = await login({
      email: 'twofactor@example.com',
      password: 'password123',
    });

    expect(mockGenerateTwoFactorToken).toHaveBeenCalledWith(mockUser.email);
    expect(mockSendTwoFactorTokenEmail).toHaveBeenCalledWith(
      mockUser.email,
      '123456'
    );
    expect(result).toEqual({
      twoFactor: true,
    });
  });

  it('should validate 2FA code and login successfully', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'twofactor@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: true,
    };

    const mockToken = {
      token: '123456',
      email: mockUser.email,
      expires: new Date(Date.now() + 3600000),
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockGetTwoFactorTokenByEmail.mockResolvedValue(mockToken);
    
    // Mock Prisma transaction
    (db as any).$transaction = jest.fn().mockImplementation(async (callback) => {
      return callback({
        twoFactorToken: {
          delete: jest.fn(),
        },
        twoFactorConfirmation: {
          upsert: jest.fn(),
        },
      });
    });

    const result = await login({
      email: 'twofactor@example.com',
      password: 'password123',
      code: '123456',
    });

    expect(mockGetTwoFactorTokenByEmail).toHaveBeenCalledWith(mockUser.email);
    expect(result).toEqual({
      success: 'Logged in!',
    });
  });

  it('should return error for invalid 2FA code', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'twofactor@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: true,
    };

    const mockToken = {
      token: '123456',
      email: mockUser.email,
      expires: new Date(Date.now() + 3600000),
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockGetTwoFactorTokenByEmail.mockResolvedValue(mockToken);

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
    };

    const mockToken = {
      token: '123456',
      email: mockUser.email,
      expires: new Date(Date.now() - 3600000), // Expired
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockGetTwoFactorTokenByEmail.mockResolvedValue(mockToken);

    const result = await login({
      email: 'twofactor@example.com',
      password: 'password123',
      code: '123456',
    });

    expect(result).toEqual({
      error: 'Code has expired!',
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
    mockSignIn.mockResolvedValue({ success: true });

    const result = await login({
      email: 'regular@example.com',
      password: 'password123',
    });

    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'regular@example.com',
      password: 'password123',
      redirectTo: undefined,
    });
    expect(result).toEqual({
      success: 'Logged in!',
    });
  });

  it('should handle login with callback URL', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'regular@example.com',
      password: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      isTwoFactorEnabled: false,
    };

    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockSignIn.mockResolvedValue({ success: true });

    const result = await login(
      {
        email: 'regular@example.com',
        password: 'password123',
      },
      '/dashboard'
    );

    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'regular@example.com',
      password: 'password123',
      redirectTo: '/dashboard',
    });
    expect(result).toEqual({
      success: 'Logged in!',
    });
  });

  it('should return error for OAuth account', async () => {
    mockGetUserByEmail.mockResolvedValue(null);

    const result = await login({
      email: 'oauth@example.com',
      password: 'password123',
    });

    expect(result).toEqual({
      error: 'Email does not exist!',
    });
  });

  it('should handle login errors gracefully', async () => {
    mockGetUserByEmail.mockRejectedValue(new Error('Database error'));

    const result = await login({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result).toEqual({
      error: 'Something went wrong!',
    });
  });
});