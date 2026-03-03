jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

import { GET } from '@/app/api/analytics/enhanced/route';
import { auth } from '@/auth';
import { adminAuth } from '@/auth.admin';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockAdminAuth = adminAuth as jest.Mock;

describe('GET /api/analytics/enhanced', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'USER', email: 'user@test.com' },
    });
    // Default: not admin
    mockAdminAuth.mockResolvedValue(null);
  });

  it('returns 401 for unauthenticated requests', async () => {
    mockAuth.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/analytics/enhanced');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when non-admin requests another user analytics', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/enhanced?userId=other-user&courseId=course-1'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('returns analytics payload for authorized request', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/enhanced?courseId=course-1'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user).toEqual({
      id: 'user-1',
      isAdmin: false,
      email: 'user@test.com',
    });
    expect(body.request.courseId).toBe('course-1');
    expect(body.request.view).toBe('student');
    expect(body.analytics.status).toBe('success');
  });

  it('allows admin users to access other user analytics', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-1', role: 'ADMIN', email: 'admin@test.com' },
    });
    mockAdminAuth.mockResolvedValueOnce({ user: { id: 'admin-1' } });

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/enhanced?userId=other-user&view=teacher'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.request.userId).toBe('other-user');
    expect(body.request.view).toBe('teacher');
  });

  it('returns 500 when auth lookup throws', async () => {
    mockAuth.mockRejectedValueOnce(new Error('auth crash'));

    const req = new NextRequest('http://localhost:3000/api/analytics/enhanced');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
