jest.mock('@/lib/monitoring/middleware-monitor', () => ({
  getMonitoringStats: jest.fn(),
  checkRedirectSafety: jest.fn(),
}));

import { GET } from '@/app/api/monitoring/redirect-stats/route';
import { currentUser } from '@/lib/auth';
import { getMonitoringStats, checkRedirectSafety } from '@/lib/monitoring/middleware-monitor';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetMonitoringStats = getMonitoringStats as jest.Mock;
const mockCheckRedirectSafety = checkRedirectSafety as jest.Mock;

describe('/api/monitoring/redirect-stats route', () => {
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockGetMonitoringStats.mockResolvedValue({ total: 10, failures: 1 });
    mockCheckRedirectSafety.mockResolvedValue({ safe: true, reasons: [] });

    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: jest.fn(() => 'req-1'),
      },
      configurable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  it('returns 401 for non-admin users', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
    const req = new NextRequest('http://localhost:3000/api/monitoring/redirect-stats');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns monitoring stats for admin', async () => {
    const req = new NextRequest('http://localhost:3000/api/monitoring/redirect-stats');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.stats.total).toBe(10);
    expect(body.data.safeToRemove.safe).toBe(true);
    expect(body.metadata.requestId).toBe('req-1');
  });

  it('returns 500 when monitoring service fails', async () => {
    mockGetMonitoringStats.mockRejectedValueOnce(new Error('service unavailable'));
    const req = new NextRequest('http://localhost:3000/api/monitoring/redirect-stats');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
