jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/analytics/real-time/route';
import { currentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/analytics/real-time route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns 401 when non-admin or unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/real-time');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns realtime payload for admin', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

    const req = new NextRequest('http://localhost:3000/api/analytics/real-time');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.realTimeMetrics).toMatchObject({
      activeUsers: 0,
      totalEvents: 0,
    });
  });

  it('POST returns 401 for non-admin', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
    const req = new NextRequest('http://localhost:3000/api/analytics/real-time', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST returns success for admin', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    const req = new NextRequest('http://localhost:3000/api/analytics/real-time', { method: 'POST' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Event tracked successfully');
  });
});
