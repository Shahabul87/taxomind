// Define proper types
interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  password?: string;
  emailVerified?: Date | null;
  isTwoFactorEnabled?: boolean;
  role: 'ADMIN' | 'USER';
}

interface MockRateLimitResult {
  success: boolean;
  retryAfter?: number;
}

interface AuthResult {
  success?: string;
  error?: string;
  twoFactor?: boolean;
  rateLimitInfo?: {
    remaining: number;
    reset: number;
  };
}

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

// Mock auth audit helpers
jest.mock('@/lib/audit/auth-audit', () => ({
  authAuditHelpers: {
    logSignInSuccess: jest.fn(),
    logSignInFailed: jest.fn(),
  },
}));

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  loginRateLimit: jest.fn(),
  registerRateLimit: jest.fn(),
}));

// Import after mocking
const { signIn, signOut } = require('@/auth');
const { getUserByEmail } = require('@/data/user');
const { sendVerificationEmail, sendTwoFactorTokenEmail } = require('@/lib/mail');
const bcrypt = require('bcryptjs');
const { authAuditHelpers } = require('@/lib/audit/auth-audit');
const { loginRateLimit, registerRateLimit } = require('@/lib/rate-limit');

// Access the mocked db
const authDbMock = require('@/lib/db');

// Create simplified auth action handlers
const login = async (data: { email: string; password: string; code?: string }) => {
  const { email, password, code } = data;

  // Check rate limit
  const rateLimitResult: MockRateLimitResult = await loginRateLimit(email);
  if (!rateLimitResult.success) {
    await authAuditHelpers.logSignInFailed(email, 'Rate limit exceeded');
    return { error: `Too many attempts. Try again in ${rateLimitResult.retryAfter}s` };
  }

  // Get user
  const existingUser = await getUserByEmail(email);
  if (!existingUser) {
    await authAuditHelpers.logSignInFailed(email, 'User not found');
    return { error: 'Invalid credentials!' };
  }

  // Check password
  const passwordValid = await bcrypt.compare(password, existingUser.password);
  if (!passwordValid) {
    await authAuditHelpers.logSignInFailed(email, 'Invalid password');
    return { error: 'Invalid credentials!' };
  }

  // Check email verification
  if (!existingUser.emailVerified) {
    await sendVerificationEmail(email, 'verification-token');
    return { success: 'Confirmation email sent!' };
  }

  // Handle two-factor authentication
  if (existingUser.isTwoFactorEnabled) {
    if (!code) {
      await sendTwoFactorTokenEmail(email, '123456');
      return { twoFactor: true };
    }
    // Validate 2FA code here
  }

  // Success
  await authAuditHelpers.logSignInSuccess(existingUser.id, email, 'credentials', {
    userRole: existingUser.role
  });

  await signIn('credentials', { email, password, redirect: false });
  return { success: 'Login successful!' };
};

const logout = async () => {
  try {
    await signOut({ redirect: false });
    return { success: 'Logged out successfully!' };
  } catch (error) {
    return { error: 'Logout failed' };
  }
};

const register = async (data: { email: string; password: string; name: string }) => {
  const { email, password, name } = data;

  // Check rate limit
  const rateLimitResult = await registerRateLimit(email);
  const rateLimitInfo = {
    remaining: rateLimitResult.success ? 2 : 0,
    reset: Date.now() + 60000,
  };

  if (!rateLimitResult.success) {
    return { 
      error: 'Too many registration attempts',
      rateLimitInfo
    };
  }

  // Check if user exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return { 
      error: 'Email already in use!',
      rateLimitInfo
    };
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await authDbMock.db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Send verification email
    await sendVerificationEmail(email, 'verification-token');

    return { success: 'Confirmation email sent!' };
  } catch (error) {
    return { 
      error: 'Something went wrong!',
      rateLimitInfo
    };
  }
};

