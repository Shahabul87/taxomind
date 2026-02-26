import { GET } from '@/app/api/analytics/unified/route';
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

const enrollment = ensureModel('enrollment', ['findMany']);
const userProgress = ensureModel('user_progress', ['findMany']);
const userExamAttempt = ensureModel('userExamAttempt', ['findMany']);
const course = ensureModel('course', ['findMany']);

describe('GET /api/analytics/unified', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    enrollment.findMany.mockResolvedValue([
      {
        courseId: 'course-1',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
        Course: { id: 'course-1', title: 'Course 1', imageUrl: 'img.png' },
      },
    ]);

    userProgress.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        courseId: 'course-1',
        timeSpent: 120,
        isCompleted: true,
        currentStreak: 5,
        progressPercent: 100,
        lastAccessedAt: new Date('2026-02-20T10:00:00.000Z'),
        Course: { id: 'course-1', title: 'Course 1' },
        Section: { id: 'sec-1', title: 'Section 1' },
      },
    ]);

    userExamAttempt.findMany.mockResolvedValue([
      {
        examId: 'exam-1',
        scorePercentage: 90,
        isPassed: true,
        submittedAt: new Date('2026-02-19T10:00:00.000Z'),
        createdAt: new Date('2026-02-19T10:00:00.000Z'),
        Exam: { id: 'exam-1', title: 'Exam 1' },
      },
    ]);

    course.findMany.mockResolvedValue([
      {
        id: 'course-1',
        title: 'Course 1',
        isPublished: true,
        Enrollment: [
          { userId: 'u1', createdAt: new Date('2026-02-01T00:00:00.000Z') },
          { userId: 'u2', createdAt: new Date('2026-02-02T00:00:00.000Z') },
        ],
        reviews: [{ rating: 4 }, { rating: 5 }],
        chapters: [],
        courseCompletionAnalytics: [],
      },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/unified');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns unified learner+creator analytics', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/unified?view=all&timeRange=month');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.analytics.summary.isLearner).toBe(true);
    expect(body.analytics.summary.isCreator).toBe(true);
    expect(body.analytics.learner.overview.totalCoursesEnrolled).toBe(1);
    expect(body.analytics.creator.overview.totalCourses).toBe(1);
  });

  it('returns 400 for invalid query params', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/unified?view=invalid');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 on unexpected errors', async () => {
    enrollment.findMany.mockRejectedValueOnce(new Error('db fail'));
    const req = new NextRequest('http://localhost:3000/api/analytics/unified?view=learner');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch analytics');
  });
});
