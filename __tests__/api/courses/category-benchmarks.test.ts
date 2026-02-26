/**
 * Tests for Category Benchmarks Route - app/api/courses/category-benchmarks/route.ts
 */

import { GET } from '@/app/api/courses/category-benchmarks/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

function req(url: string) {
  return new Request(url, { method: 'GET' });
}

describe('GET /api/courses/category-benchmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(req('http://localhost:3000/api/courses/category-benchmarks?courseId=course-1') as never);
    expect(res.status).toBe(401);
  });

  it('returns 400 when query params are missing', async () => {
    const res = await GET(req('http://localhost:3000/api/courses/category-benchmarks') as never);
    expect(res.status).toBe(400);
  });

  it('returns 404 when course is not found', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(req('http://localhost:3000/api/courses/category-benchmarks?courseId=missing') as never);
    expect(res.status).toBe(404);
  });

  it('returns 400 when course has no category', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'course-1', categoryId: null });

    const res = await GET(req('http://localhost:3000/api/courses/category-benchmarks?courseId=course-1') as never);
    expect(res.status).toBe(400);
  });

  it('returns benchmark data successfully', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      categoryId: 'cat-1',
      cognitiveQuality: { cognitiveScore: 82, cognitiveGrade: 'A' },
    });
    (db.course.findMany as jest.Mock).mockResolvedValue([
      { cognitiveQuality: { cognitiveScore: 90, cognitiveGrade: 'A+', applyPercent: 30, analyzePercent: 20, createPercent: 15 } },
      { cognitiveQuality: { cognitiveScore: 82, cognitiveGrade: 'A', applyPercent: 25, analyzePercent: 18, createPercent: 12 } },
      { cognitiveQuality: { cognitiveScore: 74, cognitiveGrade: 'B', applyPercent: 20, analyzePercent: 16, createPercent: 10 } },
    ]);
    (db.category.findUnique as jest.Mock).mockResolvedValue({ name: 'Programming' });

    const res = await GET(req('http://localhost:3000/api/courses/category-benchmarks?courseId=course-1') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.categoryName).toBe('Programming');
    expect(body.data.categoryStats.totalCourses).toBe(3);
  });
});
