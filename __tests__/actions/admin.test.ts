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
      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-1',
          role: UserRole.ADMIN,
          email: 'admin@example.com',
        },
      });

      const now = Date.now();
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

      // Mock all the database calls
      prismaMock.user.count.mockResolvedValueOnce(1000); // Total users
      prismaMock.user.count.mockResolvedValueOnce(100); // Last month users
      prismaMock.user.count.mockResolvedValueOnce(25); // Last week users
      prismaMock.course.count.mockResolvedValueOnce(500); // Total courses
      prismaMock.course.count.mockResolvedValueOnce(50); // Last month courses
      prismaMock.purchase.count.mockResolvedValue(2000); // Total sales
      prismaMock.purchase.groupBy.mockResolvedValue([
        { _sum: { price: 50000 } },
      ]); // Total revenue
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'user-1', name: 'User 1', email: 'user1@example.com', createdAt: new Date() },
        { id: 'user-2', name: 'User 2', email: 'user2@example.com', createdAt: new Date() },
      ]); // Recent users
      prismaMock.course.findMany.mockResolvedValue([
        { id: 'course-1', title: 'Course 1', price: 99.99 },
        { id: 'course-2', title: 'Course 2', price: 79.99 },
      ]); // Recent courses

      const result = await getAdminDashboardData();

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
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          role: UserRole.USER,
          email: 'user@example.com',
        },
      });

      await expect(getAdminDashboardData()).rejects.toThrow('Unauthorized: Admin access required');
    });

    it('should throw error when no session exists', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(getAdminDashboardData()).rejects.toThrow('Unauthorized: Admin access required');
    });

    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-1',
          role: UserRole.ADMIN,
        },
      });

      prismaMock.user.count.mockRejectedValue(new Error('Database error'));

      await expect(getAdminDashboardData()).rejects.toThrow('Database error');
    });
  });

  describe('admin function', () => {
    it('should return admin status for admin user', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-1',
          role: UserRole.ADMIN,
          email: 'admin@example.com',
        },
      });

      const result = await admin();

      expect(result).toBe(UserRole.ADMIN);
    });

    it('should return undefined for regular user', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          role: UserRole.USER,
          email: 'user@example.com',
        },
      });

      const result = await admin();

      expect(result).toBeUndefined();
    });

    it('should return undefined when no session exists', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await admin();

      expect(result).toBeUndefined();
    });

    it('should return undefined when user object is missing', async () => {
      mockAuth.mockResolvedValue({});

      const result = await admin();

      expect(result).toBeUndefined();
    });

    it('should handle auth errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Auth failed'));

      await expect(admin()).rejects.toThrow('Auth failed');
    });
  });
});