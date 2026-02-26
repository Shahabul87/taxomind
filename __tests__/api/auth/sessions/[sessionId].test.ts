jest.mock('@/lib/auth/session-limiter', () => ({
  terminateSession: jest.fn(),
}));

import { DELETE } from '@/app/api/auth/sessions/[sessionId]/route';
import { auth } from '@/auth';
import { terminateSession } from '@/lib/auth/session-limiter';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockTerminateSession = terminateSession as jest.Mock;

describe('/api/auth/sessions/[sessionId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockTerminateSession.mockResolvedValue(true);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/auth/sessions/s1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ sessionId: 's1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when session cannot be revoked', async () => {
    mockTerminateSession.mockResolvedValueOnce(false);
    const req = new NextRequest('http://localhost:3000/api/auth/sessions/s1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ sessionId: 's1' }) });
    expect(res.status).toBe(404);
  });

  it('revokes session successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/sessions/s1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ sessionId: 's1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockTerminateSession).toHaveBeenCalledWith('s1', 'user-1');
  });
});
