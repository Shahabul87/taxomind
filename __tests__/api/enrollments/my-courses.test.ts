import { GET } from '@/app/api/enrollments/my-courses/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/enrollments/my-courses route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.enrollment.findMany as jest.Mock).mockResolvedValue([
      { Course: { id: 'c1', title: 'Course 1' } },
      { Course: null },
      { Course: { id: 'c2', title: 'Course 2' } },
    ]);
  });

  it('returns unauthorized error structure when not authenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/enrollments/my-courses');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns flattened enrolled courses list', async () => {
    const req = new NextRequest('http://localhost:3000/api/enrollments/my-courses');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].id).toBe('c1');
  });
});
