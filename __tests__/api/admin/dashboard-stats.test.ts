/**
 * Tests for Admin Dashboard Stats Route - app/api/admin/dashboard/stats/route.ts
 *
 * Covers: GET (fetch detailed dashboard stats with growth metrics)
 * Auth: Uses adminAuth() from @/auth.admin
 */

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

// @/lib/db is globally mocked in jest.setup.js

import { GET } from '@/app/api/admin/dashboard/stats/route';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

// Add activeSession model mock (not in global jest.setup.js)
if (!(db as Record<string, unknown>).activeSession) {
  (db as Record<string, unknown>).activeSession = {
    count: jest.fn(() => Promise.resolve(0)),
    findMany: jest.fn(() => Promise.resolve([])),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
};

// =========================================================================
// GET /api/admin/dashboard/stats
// =========================================================================
describe('GET /api/admin/dashboard/stats', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(adminSession);

    // Mock all parallel Promise.all calls in order
    (db.user.count as jest.Mock).mockResolvedValue(500); // totalUsers and usersLastMonth
    (db.course.count as jest.Mock).mockResolvedValue(50); // totalCourses and newCoursesThisMonth
    (db.post.count as jest.Mock).mockResolvedValue(10); // pendingReports and newReportsToday
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for non-admin user', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
  });

  it('returns dashboard stats with metadata', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.totalUsers).toBeDefined();
    expect(body.data.totalCourses).toBeDefined();
    expect(body.data.userGrowth).toBeDefined();
    expect(body.metadata).toBeDefined();
    expect(body.metadata.timestamp).toBeDefined();
    expect(body.metadata.version).toBe('1.0.0');
  });

  it('calculates user growth percentage correctly', async () => {
    // totalUsers = 500, usersLastMonth = 400, growth = ((500-400)/400)*100 = 25
    (db.user.count as jest.Mock)
      .mockResolvedValueOnce(500)   // totalUsers
      .mockResolvedValueOnce(400);  // usersLastMonth

    (db.course.count as jest.Mock).mockResolvedValue(50);
    (db.post.count as jest.Mock).mockResolvedValue(10);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.userGrowth).toBe(25);
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
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('returns all expected stat fields', async () => {
    const res = await GET();
    const body = await res.json();

    const expectedFields = [
      'totalUsers',
      'totalCourses',
      'activeSessions',
      'pendingReports',
      'userGrowth',
      'newCoursesThisMonth',
      'activeSessionsToday',
      'newReportsToday',
    ];

    expectedFields.forEach((field) => {
      expect(body.data).toHaveProperty(field);
    });
  });
});
