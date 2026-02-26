import { GET } from '@/app/api/courses/[courseId]/predictions/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('GET /api/courses/[courseId]/predictions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'admin-1' });
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'admin-1',
      chapters: [{ title: 'Chapter 1' }],
      Purchase: [{ user: { id: 'u1', name: 'U1', email: 'u1@test.com', createdAt: new Date('2026-01-01') } }],
      Enrollment: [{ user: { id: 'u2', name: 'U2', email: 'u2@test.com', createdAt: new Date('2026-01-02') } }],
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/predictions'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/predictions'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(403);
  });

  it('returns 404 when course not found', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/predictions'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(404);
  });

  it('returns predictions payload', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/predictions'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.studentPredictions)).toBe(true);
    expect(body.coursePredictions).toBeDefined();
    expect(body.modelInfo).toBeDefined();
  });
});
