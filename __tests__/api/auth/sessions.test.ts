jest.mock('@/lib/auth/session-limiter', () => ({
  getActiveSessions: jest.fn(),
  terminateAllSessions: jest.fn(),
}));

import { DELETE, GET } from '@/app/api/auth/sessions/route';
import { auth } from '@/auth';
import { getActiveSessions, terminateAllSessions } from '@/lib/auth/session-limiter';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGetActiveSessions = getActiveSessions as jest.Mock;
const mockTerminateAllSessions = terminateAllSessions as jest.Mock;

describe('/api/auth/sessions route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockGetActiveSessions.mockResolvedValue([
      {
        id: 's1',
        deviceId: 'd1',
        deviceName: 'MacBook',
        ipAddress: '127.0.0.1',
        userAgent: 'UA',
        lastActivity: new Date('2026-03-01T10:00:00.000Z'),
        createdAt: new Date('2026-03-01T09:00:00.000Z'),
        isTrustedDevice: true,
        riskLevel: 'low',
      },
    ]);
    mockTerminateAllSessions.mockResolvedValue({ terminatedCount: 2 });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET returns mapped active sessions', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.total).toBe(1);
    expect(body.sessions[0].deviceName).toBe('MacBook');
  });

  it('DELETE returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/auth/sessions', { method: 'DELETE' });
    const res = await DELETE(req);

    expect(res.status).toBe(401);
  });

  it('DELETE terminates sessions and returns count', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/sessions', {
      method: 'DELETE',
      body: JSON.stringify({ keepCurrent: true, currentDeviceId: 'd1' }),
    });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.terminatedCount).toBe(2);
    expect(mockTerminateAllSessions).toHaveBeenCalledWith('user-1', 'd1');
  });
});
