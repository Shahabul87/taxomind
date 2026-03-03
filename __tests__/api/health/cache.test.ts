jest.mock('@/lib/api/with-api-auth', () => ({
  withAdminAuth: jest.fn((handler: (request: any, context: any) => Promise<any>) => {
    return async (request: any) =>
      handler(request, {
        user: { id: 'admin-1', role: 'ADMIN' },
      });
  }),
}));

jest.mock('@/lib/cache/redis-cache', () => ({
  redisCache: {
    healthCheck: jest.fn(),
    getMetrics: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    flush: jest.fn(),
  },
}));

jest.mock('@/lib/db/query-optimizer', () => ({
  getQueryPerformanceMetrics: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/health/cache/route';
import { redisCache } from '@/lib/cache/redis-cache';
import { getQueryPerformanceMetrics } from '@/lib/db/query-optimizer';
import { NextRequest } from 'next/server';

describe('/api/health/cache route', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';

    (redisCache.healthCheck as jest.Mock).mockResolvedValue({
      status: 'healthy',
      details: { connected: true },
    });
    (redisCache.getMetrics as jest.Mock).mockReturnValue({
      hits: 80,
      misses: 20,
      errors: 0,
      latency: [5, 10, 15],
      memoryUsage: 5 * 1024 * 1024,
      keyCount: 50,
      connectionStatus: 'connected',
      lastError: null,
    });
    (redisCache.set as jest.Mock).mockResolvedValue(true);
    (redisCache.get as jest.Mock).mockResolvedValue({ hit: true, value: { ok: true }, latency: 2 });
    (redisCache.delete as jest.Mock).mockResolvedValue(true);
    (redisCache.flush as jest.Mock).mockResolvedValue(true);
    (getQueryPerformanceMetrics as jest.Mock).mockReturnValue({
      userList: { avgQueryTime: 30, cacheHitRate: 70, avgRowCount: 20 },
    });
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('GET returns cache health payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/health/cache');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.cache.connected).toBe(true);
    expect(body.cache.metrics.totalRequests).toBe(100);
    expect(Array.isArray(body.recommendations)).toBe(true);
  });

  it('GET returns 503 when health check throws', async () => {
    (redisCache.healthCheck as jest.Mock).mockRejectedValueOnce(new Error('redis down'));
    const req = new NextRequest('http://localhost:3000/api/health/cache');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Internal server error');
  });

  it('POST supports cache set action', async () => {
    const req = new NextRequest('http://localhost:3000/api/health/cache', {
      method: 'POST',
      body: JSON.stringify({ action: 'set', key: 'k1', value: { a: 1 }, ttl: 30 }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.action).toBe('set');
    expect(body.success).toBe(true);
  });

  it('POST returns validation error for unknown action', async () => {
    const req = new NextRequest('http://localhost:3000/api/health/cache', {
      method: 'POST',
      body: JSON.stringify({ action: 'unknown' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toContain('Invalid action');
  });
});
