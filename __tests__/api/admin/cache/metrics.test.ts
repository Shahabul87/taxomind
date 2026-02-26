jest.mock('@/auth.admin', () => ({ adminAuth: jest.fn() }));
jest.mock('@/lib/redis/config', () => ({ redis: { ttl: jest.fn().mockResolvedValue(120), get: jest.fn().mockResolvedValue('v'), ping: jest.fn().mockResolvedValue('PONG') } }));
jest.mock('@/lib/redis/server-action-cache', () => ({ ServerActionCache: { getCacheStats: jest.fn().mockResolvedValue({ totalKeys: 10, memoryUsage: '1MB', hitRate: 0.9 }) } }));

import { GET, POST } from '@/app/api/admin/cache/metrics/route';
import { adminAuth } from '@/auth.admin';
import { NextRequest } from 'next/server';

const mockAdminAuth = adminAuth as jest.Mock;

describe('/api/admin/cache/metrics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
  });

  it('GET returns 401 when unauthorized', async () => {
    mockAdminAuth.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/admin/cache/metrics'));
    expect(res.status).toBe(401);
  });

  it('GET returns overview metrics', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/admin/cache/metrics?action=overview'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('POST returns 400 for flush-pattern without pattern', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/cache/metrics', { method: 'POST', body: JSON.stringify({ action: 'flush-pattern' }) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST accepts flush-all action', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/cache/metrics', { method: 'POST', body: JSON.stringify({ action: 'flush-all' }) });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