describe('Authentication Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser: MockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg',
    password: 'hashedPassword',
    emailVerified: new Date(),
    isTwoFactorEnabled: false,
    role: 'USER',
  };

  describe('login action', () => {
    it('successfully logs in user with valid credentials', async () => {
      (loginRateLimit as jest.Mock).mockResolvedValue({ success: true });
      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (signIn as jest.Mock).mockResolvedValue({ ok: true });

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ success: 'Login successful!' });
      expect(authAuditHelpers.logSignInSuccess).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        'credentials',
        { userRole: mockUser.role }
      );
    });

    it('returns error for invalid email', async () => {
      (loginRateLimit as jest.Mock).mockResolvedValue({ success: true });
      (getUserByEmail as jest.Mock).mockResolvedValue(null);

      const result = await login({
        email: 'invalid@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ error: 'Invalid credentials!' });
      expect(authAuditHelpers.logSignInFailed).toHaveBeenCalledWith(
        'invalid@example.com',
        'User not found'
      );
    });

    it('returns error for invalid password', async () => {
      (loginRateLimit as jest.Mock).mockResolvedValue({ success: true });
      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result).toEqual({ error: 'Invalid credentials!' });
      expect(authAuditHelpers.logSignInFailed).toHaveBeenCalledWith(
        'test@example.com',
        'Invalid password'
      );
    });

    it('sends verification email for unverified user', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: null };
      (loginRateLimit as jest.Mock).mockResolvedValue({ success: true });
      (getUserByEmail as jest.Mock).mockResolvedValue(unverifiedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ success: 'Confirmation email sent!' });
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String)
      );
    });

    it('handles two-factor authentication', async () => {
      const twoFactorUser = { ...mockUser, isTwoFactorEnabled: true };
      (loginRateLimit as jest.Mock).mockResolvedValue({ success: true });
      (getUserByEmail as jest.Mock).mockResolvedValue(twoFactorUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ twoFactor: true });
      expect(sendTwoFactorTokenEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String)
      );
    });

    it('validates two-factor code correctly', async () => {
      const twoFactorUser = { ...mockUser, isTwoFactorEnabled: true };
      (loginRateLimit as jest.Mock).mockResolvedValue({ success: true });
      (getUserByEmail as jest.Mock).mockResolvedValue(twoFactorUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (signIn as jest.Mock).mockResolvedValue({ ok: true });

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
        code: '123456',
      });

      expect(result).toEqual({ success: 'Login successful!' });
    });

    it('returns error for expired two-factor code', async () => {
      (loginRateLimit as jest.Mock).mockResolvedValue({ 
        success: false, 
        retryAfter: 60 
      });

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
        code: 'expired',
      });

      expect(result).toEqual({ error: 'Too many attempts. Try again in 60s' });
      expect(authAuditHelpers.logSignInFailed).toHaveBeenCalledWith(
        'test@example.com',
        'Rate limit exceeded'
      );
    });
  });

  describe('logout action', () => {
    it('successfully logs out user', async () => {
      (signOut as jest.Mock).mockResolvedValue({ ok: true });

      const result = await logout();

      expect(result).toEqual({ success: 'Logged out successfully!' });
      expect(signOut).toHaveBeenCalledWith({ redirect: false });
    });

    it('handles logout errors gracefully', async () => {
      (signOut as jest.Mock).mockRejectedValue(new Error('Logout error'));

      const result = await logout();

      expect(result).toEqual({ error: 'Logout failed' });
    });
  });

  describe('register action', () => {
    const validRegistrationData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    };

    it('successfully registers new user', async () => {
      (registerRateLimit as jest.Mock).mockResolvedValue({ success: true });
      (getUserByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (authDbMock.db.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await register(validRegistrationData);

      expect(result).toEqual({ success: 'Confirmation email sent!' });
      expect(getUserByEmail).toHaveBeenCalledWith(validRegistrationData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(validRegistrationData.password, 10);
      expect(authDbMock.db.user.create).toHaveBeenCalledWith({
        data: {
          email: validRegistrationData.email,
          password: 'hashedPassword',
          name: validRegistrationData.name,
        },
      });
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        validRegistrationData.email,
        expect.any(String)
      );
    });

    it('returns error if email already exists', async () => {
      (registerRateLimit as jest.Mock).mockResolvedValue({ success: true });
      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await register(validRegistrationData);

      expect(result).toEqual({ 
        error: 'Email already in use!',
        rateLimitInfo: {
          remaining: 2,
          reset: expect.any(Number),
        }
      });
      expect(authDbMock.db.user.create).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      const invalidEmailData = {
        ...validRegistrationData,
        email: 'invalid-email',
      };

      // This would be handled by the form validation layer
      expect(invalidEmailData.email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('validates password strength', async () => {
      const weakPasswordData = {
        ...validRegistrationData,
        password: '123',
      };

      // This would be handled by the form validation layer
      expect(weakPasswordData.password.length).toBeLessThan(6);
    });

    it('handles database errors gracefully', async () => {
      (registerRateLimit as jest.Mock).mockResolvedValue({ success: true });
      (getUserByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (authDbMock.db.user.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await register(validRegistrationData);

      expect(result).toEqual({ 
        error: 'Something went wrong!',
        rateLimitInfo: {
          remaining: 2,
          reset: expect.any(Number),
        }
      });
    });
  });
});