import { GET } from '@/app/api/courses/[courseId]/learner-analytics/route';
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
  return model as Record<string, jest.Mock>;
}

const userProgress = ensureModel('user_progress', ['findMany', 'count', 'findFirst']);
const studyStreaks = ensureModel('study_streaks', ['findFirst']);
const section = ensureModel('section', ['count']);

describe('GET /api/courses/[courseId]/learner-analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    userProgress.findMany.mockResolvedValue([
      { lastAccessedAt: new Date('2026-02-20'), timeSpent: 600, isCompleted: true },
    ]);
    userProgress.count.mockResolvedValue(1);
    userProgress.findFirst.mockResolvedValue(null);
    studyStreaks.findFirst.mockResolvedValue({ currentStreak: 2, longestStreak: 5, lastStudyDate: new Date() });
    section.count.mockResolvedValue(10);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/learner-analytics'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid params', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses//learner-analytics'),
      { params: Promise.resolve({ courseId: '' }) }
    );

    expect(res.status).toBe(400);
  });

  it('returns learner analytics payload', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/learner-analytics'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.learningStats).toBeDefined();
    expect(body.data.completionVelocity).toBeDefined();
  });
});
