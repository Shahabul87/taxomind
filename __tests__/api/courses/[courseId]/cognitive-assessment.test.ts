import { GET } from '@/app/api/courses/[courseId]/cognitive-assessment/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('GET /api/courses/[courseId]/cognitive-assessment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'admin-1' });
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'admin-1',
      chapters: [],
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/cognitive-assessment'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/cognitive-assessment'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(403);
  });

  it('returns 404 when course is not found', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/cognitive-assessment'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(404);
  });

  it('returns cognitive assessment data', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/cognitive-assessment'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.courseId).toBe('course-1');
    expect(body.overallHealth).toBeDefined();
    expect(Array.isArray(body.recommendations)).toBe(true);
  });
});
