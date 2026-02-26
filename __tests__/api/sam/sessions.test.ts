jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/sam/stores/prisma-session-stores', () => ({
  getStudentSessions: jest.fn(),
}));

import { GET } from '@/app/api/sam/sessions/route';
import { auth } from '@/auth';
import { getStudentSessions } from '@/lib/sam/stores/prisma-session-stores';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGetStudentSessions = getStudentSessions as jest.Mock;

describe('/api/sam/sessions route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'teacher-1', isTeacher: true } });
    mockGetStudentSessions.mockResolvedValue({
      sessions: [{ id: 's1' }],
      total: 1,
      cursor: null,
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/sessions');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not teacher/admin', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'USER', isTeacher: false } });

    const req = new NextRequest('http://localhost:3000/api/sam/sessions');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('returns sessions for teacher', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/sessions?courseId=course-1&cursor=cur-1&limit=25');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta.total).toBe(1);
    expect(mockGetStudentSessions).toHaveBeenCalledWith('teacher-1', {
      courseId: 'course-1',
      cursor: 'cur-1',
      limit: 25,
    });
  });

  it('caps limit at 50', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/sessions?limit=500');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockGetStudentSessions).toHaveBeenCalledWith('teacher-1', {
      courseId: undefined,
      cursor: undefined,
      limit: 50,
    });
  });

  it('returns 500 when session store throws', async () => {
    mockGetStudentSessions.mockRejectedValueOnce(new Error('store down'));

    const req = new NextRequest('http://localhost:3000/api/sam/sessions');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
