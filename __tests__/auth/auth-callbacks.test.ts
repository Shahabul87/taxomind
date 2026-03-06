/**
 * Auth Callbacks Test Suite
 *
 * Tests the NextAuth callback functions defined in auth.ts:
 * - redirect callback
 * - signIn callback
 * - session callback
 * - jwt callback
 *
 * Strategy: Since auth.ts calls NextAuth() at module level and jest.setup.js
 * provides global mocks for both `next-auth` and `@/auth`, we must:
 * 1. Unmock `@/auth` so we can load the real module
 * 2. Override `next-auth` mock so our spy captures the config
 * 3. Mock all dependencies that auth.ts imports
 */

// Unmock the modules we want to load for real
jest.unmock('@/auth');
jest.unmock('next-auth');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CapturedAuthConfig {
  callbacks: {
    redirect: (params: { url: string; baseUrl: string }) => Promise<string>;
    signIn: (params: {
      user: Record<string, unknown> | null;
      account: Record<string, unknown> | null;
    }) => Promise<boolean>;
    session: (params: {
      token: Record<string, unknown> | null;
      session: Record<string, unknown> | null;
    }) => Promise<Record<string, unknown>>;
    jwt: (params: {
      token: Record<string, unknown> | null;
      trigger?: string;
      session?: Record<string, unknown>;
    }) => Promise<Record<string, unknown>>;
  };
  events: Record<string, (...args: unknown[]) => Promise<void>>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Override the next-auth mock to capture the config
// ---------------------------------------------------------------------------

let capturedConfig: CapturedAuthConfig;

jest.mock('next-auth', () => ({
  __esModule: true,
  default: (config: CapturedAuthConfig) => {
    capturedConfig = config;
    return {
      handlers: { GET: jest.fn(), POST: jest.fn() },
      auth: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    };
  },
}));

// ---------------------------------------------------------------------------
// Mock all dependencies that auth.ts imports
// ---------------------------------------------------------------------------

jest.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(),
}));

jest.mock('@/auth.config', () => ({
  __esModule: true,
  default: { providers: [] },
}));

jest.mock('@/lib/db', () => ({
  db: {
    user: { update: jest.fn() },
    twoFactorConfirmation: { delete: jest.fn() },
  },
  getBasePrismaClient: jest.fn(),
}));

jest.mock('@/data/user', () => ({
  getUserById: jest.fn(),
}));

jest.mock('@/data/two-factor-confirmation', () => ({
  getTwoFactorConfirmationByUserId: jest.fn(),
}));

jest.mock('@/data/account', () => ({
  getAccountByUserId: jest.fn(),
}));

jest.mock('@/lib/env-check', () => ({
  checkEnvironmentVariables: jest.fn(),
}));

jest.mock('@/lib/security/cookie-config', () => ({
  getSessionConfig: jest.fn(),
  validateCookieConfig: jest.fn(() => true),
  DefaultCookieConfig: {},
}));

