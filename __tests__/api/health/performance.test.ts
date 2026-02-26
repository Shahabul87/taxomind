jest.mock('@/lib/api/with-api-auth', () => ({
  withAdminAuth: jest.fn((handler: (request: any, context: any) => Promise<any>) => {
    return async (request: any) =>
      handler(request, {
        user: { id: 'admin-1', role: 'ADMIN' },
      });
  }),
}));

jest.mock('@/lib/monitoring/performance', () => ({
  perfMonitor: {
    getStats: jest.fn(),
    getSlowOperations: jest.fn(),
  },
}));

jest.mock('@/lib/cache/simple-cache', () => ({
  cache: {
    getStats: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/health/performance/route';
import { db } from '@/lib/db';
import { perfMonitor } from '@/lib/monitoring/performance';
import { cache } from '@/lib/cache/simple-cache';
import { NextRequest } from 'next/server';

describe('/api/health/performance route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.user.count as jest.Mock).mockResolvedValue(10);
    (perfMonitor.getStats as jest.Mock).mockReturnValue({ avg: 120, p95: 300 });
    (perfMonitor.getSlowOperations as jest.Mock).mockReturnValue([]);
    (cache.getStats as jest.Mock).mockReturnValue({ size: 150 });
  });

  it('returns performance health metrics', async () => {
    const req = new NextRequest('http://localhost:3000/api/health/performance');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.metrics.database.userCount).toBe(10);
    expect(body.metrics.api.stats.avg).toBe(120);
  });

  it('returns 500 when metrics retrieval fails', async () => {
    (db.user.count as jest.Mock).mockRejectedValueOnce(new Error('db fail'));
    const req = new NextRequest('http://localhost:3000/api/health/performance');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.status).toBe('error');
  });
});
