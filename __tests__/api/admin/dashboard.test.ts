/**
 * Tests for Admin Dashboard Route - app/api/admin/dashboard/route.ts
 *
 * Covers: GET (fetch dashboard stats including users, courses, groups, resources)
 * Auth: Uses adminAuth() from @/auth.admin
 */

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

// @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import { GET } from '@/app/api/admin/dashboard/route';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
};

// =========================================================================
// GET /api/admin/dashboard
// =========================================================================
describe('GET /api/admin/dashboard', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(adminSession);

    // Default mock values for all database calls
    (db.user.count as jest.Mock).mockResolvedValue(100);
    (db.user.groupBy as jest.Mock).mockResolvedValue([
      { isTeacher: false, _count: { isTeacher: 80 } },
      { isTeacher: true, _count: { isTeacher: 20 } },
    ]);
    (db.account.count as jest.Mock).mockResolvedValue(30);
    (db.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'u1',
        name: 'Recent User',
        email: 'recent@test.com',
        isTeacher: false,
        createdAt: new Date(),
        emailVerified: new Date(),
      },
    ]);
    (db.course?.count as jest.Mock).mockResolvedValue(50);
    (db.group?.count as jest.Mock).mockResolvedValue(10);
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it('returns 401 for non-admin user', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it('returns dashboard stats for admin', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.stats).toBeDefined();
    expect(body.stats.totalUsers).toBe(100);
    expect(body.stats.totalCourses).toBe(50);
    expect(body.stats.totalGroups).toBe(10);
    expect(body.stats.oauthAccounts).toBe(30);
    expect(body.stats.credentialUsers).toBe(70); // 100 - 30
    expect(body.recentUsers).toHaveLength(1);
  });

  it('returns user type distribution', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.stats.usersByType).toHaveLength(2);
  });

  it('calculates verified vs unverified users', async () => {
    // First count call: totalUsers, second: lastWeekUsers, third: verifiedUsers
    (db.user.count as jest.Mock)
      .mockResolvedValueOnce(100) // totalUsers
      .mockResolvedValueOnce(15) // lastWeekUsers
      .mockResolvedValueOnce(75); // verifiedUsers

    const res = await GET();
    const body = await res.json();

    expect(body.stats.totalUsers).toBe(100);
    expect(body.stats.lastWeekUsers).toBe(15);
    expect(body.stats.verifiedUsers).toBe(75);
    expect(body.stats.unverifiedUsers).toBe(25); // 100 - 75
  });

  it('allows SUPERADMIN access', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'superadmin-1', role: 'SUPERADMIN' },
    });

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('returns 500 on database error', async () => {
    (db.user.count as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
