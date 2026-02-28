jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/cache/redis-cache', () => ({
  redisCache: {
    get: jest.fn(),
    set: jest.fn(),
  },
  CACHE_PREFIXES: {
    PROGRESS: 'progress',
  },
  CACHE_TTL: {
    SHORT: 60,
  },
}));

import { GET, POST } from '@/app/api/progress/metrics/route';
import { auth } from '@/auth';
import { redisCache } from '@/lib/cache/redis-cache';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockRedisGet = (redisCache.get as jest.Mock);
const mockRedisSet = (redisCache.set as jest.Mock);

describe('/api/progress/metrics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockRedisGet.mockResolvedValue({ hit: false, value: null });
    mockRedisSet.mockResolvedValue(undefined);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/progress/metrics');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('GET returns overall progress metrics with cache miss path', async () => {
    const req = new NextRequest('http://localhost:3000/api/progress/metrics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.metrics)).toBe(true);
    expect(body.overallStats).toBeDefined();
    expect(mockRedisSet).toHaveBeenCalled();
  });

  it('POST returns 400 when courseId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/progress/metrics', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('POST returns mock recalculated metrics for valid courseId', async () => {
    const req = new NextRequest('http://localhost:3000/api/progress/metrics', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'react-101' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.metrics.courseId).toBe('react-101');
  });
});
