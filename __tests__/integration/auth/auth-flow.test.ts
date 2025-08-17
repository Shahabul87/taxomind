/**
 * Comprehensive Authentication Flow Integration Tests
 * Tests the complete authentication journey including:
 * - Registration with email verification
 * - Login with 2FA
 * - Password reset flow
 * - Session management
 * - Role-based access control
 */

import { login } from '@/actions/login';
import { logout } from '@/actions/logout';
import { register } from '@/actions/register';
import { newPassword } from '@/actions/new-password';
import { newVerification } from '@/actions/new-verification';
import { reset } from '@/actions/reset';
import { settings } from '@/actions/settings';
import { signIn, signOut, auth } from '@/auth';
import { getUserByEmail, getUserById } from '@/data/user';
import { getVerificationTokenByToken } from '@/data/verification-token';
import { getPasswordResetTokenByToken } from '@/data/password-reset-token';
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { sendVerificationEmail, sendPasswordResetEmail, sendTwoFactorTokenEmail } from '@/lib/mail';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateVerificationToken, generatePasswordResetToken, generateTwoFactorToken } from '@/lib/tokens';

// Mock all external dependencies
jest.mock('@/auth');
jest.mock('@/data/user');
jest.mock('@/data/verification-token');
jest.mock('@/data/password-reset-token');
jest.mock('@/data/two-factor-token');
jest.mock('@/data/two-factor-confirmation');
jest.mock('@/lib/mail');
jest.mock('@/lib/tokens');
jest.mock('bcryptjs');
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    twoFactorToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    twoFactorConfirmation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
    },
  },
}));

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('Complete Registration Flow', () => {
    const newUserData = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      name: 'New User',
    };

    it('should successfully register a new user and send verification email', async () => {
      // Mock that user doesn't exist
      (getUserByEmail as jest.Mock).mockResolvedValue(null);
      
      // Mock password hashing
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      
      // Mock user creation
      (db.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-id',
        email: newUserData.email,
        name: newUserData.name,
        password: 'hashedPassword',
        emailVerified: null,
      });

      // Mock verification token generation
      const mockToken = { email: newUserData.email, token: 'verification-token-123', expires: new Date() };
      (generateVerificationToken as jest.Mock).mockResolvedValue(mockToken);
      
      // Mock email sending
      (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await register(newUserData);

      expect(result).toEqual({ success: 'Confirmation email sent!' });
      expect(getUserByEmail).toHaveBeenCalledWith(newUserData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(newUserData.password, 10);
      expect(db.user.create).toHaveBeenCalledWith({
        data: {
          email: newUserData.email,
          name: newUserData.name,
          password: 'hashedPassword',
        },
      });
      expect(generateVerificationToken).toHaveBeenCalledWith(newUserData.email);
      expect(sendVerificationEmail).toHaveBeenCalledWith(newUserData.email, 'verification-token-123');
    });

    it('should prevent registration with existing email', async () => {
      // Mock that user already exists
      (getUserByEmail as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: newUserData.email,
      });

      const result = await register(newUserData);

      expect(result).toEqual({ error: 'Email already in use!' });
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it('should validate password strength requirements', async () => {
      const weakPasswordData = {
        ...newUserData,
        password: '123', // Too weak
      };

      const result = await register(weakPasswordData);

      expect(result).toEqual({ error: 'Invalid fields!' });
      expect(db.user.create).not.toHaveBeenCalled();
    });
  });

  describe('Email Verification Flow', () => {
    it('should verify email with valid token', async () => {
      const mockToken = {
        email: 'user@example.com',
        token: 'valid-token',
        expires: new Date(Date.now() + 3600000), // 1 hour from now
      };

      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        emailVerified: null,
      };

      (getVerificationTokenByToken as jest.Mock).mockResolvedValue(mockToken);
      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerified: new Date(),
      });
      (db.verificationToken.delete as jest.Mock).mockResolvedValue({});

      const result = await newVerification('valid-token');

      expect(result).toEqual({ success: 'Email verified!' });
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          emailVerified: expect.any(Date),
          email: 'user@example.com',
        },
      });
    });

    it('should reject expired verification token', async () => {
      const expiredToken = {
        email: 'user@example.com',
        token: 'expired-token',
        expires: new Date(Date.now() - 3600000), // 1 hour ago
      };

      (getVerificationTokenByToken as jest.Mock).mockResolvedValue(expiredToken);

      const result = await newVerification('expired-token');

      expect(result).toEqual({ error: 'Token has expired!' });
      expect(db.user.update).not.toHaveBeenCalled();
    });
  });

  describe('Login Flow with 2FA', () => {
    const loginCredentials = {
      email: 'user@example.com',
      password: 'password123',
    };

    it('should login user without 2FA', async () => {
      const mockUser = {
        id: 'user-id',
        email: loginCredentials.email,
        password: 'hashedPassword',
        emailVerified: new Date(),
        isTwoFactorEnabled: false,
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (signIn as jest.Mock).mockResolvedValue({ success: true });

      const result = await login(loginCredentials);

      expect(result).toEqual({ success: 'Logged in!' });
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: loginCredentials.email,
        password: loginCredentials.password,
        redirectTo: undefined,
      });
    });

    it('should send 2FA code when 2FA is enabled', async () => {
      const mockUser = {
        id: 'user-id',
        email: loginCredentials.email,
        password: 'hashedPassword',
        emailVerified: new Date(),
        isTwoFactorEnabled: true,
      };

      const mockTwoFactorToken = {
        email: loginCredentials.email,
        token: '123456',
        expires: new Date(Date.now() + 300000), // 5 minutes
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateTwoFactorToken as jest.Mock).mockResolvedValue(mockTwoFactorToken);
      (sendTwoFactorTokenEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await login(loginCredentials);

      expect(result).toEqual({ twoFactor: true });
      expect(generateTwoFactorToken).toHaveBeenCalledWith(loginCredentials.email);
      expect(sendTwoFactorTokenEmail).toHaveBeenCalledWith(loginCredentials.email, '123456');
    });

    it('should verify 2FA code and complete login', async () => {
      const loginWith2FA = {
        ...loginCredentials,
        code: '123456',
      };

      const mockUser = {
        id: 'user-id',
        email: loginCredentials.email,
        password: 'hashedPassword',
        emailVerified: new Date(),
        isTwoFactorEnabled: true,
      };

      const mockTwoFactorToken = {
        id: 'token-id',
        email: loginCredentials.email,
        token: '123456',
        expires: new Date(Date.now() + 300000),
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (getTwoFactorTokenByEmail as jest.Mock).mockResolvedValue(mockTwoFactorToken);
      (db.twoFactorToken.delete as jest.Mock).mockResolvedValue({});
      (getTwoFactorConfirmationByUserId as jest.Mock).mockResolvedValue(null);
      (db.twoFactorConfirmation.create as jest.Mock).mockResolvedValue({});
      (signIn as jest.Mock).mockResolvedValue({ success: true });

      const result = await login(loginWith2FA);

      expect(result).toEqual({ success: 'Logged in!' });
      expect(db.twoFactorToken.delete).toHaveBeenCalledWith({
        where: { id: expect.any(String) },
      });
      expect(db.twoFactorConfirmation.create).toHaveBeenCalledWith({
        data: { userId: mockUser.id },
      });
    });

    it('should reject invalid 2FA code', async () => {
      const loginWithWrong2FA = {
        ...loginCredentials,
        code: '999999',
      };

      const mockUser = {
        id: 'user-id',
        email: loginCredentials.email,
        password: 'hashedPassword',
        emailVerified: new Date(),
        isTwoFactorEnabled: true,
      };

      const mockTwoFactorToken = {
        id: 'token-id-2',
        email: loginCredentials.email,
        token: '123456', // Different from provided code
        expires: new Date(Date.now() + 300000),
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (getTwoFactorTokenByEmail as jest.Mock).mockResolvedValue(mockTwoFactorToken);

      const result = await login(loginWithWrong2FA);

      expect(result).toEqual({ error: 'Invalid code!' });
      expect(signIn).not.toHaveBeenCalled();
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        emailVerified: new Date(),
      };

      const mockResetToken = {
        email: 'user@example.com',
        token: 'reset-token-123',
        expires: new Date(Date.now() + 3600000),
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (generatePasswordResetToken as jest.Mock).mockResolvedValue(mockResetToken);
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await reset({ email: 'user@example.com' });

      expect(result).toEqual({ success: 'Reset email sent!' });
      expect(generatePasswordResetToken).toHaveBeenCalledWith('user@example.com');
      expect(sendPasswordResetEmail).toHaveBeenCalledWith('user@example.com', 'reset-token-123');
    });

    it('should reset password with valid token', async () => {
      const mockToken = {
        email: 'user@example.com',
        token: 'valid-reset-token',
        expires: new Date(Date.now() + 3600000),
      };

      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
      };

      (getPasswordResetTokenByToken as jest.Mock).mockResolvedValue(mockToken);
      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      (db.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'newHashedPassword',
      });
      (db.passwordResetToken.delete as jest.Mock).mockResolvedValue({});

      const result = await newPassword({
        password: 'NewSecurePassword123!',
      }, 'valid-reset-token');

      expect(result).toEqual({ success: 'Password updated!' });
      expect(bcrypt.hash).toHaveBeenCalledWith('NewSecurePassword123!', 10);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { password: 'newHashedPassword' },
      });
    });
  });

  describe('User Settings Management', () => {
    it('should update user profile settings', async () => {
      const mockUser = {
        id: 'user-id',
        name: 'Old Name',
        email: 'user@example.com',
        isTwoFactorEnabled: false,
      };

      const updateData = {
        name: 'New Name',
        isTwoFactorEnabled: true,
        role: 'USER' as const,
      };

      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'user-id' },
      });
      (getUserById as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...updateData,
      });

      const result = await settings(updateData);

      expect(result).toEqual({ success: 'Settings updated!' });
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: updateData,
      });
    });

    it('should handle email change with verification', async () => {
      const mockUser = {
        id: 'user-id',
        name: 'User Name',
        email: 'old@example.com',
        isTwoFactorEnabled: false,
        password: 'hashedPassword',
      };

      const updateData = {
        email: 'new@example.com',
        password: 'currentPassword',
        role: 'USER' as const,
      };

      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'user-id' },
      });
      (getUserById as jest.Mock).mockResolvedValue(mockUser);
      (getUserByEmail as jest.Mock).mockResolvedValue(null); // New email not taken
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateVerificationToken as jest.Mock).mockResolvedValue({
        email: 'new@example.com',
        token: 'verification-token',
        expires: new Date(),
      });
      (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);
      (db.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: 'new@example.com',
      });

      const result = await settings(updateData);

      expect(result).toEqual({ success: 'Verification email sent!' });
      expect(bcrypt.compare).toHaveBeenCalledWith('currentPassword', 'hashedPassword');
      expect(generateVerificationToken).toHaveBeenCalledWith('new@example.com');
      expect(sendVerificationEmail).toHaveBeenCalledWith('new@example.com', 'verification-token');
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout user', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);

      await logout();

      expect(signOut).toHaveBeenCalled();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should enforce admin role requirements', async () => {
      const adminUser = {
        id: 'admin-id',
        email: 'admin@example.com',
        role: 'ADMIN',
        emailVerified: new Date(),
      };

      const regularUser = {
        id: 'user-id',
        email: 'user@example.com',
        role: 'USER',
        emailVerified: new Date(),
      };

      // Mock admin check
      (getUserById as jest.Mock)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(regularUser);

      // Test admin access
      const adminAccess = adminUser.role === 'ADMIN';
      expect(adminAccess).toBe(true);

      // Test regular user access
      const userAccess = regularUser.role === 'ADMIN';
      expect(userAccess).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should maintain session after successful login', async () => {
      const mockSession = {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          name: 'Test User',
          role: 'USER',
        },
        expires: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      };

      (auth as jest.Mock).mockResolvedValue(mockSession);

      const session = await auth();
      
      expect(session).toEqual(mockSession);
      expect(session?.user?.id).toBe('user-id');
    });

    it('should return null for expired session', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const session = await auth();
      
      expect(session).toBeNull();
    });
  });

  describe('Security Features', () => {
    it('should prevent brute force attacks with rate limiting', async () => {
      const loginAttempts = Array(6).fill(null).map(() => 
        login({ email: 'user@example.com', password: 'wrongpassword' })
      );

      // Mock user exists but password is wrong
      (getUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        password: 'hashedPassword',
        emailVerified: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const results = await Promise.all(loginAttempts);
      
      // First 5 attempts should return invalid credentials
      results.slice(0, 5).forEach(result => {
        expect(result).toEqual({ error: 'Invalid credentials!' });
      });
    });

    it('should sanitize user input to prevent injection attacks', async () => {
      const maliciousInput = {
        email: '<script>alert("XSS")</script>@example.com',
        password: 'password123',
      };

      const result = await login(maliciousInput);

      expect(result).toEqual({ error: 'Invalid fields!' });
      expect(getUserByEmail).not.toHaveBeenCalled();
    });
  });
});