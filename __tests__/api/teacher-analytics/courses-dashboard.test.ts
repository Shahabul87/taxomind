import { GET } from '@/app/api/teacher-analytics/courses-dashboard/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const course = ensureModel('course', ['findMany']);
const purchase = ensureModel('purchase', ['findMany']);
const courseReview = ensureModel('courseReview', ['findMany']);

describe('/api/teacher-analytics/courses-dashboard route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });

    course.findMany.mockResolvedValue([
      {
        id: 'course-1',
        title: 'Algorithms',
        price: 100,
        category: { name: 'Computer Science' },
        _count: { Purchase: 2, chapters: 3, reviews: 1 },
        Purchase: [{ createdAt: new Date('2026-02-01T00:00:00.000Z'), userId: 'student-1' }],
        reviews: [{ rating: 4.5, createdAt: new Date('2026-02-01T00:00:00.000Z') }],
      },
    ]);

    purchase.findMany
      .mockResolvedValueOnce([
        {
          id: 'p-chart-1',
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          courseId: 'course-1',
          Course: { price: 100 },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'p-activity-1',
          createdAt: new Date('2026-02-02T00:00:00.000Z'),
          courseId: 'course-1',
          Course: { title: 'Algorithms' },
        },
      ]);

    courseReview.findMany.mockResolvedValue([]);
  });

  it('returns 401 when teacher is unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/teacher-analytics/courses-dashboard');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns analytics payload for authenticated teacher', async () => {
    const req = new NextRequest('http://localhost:3000/api/teacher-analytics/courses-dashboard');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.analytics.revenue.total).toBe(200);
    expect(Array.isArray(body.data.recentActivity)).toBe(true);
    expect(body.data.performanceIndicators).toHaveLength(3);
  });
});
