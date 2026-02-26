import { GET } from '@/app/api/courses/[courseId]/analytics/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/courses/[courseId]/analytics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/analytics'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not an admin account', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-1' });
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/analytics'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(403);
  });

  it('returns 404 when course is not accessible', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'admin-1' });
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' });
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/analytics'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(404);
  });

  it('returns analytics payload for admin', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'admin-1' });
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' });
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'course-1',
      title: 'Course 1',
      userId: 'admin-1',
      chapters: [
        {
          id: 'ch-1',
          title: 'Chapter 1',
          sections: [
            {
              id: 'sec-1',
              title: 'Section 1',
              videos: [{ id: 'v1' }],
              blogs: [{ id: 'b1' }],
              codeExplanations: [{ id: 'c1' }],
              mathExplanations: [{ id: 'm1' }],
            },
          ],
        },
      ],
      Purchase: [{ id: 'p-1', userId: 'u1', createdAt: new Date('2026-01-01T00:00:00.000Z') }],
      Enrollment: [
        {
          id: 'e-1',
          userId: 'u2',
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          User: {
            id: 'u2',
            name: 'User Two',
            email: 'u2@test.com',
            createdAt: new Date('2025-12-01T00:00:00.000Z'),
          },
        },
      ],
    });

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/analytics?timeframe=7d'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.analytics).toBeDefined();
    expect(body.studentProgress).toBeDefined();
    expect(body.contentAnalytics).toBeDefined();
    expect(body.analytics.overview.totalStudents).toBe(2);
  });
});
