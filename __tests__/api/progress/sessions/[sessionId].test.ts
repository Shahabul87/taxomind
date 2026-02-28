jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { DELETE, PATCH } from '@/app/api/progress/sessions/[sessionId]/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/progress/sessions/[sessionId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('PATCH returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/progress/sessions/session-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ sessionId: 'session-1' }) });

    expect(res.status).toBe(401);
  });

  it('PATCH returns updated session payload for authenticated users', async () => {
    const req = new NextRequest('http://localhost:3000/api/progress/sessions/session-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'IN_PROGRESS', duration: 45 }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ sessionId: 'session-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.session.id).toBe('session-1');
    expect(body.session.userId).toBe('user-1');
    expect(body.session.duration).toBe(45);
    expect(body.session.status).toBe('IN_PROGRESS');
  });

  it('DELETE returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/progress/sessions/session-1', {
      method: 'DELETE',
      body: JSON.stringify({ finalData: { status: 'COMPLETED' } }),
    });
    const res = await DELETE(req, { params: Promise.resolve({ sessionId: 'session-1' }) });

    expect(res.status).toBe(401);
  });

  it('DELETE returns final session data from request payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/progress/sessions/session-1', {
      method: 'DELETE',
      body: JSON.stringify({
        finalData: {
          status: 'ABANDONED',
          duration: 12,
          confidenceScore: 22,
        },
      }),
    });
    const res = await DELETE(req, { params: Promise.resolve({ sessionId: 'session-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.session.id).toBe('session-1');
    expect(body.session.userId).toBe('user-1');
    expect(body.session.status).toBe('ABANDONED');
    expect(body.session.duration).toBe(12);
    expect(body.session.confidenceScore).toBe(22);
  });
});
