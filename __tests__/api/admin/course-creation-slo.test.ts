/**
 * Tests for Admin Course Creation SLO Route - app/api/admin/course-creation-slo/route.ts
 *
 * Covers: GET (SLO dashboard metrics)
 * Auth: Uses adminAuth() from @/auth.admin
 */

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/types/admin-role', () => ({
  AdminRole: { ADMIN: 'ADMIN', SUPERADMIN: 'SUPERADMIN' },
}));

jest.mock('@/lib/sam/course-creation/slo-telemetry', () => ({
  getCourseCreationSLODashboard: jest.fn().mockResolvedValue({
    totalRuns: 50,
    successRate: 0.92,
    averageDuration: 45000,
    p95Duration: 90000,
    errorRate: 0.08,
    recentErrors: [],
    stepBreakdown: [],
  }),
}));

import { GET } from '@/app/api/admin/course-creation-slo/route';
import { adminAuth } from '@/auth.admin';
import { getCourseCreationSLODashboard } from '@/lib/sam/course-creation/slo-telemetry';
import { NextRequest } from 'next/server';

const mockAdminAuth = adminAuth as jest.Mock;
const mockGetDashboard = getCourseCreationSLODashboard as jest.Mock;

describe('GET /api/admin/course-creation-slo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/admin/course-creation-slo');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-admin user', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const req = new NextRequest('http://localhost:3000/api/admin/course-creation-slo');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns SLO metrics for admin', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    const req = new NextRequest('http://localhost:3000/api/admin/course-creation-slo');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.totalRuns).toBe(50);
    expect(data.data.successRate).toBe(0.92);
    expect(data.metadata).toBeDefined();
  });

  it('supports custom hours parameter', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    const req = new NextRequest('http://localhost:3000/api/admin/course-creation-slo?hours=168');
    await GET(req);

    expect(mockGetDashboard).toHaveBeenCalledWith(168);
  });

  it('defaults to 24 hours when no parameter', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    const req = new NextRequest('http://localhost:3000/api/admin/course-creation-slo');
    await GET(req);

    expect(mockGetDashboard).toHaveBeenCalledWith(24);
  });

  it('returns 500 on telemetry error', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    mockGetDashboard.mockRejectedValueOnce(new Error('Telemetry unavailable'));

    const req = new NextRequest('http://localhost:3000/api/admin/course-creation-slo');
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });
});
