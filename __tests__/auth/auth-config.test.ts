/**
 * Auth Config Test Suite
 *
 * Tests the NextAuth configuration exported from auth.config.ts:
 * - Provider configuration (Google, GitHub, Credentials)
 * - Session and JWT settings
 * - Cookie and trust settings
 * - Secret resolution
 * - Credentials authorize function
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/schemas', () => ({
  LoginSchema: {
    safeParse: jest.fn(),
  },
}));

jest.mock('@/data/user', () => ({
  getUserByEmail: jest.fn(),
}));

jest.mock('@/lib/security/cookie-config', () => ({
  DefaultCookieConfig: {
    sessionToken: { name: 'test-session-token' },
  },
}));

jest.mock('@/lib/passwordUtils', () => ({
  verifyPassword: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the providers to return identifiable objects
jest.mock('next-auth/providers/google', () => ({
  __esModule: true,
  default: jest.fn((config: Record<string, unknown>) => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
    options: config,
  })),
}));

jest.mock('next-auth/providers/github', () => ({
  __esModule: true,
  default: jest.fn((config: Record<string, unknown>) => ({
    id: 'github',
    name: 'GitHub',
    type: 'oauth',
    options: config,
  })),
}));

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn((config: Record<string, unknown>) => ({
    id: 'credentials',
    name: 'Credentials',
    type: 'credentials',
    authorize: config.authorize,
  })),
}));

jest.mock('next-auth/jwt', () => ({
  encode: jest.fn(),
  decode: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { LoginSchema } from '@/schemas';
import { getUserByEmail } from '@/data/user';

const mockLoginSafeParse = LoginSchema.safeParse as jest.Mock;
const mockGetUserByEmail = getUserByEmail as jest.Mock;

// ---------------------------------------------------------------------------
// Helper to get the config fresh (handles env-dependent secret)
// ---------------------------------------------------------------------------

function loadAuthConfig() {
  // Reset modules so auth.config.ts re-evaluates (picks up env changes)
  jest.resetModules();

  // Re-apply mocks after resetModules
  jest.doMock('@/schemas', () => ({
    LoginSchema: { safeParse: mockLoginSafeParse },
  }));
  jest.doMock('@/data/user', () => ({
    getUserByEmail: mockGetUserByEmail,
  }));
  jest.doMock('@/lib/security/cookie-config', () => ({
    DefaultCookieConfig: { sessionToken: { name: 'test-session-token' } },
  }));
  jest.doMock('@/lib/passwordUtils', () => ({
    verifyPassword: jest.fn(),
  }));
  jest.doMock('@/lib/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  }));
  jest.doMock('next-auth/providers/google', () => ({
    __esModule: true,
    default: jest.fn((config: Record<string, unknown>) => ({
      id: 'google', name: 'Google', type: 'oauth', options: config,
    })),
  }));
  jest.doMock('next-auth/providers/github', () => ({
    __esModule: true,
    default: jest.fn((config: Record<string, unknown>) => ({
      id: 'github', name: 'GitHub', type: 'oauth', options: config,
    })),
  }));
  jest.doMock('next-auth/providers/credentials', () => ({
    __esModule: true,
    default: jest.fn((config: Record<string, unknown>) => ({
      id: 'credentials', name: 'Credentials', type: 'credentials', authorize: config.authorize,
    })),
  }));
  jest.doMock('next-auth/jwt', () => ({
    encode: jest.fn(),
    decode: jest.fn(),
  }));

  return require('@/auth.config').default;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('auth.config.ts', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      AUTH_SECRET: 'test-auth-secret',
      NEXTAUTH_SECRET: 'test-nextauth-secret',
      GOOGLE_CLIENT_ID: 'test-google-id',
      GOOGLE_CLIENT_SECRET: 'test-google-secret',
      GITHUB_CLIENT_ID: 'test-github-id',
      GITHUB_CLIENT_SECRET: 'test-github-secret',
      NODE_ENV: 'test',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // =========================================================================
  // Provider configuration
  // =========================================================================

  describe('providers', () => {
    it('should include Google, GitHub, and Credentials providers', () => {
      const config = loadAuthConfig();
      expect(config.providers).toHaveLength(3);

      const providerIds = config.providers.map((p: { id: string }) => p.id);
      expect(providerIds).toContain('google');
      expect(providerIds).toContain('github');
      expect(providerIds).toContain('credentials');
    });
  });

  // =========================================================================
  // Session configuration
  // =========================================================================

  describe('session', () => {
    it('should use jwt strategy', () => {
      const config = loadAuthConfig();
      expect(config.session.strategy).toBe('jwt');
    });

    it('should set maxAge to 30 days', () => {
      const config = loadAuthConfig();
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      expect(config.session.maxAge).toBe(thirtyDaysInSeconds);
    });
  });

  // =========================================================================
  // JWT configuration
  // =========================================================================

  describe('jwt', () => {
    it('should set jwt maxAge to 30 days', () => {
      const config = loadAuthConfig();
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      expect(config.jwt.maxAge).toBe(thirtyDaysInSeconds);
    });
  });

  // =========================================================================
  // Trust and cookie settings
  // =========================================================================

  describe('trustHost and cookies', () => {
    it('should set trustHost to true', () => {
      const config = loadAuthConfig();
      expect(config.trustHost).toBe(true);
    });

    it('should use secure cookies in production', () => {
      process.env.NODE_ENV = 'production';
      const config = loadAuthConfig();
      expect(config.useSecureCookies).toBe(true);
    });

    it('should not use secure cookies outside production', () => {
      process.env.NODE_ENV = 'development';
      const config = loadAuthConfig();
      expect(config.useSecureCookies).toBe(false);
    });
  });

  // =========================================================================
  // Secret resolution
  // =========================================================================

  describe('secret', () => {
    it('should use AUTH_SECRET when available', () => {
      process.env.AUTH_SECRET = 'primary-secret';
      process.env.NEXTAUTH_SECRET = 'fallback-secret';
      const config = loadAuthConfig();
      expect(config.secret).toBe('primary-secret');
    });

    it('should fallback to NEXTAUTH_SECRET when AUTH_SECRET is missing', () => {
      delete process.env.AUTH_SECRET;
      process.env.NEXTAUTH_SECRET = 'fallback-secret';
      const config = loadAuthConfig();
      expect(config.secret).toBe('fallback-secret');
    });

    it('should throw if both AUTH_SECRET and NEXTAUTH_SECRET are missing', () => {
      delete process.env.AUTH_SECRET;
      delete process.env.NEXTAUTH_SECRET;

      expect(() => loadAuthConfig()).toThrow(
        'AUTH_SECRET or NEXTAUTH_SECRET must be set'
      );
    });
  });

  // =========================================================================
  // Credentials authorize function
  // =========================================================================

  describe('Credentials authorize', () => {
    let authorize: (credentials: Record<string, unknown>) => Promise<Record<string, unknown> | null>;

    beforeEach(() => {
      const config = loadAuthConfig();
      const credentialsProvider = config.providers.find(
        (p: { id: string }) => p.id === 'credentials'
      );
      authorize = credentialsProvider.authorize;
    });

    it('should return null for invalid credentials (schema validation fails)', async () => {
      mockLoginSafeParse.mockReturnValue({
        success: false,
        error: { issues: [{ message: 'Invalid email' }] },
      });

      const result = await authorize({ email: 'bad', password: '' });
      expect(result).toBeNull();
    });

    it('should return null if user is not found', async () => {
      mockLoginSafeParse.mockReturnValue({
        success: true,
        data: { email: 'unknown@example.com', password: 'password123' },
      });
      mockGetUserByEmail.mockResolvedValue(null);

      const result = await authorize({
        email: 'unknown@example.com',
        password: 'password123',
      });
      expect(result).toBeNull();
    });

    it('should return null if user has no password (OAuth-only user)', async () => {
      mockLoginSafeParse.mockReturnValue({
        success: true,
        data: { email: 'oauth@example.com', password: 'password123' },
      });
      mockGetUserByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'oauth@example.com',
        password: null,
      });

      const result = await authorize({
        email: 'oauth@example.com',
        password: 'password123',
      });
      expect(result).toBeNull();
    });

    it('should return user on valid password match', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'valid@example.com',
        name: 'Valid User',
        password: 'hashed-password',
      };

      mockLoginSafeParse.mockReturnValue({
        success: true,
        data: { email: 'valid@example.com', password: 'correct-password' },
      });
      mockGetUserByEmail.mockResolvedValue(mockUser);

      // Need to get the verifyPassword mock from the doMock'd module
      const { verifyPassword } = require('@/lib/passwordUtils');
      (verifyPassword as jest.Mock).mockResolvedValue(true);

      const result = await authorize({
        email: 'valid@example.com',
        password: 'correct-password',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null on password mismatch', async () => {
      mockLoginSafeParse.mockReturnValue({
        success: true,
        data: { email: 'user@example.com', password: 'wrong-password' },
      });
      mockGetUserByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password: 'hashed-password',
      });

      const { verifyPassword } = require('@/lib/passwordUtils');
      (verifyPassword as jest.Mock).mockResolvedValue(false);

      const result = await authorize({
        email: 'user@example.com',
        password: 'wrong-password',
      });
      expect(result).toBeNull();
    });

    it('should return null when password verification throws an error', async () => {
      mockLoginSafeParse.mockReturnValue({
        success: true,
        data: { email: 'user@example.com', password: 'password123' },
      });
      mockGetUserByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password: 'hashed-password',
      });

      const { verifyPassword } = require('@/lib/passwordUtils');
      (verifyPassword as jest.Mock).mockRejectedValue(new Error('Crypto error'));

      const result = await authorize({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result).toBeNull();
    });
  });
});
