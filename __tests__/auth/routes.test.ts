/**
 * Routes Test Suite
 *
 * Tests the route configuration and helper functions from routes.ts.
 * These are pure functions with no external dependencies, making them
 * straightforward to test without mocking.
 */

import {
  publicRoutes,
  authRoutes,
  adminAuthRoutes,
  adminRoutes,
  protectedRoutes,
  apiAuthPrefix,
  DEFAULT_LOGIN_REDIRECT,
  isPublicRoute,
  isProtectedRoute,
  isAdminAuthRoute,
  isAdminRoute,
  getRedirectUrl,
} from '@/routes';

// ---------------------------------------------------------------------------
// Suppress console.warn from getRedirectUrl deprecation warning
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

// ===========================================================================
// Route arrays
// ===========================================================================

describe('routes.ts', () => {
  describe('publicRoutes', () => {
    it('should include the root route', () => {
      expect(publicRoutes).toContain('/');
    });

    it('should include /blog', () => {
      expect(publicRoutes).toContain('/blog');
    });

    it('should include /courses', () => {
      expect(publicRoutes).toContain('/courses');
    });

    it('should include admin auth login route (must be accessible pre-login)', () => {
      expect(publicRoutes).toContain('/admin/auth/login');
    });

    it('should include admin auth error route', () => {
      expect(publicRoutes).toContain('/admin/auth/error');
    });

    it('should include /about page', () => {
      expect(publicRoutes).toContain('/about');
    });

    it('should include /features page', () => {
      expect(publicRoutes).toContain('/features');
    });

    it('should include /blog/[postId] dynamic route pattern', () => {
      expect(publicRoutes).toContain('/blog/[postId]');
    });
  });

  describe('authRoutes', () => {
    it('should include /auth/login', () => {
      expect(authRoutes).toContain('/auth/login');
    });

    it('should include /auth/register', () => {
      expect(authRoutes).toContain('/auth/register');
    });

    it('should include /auth/error', () => {
      expect(authRoutes).toContain('/auth/error');
    });

    it('should include /auth/reset', () => {
      expect(authRoutes).toContain('/auth/reset');
    });

    it('should include /auth/new-password', () => {
      expect(authRoutes).toContain('/auth/new-password');
    });
  });

  describe('adminAuthRoutes', () => {
    it('should include /admin/auth/login', () => {
      expect(adminAuthRoutes).toContain('/admin/auth/login');
    });

    it('should include /admin/auth/error', () => {
      expect(adminAuthRoutes).toContain('/admin/auth/error');
    });

    it('should include /admin/auth/reset', () => {
      expect(adminAuthRoutes).toContain('/admin/auth/reset');
    });

    it('should include /admin/auth/new-password', () => {
      expect(adminAuthRoutes).toContain('/admin/auth/new-password');
    });
  });

  describe('adminRoutes', () => {
    it('should include /dashboard/admin', () => {
      expect(adminRoutes).toContain('/dashboard/admin');
    });

    it('should include /admin', () => {
      expect(adminRoutes).toContain('/admin');
    });

    it('should include /admin/mfa-setup', () => {
      expect(adminRoutes).toContain('/admin/mfa-setup');
    });

    it('should include /admin/dashboard', () => {
      expect(adminRoutes).toContain('/admin/dashboard');
    });
  });

  describe('protectedRoutes', () => {
    it('should include /dashboard', () => {
      expect(protectedRoutes).toContain('/dashboard');
    });

    it('should include /settings', () => {
      expect(protectedRoutes).toContain('/settings');
    });

    it('should include teacher routes', () => {
      expect(protectedRoutes).toContain('/teacher/courses');
      expect(protectedRoutes).toContain('/teacher/create');
    });

    it('should include /dashboard/user', () => {
      expect(protectedRoutes).toContain('/dashboard/user');
    });

    it('should include /dashboard/admin', () => {
      expect(protectedRoutes).toContain('/dashboard/admin');
    });
  });

  // =========================================================================
  // Constants
  // =========================================================================

  describe('constants', () => {
    it('should set apiAuthPrefix to /api/auth', () => {
      expect(apiAuthPrefix).toBe('/api/auth');
    });

    it('should set DEFAULT_LOGIN_REDIRECT to /dashboard/user', () => {
      expect(DEFAULT_LOGIN_REDIRECT).toBe('/dashboard/user');
    });
  });

  // =========================================================================
  // getRedirectUrl
  // =========================================================================

  describe('getRedirectUrl', () => {
    it('should return /dashboard/user with no arguments', () => {
      expect(getRedirectUrl()).toBe('/dashboard/user');
    });

    it('should return /dashboard/user regardless of role parameter (deprecated)', () => {
      expect(getRedirectUrl('ADMIN')).toBe('/dashboard/user');
      expect(getRedirectUrl('USER')).toBe('/dashboard/user');
      expect(getRedirectUrl('SUPERADMIN')).toBe('/dashboard/user');
    });
  });

  // =========================================================================
  // isPublicRoute
  // =========================================================================

  describe('isPublicRoute', () => {
    it('should return true for root path', () => {
      expect(isPublicRoute('/')).toBe(true);
    });

    it('should return true for /blog', () => {
      expect(isPublicRoute('/blog')).toBe(true);
    });

    it('should return true for /courses', () => {
      expect(isPublicRoute('/courses')).toBe(true);
    });

    it('should return false for /dashboard', () => {
      expect(isPublicRoute('/dashboard')).toBe(false);
    });

    it('should return false for /settings', () => {
      expect(isPublicRoute('/settings')).toBe(false);
    });

    it('should return true for all API routes (handled by their own auth)', () => {
      expect(isPublicRoute('/api/anything')).toBe(true);
      expect(isPublicRoute('/api/courses')).toBe(true);
      expect(isPublicRoute('/api/auth/callback/google')).toBe(true);
    });

    it('should return true for dynamic blog routes', () => {
      expect(isPublicRoute('/blog/some-post-id')).toBe(true);
      expect(isPublicRoute('/blog/12345')).toBe(true);
    });

    it('should return true for dynamic course routes', () => {
      expect(isPublicRoute('/courses/course-123')).toBe(true);
    });

    it('should return true for /about', () => {
      expect(isPublicRoute('/about')).toBe(true);
    });

    it('should return true for admin auth login', () => {
      expect(isPublicRoute('/admin/auth/login')).toBe(true);
    });

    it('should return false for /teacher/courses', () => {
      expect(isPublicRoute('/teacher/courses')).toBe(false);
    });
  });

  // =========================================================================
  // isProtectedRoute
  // =========================================================================

  describe('isProtectedRoute', () => {
    it('should return true for /dashboard/user', () => {
      expect(isProtectedRoute('/dashboard/user')).toBe(true);
    });

    it('should return true for /settings', () => {
      expect(isProtectedRoute('/settings')).toBe(true);
    });

    it('should return true for /teacher/courses', () => {
      expect(isProtectedRoute('/teacher/courses')).toBe(true);
    });

    it('should return false for root path', () => {
      expect(isProtectedRoute('/')).toBe(false);
    });

    it('should return false for /blog', () => {
      expect(isProtectedRoute('/blog')).toBe(false);
    });

    it('should return false for API routes (not processed by middleware)', () => {
      expect(isProtectedRoute('/api/test')).toBe(false);
      expect(isProtectedRoute('/api/courses')).toBe(false);
    });

    it('should return true for /dashboard', () => {
      expect(isProtectedRoute('/dashboard')).toBe(true);
    });

    it('should match dynamic teacher course routes', () => {
      expect(isProtectedRoute('/teacher/courses/course-123')).toBe(true);
    });
  });

  // =========================================================================
  // isAdminAuthRoute
  // =========================================================================

  describe('isAdminAuthRoute', () => {
    it('should return true for /admin/auth/login', () => {
      expect(isAdminAuthRoute('/admin/auth/login')).toBe(true);
    });

    it('should return true for /admin/auth/error', () => {
      expect(isAdminAuthRoute('/admin/auth/error')).toBe(true);
    });

    it('should return true for /admin/auth/reset', () => {
      expect(isAdminAuthRoute('/admin/auth/reset')).toBe(true);
    });

    it('should return false for /admin/dashboard', () => {
      expect(isAdminAuthRoute('/admin/dashboard')).toBe(false);
    });

    it('should return false for /dashboard/admin', () => {
      expect(isAdminAuthRoute('/dashboard/admin')).toBe(false);
    });

    it('should return false for /auth/login (user auth, not admin)', () => {
      expect(isAdminAuthRoute('/auth/login')).toBe(false);
    });
  });

  // =========================================================================
  // isAdminRoute
  // =========================================================================

  describe('isAdminRoute', () => {
    it('should return true for /dashboard/admin', () => {
      expect(isAdminRoute('/dashboard/admin')).toBe(true);
    });

    it('should return true for /admin/mfa-setup', () => {
      expect(isAdminRoute('/admin/mfa-setup')).toBe(true);
    });

    it('should return false for admin auth routes (must be accessible pre-login)', () => {
      expect(isAdminRoute('/admin/auth/login')).toBe(false);
      expect(isAdminRoute('/admin/auth/error')).toBe(false);
      expect(isAdminRoute('/admin/auth/reset')).toBe(false);
    });

    it('should return true for sub-paths under /dashboard/admin/', () => {
      expect(isAdminRoute('/dashboard/admin/users')).toBe(true);
      expect(isAdminRoute('/dashboard/admin/settings')).toBe(true);
      expect(isAdminRoute('/dashboard/admin/analytics')).toBe(true);
    });

    it('should return true for sub-paths under /admin/', () => {
      expect(isAdminRoute('/admin/users')).toBe(true);
      expect(isAdminRoute('/admin/settings')).toBe(true);
    });

    it('should return false for /dashboard/user', () => {
      expect(isAdminRoute('/dashboard/user')).toBe(false);
    });

    it('should return false for root path', () => {
      expect(isAdminRoute('/')).toBe(false);
    });

    it('should return false for /auth/login', () => {
      expect(isAdminRoute('/auth/login')).toBe(false);
    });

    it('should return true for /admin (exact match)', () => {
      expect(isAdminRoute('/admin')).toBe(true);
    });

    it('should return true for /admin/dashboard', () => {
      expect(isAdminRoute('/admin/dashboard')).toBe(true);
    });
  });
});
