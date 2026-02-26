import { GET } from '@/app/api/monitoring/metrics/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/monitoring/metrics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/monitoring/metrics');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns metrics payload for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const req = new NextRequest('http://localhost:3000/api/monitoring/metrics?period=24h');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.metrics.period).toBe('24h');
    expect(body.metrics.system.cpu.usage).toBe(45);
    expect(body.metrics.application.requests.total).toBe(10000);
  });
});
