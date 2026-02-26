jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/analytics/websocket/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('GET /api/analytics/websocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/websocket');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns websocket metadata for authenticated session', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const req = new NextRequest('http://localhost:3000/api/analytics/websocket?courseId=course-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.courseId).toBe('course-1');
    expect(body.user).toEqual({ id: 'user-1', role: 'USER' });
  });

  it('returns 500 when auth throws', async () => {
    mockAuth.mockRejectedValueOnce(new Error('auth fail'));
    const req = new NextRequest('http://localhost:3000/api/analytics/websocket');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
