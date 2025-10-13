import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import {
  withAPIAuth,
  withAuth,
  withAdminAuth,
  withPermissions,
  withOwnership,
  withPublicAPI,
  APIAuthOptions,
  APIAuthContext
} from '@/lib/api/with-api-auth';
import { ApiError } from '@/lib/api/api-responses';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
  currentRole: jest.fn(),
}));

jest.mock('@/lib/role-management', () => ({
  hasPermission: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  getClientIdentifier: jest.fn(),
  getRateLimitHeaders: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { currentUser, currentRole } from '@/lib/auth';
import { hasPermission } from '@/lib/role-management';
import { rateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

describe('Enterprise API Authentication', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.USER,
    image: null,
    isOAuth: false,
    isTwoFactorEnabled: false,
  };

  const mockAdminUser = {
    ...mockUser,
    id: 'admin-123',
    role: UserRole.ADMIN,
  };

  const createMockRequest = (options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
  } = {}) => {
    const { method = 'GET', url = 'http://localhost:3000/api/test', headers = {} } = options;
    return new NextRequest(url, {
      method,
      headers: {
        'content-type': 'application/json',
        'user-agent': 'test-agent',
        'x-forwarded-for': '127.0.0.1',
        ...headers,
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    (getClientIdentifier as jest.Mock).mockReturnValue('127.0.0.1');
    (getRateLimitHeaders as jest.Mock).mockReturnValue({
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '99',
      'X-RateLimit-Reset': '1234567890',
    });
    (rateLimit as jest.Mock).mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: 1234567890,
    });
  });

  describe('withAuth wrapper', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should allow authenticated users', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);

      const wrappedHandler = withAuth(mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'user-123',
            role: UserRole.USER,
          }),
        }),
        undefined
      );
    });

    it('should reject unauthenticated users with 401', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);
      (currentRole as jest.Mock).mockResolvedValue(null);

      const wrappedHandler = withAuth(mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
      
      const data = await response.json();
      expect(data.error?.message || data.error).toContain('Authentication required');
    });

    it('should include proper authentication context', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);

      const contextCapture = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withAuth(contextCapture);
      const request = createMockRequest();
      
      await wrappedHandler(request);

      expect(contextCapture).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          user: {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            role: UserRole.USER,
            image: null,
            isOAuth: false,
            isTwoFactorEnabled: false,
          },
          request: {
            method: 'GET',
            url: 'http://localhost:3000/api/test',
            ip: '127.0.0.1',
            userAgent: 'test-agent',
            timestamp: expect.any(Date),
          },
          permissions: {
            hasRole: expect.any(Function),
            hasPermission: expect.any(Function),
            canAccess: expect.any(Function),
          },
        }),
        undefined
      );
    });
  });

  describe('withAdminAuth wrapper', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should allow admin users', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockAdminUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.ADMIN);

      const wrappedHandler = withAdminAuth(mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject non-admin users with 403', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);

      const wrappedHandler = withAdminAuth(mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
      
      const data = await response.json();
      expect(data.error?.message || data.error).toContain('Required role: ADMIN');
    });

    it('should reject unauthenticated users with 401', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);
      (currentRole as jest.Mock).mockResolvedValue(null);

      const wrappedHandler = withAdminAuth(mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('withPermissions wrapper', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should allow users with required permissions', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);
      (hasPermission as jest.Mock).mockResolvedValue(true);

      const wrappedHandler = withPermissions('READ_COURSES', mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
      expect(hasPermission).toHaveBeenCalledWith('READ_COURSES');
    });

    it('should reject users without required permissions with 403', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);
      (hasPermission as jest.Mock).mockResolvedValue(false);

      const wrappedHandler = withPermissions('WRITE_COURSES', mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
      
      const data = await response.json();
      expect(data.error?.message || data.error).toContain('Insufficient permissions: WRITE_COURSES required');
    });

    it('should handle multiple permissions', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);
      (hasPermission as jest.Mock)
        .mockResolvedValueOnce(true)  // First permission
        .mockResolvedValueOnce(false); // Second permission fails

      const wrappedHandler = withPermissions(['READ_COURSES', 'WRITE_COURSES'], mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
      expect(hasPermission).toHaveBeenCalledTimes(2);
    });
  });

  describe('withOwnership wrapper', () => {
    const mockHandler = jest.fn();
    const getUserId = jest.fn();

    beforeEach(() => {
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should allow user to access their own resources', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);
      getUserId.mockResolvedValue('user-123'); // Same as current user

      const wrappedHandler = withOwnership(getUserId, mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
      expect(getUserId).toHaveBeenCalled();
    });

    it('should allow admin to access any resource', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockAdminUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.ADMIN);
      getUserId.mockResolvedValue('user-456'); // Different user

      const wrappedHandler = withOwnership(getUserId, mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject non-owner non-admin with 403', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);
      getUserId.mockResolvedValue('user-456'); // Different user

      const wrappedHandler = withOwnership(getUserId, mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
      
      const data = await response.json();
      expect(data.error?.message || data.error).toContain('insufficient permissions for this resource');
    });
  });

  describe('Rate limiting integration', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should apply rate limiting when configured', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);

      const options: APIAuthOptions = {
        rateLimit: {
          requests: 100,
          window: 60000,
        },
      };

      const wrappedHandler = withAPIAuth(mockHandler, options);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(rateLimit).toHaveBeenCalledWith('127.0.0.1:user-123', 100, 60000);
      expect(response.status).toBe(200);
      
      // Check rate limit headers
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
    });

    it('should reject requests when rate limit exceeded', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);
      (rateLimit as jest.Mock).mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: 1234567890,
        retryAfter: 30,
      });
      (getRateLimitHeaders as jest.Mock).mockReturnValue({
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': '1234567890',
        'Retry-After': '30',
      });

      const options: APIAuthOptions = {
        rateLimit: {
          requests: 10,
          window: 60000,
        },
      };

      const wrappedHandler = withAPIAuth(mockHandler, options);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(429);
      expect(mockHandler).not.toHaveBeenCalled();
      
      const data = await response.json();
      expect(data.error?.message || data.error).toContain('Rate limit exceeded');
      
      // Check rate limit headers are included in error response
      expect(response.headers.get('Retry-After')).toBe('30');
    });

    it('should use custom key generator when provided', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);

      const customKeyGenerator = jest.fn().mockReturnValue('custom-key-123');
      const options: APIAuthOptions = {
        rateLimit: {
          requests: 10,
          window: 60000,
          keyGenerator: customKeyGenerator,
        },
      };

      const wrappedHandler = withAPIAuth(mockHandler, options);
      const request = createMockRequest();
      await wrappedHandler(request);

      expect(customKeyGenerator).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          user: expect.objectContaining({ id: 'user-123' }),
        })
      );
      expect(rateLimit).toHaveBeenCalledWith('custom-key-123', 10, 60000);
    });
  });

  describe('Audit logging', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should log successful requests when audit enabled', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);

      const options: APIAuthOptions = {
        auditLog: true,
      };

      const wrappedHandler = withAPIAuth(mockHandler, options);
      const request = createMockRequest();
      await wrappedHandler(request);

      expect(logger.info).toHaveBeenCalledWith(
        'API Audit Log',
        expect.objectContaining({
          userId: 'user-123',
          userRole: UserRole.USER,
          method: 'GET',
          endpoint: '/api/test',
          ip: '127.0.0.1',
          success: true,
          responseTimeMs: expect.any(Number),
        })
      );
    });

    it('should log failed authentication attempts', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);
      (currentRole as jest.Mock).mockResolvedValue(null);

      const options: APIAuthOptions = {
        auditLog: true,
      };

      const wrappedHandler = withAPIAuth(mockHandler, options);
      const request = createMockRequest();
      await wrappedHandler(request);

      expect(logger.info).toHaveBeenCalledWith(
        'API Audit Log',
        expect.objectContaining({
          userId: null,
          userRole: null,
          success: false,
          error: 'Authentication required',
        })
      );
    });

    it('should log authorization failures', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);

      const options: APIAuthOptions = {
        roles: UserRole.ADMIN,
        auditLog: true,
      };

      const wrappedHandler = withAPIAuth(mockHandler, options);
      const request = createMockRequest();
      await wrappedHandler(request);

      expect(logger.info).toHaveBeenCalledWith(
        'API Audit Log',
        expect.objectContaining({
          userId: 'user-123',
          userRole: UserRole.USER,
          success: false,
          error: expect.stringContaining('Insufficient role'),
        })
      );
    });

    it('should log rate limiting failures', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);
      (rateLimit as jest.Mock).mockResolvedValue({ success: false });

      const options: APIAuthOptions = {
        rateLimit: { requests: 10, window: 60000 },
        auditLog: true,
      };

      const wrappedHandler = withAPIAuth(mockHandler, options);
      const request = createMockRequest();
      await wrappedHandler(request);

      expect(logger.info).toHaveBeenCalledWith(
        'API Audit Log',
        expect.objectContaining({
          success: false,
          error: 'Rate limit exceeded',
        })
      );
    });
  });

  describe('Custom validation', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should run custom validation function', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);

      const customValidation = jest.fn().mockResolvedValue(undefined);
      const options: APIAuthOptions = {
        customValidation,
      };

      const wrappedHandler = withAPIAuth(mockHandler, options);
      const request = createMockRequest();
      await wrappedHandler(request);

      expect(customValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: 'user-123' }),
        })
      );
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle custom validation failures', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);

      const customValidation = jest.fn().mockRejectedValue(
        ApiError.forbidden('Custom validation failed')
      );
      const options: APIAuthOptions = {
        customValidation,
      };

      const wrappedHandler = withAPIAuth(mockHandler, options);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
      
      const data = await response.json();
      expect(data.error?.message || data.error).toContain('Custom validation failed');
    });
  });

  describe('withPublicAPI wrapper', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should allow unauthenticated access', async () => {
      // Don&apos;t mock currentUser - it shouldn&apos;t be called
      const wrappedHandler = withPublicAPI(mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(request, undefined);
      expect(currentUser).not.toHaveBeenCalled();
    });

    it('should still apply rate limiting when configured', async () => {
      const options = {
        rateLimit: {
          requests: 100,
          window: 60000,
        },
      };

      const wrappedHandler = withPublicAPI(mockHandler, options);
      const request = createMockRequest();
      await wrappedHandler(request);

      expect(rateLimit).toHaveBeenCalledWith('127.0.0.1', 100, 60000);
    });
  });

  describe('Error handling', () => {
    const mockHandler = jest.fn();

    it('should handle unexpected errors gracefully', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);
      mockHandler.mockRejectedValue(new Error('Unexpected error'));

      const wrappedHandler = withAuth(mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(500);
      expect(logger.error).toHaveBeenCalledWith(
        'API authentication error',
        expect.any(Error)
      );
      
      const data = await response.json();
      expect(data.error?.message || data.error).toBe('Internal server error');
    });

    it('should handle authentication service failures', async () => {
      (currentUser as jest.Mock).mockRejectedValue(new Error('Auth service down'));
      (currentRole as jest.Mock).mockRejectedValue(new Error('Auth service down'));

      const wrappedHandler = withAuth(mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(500);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle rate limiting service failures', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);
      (rateLimit as jest.Mock).mockRejectedValue(new Error('Rate limit service down'));

      const options: APIAuthOptions = {
        rateLimit: { requests: 10, window: 60000 },
      };

      const wrappedHandler = withAPIAuth(mockHandler, options);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      // Should fail gracefully and return 500
      expect(response.status).toBe(500);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Context permissions helper methods', () => {
    it('should provide working permission helper methods', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);
      (hasPermission as jest.Mock).mockResolvedValue(true);

      const contextCapture = jest.fn().mockImplementation(async (req, context: APIAuthContext) => {
        // Test hasRole method
        expect(context.permissions.hasRole(UserRole.USER)).toBe(true);
        expect(context.permissions.hasRole(UserRole.ADMIN)).toBe(false);

        // Test hasPermission method
        const permissionResult = await context.permissions.hasPermission('READ_COURSES');
        expect(permissionResult).toBe(true);

        // Test canAccess method
        const canAccessOwn = await context.permissions.canAccess({ userId: 'user-123' });
        expect(canAccessOwn).toBe(true);

        const canAccessOther = await context.permissions.canAccess({ userId: 'user-456' });
        expect(canAccessOther).toBe(false);

        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withAuth(contextCapture);
      const request = createMockRequest();
      await wrappedHandler(request);

      expect(contextCapture).toHaveBeenCalled();
    });

    it('should handle admin access in canAccess method', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockAdminUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.ADMIN);

      const contextCapture = jest.fn().mockImplementation(async (req, context: APIAuthContext) => {
        // Admin should be able to access any resource
        const canAccessAny = await context.permissions.canAccess({ userId: 'any-user' });
        expect(canAccessAny).toBe(true);

        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withAuth(contextCapture);
      const request = createMockRequest();
      await wrappedHandler(request);

      expect(contextCapture).toHaveBeenCalled();
    });
  });

  describe('Performance and reliability', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should handle concurrent requests', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);

      const wrappedHandler = withAuth(mockHandler);
      const requests = Array.from({ length: 10 }, () =>
        createMockRequest({ url: `http://localhost:3000/api/test${Math.random()}` })
      );

      const responses = await Promise.all(
        requests.map(request => wrappedHandler(request))
      );

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // All handlers should have been called
      expect(mockHandler).toHaveBeenCalledTimes(10);
    });

    it('should provide request timing information', async () => {
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (currentRole as jest.Mock).mockResolvedValue(UserRole.USER);

      // Add delay to handler to test timing
      const delayedHandler = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return NextResponse.json({ success: true });
      });

      const options: APIAuthOptions = {
        auditLog: true,
      };

      const wrappedHandler = withAPIAuth(delayedHandler, options);
      const request = createMockRequest();
      await wrappedHandler(request);

      // Check that timing information is logged
      expect(logger.info).toHaveBeenCalledWith(
        'API Audit Log',
        expect.objectContaining({
          responseTimeMs: expect.any(Number),
        })
      );

      const logCall = (logger.info as jest.Mock).mock.calls.find(
        call => call[0] === 'API Audit Log'
      );
      expect(logCall[1].responseTimeMs).toBeGreaterThan(90); // Should be at least 90ms due to delay
    });
  });
});