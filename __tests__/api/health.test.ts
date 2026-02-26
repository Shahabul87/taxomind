jest.mock('@/lib/data-fetching/enterprise-data-api', () => ({
  enterpriseDataAPI: {
    healthCheck: jest.fn(),
  },
}));

jest.mock('@/lib/config/news-config', () => ({
  shouldUseRealNews: jest.fn(),
  isProductionEnvironment: jest.fn(),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  getAdapterStatus: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/pipeline/stage-health-tracker', () => ({
  stageHealthTracker: {
    getHealth: jest.fn(),
  },
}));

jest.mock('@/lib/sam/providers/ai-registry', () => ({
  getAllProviders: jest.fn(),
  getDefaultProvider: jest.fn(),
}));

jest.mock('@/lib/sam/agentic-notifications', () => ({
  getNotificationCapabilities: jest.fn(),
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  getRateLimitStoreInfo: jest.fn(),
  getRateLimitStats: jest.fn(),
}));

import { GET, HEAD } from '@/app/api/health/route';
import { db } from '@/lib/db';
import { getDbMetrics } from '@/lib/db-pooled';
import { enterpriseDataAPI } from '@/lib/data-fetching/enterprise-data-api';
import { shouldUseRealNews, isProductionEnvironment } from '@/lib/config/news-config';
import { getAdapterStatus } from '@/lib/sam/ai-provider';
import { stageHealthTracker } from '@/lib/sam/pipeline/stage-health-tracker';
import { getAllProviders, getDefaultProvider } from '@/lib/sam/providers/ai-registry';
import { getNotificationCapabilities } from '@/lib/sam/agentic-notifications';
import { getRateLimitStoreInfo, getRateLimitStats } from '@/lib/sam/middleware/rate-limiter';
import { NextRequest } from 'next/server';

describe('/api/health route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.NODE_ENV = 'test';

    (db.$queryRaw as jest.Mock).mockResolvedValue([{ one: 1 }]);
    (enterpriseDataAPI.healthCheck as jest.Mock).mockResolvedValue({
      success: true,
      data: { source: 'ok' },
    });
    (shouldUseRealNews as jest.Mock).mockReturnValue(false);
    (isProductionEnvironment as jest.Mock).mockReturnValue(false);
    (getAdapterStatus as jest.Mock).mockReturnValue({
      hasAIAdapter: true,
      hasEmbeddingProvider: true,
      adapterSource: 'test',
      circuitBreakerState: 'closed',
    });
    (stageHealthTracker.getHealth as jest.Mock).mockReturnValue({
      overallHealth: 'healthy',
      totalRequests: 10,
      stages: {
        analyze: {
          successRate: 99.2,
          avgDurationMs: 120,
          totalRuns: 10,
          failureCount: 0,
          timeoutCount: 0,
        },
      },
    });
    (getDbMetrics as jest.Mock).mockReturnValue({
      totalQueries: 20,
      errorCount: 1,
      latency: { p50: 5, p95: 20, p99: 30, avg: 8 },
    });
    (getAllProviders as jest.Mock).mockReturnValue([
      { id: 'openai', isConfigured: () => true },
      { id: 'anthropic', isConfigured: () => false },
    ]);
    (getDefaultProvider as jest.Mock).mockReturnValue({ id: 'openai' });
    (getNotificationCapabilities as jest.Mock).mockReturnValue({
      email: { enabled: true, reason: '' },
      push: { enabled: false, reason: 'missing key' },
      sms: { enabled: false, reason: 'disabled' },
    });
    (getRateLimitStoreInfo as jest.Mock).mockReturnValue({
      type: 'memory',
      isDistributed: true,
    });
    (getRateLimitStats as jest.Mock).mockReturnValue({
      totalBuckets: 3,
      bucketsByPrefix: { ai: 1, tools: 2 },
    });
  });

  it('GET returns healthy status when core checks pass', async () => {
    const req = new NextRequest('http://localhost:3000/api/health');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.services.database.status).toBe('up');
    expect(body.enterpriseAPI).toEqual({ source: 'ok' });
    expect(body.sam.aiAdapter).toBe('initialized');
    expect(body.aiProviders.default).toBe('openai');
  });

  it('GET returns 503 when database check fails', async () => {
    (db.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('db unavailable'));
    const req = new NextRequest('http://localhost:3000/api/health');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.services.database.status).toBe('down');
    expect(body.services.database.error).toContain('db unavailable');
  });

  it('HEAD returns 200 for liveness probe', async () => {
    const req = new NextRequest('http://localhost:3000/api/health');
    const res = await HEAD(req);
    expect(res.status).toBe(200);
  });
});
