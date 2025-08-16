import { login } from '@/actions/login';
import { logout } from '@/actions/logout';
import { register } from '@/actions/register';
import { signIn, signOut } from '@/auth';
import { getUserByEmail, getUserById } from '@/data/user';
import { sendVerificationEmail, sendTwoFactorTokenEmail } from '@/lib/mail';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('@/auth', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/data/user', () => ({
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
}));

jest.mock('@/lib/mail', () => ({
  sendVerificationEmail: jest.fn(),
  sendTwoFactorTokenEmail: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    verificationToken: {
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
      delete: jest.fn(),
    },
  },
}));

import { db } from '@/lib/db';

describe('Authentication Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login action', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('successfully logs in user with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedPassword',
        emailVerified: new Date(),
        isTwoFactorEnabled: false,
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (signIn as jest.Mock).mockResolvedValue({ success: true });

      const result = await login(validCredentials);

      expect(result).toEqual({ success: 'Logged in!' });
      expect(getUserByEmail).toHaveBeenCalledWith(validCredentials.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(validCredentials.password, mockUser.password);
      expect(signIn).toHaveBeenCalledWith('credentials', validCredentials);
    });

    it('returns error for invalid email', async () => {
      (getUserByEmail as jest.Mock).mockResolvedValue(null);

      const result = await login(validCredentials);

      expect(result).toEqual({ error: 'Invalid credentials!' });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(signIn).not.toHaveBeenCalled();
    });

    it('returns error for invalid password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedPassword',
        emailVerified: new Date(),
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await login(validCredentials);

      expect(result).toEqual({ error: 'Invalid credentials!' });
      expect(signIn).not.toHaveBeenCalled();
    });

    it('sends verification email for unverified user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedPassword',
        emailVerified: null,
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await login(validCredentials);

      expect(result).toEqual({ success: 'Confirmation email sent!' });
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String)
      );
      expect(signIn).not.toHaveBeenCalled();
    });

    it('handles two-factor authentication', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedPassword',
        emailVerified: new Date(),
        isTwoFactorEnabled: true,
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (sendTwoFactorTokenEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await login(validCredentials);

      expect(result).toEqual({ twoFactor: true });
      expect(sendTwoFactorTokenEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String)
      );
      expect(signIn).not.toHaveBeenCalled();
    });

    it('validates two-factor code correctly', async () => {
      const credentialsWithCode = {
        ...validCredentials,
        code: '123456',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedPassword',
        emailVerified: new Date(),
        isTwoFactorEnabled: true,
      };

      const mockToken = {
        id: 'token-1',
        email: 'test@example.com',
        token: '123456',
        expires: new Date(Date.now() + 3600000),
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (db.twoFactorToken.findFirst as jest.Mock).mockResolvedValue(mockToken);
      (db.twoFactorToken.delete as jest.Mock).mockResolvedValue(undefined);
      (db.twoFactorConfirmation.delete as jest.Mock).mockResolvedValue(undefined);
      (db.twoFactorConfirmation.create as jest.Mock).mockResolvedValue(undefined);
      (signIn as jest.Mock).mockResolvedValue({ success: true });

      const result = await login(credentialsWithCode);

      expect(result).toEqual({ success: 'Logged in!' });
      expect(db.twoFactorToken.findFirst).toHaveBeenCalledWith({
        where: { token: credentialsWithCode.code },
      });
      expect(signIn).toHaveBeenCalled();
    });

    it('returns error for expired two-factor code', async () => {
      const credentialsWithCode = {
        ...validCredentials,
        code: '123456',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedPassword',
        emailVerified: new Date(),
        isTwoFactorEnabled: true,
      };

      const mockToken = {
        id: 'token-1',
        email: 'test@example.com',
        token: '123456',
        expires: new Date(Date.now() - 3600000), // Expired
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (db.twoFactorToken.findFirst as jest.Mock).mockResolvedValue(mockToken);

      const result = await login(credentialsWithCode);

      expect(result).toEqual({ error: 'Code has expired!' });
      expect(signIn).not.toHaveBeenCalled();
    });
  });

  describe('logout action', () => {
    it('successfully logs out user', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);

      await logout();

      expect(signOut).toHaveBeenCalled();
    });

    it('handles logout errors gracefully', async () => {
      (signOut as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      // Should not throw
      await expect(logout()).resolves.not.toThrow();
    });
  });

  describe('register action', () => {
    const validRegistrationData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      name: 'New User',
    };

    it('successfully registers new user', async () => {
      (getUserByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (db.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-1',
        ...validRegistrationData,
        password: 'hashedPassword',
      });
      (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await register(validRegistrationData);

      expect(result).toEqual({ success: 'Confirmation email sent!' });
      expect(getUserByEmail).toHaveBeenCalledWith(validRegistrationData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(validRegistrationData.password, 10);
      expect(db.user.create).toHaveBeenCalledWith({
        data: {
          name: validRegistrationData.name,
          email: validRegistrationData.email,
          password: 'hashedPassword',
        },
      });
      expect(sendVerificationEmail).toHaveBeenCalled();
    });

    it('returns error if email already exists', async () => {
      (getUserByEmail as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: validRegistrationData.email,
      });

      const result = await register(validRegistrationData);

      expect(result).toEqual({ error: 'Email already in use!' });
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      const invalidData = {
        ...validRegistrationData,
        email: 'invalid-email',
      };

      const result = await register(invalidData);

      expect(result).toEqual({ error: 'Invalid fields!' });
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it('validates password strength', async () => {
      const weakPasswordData = {
        ...validRegistrationData,
        password: '123',
      };

      const result = await register(weakPasswordData);

      expect(result).toEqual({ error: 'Invalid fields!' });
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it('handles database errors gracefully', async () => {
      (getUserByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (db.user.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await register(validRegistrationData);

      expect(result).toEqual({ error: 'Something went wrong!' });
    });
  });
});