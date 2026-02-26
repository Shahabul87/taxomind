jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/lib/db-pooled', () => ({
  getDbMetrics: jest.fn(),
  checkDatabaseHealth: jest.fn(),
}));

jest.mock('@/lib/monitoring/performance', () => ({
  perfMonitor: {
    getStats: jest.fn(),
    getSlowOperations: jest.fn(),
  },
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  getAdapterStatus: jest.fn(),
  getSAMAdapterSystem: jest.fn(),
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  getRateLimitStats: jest.fn(),
  RATE_LIMIT_CONFIGS: {},
}));

jest.mock('@/lib/cache/simple-cache', () => ({
  cache: {
    getStats: jest.fn(),
  },
}));

jest.mock('@/lib/sam/telemetry', () => ({
  getSAMTelemetryService: jest.fn(),
}));

jest.mock('@/lib/data-fetching/enterprise-data-api', () => ({
  enterpriseDataAPI: {
    healthCheck: jest.fn(),
    fetchPosts: jest.fn(),
    fetchCourses: jest.fn(),
  },
}));

import { GET } from '@/app/api/admin/system-health/route';
import { adminAuth } from '@/auth.admin';
import { checkDatabaseHealth, getDbMetrics } from '@/lib/db-pooled';
import { perfMonitor } from '@/lib/monitoring/performance';
import { getAdapterStatus, getSAMAdapterSystem } from '@/lib/sam/ai-provider';
import { getRateLimitStats } from '@/lib/sam/middleware/rate-limiter';
import { cache } from '@/lib/cache/simple-cache';
import { getSAMTelemetryService } from '@/lib/sam/telemetry';
import { enterpriseDataAPI } from '@/lib/data-fetching/enterprise-data-api';

describe('api/admin/system-health route', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (adminAuth as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (checkDatabaseHealth as jest.Mock).mockResolvedValue({
      healthy: true,
      latency: 5,
      metrics: {
        totalQueries: 100,
        errorCount: 0,
        connectionCount: 1,
        latency: { p50: 1, p95: 2, p99: 3, max: 4, avg: 2 },
      },
    });
    (getDbMetrics as jest.Mock).mockReturnValue({
      totalQueries: 100,
      errorCount: 0,
      connectionCount: 1,
      latency: { p50: 1, p95: 2, p99: 3, max: 4, avg: 2 },
    });
    (perfMonitor as any).getStats.mockReturnValue({
      count: 10, min: 1, max: 5, avg: 2, p50: 2, p95: 4, p99: 5,
    });
    (perfMonitor as any).getSlowOperations.mockReturnValue([]);
    (getSAMAdapterSystem as jest.Mock).mockResolvedValue(null);
    (getAdapterStatus as jest.Mock).mockReturnValue({
      hasAIAdapter: true,
      hasEmbeddingProvider: true,
      adapterSource: 'anthropic',
      circuitBreakerState: 'closed',
    });
    (getRateLimitStats as jest.Mock).mockReturnValue({
      totalBuckets: 1,
      bucketsByPrefix: { 'sam:standard': 1 },
    });
    (cache as any).getStats.mockReturnValue({ size: 10, maxSize: 1000 });
    (getSAMTelemetryService as jest.Mock).mockReturnValue({
      getSystemHealth: jest.fn().mockResolvedValue({
        healthScore: 1,
        components: {},
        activeConnections: 1,
        memoryUsageMb: 100,
        errorRate: 0,
        latencyP50Ms: 1,
        latencyP95Ms: 2,
      }),
      getActiveAlerts: jest.fn().mockReturnValue([]),
    });
    (enterpriseDataAPI as any).healthCheck.mockResolvedValue({ success: true });
    (enterpriseDataAPI as any).fetchPosts.mockResolvedValue({ success: true, data: [] });
    (enterpriseDataAPI as any).fetchCourses.mockResolvedValue({ success: true, data: [] });
  });

  it('returns 401 when admin auth fails', async () => {
    (adminAuth as jest.Mock).mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns health payload for admin', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBeDefined();
    expect(body.data.healthScore).toBeDefined();
  });
});
