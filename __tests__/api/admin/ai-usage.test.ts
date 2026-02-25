/**
 * Tests for Admin AI Usage Route - app/api/admin/ai-usage/route.ts
 *
 * Covers: GET (AI usage analytics for admin dashboard)
 * Auth: Uses adminAuth() from @/auth.admin
 */

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/types/admin-role', () => ({
  AdminRole: { ADMIN: 'ADMIN', SUPERADMIN: 'SUPERADMIN' },
}));

import { GET } from '@/app/api/admin/ai-usage/route';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

// Add missing model mocks
if (!(db as Record<string, unknown>).aIContentGeneration) {
  (db as Record<string, unknown>).aIContentGeneration = {
    groupBy: jest.fn(() => Promise.resolve([])),
    findMany: jest.fn(() => Promise.resolve([])),
    count: jest.fn(() => Promise.resolve(0)),
  };
}

describe('GET /api/admin/ai-usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/admin/ai-usage');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-admin user', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const req = new Request('http://localhost:3000/api/admin/ai-usage');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns usage stats for admin', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.aIUsageMetrics.aggregate as jest.Mock).mockResolvedValue({
      _sum: {
        totalGenerations: 100,
        totalTokens: 50000,
        totalCost: 5.0,
        courseGenerations: 20,
        chapterGenerations: 30,
        lessonGenerations: 25,
        examGenerations: 15,
        exerciseGenerations: 10,
      },
      _avg: { averageRating: 4.2, approvalRate: 0.85 },
    });
    (db.aIUsageMetrics.groupBy as jest.Mock).mockResolvedValue([]);
    (db.user.findMany as jest.Mock).mockResolvedValue([]);
    ((db as Record<string, unknown>).aIContentGeneration as { groupBy: jest.Mock }).groupBy
      .mockResolvedValue([]);
    (db.platformAIUsageSummary.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/admin/ai-usage');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.summary.totalGenerations).toBe(100);
    expect(data.data.summary.totalTokens).toBe(50000);
  });

  it('allows SUPERADMIN access', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'super-1', role: 'SUPERADMIN' } });
    (db.aIUsageMetrics.aggregate as jest.Mock).mockResolvedValue({
      _sum: { totalGenerations: 0, totalTokens: 0, totalCost: 0,
        courseGenerations: 0, chapterGenerations: 0, lessonGenerations: 0,
        examGenerations: 0, exerciseGenerations: 0 },
      _avg: { averageRating: 0, approvalRate: 0 },
    });
    (db.aIUsageMetrics.groupBy as jest.Mock).mockResolvedValue([]);
    (db.user.findMany as jest.Mock).mockResolvedValue([]);
    ((db as Record<string, unknown>).aIContentGeneration as { groupBy: jest.Mock }).groupBy
      .mockResolvedValue([]);
    (db.platformAIUsageSummary.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/admin/ai-usage');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('supports period parameter', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.aIUsageMetrics.aggregate as jest.Mock).mockResolvedValue({
      _sum: { totalGenerations: 0, totalTokens: 0, totalCost: 0,
        courseGenerations: 0, chapterGenerations: 0, lessonGenerations: 0,
        examGenerations: 0, exerciseGenerations: 0 },
      _avg: { averageRating: 0, approvalRate: 0 },
    });
    (db.aIUsageMetrics.groupBy as jest.Mock).mockResolvedValue([]);
    (db.user.findMany as jest.Mock).mockResolvedValue([]);
    ((db as Record<string, unknown>).aIContentGeneration as { groupBy: jest.Mock }).groupBy
      .mockResolvedValue([]);
    (db.platformAIUsageSummary.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/admin/ai-usage?period=month');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.period).toBe('month');
  });

  it('returns generation breakdown by type', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.aIUsageMetrics.aggregate as jest.Mock).mockResolvedValue({
      _sum: {
        totalGenerations: 100, totalTokens: 50000, totalCost: 5.0,
        courseGenerations: 20, chapterGenerations: 30,
        lessonGenerations: 25, examGenerations: 15, exerciseGenerations: 10,
      },
      _avg: { averageRating: 4.2, approvalRate: 0.85 },
    });
    (db.aIUsageMetrics.groupBy as jest.Mock).mockResolvedValue([]);
    (db.user.findMany as jest.Mock).mockResolvedValue([]);
    ((db as Record<string, unknown>).aIContentGeneration as { groupBy: jest.Mock }).groupBy
      .mockResolvedValue([]);
    (db.platformAIUsageSummary.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/admin/ai-usage');
    const res = await GET(req);
    const data = await res.json();

    expect(data.data.generationBreakdown.courses).toBe(20);
    expect(data.data.generationBreakdown.chapters).toBe(30);
    expect(data.data.generationBreakdown.lessons).toBe(25);
  });

  it('returns estimated costs by provider', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.aIUsageMetrics.aggregate as jest.Mock).mockResolvedValue({
      _sum: {
        totalGenerations: 100, totalTokens: 1000000, totalCost: 5.0,
        courseGenerations: 0, chapterGenerations: 0,
        lessonGenerations: 0, examGenerations: 0, exerciseGenerations: 0,
      },
      _avg: { averageRating: 0, approvalRate: 0 },
    });
    (db.aIUsageMetrics.groupBy as jest.Mock).mockResolvedValue([]);
    (db.user.findMany as jest.Mock).mockResolvedValue([]);
    ((db as Record<string, unknown>).aIContentGeneration as { groupBy: jest.Mock }).groupBy
      .mockResolvedValue([]);
    (db.platformAIUsageSummary.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/admin/ai-usage');
    const res = await GET(req);
    const data = await res.json();

    expect(data.data.estimatedCosts).toBeDefined();
    expect(data.data.estimatedCosts.deepseek).toBeGreaterThanOrEqual(0);
    expect(data.data.estimatedCosts.anthropic).toBeGreaterThanOrEqual(0);
    expect(data.data.estimatedCosts.openai).toBeGreaterThanOrEqual(0);
  });

  it('returns 500 on database error', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.aIUsageMetrics.aggregate as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = new Request('http://localhost:3000/api/admin/ai-usage');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