jest.mock('@/lib/audit/auth-audit', () => ({
  authAuditHelpers: {
    logOAuthSuccess: jest.fn().mockResolvedValue(undefined),
    logSignInSuccess: jest.fn().mockResolvedValue(undefined),
    logSignOut: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/lib/auth/mfa-enforcement', () => ({
  shouldEnforceMFAOnSignIn: jest.fn(),
  logMFAEnforcementAction: jest.fn(),
}));

jest.mock('@/lib/security/session-manager', () => ({
  SessionManager: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/routes', () => ({
  getRedirectUrl: jest.fn(() => '/dashboard/user'),
}));

jest.mock('@/lib/auth/brute-force-protection', () => ({
  checkAccountLocked: jest.fn().mockResolvedValue({ locked: false }),
}));

jest.mock('@/lib/auth/session-limiter', () => ({
  enforceSessionLimit: jest.fn().mockResolvedValue({ enforced: false, terminatedCount: 0 }),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks are declared)
// ---------------------------------------------------------------------------

import { getUserById } from '@/data/user';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { getAccountByUserId } from '@/data/account';
import { db } from '@/lib/db';

const mockGetUserById = getUserById as jest.Mock;
const mockGetTwoFactorConfirmation = getTwoFactorConfirmationByUserId as jest.Mock;
const mockGetAccountByUserId = getAccountByUserId as jest.Mock;
const mockDeleteTwoFactorConfirmation = (
  db.twoFactorConfirmation as { delete: jest.Mock }
).delete;

// ---------------------------------------------------------------------------
// Load the real auth.ts to trigger NextAuth() and capture the config
// ---------------------------------------------------------------------------

// This import triggers the module evaluation of auth.ts which calls NextAuth()
// with the callback config we want to test. Our mock captures it.
require('@/auth');

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

const BASE_URL = 'http://localhost:3000';

function createVerifiedUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: new Date('2024-01-01'),
    isTwoFactorEnabled: false,
    password: 'hashed-password',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Restore brute force mock default after clearAllMocks resets it
  const bruteForce = require('@/lib/auth/brute-force-protection');
  (bruteForce.checkAccountLocked as jest.Mock).mockResolvedValue({ locked: false });
});

// ===========================================================================
// Tests
// ===========================================================================

describe('auth.ts callbacks', () => {
  // =========================================================================
  // redirect callback
  // =========================================================================

  describe('redirect callback', () => {
    it('should redirect OAuth callback URLs to /dashboard/user', async () => {
      const result = await capturedConfig.callbacks.redirect({
        url: `${BASE_URL}/api/auth/callback/google`,
        baseUrl: BASE_URL,
      });
      expect(result).toBe(`${BASE_URL}/dashboard/user`);
    });

    it('should redirect base URL to /dashboard/user', async () => {
      const result = await capturedConfig.callbacks.redirect({
        url: BASE_URL,
        baseUrl: BASE_URL,
      });
      expect(result).toBe(`${BASE_URL}/dashboard/user`);
    });

    it('should redirect root path to /dashboard/user', async () => {
      const result = await capturedConfig.callbacks.redirect({
        url: `${BASE_URL}/`,
        baseUrl: BASE_URL,
      });
      expect(result).toBe(`${BASE_URL}/dashboard/user`);
    });

    it('should redirect /dashboard to /dashboard/user', async () => {
      const result = await capturedConfig.callbacks.redirect({
        url: `${BASE_URL}/dashboard`,
        baseUrl: BASE_URL,
      });
      expect(result).toBe(`${BASE_URL}/dashboard/user`);
    });

    it('should pass through absolute URLs on the same domain', async () => {
      const targetUrl = `${BASE_URL}/settings/profile`;
      const result = await capturedConfig.callbacks.redirect({
        url: targetUrl,
        baseUrl: BASE_URL,
      });
      expect(result).toBe(targetUrl);
    });

    it('should combine relative URLs with baseUrl', async () => {
      const result = await capturedConfig.callbacks.redirect({
        url: '/courses/123',
        baseUrl: BASE_URL,
      });
      expect(result).toBe(`${BASE_URL}/courses/123`);
    });

    it('should fallback to /dashboard/user for unknown external URLs', async () => {
      const result = await capturedConfig.callbacks.redirect({
        url: 'https://evil.com/phishing',
        baseUrl: BASE_URL,
      });
      expect(result).toBe(`${BASE_URL}/dashboard/user`);
    });

    it('should handle OAuth callback with GitHub provider', async () => {
      const result = await capturedConfig.callbacks.redirect({
        url: `${BASE_URL}/api/auth/callback/github`,
        baseUrl: BASE_URL,
      });
      expect(result).toBe(`${BASE_URL}/dashboard/user`);
    });
  });

  // =========================================================================
  // signIn callback
  // =========================================================================

  describe('signIn callback', () => {
    it('should return false if user is null', async () => {
      const result = await capturedConfig.callbacks.signIn({
        user: null,
        account: null,
      });
      expect(result).toBe(false);
    });

    it('should return false if user is missing id', async () => {
      const result = await capturedConfig.callbacks.signIn({
        user: { email: 'test@example.com' },
        account: null,
      });
      expect(result).toBe(false);
    });

    it('should return true for OAuth providers (non-credentials)', async () => {
      const result = await capturedConfig.callbacks.signIn({
        user: { id: 'user-1', email: 'test@example.com' },
        account: { provider: 'google', type: 'oauth' },
      });
      expect(result).toBe(true);
    });

    it('should return true for GitHub OAuth provider', async () => {
      const result = await capturedConfig.callbacks.signIn({
        user: { id: 'user-1', email: 'test@example.com' },
        account: { provider: 'github', type: 'oauth' },
      });
      expect(result).toBe(true);
    });

    it('should return false if user not found in database', async () => {
      mockGetUserById.mockResolvedValue(null);

      const result = await capturedConfig.callbacks.signIn({
        user: { id: 'nonexistent-user' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(false);
    });

    it('should return false if email is not verified', async () => {
      mockGetUserById.mockResolvedValue(
        createVerifiedUser({ emailVerified: null })
      );

      const result = await capturedConfig.callbacks.signIn({
        user: { id: 'user-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(false);
    });

    it('should return false if 2FA is enabled but no confirmation found', async () => {
      mockGetUserById.mockResolvedValue(
        createVerifiedUser({ isTwoFactorEnabled: true })
      );
      mockGetTwoFactorConfirmation.mockResolvedValue(null);

      const result = await capturedConfig.callbacks.signIn({
        user: { id: 'user-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(false);
    });

    it('should delete 2FA confirmation on successful sign-in', async () => {
      const confirmationId = 'confirmation-123';
      mockGetUserById.mockResolvedValue(
        createVerifiedUser({ isTwoFactorEnabled: true })
      );
      mockGetTwoFactorConfirmation.mockResolvedValue({ id: confirmationId });
      mockDeleteTwoFactorConfirmation.mockResolvedValue({});

      const result = await capturedConfig.callbacks.signIn({
        user: { id: 'user-1' },
        account: { provider: 'credentials' },
      });

      expect(result).toBe(true);
      expect(mockDeleteTwoFactorConfirmation).toHaveBeenCalledWith({
        where: { id: confirmationId },
      });
    });

    it('should return true for verified user without 2FA', async () => {
      mockGetUserById.mockResolvedValue(createVerifiedUser());

      const result = await capturedConfig.callbacks.signIn({
        user: { id: 'user-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(true);
    });

    it('should return false when account is locked (brute force protection)', async () => {
      const bruteForce = require('@/lib/auth/brute-force-protection');
      (bruteForce.checkAccountLocked as jest.Mock).mockResolvedValue({
        locked: true,
        reason: 'Too many failed attempts',
        remainingMs: 300000,
      });

      const result = await capturedConfig.callbacks.signIn({
        user: { id: 'user-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(false);
    });

    it('should handle errors gracefully and return false', async () => {
      mockGetUserById.mockRejectedValue(new Error('Database connection failed'));

      const result = await capturedConfig.callbacks.signIn({
        user: { id: 'user-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(false);
    });

    it('should still allow sign-in if brute force check itself fails', async () => {
      const bruteForce = require('@/lib/auth/brute-force-protection');
      (bruteForce.checkAccountLocked as jest.Mock).mockRejectedValue(
        new Error('Redis unavailable')
      );
      mockGetUserById.mockResolvedValue(createVerifiedUser());

      const result = await capturedConfig.callbacks.signIn({
        user: { id: 'user-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(true);
    });
  });

  // =========================================================================
  // session callback
  // =========================================================================

  describe('session callback', () => {
    it('should set user.id from token.sub', async () => {
      const session = {
        user: { id: '', name: '', email: '', isTwoFactorEnabled: false, isOAuth: false },
      };
      const token = {
        sub: 'user-abc',
        name: 'Test',
        email: 'test@example.com',
        isTwoFactorEnabled: true,
        isOAuth: false,
      };

      const result = await capturedConfig.callbacks.session({ token, session });

      expect((result as { user: { id: string } }).user.id).toBe('user-abc');
    });

    it('should set user properties from token', async () => {
      const session = {
        user: { id: '', name: '', email: '', isTwoFactorEnabled: false, isOAuth: false },
      };
      const token = {
        sub: 'user-abc',
        name: 'Alice',
        email: 'alice@example.com',
        isTwoFactorEnabled: true,
        isOAuth: true,
      };

      const result = await capturedConfig.callbacks.session({ token, session });
      const user = (result as { user: Record<string, unknown> }).user;

      expect(user.name).toBe('Alice');
      expect(user.email).toBe('alice@example.com');
      expect(user.isTwoFactorEnabled).toBe(true);
      expect(user.isOAuth).toBe(true);
    });

    it('should return session even if token is null', async () => {
      const session = { user: { id: 'original-id', name: 'Original' } };

      const result = await capturedConfig.callbacks.session({ token: null, session });

      expect(result).toBe(session);
    });

    it('should default name and email to empty strings when missing from token', async () => {
      const session = {
        user: { id: '', name: 'old', email: 'old@test.com', isTwoFactorEnabled: false, isOAuth: false },
      };
      const token = { sub: 'user-1', name: null, email: null, isTwoFactorEnabled: false, isOAuth: false };

      const result = await capturedConfig.callbacks.session({ token, session });
      const user = (result as { user: Record<string, unknown> }).user;

      expect(user.name).toBe('');
      expect(user.email).toBe('');
    });

    it('should default isTwoFactorEnabled to false when token value is falsy', async () => {
      const session = {
        user: { id: '', name: '', email: '', isTwoFactorEnabled: true, isOAuth: false },
      };
      const token = { sub: 'user-1', name: 'Test', email: 'test@test.com' };

      const result = await capturedConfig.callbacks.session({ token, session });
      const user = (result as { user: Record<string, unknown> }).user;

      expect(user.isTwoFactorEnabled).toBe(false);
    });
  });

  // =========================================================================
  // jwt callback
  // =========================================================================

  describe('jwt callback', () => {
    it('should return token as-is if token.sub is missing', async () => {
      const token = { name: 'Test', email: 'test@example.com' };

      const result = await capturedConfig.callbacks.jwt({ token });

      expect(result).toBe(token);
      expect(mockGetUserById).not.toHaveBeenCalled();
    });

    it('should return token as-is if token is null', async () => {
      const result = await capturedConfig.callbacks.jwt({ token: null });

      expect(result).toBeNull();
      expect(mockGetUserById).not.toHaveBeenCalled();
    });

    it('should look up user and set token properties', async () => {
      const user = createVerifiedUser({
        name: 'Jane Doe',
        email: 'jane@example.com',
        isTwoFactorEnabled: true,
      });
      mockGetUserById.mockResolvedValue(user);
      mockGetAccountByUserId.mockResolvedValue({ id: 'account-1', provider: 'google' });

      const token = { sub: 'user-1' };
      const result = await capturedConfig.callbacks.jwt({ token });

      expect(mockGetUserById).toHaveBeenCalledWith('user-1');
      expect((result as Record<string, unknown>).name).toBe('Jane Doe');
      expect((result as Record<string, unknown>).email).toBe('jane@example.com');
      expect((result as Record<string, unknown>).isTwoFactorEnabled).toBe(true);
      expect((result as Record<string, unknown>).isOAuth).toBe(true);
    });

    it('should set isOAuth to false when no linked account exists', async () => {
      mockGetUserById.mockResolvedValue(createVerifiedUser());
      mockGetAccountByUserId.mockResolvedValue(null);

      const token = { sub: 'user-1' };
      const result = await capturedConfig.callbacks.jwt({ token });

      expect((result as Record<string, unknown>).isOAuth).toBe(false);
    });

    it('should generate sessionToken if not present', async () => {
      mockGetUserById.mockResolvedValue(createVerifiedUser());
      mockGetAccountByUserId.mockResolvedValue(null);

      const token = { sub: 'user-1' };
      const result = await capturedConfig.callbacks.jwt({ token });

      expect((result as Record<string, unknown>).sessionToken).toBeDefined();
      expect(typeof (result as Record<string, unknown>).sessionToken).toBe('string');
    });

    it('should preserve existing sessionToken', async () => {
      mockGetUserById.mockResolvedValue(createVerifiedUser());
      mockGetAccountByUserId.mockResolvedValue(null);

      const existingToken = 'existing-session-token-uuid';
      const token = { sub: 'user-1', sessionToken: existingToken };
      const result = await capturedConfig.callbacks.jwt({ token });

      expect((result as Record<string, unknown>).sessionToken).toBe(existingToken);
    });

    it('should return token on error without breaking auth', async () => {
      mockGetUserById.mockRejectedValue(new Error('Database unavailable'));

      const token = { sub: 'user-1', name: 'Existing Name' };
      const result = await capturedConfig.callbacks.jwt({ token });

      expect(result).toBe(token);
    });

    it('should return token if user not found in database', async () => {
      mockGetUserById.mockResolvedValue(null);

      const token = { sub: 'nonexistent-user' };
      const result = await capturedConfig.callbacks.jwt({ token });

      expect(result).toBe(token);
      expect(mockGetAccountByUserId).not.toHaveBeenCalled();
    });
  });
});
