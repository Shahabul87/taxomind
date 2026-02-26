import { GET } from '@/app/api/courses/[courseId]/similar/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('GET /api/courses/[courseId]/similar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when current course is missing', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/similar'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(404);
  });

  it('returns similar courses and fills with additional courses', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce({
      categoryId: 'cat-1',
      difficulty: 'BEGINNER',
      price: 10,
    });

    (db.course.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 'c-2', title: 'Similar 1' }])
      .mockResolvedValueOnce([{ id: 'c-3', title: 'Additional 1' }]);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/similar?limit=2'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.count).toBe(2);
    expect(db.course.findMany).toHaveBeenCalledTimes(2);
  });

  it('returns 500 on unexpected error', async () => {
    (db.course.findUnique as jest.Mock).mockRejectedValueOnce(new Error('db down'));

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/similar'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(500);
  });
});
