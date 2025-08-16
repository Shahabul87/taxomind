import middlewareFunc from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// Mock NextAuth
jest.mock('@/auth');
const mockAuth = auth as jest.Mock;

// Mock NextResponse.redirect
const mockRedirect = jest.fn((url: string | URL) => {
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: url.toString(),
    },
  });
});

jest.spyOn(NextResponse, 'redirect').mockImplementation(mockRedirect);

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', async () => {
      mockAuth.mockResolvedValue(null);

      const publicRoutes = [
        '/',
        '/auth/login',
        '/auth/register',
        '/auth/error',
        '/api/uploadthing',
      ];

      for (const route of publicRoutes) {
        const request = new NextRequest(`http://localhost:3000${route}`);
        const response = await middlewareFunc(request, {} as any);

        expect(response).toBeUndefined(); // No redirect
        expect(mockRedirect).not.toHaveBeenCalled();
      }
    });

    it('should allow access to course preview pages', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/courses/course-123');
      const response = await middlewareFunc(request, {} as any);

      expect(response).toBeUndefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users from protected routes to login', async () => {
      mockAuth.mockResolvedValue(null);

      const protectedRoutes = [
        '/dashboard',
        '/settings',
        '/teacher/courses',
        '/learn/paths',
      ];

      for (const route of protectedRoutes) {
        const request = new NextRequest(`http://localhost:3000${route}`);
        await middlewareFunc(request, {} as any);

        expect(mockRedirect).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login')
        );
      }
    });

    it('should include callback URL when redirecting to login', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/dashboard');
      await middlewareFunc(request, {} as any);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('callbackUrl=%2Fdashboard')
      );
    });

    it('should allow authenticated users to access protected routes', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'USER',
        },
      });

      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await middlewareFunc(request, {} as any);

      expect(response).toBeUndefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Admin Routes', () => {
    it('should redirect non-admin users from admin routes', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'USER',
        },
      });

      const adminRoutes = [
        '/admin',
        '/admin/users',
        '/admin/dashboard',
        '/admin/settings',
      ];

      for (const route of adminRoutes) {
        const request = new NextRequest(`http://localhost:3000${route}`);
        await middlewareFunc(request, {} as any);

        expect(mockRedirect).toHaveBeenCalledWith(
          expect.stringContaining('/dashboard')
        );
      }
    });

    it('should allow admin users to access admin routes', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      });

      const request = new NextRequest('http://localhost:3000/admin/dashboard');
      const response = await middlewareFunc(request, {} as any);

      expect(response).toBeUndefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should handle admin sub-routes correctly', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      });

      const adminSubRoutes = [
        '/admin/users/123/edit',
        '/admin/courses/analytics',
        '/admin/system/logs',
      ];

      for (const route of adminSubRoutes) {
        const request = new NextRequest(`http://localhost:3000${route}`);
        const response = await middlewareFunc(request, {} as any);

        expect(response).toBeUndefined();
        expect(mockRedirect).not.toHaveBeenCalled();
      }
    });
  });

  describe('Auth Routes', () => {
    it('should redirect authenticated users from auth routes to dashboard', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'USER',
        },
      });

      const authRoutes = [
        '/auth/login',
        '/auth/register',
        '/auth/reset',
      ];

      for (const route of authRoutes) {
        const request = new NextRequest(`http://localhost:3000${route}`);
        await middlewareFunc(request, {} as any);

        expect(mockRedirect).toHaveBeenCalledWith(
          expect.stringContaining('/dashboard')
        );
      }
    });

    it('should not redirect from auth/error even when authenticated', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'USER',
        },
      });

      const request = new NextRequest('http://localhost:3000/auth/error');
      const response = await middlewareFunc(request, {} as any);

      expect(response).toBeUndefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('API Routes', () => {
    it('should not apply middleware to API routes', async () => {
      const apiRoutes = [
        '/api/courses',
        '/api/auth/session',
        '/api/users/profile',
      ];

      for (const route of apiRoutes) {
        const request = new NextRequest(`http://localhost:3000${route}`);
        const response = await middlewareFunc(request, {} as any);

        expect(response).toBeUndefined();
        expect(mockAuth).not.toHaveBeenCalled();
      }
    });
  });

  describe('Static Assets', () => {
    it('should not apply middleware to static assets', async () => {
      const staticAssets = [
        '/_next/static/chunks/main.js',
        '/_next/image',
        '/favicon.ico',
        '/robots.txt',
      ];

      for (const asset of staticAssets) {
        const request = new NextRequest(`http://localhost:3000${asset}`);
        const response = await middlewareFunc(request, {} as any);

        expect(response).toBeUndefined();
        expect(mockAuth).not.toHaveBeenCalled();
      }
    });
  });

  describe('Teacher Routes', () => {
    it('should allow teachers to access teacher routes', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'teacher-1',
          email: 'teacher@example.com',
          role: 'USER', // Teachers have USER role
        },
      });

      const teacherRoutes = [
        '/teacher/courses',
        '/teacher/courses/new',
        '/teacher/analytics',
      ];

      for (const route of teacherRoutes) {
        const request = new NextRequest(`http://localhost:3000${route}`);
        const response = await middlewareFunc(request, {} as any);

        expect(response).toBeUndefined();
        expect(mockRedirect).not.toHaveBeenCalled();
      }
    });
  });

  describe('Role-Based Redirects', () => {
    it('should redirect admin users to admin dashboard from root', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      });

      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await middlewareFunc(request, {} as any);

      // Admin can access regular dashboard
      expect(response).toBeUndefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should handle missing role gracefully', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          // role is missing
        },
      });

      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await middlewareFunc(request, {} as any);

      // Should still allow access to regular protected routes
      expect(response).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed URLs gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/../../etc/passwd');
      const response = await middlewareFunc(request, {} as any);

      expect(response).toBeUndefined();
    });

    it('should handle very long URLs', async () => {
      const longPath = '/dashboard/' + 'a'.repeat(2000);
      const request = new NextRequest(`http://localhost:3000${longPath}`);
      
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'USER',
        },
      });

      const response = await middlewareFunc(request, {} as any);
      expect(response).toBeUndefined();
    });

    it('should handle query parameters correctly', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/dashboard?tab=overview&filter=recent');
      await middlewareFunc(request, {} as any);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('callbackUrl=%2Fdashboard%3Ftab%3Doverview%26filter%3Drecent')
      );
    });

    it('should handle hash fragments correctly', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/dashboard#section-1');
      await middlewareFunc(request, {} as any);

      expect(mockRedirect).toHaveBeenCalled();
    });
  });
});