/**
 * Tests for Admin Database Performance Route - app/api/admin/database/performance/route.ts
 *
 * Covers: GET with actions: query-stats, slow-queries, db-metrics, table-sizes, default
 * Auth: Uses adminAuth() from @/auth.admin
 */

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/lib/database/query-optimizer', () => ({
  QueryPerformanceMonitor: {
    getAllQueryStats: jest.fn(),
  },
}));

// @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import { GET } from '@/app/api/admin/database/performance/route';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';
import { QueryPerformanceMonitor } from '@/lib/database/query-optimizer';

const mockAdminAuth = adminAuth as jest.Mock;
const mockGetAllQueryStats =
  QueryPerformanceMonitor.getAllQueryStats as jest.Mock;

function createGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/admin/database/performance');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
};

// =========================================================================
// GET /api/admin/database/performance
// =========================================================================
describe('GET /api/admin/database/performance', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(adminSession);
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 for non-admin user', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns available actions when no action specified', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.available_actions).toContain('query-stats');
    expect(body.available_actions).toContain('slow-queries');
    expect(body.available_actions).toContain('db-metrics');
    expect(body.available_actions).toContain('table-sizes');
  });

  it('returns query stats for action=query-stats', async () => {
    mockGetAllQueryStats.mockReturnValue([
      { query: 'SELECT * FROM users', averageTime: 50, callCount: 100 },
    ]);

    const res = await GET(createGetRequest({ action: 'query-stats' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.stats).toHaveLength(1);
  });

  it('returns slow queries for action=slow-queries', async () => {
    mockGetAllQueryStats.mockReturnValue([
      { query: 'SELECT * FROM big_table', averageTime: 1200, callCount: 10 },
      { query: 'SELECT * FROM small_table', averageTime: 50, callCount: 100 },
    ]);

    const res = await GET(createGetRequest({ action: 'slow-queries' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // Only queries with averageTime > 500 are returned
    expect(body.slowQueries).toHaveLength(1);
    expect(body.slowQueries[0].averageTime).toBe(1200);
  });

  it('returns db metrics for action=db-metrics', async () => {
    // $queryRaw is used as tagged template literal; the mock returns []
    // getDatabaseMetrics() handles errors internally and returns { connections, tableStats }
    // With an empty array result, connections will be result[0] = undefined
    const res = await GET(createGetRequest({ action: 'db-metrics' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.metrics).toBeDefined();
  });

  it('returns table sizes for action=table-sizes', async () => {
    // $queryRaw mock returns [] by default - getTableSizes() returns that directly
    const res = await GET(createGetRequest({ action: 'table-sizes' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.tableSizes).toBeDefined();
  });

  it('returns 500 on unexpected error', async () => {
    mockAdminAuth.mockRejectedValue(new Error('Auth service down'));

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
