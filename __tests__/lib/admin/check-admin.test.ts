/**
 * Tests for admin check utilities
 * Source: lib/admin/check-admin.ts
 */

jest.mock('@/config/auth/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

import {
  getCurrentAdminSession,
  isCurrentSessionAdmin,
  isCurrentSessionSuperAdmin,
  requireAdminSession,
  requireSuperAdminSession,
} from '@/lib/admin/check-admin';
import { adminAuth } from '@/config/auth/auth.admin';

const mockAdminAuth = adminAuth as jest.Mock;

describe('check-admin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentAdminSession', () => {
    it('should return admin status for ADMIN role', async () => {
      mockAdminAuth.mockResolvedValue({
        user: {
          id: 'admin-1',
          email: 'admin@taxomind.com',
          name: 'Admin User',
          role: 'ADMIN',
        },
      });

      const result = await getCurrentAdminSession();

      expect(result.isAdmin).toBe(true);
      expect(result.isSuperAdmin).toBe(false);
      expect(result.role).toBe('ADMIN');
      expect(result.adminId).toBe('admin-1');
      expect(result.email).toBe('admin@taxomind.com');
      expect(result.name).toBe('Admin User');
    });

    it('should return superadmin status for SUPERADMIN role', async () => {
      mockAdminAuth.mockResolvedValue({
        user: {
          id: 'sa-1',
          email: 'superadmin@taxomind.com',
          name: 'Super Admin',
          role: 'SUPERADMIN',
        },
      });

      const result = await getCurrentAdminSession();

      expect(result.isAdmin).toBe(true);
      expect(result.isSuperAdmin).toBe(true);
      expect(result.role).toBe('SUPERADMIN');
    });

    it('should return non-admin status when no session', async () => {
      mockAdminAuth.mockResolvedValue(null);

      const result = await getCurrentAdminSession();

      expect(result.isAdmin).toBe(false);
      expect(result.isSuperAdmin).toBe(false);
      expect(result.role).toBeNull();
      expect(result.adminId).toBeNull();
      expect(result.email).toBeNull();
      expect(result.name).toBeNull();
    });

    it('should return non-admin status when session has no user', async () => {
      mockAdminAuth.mockResolvedValue({ user: null });

      const result = await getCurrentAdminSession();

      expect(result.isAdmin).toBe(false);
    });

    it('should return non-admin status when session user has no role', async () => {
      mockAdminAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'user@test.com' },
      });

      const result = await getCurrentAdminSession();

      expect(result.isAdmin).toBe(false);
      expect(result.role).toBeNull();
    });

    it('should handle auth errors gracefully', async () => {
      mockAdminAuth.mockRejectedValue(new Error('Auth service unavailable'));

      const result = await getCurrentAdminSession();

      expect(result.isAdmin).toBe(false);
      expect(result.isSuperAdmin).toBe(false);
      expect(result.role).toBeNull();
    });
  });

  describe('isCurrentSessionAdmin', () => {
    it('should return true for admin session', async () => {
      mockAdminAuth.mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
      });

      const isAdmin = await isCurrentSessionAdmin();

      expect(isAdmin).toBe(true);
    });

    it('should return false for non-admin session', async () => {
      mockAdminAuth.mockResolvedValue(null);

      const isAdmin = await isCurrentSessionAdmin();

      expect(isAdmin).toBe(false);
    });
  });

  describe('isCurrentSessionSuperAdmin', () => {
    it('should return true for superadmin', async () => {
      mockAdminAuth.mockResolvedValue({
        user: { id: 'sa-1', role: 'SUPERADMIN' },
      });

      const isSuperAdmin = await isCurrentSessionSuperAdmin();

      expect(isSuperAdmin).toBe(true);
    });

    it('should return false for regular admin', async () => {
      mockAdminAuth.mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
      });

      const isSuperAdmin = await isCurrentSessionSuperAdmin();

      expect(isSuperAdmin).toBe(false);
    });
  });

  describe('requireAdminSession', () => {
    it('should return admin status for admin session', async () => {
      mockAdminAuth.mockResolvedValue({
        user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN' },
      });

      const result = await requireAdminSession();

      expect(result.isAdmin).toBe(true);
      expect(result.adminId).toBe('admin-1');
    });

    it('should throw for non-admin session', async () => {
      mockAdminAuth.mockResolvedValue(null);

      await expect(requireAdminSession()).rejects.toThrow('Admin access required');
    });
  });

  describe('requireSuperAdminSession', () => {
    it('should return status for superadmin', async () => {
      mockAdminAuth.mockResolvedValue({
        user: { id: 'sa-1', email: 'sa@test.com', name: 'SA', role: 'SUPERADMIN' },
      });

      const result = await requireSuperAdminSession();

      expect(result.isSuperAdmin).toBe(true);
    });

    it('should throw for regular admin', async () => {
      mockAdminAuth.mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
      });

      await expect(requireSuperAdminSession()).rejects.toThrow('Superadmin access required');
    });

    it('should throw for no session', async () => {
      mockAdminAuth.mockResolvedValue(null);

      await expect(requireSuperAdminSession()).rejects.toThrow('Superadmin access required');
    });
  });
});
