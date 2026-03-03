/**
 * Tests for Admin User Token Usage Route - app/api/admin/user-token-usage/route.ts
 *
 * Covers: GET (user token usage analytics for admin dashboard)
 * Auth: Uses adminAuth() from @/auth.admin
 */

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/types/admin-role', () => ({
  AdminRole: { ADMIN: 'ADMIN', SUPERADMIN: 'SUPERADMIN' },
}));

import { GET } from '@/app/api/admin/user-token-usage/route';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

const setupDefaultMocks = () => {
  (db.platformAISettings.findFirst as jest.Mock).mockResolvedValue(null);
  (db.user.findMany as jest.Mock).mockResolvedValue([]);
  (db.aIUsageMetrics.count as jest.Mock).mockResolvedValue(0);
  (db.user.groupBy as jest.Mock).mockResolvedValue([]);
};

describe('GET /api/admin/user-token-usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/admin/user-token-usage');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-admin user', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const req = new Request('http://localhost:3000/api/admin/user-token-usage');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns token usage data for admin', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    setupDefaultMocks();

    const req = new Request('http://localhost:3000/api/admin/user-token-usage');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.platformSummary).toBeDefined();
    expect(data.data.users).toBeDefined();
    expect(data.metadata.pagination).toBeDefined();
  });

  it('returns per-user breakdown with AI usage', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.platformAISettings.findFirst as jest.Mock).mockResolvedValue(null);
    (db.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'user-1', name: 'Test User', email: 'test@test.com',
        image: null, subscriptionTier: 'FREE',
        dailyAiUsageCount: 5, monthlyAiUsageCount: 20,
      },
    ]);
    (db.aIUsageMetrics.count as jest.Mock).mockResolvedValue(1);
    (db.aIUsageMetrics.groupBy as jest.Mock).mockResolvedValue([
      {
        userId: 'user-1',
        _sum: {
          totalTokens: 10000, totalGenerations: 50, totalCost: 1.0,
          courseGenerations: 10, chapterGenerations: 15,
          lessonGenerations: 12, examGenerations: 8, exerciseGenerations: 5,
        },
        _max: { date: new Date() },
      },
    ]);
    (db.aIUsageMetrics.aggregate as jest.Mock).mockResolvedValue({
      _sum: {
        totalTokens: 10000, totalGenerations: 50, totalCost: 1.0,
        courseGenerations: 10, chapterGenerations: 15,
        lessonGenerations: 12, examGenerations: 8, exerciseGenerations: 5,
      },
    });
    (db.user.groupBy as jest.Mock).mockResolvedValue([
      { subscriptionTier: 'FREE', _count: 5 },
    ]);

    const req = new Request('http://localhost:3000/api/admin/user-token-usage');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.users).toHaveLength(1);
    expect(data.data.users[0].totalTokens).toBe(10000);
  });

  it('supports period filter', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    setupDefaultMocks();

    const req = new Request('http://localhost:3000/api/admin/user-token-usage?period=week');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.metadata.period).toBe('week');
  });

  it('supports search filter', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    setupDefaultMocks();

    const req = new Request('http://localhost:3000/api/admin/user-token-usage?search=test');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.metadata.filters.search).toBe('test');
  });

  it('supports tier filter', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    setupDefaultMocks();

    const req = new Request('http://localhost:3000/api/admin/user-token-usage?tier=STARTER');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.metadata.filters.tier).toBe('STARTER');
  });

  it('supports pagination', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    setupDefaultMocks();

    const req = new Request('http://localhost:3000/api/admin/user-token-usage?page=2&limit=10');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.metadata.pagination.page).toBe(2);
    expect(data.metadata.pagination.limit).toBe(10);
  });

  it('returns 500 on database error', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    // platformAISettings.findFirst is inside an inner try-catch with fallback,
    // so we need to throw from user.findMany which is outside that inner catch
    (db.user.findMany as jest.Mock).mockRejectedValue(new Error('DB down'));

    const req = new Request('http://localhost:3000/api/admin/user-token-usage');
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(typeof data.error).toBe('string');
  });
});
