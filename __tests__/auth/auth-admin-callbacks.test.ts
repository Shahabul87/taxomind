/**
 * Admin Auth Callbacks Test Suite
 *
 * Tests the NextAuth callback functions defined in auth.admin.ts:
 * - redirect callback (routes to /dashboard/admin)
 * - signIn callback (admin-only, no OAuth, role verification)
 * - session callback (includes role property)
 * - jwt callback (includes role property)
 *
 * Strategy: Use jest.unmock to clear global mocks from jest.setup.js,
 * then provide our own mocks to capture the admin NextAuth config.
 */

// Unmock so we can load the real auth.admin module
jest.unmock('next-auth');
jest.unmock('@/auth');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CapturedAdminConfig {
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
// Mock next-auth to capture admin config
// ---------------------------------------------------------------------------

let capturedAdminConfig: CapturedAdminConfig;

jest.mock('next-auth', () => ({
  __esModule: true,
  default: (config: CapturedAdminConfig) => {
    capturedAdminConfig = config;
    return {
      handlers: { GET: jest.fn(), POST: jest.fn() },
      auth: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    };
  },
}));

// ---------------------------------------------------------------------------
// Mock all dependencies that auth.admin.ts imports
// ---------------------------------------------------------------------------

jest.mock('server-only', () => ({}));

jest.mock('@/auth.config.admin', () => ({
  __esModule: true,
  default: { providers: [] },
}));

jest.mock('@/lib/auth/admin-prisma-adapter', () => ({
  AdminPrismaAdapter: jest.fn(),
}));

// NOTE: @/lib/db is resolved via moduleNameMapper to __mocks__/db.js
// We do NOT override it here -- we use the global mock and access its methods directly

jest.mock('@/data/admin', () => ({
  getAdminAccountById: jest.fn(),
}));

jest.mock('@/data/admin-two-factor-confirmation', () => ({
  getTwoFactorConfirmationByAdminId: jest.fn(),
}));

jest.mock('@/data/account', () => ({
  getAccountByUserId: jest.fn(),
}));

jest.mock('@/lib/env-check', () => ({
  checkEnvironmentVariables: jest.fn(),
}));

jest.mock('@/lib/security/cookie-config', () => ({
  getSessionConfig: jest.fn(),
  getAdminCookieConfig: jest.fn(() => ({})),
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

jest.mock('@/lib/admin/audit-helpers', () => ({
  logAdminLoginSuccess: jest.fn().mockResolvedValue(undefined),
  logAdminLoginFailure: jest.fn().mockResolvedValue(undefined),
  logAdminLogout: jest.fn().mockResolvedValue(undefined),
  createAdminSessionMetric: jest.fn().mockResolvedValue(undefined),
  endAdminSession: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/auth/mfa-enforcement', () => ({
  shouldEnforceMFAOnSignIn: jest.fn(() => ({ enforce: false, reason: 'MFA not required' })),
  logMFAEnforcementAction: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { getAdminAccountById } from '@/data/admin';
import { getTwoFactorConfirmationByAdminId } from '@/data/admin-two-factor-confirmation';
import { getAccountByUserId } from '@/data/account';
import { db } from '@/lib/db';

const mockGetAdminAccountById = getAdminAccountById as jest.Mock;
const mockGetTwoFactorConfirmation = getTwoFactorConfirmationByAdminId as jest.Mock;
const mockGetAccountByUserId = getAccountByUserId as jest.Mock;

// The global db mock (from __mocks__/db.js via moduleNameMapper) does not include
// adminTwoFactorConfirmation. We add it here so auth.admin.ts can find it.
const mockDeleteAdminTwoFactorConfirmation = jest.fn();
(db as Record<string, unknown>).adminTwoFactorConfirmation = {
  delete: mockDeleteAdminTwoFactorConfirmation,
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
};

// ---------------------------------------------------------------------------
// Load auth.admin.ts to trigger NextAuth() and capture config
// ---------------------------------------------------------------------------

require('@/auth.admin');

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

const BASE_URL = 'http://localhost:3000';

function createAdminAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@taxomind.com',
    emailVerified: new Date('2024-01-01'),
    role: 'ADMIN',
    isTwoFactorEnabled: false,
    totpEnabled: false,
    totpVerified: false,
    createdAt: new Date('2024-01-01'),
    password: 'hashed-password',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Restore default MFA enforcement mock after clearAllMocks
  const mfaEnforcement = require('@/lib/auth/mfa-enforcement');
  (mfaEnforcement.shouldEnforceMFAOnSignIn as jest.Mock).mockReturnValue({
    enforce: false,
    reason: 'MFA not required',
  });
});

// ===========================================================================
// Tests
// ===========================================================================

describe('auth.admin.ts callbacks', () => {
  // =========================================================================
  // redirect callback
  // =========================================================================

  describe('redirect callback', () => {
    it('should pass through absolute URLs on the same domain', async () => {
      const targetUrl = `${BASE_URL}/admin/settings`;
      const result = await capturedAdminConfig.callbacks.redirect({
        url: targetUrl,
        baseUrl: BASE_URL,
      });
      expect(result).toBe(targetUrl);
    });

    it('should combine relative URLs with baseUrl', async () => {
      const result = await capturedAdminConfig.callbacks.redirect({
        url: '/admin/users',
        baseUrl: BASE_URL,
      });
      expect(result).toBe(`${BASE_URL}/admin/users`);
    });

    it('should pass through root URL (matches startsWith baseUrl)', async () => {
      // Note: admin redirect checks url.startsWith(baseUrl) first, which
      // catches the root URL before the dedicated root-to-admin check
      const result = await capturedAdminConfig.callbacks.redirect({
        url: BASE_URL,
        baseUrl: BASE_URL,
      });
      expect(result).toBe(BASE_URL);
    });

    it('should pass through root path with trailing slash (matches startsWith baseUrl)', async () => {
      const result = await capturedAdminConfig.callbacks.redirect({
        url: `${BASE_URL}/`,
        baseUrl: BASE_URL,
      });
      expect(result).toBe(`${BASE_URL}/`);
    });

    it('should redirect unknown external URLs to /dashboard/admin', async () => {
      const result = await capturedAdminConfig.callbacks.redirect({
        url: 'https://evil.com/attack',
        baseUrl: BASE_URL,
      });
      expect(result).toBe(`${BASE_URL}/dashboard/admin`);
    });

    it('should preserve admin dashboard path when already on same domain', async () => {
      const result = await capturedAdminConfig.callbacks.redirect({
        url: `${BASE_URL}/dashboard/admin/users`,
        baseUrl: BASE_URL,
      });
      expect(result).toBe(`${BASE_URL}/dashboard/admin/users`);
    });
  });

  // =========================================================================
  // signIn callback
  // =========================================================================

  describe('signIn callback', () => {
    it('should return false if user is null', async () => {
      const result = await capturedAdminConfig.callbacks.signIn({
        user: null,
        account: null,
      });
      expect(result).toBe(false);
    });

    it('should return false if user is missing id', async () => {
      const result = await capturedAdminConfig.callbacks.signIn({
        user: { email: 'admin@taxomind.com' },
        account: null,
      });
      expect(result).toBe(false);
    });

    it('should return false for OAuth providers (admin OAuth is disabled)', async () => {
      const result = await capturedAdminConfig.callbacks.signIn({
        user: { id: 'admin-1', email: 'admin@taxomind.com' },
        account: { provider: 'google', type: 'oauth' },
      });
      expect(result).toBe(false);
    });

    it('should return false for GitHub OAuth (admin OAuth is disabled)', async () => {
      const result = await capturedAdminConfig.callbacks.signIn({
        user: { id: 'admin-1', email: 'admin@taxomind.com' },
        account: { provider: 'github', type: 'oauth' },
      });
      expect(result).toBe(false);
    });

    it('should return false if admin account not found in database', async () => {
      mockGetAdminAccountById.mockResolvedValue(null);

      const result = await capturedAdminConfig.callbacks.signIn({
        user: { id: 'nonexistent-admin' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(false);
    });

    it('should return false if admin role is not ADMIN or SUPERADMIN', async () => {
      mockGetAdminAccountById.mockResolvedValue(
        createAdminAccount({ role: 'USER' })
      );

      const result = await capturedAdminConfig.callbacks.signIn({
        user: { id: 'admin-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(false);
    });

    it('should return false if admin email is not verified', async () => {
      mockGetAdminAccountById.mockResolvedValue(
        createAdminAccount({ emailVerified: null })
      );

      const result = await capturedAdminConfig.callbacks.signIn({
        user: { id: 'admin-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(false);
    });

    it('should return true for verified ADMIN without 2FA', async () => {
      mockGetAdminAccountById.mockResolvedValue(createAdminAccount());

      const result = await capturedAdminConfig.callbacks.signIn({
        user: { id: 'admin-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(true);
    });

    it('should return true for verified SUPERADMIN without 2FA', async () => {
      mockGetAdminAccountById.mockResolvedValue(
        createAdminAccount({ role: 'SUPERADMIN' })
      );

      const result = await capturedAdminConfig.callbacks.signIn({
        user: { id: 'admin-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(true);
    });

    it('should return false if 2FA is enabled but no confirmation found', async () => {
      mockGetAdminAccountById.mockResolvedValue(
        createAdminAccount({ isTwoFactorEnabled: true })
      );
      mockGetTwoFactorConfirmation.mockResolvedValue(null);

      const result = await capturedAdminConfig.callbacks.signIn({
        user: { id: 'admin-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(false);
    });

    it('should delete 2FA confirmation on successful admin sign-in', async () => {
      const confirmationId = 'admin-2fa-conf-123';
      mockGetAdminAccountById.mockResolvedValue(
        createAdminAccount({ isTwoFactorEnabled: true })
      );
      mockGetTwoFactorConfirmation.mockResolvedValue({ id: confirmationId });
      mockDeleteAdminTwoFactorConfirmation.mockResolvedValue({ id: confirmationId });

      const result = await capturedAdminConfig.callbacks.signIn({
        user: { id: 'admin-1' },
        account: { provider: 'credentials' },
      });

      expect(result).toBe(true);
      expect(mockDeleteAdminTwoFactorConfirmation).toHaveBeenCalledWith({
        where: { id: confirmationId },
      });
    });

    it('should NOT block sign-in when MFA enforcement is required (chicken-and-egg)', async () => {
      const mfaEnforcement = require('@/lib/auth/mfa-enforcement');
      (mfaEnforcement.shouldEnforceMFAOnSignIn as jest.Mock).mockReturnValue({
        enforce: true,
        reason: 'MFA setup required',
      });

      mockGetAdminAccountById.mockResolvedValue(createAdminAccount());

      const result = await capturedAdminConfig.callbacks.signIn({
        user: { id: 'admin-1' },
        account: { provider: 'credentials' },
      });
      // MFA enforcement does NOT block sign-in; route-level middleware handles it
      expect(result).toBe(true);
    });

    it('should handle errors gracefully and return false', async () => {
      mockGetAdminAccountById.mockRejectedValue(new Error('Database unavailable'));

      const result = await capturedAdminConfig.callbacks.signIn({
        user: { id: 'admin-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(false);
    });

    it('should return false when 2FA check throws an error', async () => {
      mockGetAdminAccountById.mockResolvedValue(
        createAdminAccount({ isTwoFactorEnabled: true })
      );
      mockGetTwoFactorConfirmation.mockRejectedValue(new Error('2FA service down'));

      const result = await capturedAdminConfig.callbacks.signIn({
        user: { id: 'admin-1' },
        account: { provider: 'credentials' },
      });
      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // session callback
  // =========================================================================

  describe('session callback', () => {
    it('should set user.id from token.sub', async () => {
      const session = {
        user: { id: '', role: '', name: '', email: '', isTwoFactorEnabled: false, isOAuth: false },
      };
      const token = {
        sub: 'admin-abc',
        role: 'ADMIN',
        name: 'Admin',
        email: 'admin@test.com',
        isTwoFactorEnabled: false,
        isOAuth: false,
      };

      const result = await capturedAdminConfig.callbacks.session({ token, session });
      expect((result as { user: { id: string } }).user.id).toBe('admin-abc');
    });

    it('should set role from token on session user', async () => {
      const session = {
        user: { id: '', role: '', name: '', email: '', isTwoFactorEnabled: false, isOAuth: false },
      };
      const token = {
        sub: 'admin-1',
        role: 'ADMIN',
        name: 'Admin',
        email: 'admin@test.com',
        isTwoFactorEnabled: true,
        isOAuth: false,
      };

      const result = await capturedAdminConfig.callbacks.session({ token, session });
      const user = (result as { user: Record<string, unknown> }).user;

      expect(user.role).toBe('ADMIN');
      expect(user.isTwoFactorEnabled).toBe(true);
    });

    it('should set SUPERADMIN role on session user', async () => {
      const session = {
        user: { id: '', role: '', name: '', email: '', isTwoFactorEnabled: false, isOAuth: false },
      };
      const token = {
        sub: 'admin-1',
        role: 'SUPERADMIN',
        name: 'Super Admin',
        email: 'super@test.com',
        isTwoFactorEnabled: false,
        isOAuth: false,
      };

      const result = await capturedAdminConfig.callbacks.session({ token, session });
      const user = (result as { user: Record<string, unknown> }).user;

      expect(user.role).toBe('SUPERADMIN');
    });

    it('should set user properties from token', async () => {
      const session = {
        user: { id: '', role: '', name: '', email: '', isTwoFactorEnabled: false, isOAuth: false },
      };
      const token = {
        sub: 'admin-1',
        role: 'ADMIN',
        name: 'Admin User',
        email: 'admin@taxomind.com',
        isTwoFactorEnabled: true,
        isOAuth: true,
      };

      const result = await capturedAdminConfig.callbacks.session({ token, session });
      const user = (result as { user: Record<string, unknown> }).user;

      expect(user.name).toBe('Admin User');
      expect(user.email).toBe('admin@taxomind.com');
      expect(user.isOAuth).toBe(true);
    });

    it('should return session even if token is null', async () => {
      const session = { user: { id: 'original', role: 'ADMIN' } };

      const result = await capturedAdminConfig.callbacks.session({ token: null, session });
      expect(result).toBe(session);
    });

    it('should still return session when role is invalid (logs security alert)', async () => {
      const session = {
        user: { id: '', role: '', name: '', email: '', isTwoFactorEnabled: false, isOAuth: false },
      };
      const token = {
        sub: 'admin-1',
        role: 'USER',
        name: 'Not Admin',
        email: 'user@test.com',
        isTwoFactorEnabled: false,
        isOAuth: false,
      };

      const result = await capturedAdminConfig.callbacks.session({ token, session });
      // Session is still returned (role is invalid - middleware handles enforcement)
      expect(result).toBeDefined();
    });
  });

  // =========================================================================
  // jwt callback
  // =========================================================================

  describe('jwt callback', () => {
    it('should return token as-is if token.sub is missing', async () => {
      const token = { name: 'Admin' };

      const result = await capturedAdminConfig.callbacks.jwt({ token });
      expect(result).toBe(token);
      expect(mockGetAdminAccountById).not.toHaveBeenCalled();
    });

    it('should return token as-is if token is null', async () => {
      const result = await capturedAdminConfig.callbacks.jwt({ token: null });
      expect(result).toBeNull();
      expect(mockGetAdminAccountById).not.toHaveBeenCalled();
    });

    it('should look up admin and set token properties including role', async () => {
      const admin = createAdminAccount({
        name: 'Jane Admin',
        email: 'jane@taxomind.com',
        role: 'ADMIN',
        isTwoFactorEnabled: true,
      });
      mockGetAdminAccountById.mockResolvedValue(admin);
      mockGetAccountByUserId.mockResolvedValue({ id: 'account-1', provider: 'credentials' });

      const token = { sub: 'admin-1' };
      const result = await capturedAdminConfig.callbacks.jwt({ token });

      expect(mockGetAdminAccountById).toHaveBeenCalledWith('admin-1');
      expect((result as Record<string, unknown>).name).toBe('Jane Admin');
      expect((result as Record<string, unknown>).email).toBe('jane@taxomind.com');
      expect((result as Record<string, unknown>).role).toBe('ADMIN');
      expect((result as Record<string, unknown>).isTwoFactorEnabled).toBe(true);
    });

    it('should set SUPERADMIN role on token', async () => {
      mockGetAdminAccountById.mockResolvedValue(
        createAdminAccount({ role: 'SUPERADMIN' })
      );
      mockGetAccountByUserId.mockResolvedValue(null);

      const token = { sub: 'admin-1' };
      const result = await capturedAdminConfig.callbacks.jwt({ token });

      expect((result as Record<string, unknown>).role).toBe('SUPERADMIN');
    });

    it('should return token if admin not found in database', async () => {
      mockGetAdminAccountById.mockResolvedValue(null);

      const token = { sub: 'nonexistent-admin' };
      const result = await capturedAdminConfig.callbacks.jwt({ token });

      expect(result).toBe(token);
      expect(mockGetAccountByUserId).not.toHaveBeenCalled();
    });

    it('should return token on error without breaking auth', async () => {
      mockGetAdminAccountById.mockRejectedValue(new Error('Database error'));

      const token = { sub: 'admin-1', name: 'Existing' };
      const result = await capturedAdminConfig.callbacks.jwt({ token });

      expect(result).toBe(token);
    });

    it('should generate sessionToken if not present', async () => {
      mockGetAdminAccountById.mockResolvedValue(createAdminAccount());
      mockGetAccountByUserId.mockResolvedValue(null);

      const token = { sub: 'admin-1' };
      const result = await capturedAdminConfig.callbacks.jwt({ token });

      expect((result as Record<string, unknown>).sessionToken).toBeDefined();
      expect(typeof (result as Record<string, unknown>).sessionToken).toBe('string');
    });

    it('should preserve existing sessionToken', async () => {
      mockGetAdminAccountById.mockResolvedValue(createAdminAccount());
      mockGetAccountByUserId.mockResolvedValue(null);

      const existingToken = 'existing-admin-session-token';
      const token = { sub: 'admin-1', sessionToken: existingToken };
      const result = await capturedAdminConfig.callbacks.jwt({ token });

      expect((result as Record<string, unknown>).sessionToken).toBe(existingToken);
    });

    it('should return token with logged security alert when role is invalid', async () => {
      mockGetAdminAccountById.mockResolvedValue(
        createAdminAccount({ role: 'USER' })
      );
      mockGetAccountByUserId.mockResolvedValue(null);

      const token = { sub: 'admin-1' };
      const result = await capturedAdminConfig.callbacks.jwt({ token });

      // Token is still returned (security alert is logged)
      expect(result).toBe(token);
    });

    it('should set isOAuth based on whether account exists', async () => {
      mockGetAdminAccountById.mockResolvedValue(createAdminAccount());
      mockGetAccountByUserId.mockResolvedValue(null);

      const token = { sub: 'admin-1' };
      const result = await capturedAdminConfig.callbacks.jwt({ token });

      expect((result as Record<string, unknown>).isOAuth).toBe(false);
    });
  });
});
