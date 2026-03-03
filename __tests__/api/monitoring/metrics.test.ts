jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

import { GET } from '@/app/api/monitoring/metrics/route';
import { adminAuth } from '@/auth.admin';
import { NextRequest } from 'next/server';

const mockAdminAuth = adminAuth as jest.Mock;

describe('/api/monitoring/metrics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/monitoring/metrics');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-admin user', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const req = new NextRequest('http://localhost:3000/api/monitoring/metrics?period=24h');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns metrics payload for admin user', async () => {
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    const req = new NextRequest('http://localhost:3000/api/monitoring/metrics?period=24h');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.metrics.period).toBe('24h');
    // Real system metrics - check structure, not specific values
    expect(body.metrics.system.cpu.cores).toBeGreaterThan(0);
    expect(body.metrics.system.memory).toBeDefined();
    expect(body.metrics.process.uptime).toBeGreaterThanOrEqual(0);
  });
});
