import { GET, POST } from '@/app/api/courses/[courseId]/streak/route';
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

const studyStreaks = ensureModel('study_streaks', ['findFirst', 'create', 'update']);
const userProgress = ensureModel('user_progress', ['findMany', 'findFirst', 'aggregate']);

describe('/api/courses/[courseId]/streak', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    userProgress.findMany.mockResolvedValue([]);
    userProgress.findFirst.mockResolvedValue(null);
    userProgress.aggregate.mockResolvedValue({ _sum: { timeSpent: 1200 } });
    studyStreaks.findFirst.mockResolvedValue(null);
    studyStreaks.create.mockResolvedValue({
      id: 's-1',
      currentStreak: 1,
      longestStreak: 1,
      lastStudyDate: new Date(),
      streakStart: new Date(),
      weeklyGoalMinutes: 120,
      weeklyActualMinutes: 0,
      updatedAt: new Date(),
    });
    studyStreaks.update.mockResolvedValue({
      id: 's-1',
      currentStreak: 2,
      longestStreak: 2,
      lastStudyDate: new Date(),
      streakStart: new Date(),
      weeklyGoalMinutes: 120,
      weeklyActualMinutes: 30,
      updatedAt: new Date(),
    });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/streak'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(401);
  });

  it('GET returns streak payload', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/streak'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.currentStreak).toBeGreaterThanOrEqual(0);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await POST(
      new NextRequest('http://localhost:3000/api/courses/course-1/streak', {
        method: 'POST',
        body: JSON.stringify({ minutesStudied: 25 }),
      }),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(401);
  });

  it('POST records activity and returns updated streak', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/courses/course-1/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutesStudied: 25 }),
      }),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
