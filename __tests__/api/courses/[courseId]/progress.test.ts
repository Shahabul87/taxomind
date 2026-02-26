import { GET, PUT } from '@/app/api/courses/[courseId]/progress/route';
import { currentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('api/courses/[courseId]/progress route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/progress'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(401);
  });

  it('PUT returns 501 for authenticated users (not implemented)', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-1' });

    const res = await PUT(
      new NextRequest('http://localhost:3000/api/courses/course-1/progress', { method: 'PUT' }),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(501);
    expect(body.error).toContain('not yet implemented');
  });
});
