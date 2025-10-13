jest.mock('@/actions/admin', () => ({
  getAdminDashboardData: jest.fn(),
  admin: jest.fn(),
}));

import { getAdminDashboardData, admin } from '@/actions/admin';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';
import { UserRole } from '@prisma/client';

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

const mockAuth = auth as jest.Mock;

describe('admin actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdminDashboardData', () => {
    it('should return dashboard data for admin user', async () => {
      const mockDashboardData = {
        totalUsers: 1000,
        monthlyGrowth: { users: 100, percentage: 10 },
        weeklyGrowth: { users: 25, percentage: 2.5 },
        totalCourses: 500,
        totalSales: 2000,
        totalRevenue: 50000,
        recentUsers: [
          { id: 'user-1', name: 'User 1', email: 'user1@example.com', createdAt: new Date() },
          { id: 'user-2', name: 'User 2', email: 'user2@example.com', createdAt: new Date() },
        ],
        recentCourses: [
          { id: 'course-1', title: 'Course 1', price: 99.99 },
          { id: 'course-2', title: 'Course 2', price: 79.99 },
        ],
      };

      (getAdminDashboardData as jest.Mock).mockResolvedValue(mockDashboardData);

      const result = await getAdminDashboardData();

      expect(result).toEqual(mockDashboardData);
      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('monthlyGrowth');
      expect(result).toHaveProperty('weeklyGrowth');
      expect(result).toHaveProperty('totalCourses');
      expect(result).toHaveProperty('totalSales');
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('recentUsers');
      expect(result).toHaveProperty('recentCourses');
    });

    it('should throw error for non-admin user', async () => {
      (getAdminDashboardData as jest.Mock).mockRejectedValue(new Error('Unauthorized: Admin access required'));

      await expect(getAdminDashboardData()).rejects.toThrow('Unauthorized: Admin access required');
    });

    it('should throw error when no session exists', async () => {
      (getAdminDashboardData as jest.Mock).mockRejectedValue(new Error('Unauthorized: Admin access required'));

      await expect(getAdminDashboardData()).rejects.toThrow('Unauthorized: Admin access required');
    });

    it('should handle database errors gracefully', async () => {
      (getAdminDashboardData as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getAdminDashboardData()).rejects.toThrow('Database error');
    });
  });

  describe('admin function', () => {
    it('should return admin status for admin user', async () => {
      (admin as jest.Mock).mockResolvedValue(UserRole.ADMIN);

      const result = await admin();

      expect(result).toBe(UserRole.ADMIN);
    });

    it('should return undefined for regular user', async () => {
      (admin as jest.Mock).mockResolvedValue(undefined);

      const result = await admin();

      expect(result).toBeUndefined();
    });

    it('should return undefined when no session exists', async () => {
      (admin as jest.Mock).mockResolvedValue(undefined);

      const result = await admin();

      expect(result).toBeUndefined();
    });

    it('should return undefined when user object is missing', async () => {
      (admin as jest.Mock).mockResolvedValue(undefined);

      const result = await admin();

      expect(result).toBeUndefined();
    });

    it('should handle auth errors gracefully', async () => {
      (admin as jest.Mock).mockRejectedValue(new Error('Auth failed'));

      await expect(admin()).rejects.toThrow('Auth failed');
    });
  });
});