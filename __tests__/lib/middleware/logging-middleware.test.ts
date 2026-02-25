/**
 * Tests for logging middleware - lib/middleware/logging-middleware.ts
 *
 * Covers: withLogging correlation ID resolution, context building,
 *         conditional auth logging, logAccessDenied, logMFAEnforcement, logRedirect
 */

jest.mock('@/lib/logging/structured-logger', () => ({
  AuthLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  LoggerManager: {
    createCorrelationId: jest.fn().mockReturnValue('generated-correlation-id'),
  },
}));

import { NextRequest } from 'next/server';
import {
  withLogging,
  logAccessDenied,
  logMFAEnforcement,
  logRedirect,
} from '@/lib/middleware/logging-middleware';
import { AuthLogger, LoggerManager } from '@/lib/logging/structured-logger';

function createRequest(path, options) {
  const resolvedPath = path || '/api/test';
  const resolvedOptions = options || {};
  const url = new URL(resolvedPath, 'http://localhost:3000');
  return new NextRequest(url.toString(), {
    method: resolvedOptions.method || 'GET',
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ...resolvedOptions.headers,
    },
  });
}

function createAuth(overrides) {
  return {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      role: 'USER',
    },
    expires: '2026-03-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('logging-middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withLogging', () => {
    describe('correlation ID resolution', () => {
      it('uses x-correlation-id header when present', () => {
        const req = createRequest('/api/test', {
          headers: { 'x-correlation-id': 'header-corr-id' },
        });

        const result = withLogging('/api/test', req, createAuth());

        expect(result.correlationId).toBe('header-corr-id');
        expect(LoggerManager.createCorrelationId).not.toHaveBeenCalled();
      });

      it('falls back to x-request-id when x-correlation-id is missing', () => {
        const req = createRequest('/api/test', {
          headers: { 'x-request-id': 'request-id-fallback' },
        });

        const result = withLogging('/api/test', req, createAuth());

        expect(result.correlationId).toBe('request-id-fallback');
        expect(LoggerManager.createCorrelationId).not.toHaveBeenCalled();
      });

      it('prefers x-correlation-id over x-request-id when both present', () => {
        const req = createRequest('/api/test', {
          headers: {
            'x-correlation-id': 'corr-id',
            'x-request-id': 'req-id',
          },
        });

        const result = withLogging('/api/test', req, createAuth());

        expect(result.correlationId).toBe('corr-id');
      });

      it('falls back to LoggerManager.createCorrelationId when no header is present', () => {
        const req = createRequest('/api/test');

        const result = withLogging('/api/test', req, createAuth());

        expect(result.correlationId).toBe('generated-correlation-id');
        expect(LoggerManager.createCorrelationId).toHaveBeenCalledTimes(1);
      });
    });

    describe('context building', () => {
      it('builds correct context object with all fields populated', () => {
        const auth = createAuth();
        const req = createRequest('/api/test', {
          method: 'POST',
          headers: {
            'x-correlation-id': 'ctx-corr-id',
            'x-forwarded-for': '192.168.1.100',
          },
        });

        const { context } = withLogging('/api/test', req, auth);

        expect(context).toEqual({
          correlationId: 'ctx-corr-id',
          userId: 'user-123',
          userEmail: 'test@example.com',
          requestPath: '/api/test',
          requestMethod: 'POST',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          ip: '192.168.1.100',
        });
      });

      it('uses x-real-ip when x-forwarded-for is absent', () => {
        const req = createRequest('/api/test', {
          headers: { 'x-real-ip': '10.0.0.5' },
        });

        const { context } = withLogging('/api/test', req, createAuth());

        expect(context.ip).toBe('10.0.0.5');
      });

      it('sets ip to undefined when neither forwarded-for nor real-ip headers exist', () => {
        const req = createRequest('/api/test');

        const { context } = withLogging('/api/test', req, createAuth());

        expect(context.ip).toBeUndefined();
      });

      it('handles null auth gracefully with undefined userId and userEmail', () => {
        const req = createRequest('/api/test');

        const { context } = withLogging('/api/test', req, null);

        expect(context.userId).toBeUndefined();
        expect(context.userEmail).toBeUndefined();
      });

      it('handles undefined auth gracefully', () => {
        const req = createRequest('/api/test');

        const { context } = withLogging('/api/test', req, undefined);

        expect(context.userId).toBeUndefined();
        expect(context.userEmail).toBeUndefined();
      });

      it('handles auth with no user property', () => {
        const req = createRequest('/api/test');

        const { context } = withLogging('/api/test', req, { expires: '2026-03-01' });

        expect(context.userId).toBeUndefined();
        expect(context.userEmail).toBeUndefined();
      });

      it('sets userAgent to undefined when user-agent header is empty', () => {
        const req = createRequest('/api/test', {
          headers: { 'user-agent': '' },
        });

        const { context } = withLogging('/api/test', req, createAuth());

        // Empty string is falsy, so || undefined yields undefined
        expect(context.userAgent).toBeUndefined();
      });
    });

    describe('conditional authentication logging', () => {
      it('logs auth check for /dashboard paths', () => {
        const auth = createAuth();
        const req = createRequest('/dashboard');

        withLogging('/dashboard', req, auth);

        expect(AuthLogger.info).toHaveBeenCalledWith(
          'Authentication check in middleware',
          expect.objectContaining({
            pathname: '/dashboard',
            isLoggedIn: true,
            hasAuth: true,
            userRole: 'USER',
            sessionExpires: '2026-03-01T00:00:00.000Z',
          })
        );
      });

      it('logs auth check for /dashboard sub-paths', () => {
        const auth = createAuth();
        const req = createRequest('/dashboard/courses');

        withLogging('/dashboard/courses', req, auth);

        expect(AuthLogger.info).toHaveBeenCalledWith(
          'Authentication check in middleware',
          expect.objectContaining({ pathname: '/dashboard/courses' })
        );
      });

      it('logs auth check for /settings paths', () => {
        const auth = createAuth();
        const req = createRequest('/settings');

        withLogging('/settings', req, auth);

        expect(AuthLogger.info).toHaveBeenCalledWith(
          'Authentication check in middleware',
          expect.objectContaining({
            pathname: '/settings',
            isLoggedIn: true,
          })
        );
      });

      it('logs auth check for /my-courses paths', () => {
        const auth = createAuth();
        const req = createRequest('/my-courses');

        withLogging('/my-courses', req, auth);

        expect(AuthLogger.info).toHaveBeenCalledWith(
          'Authentication check in middleware',
          expect.objectContaining({
            pathname: '/my-courses',
            isLoggedIn: true,
          })
        );
      });

      it('does NOT log auth check for non-protected paths', () => {
        const auth = createAuth();
        const req = createRequest('/api/test');

        withLogging('/api/test', req, auth);

        expect(AuthLogger.info).not.toHaveBeenCalled();
      });

      it('does NOT log auth check for root path', () => {
        const req = createRequest('/');

        withLogging('/', req, createAuth());

        expect(AuthLogger.info).not.toHaveBeenCalled();
      });

      it('does NOT log auth check for /courses path (not /my-courses)', () => {
        const req = createRequest('/courses');

        withLogging('/courses', req, createAuth());

        expect(AuthLogger.info).not.toHaveBeenCalled();
      });

      it('logs isLoggedIn as false when auth has no user', () => {
        const auth = { expires: '2026-03-01T00:00:00.000Z' };
        const req = createRequest('/dashboard');

        withLogging('/dashboard', req, auth);

        expect(AuthLogger.info).toHaveBeenCalledWith(
          'Authentication check in middleware',
          expect.objectContaining({
            isLoggedIn: false,
            hasAuth: true,
            userRole: undefined,
          })
        );
      });

      it('logs hasAuth as false and isLoggedIn as false when auth is null', () => {
        const req = createRequest('/dashboard');

        withLogging('/dashboard', req, null);

        expect(AuthLogger.info).toHaveBeenCalledWith(
          'Authentication check in middleware',
          expect.objectContaining({
            isLoggedIn: false,
            hasAuth: false,
          })
        );
      });
    });
  });

  describe('logAccessDenied', () => {
    it('calls AuthLogger.warn with correct message and details', () => {
      logAccessDenied('/admin/settings', 'admin@example.com', 'Insufficient role', 'corr-001');

      expect(AuthLogger.warn).toHaveBeenCalledTimes(1);
      expect(AuthLogger.warn).toHaveBeenCalledWith('Access denied', {
        pathname: '/admin/settings',
        userEmail: 'admin@example.com',
        reason: 'Insufficient role',
        correlationId: 'corr-001',
      });
    });

    it('handles undefined userEmail', () => {
      logAccessDenied('/admin/settings', undefined, 'Not authenticated', 'corr-002');

      expect(AuthLogger.warn).toHaveBeenCalledWith('Access denied', {
        pathname: '/admin/settings',
        userEmail: undefined,
        reason: 'Not authenticated',
        correlationId: 'corr-002',
      });
    });
  });

  describe('logMFAEnforcement', () => {
    it('calls AuthLogger.info with correct message and details', () => {
      logMFAEnforcement('/settings/security', 'user-456', 'MFA required for settings', 'corr-003');

      expect(AuthLogger.info).toHaveBeenCalledTimes(1);
      expect(AuthLogger.info).toHaveBeenCalledWith('MFA enforcement triggered', {
        pathname: '/settings/security',
        userId: 'user-456',
        reason: 'MFA required for settings',
        correlationId: 'corr-003',
      });
    });
  });

  describe('logRedirect', () => {
    it('calls AuthLogger.info with correct from, to, reason, and correlationId', () => {
      logRedirect('/admin/panel', '/auth/login', 'Not authenticated', 'corr-004');

      expect(AuthLogger.info).toHaveBeenCalledTimes(1);
      expect(AuthLogger.info).toHaveBeenCalledWith('Redirect triggered', {
        from: '/admin/panel',
        to: '/auth/login',
        reason: 'Not authenticated',
        correlationId: 'corr-004',
      });
    });

    it('logs redirect with different paths and reasons', () => {
      logRedirect('/dashboard', '/mfa/verify', 'MFA required', 'corr-005');

      expect(AuthLogger.info).toHaveBeenCalledWith('Redirect triggered', {
        from: '/dashboard',
        to: '/mfa/verify',
        reason: 'MFA required',
        correlationId: 'corr-005',
      });
    });
  });
});
