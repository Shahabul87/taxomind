import { GET } from '@/app/api/analytics/learning/route';
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

const userProgress = ensureModel('user_progress', ['findMany']);

describe('GET /api/analytics/learning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    userProgress.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        courseId: 'course-1',
        progressPercent: 100,
        timeSpent: 60,
        isCompleted: true,
        averageScore: 85,
        currentStreak: 4,
        lastAccessedAt: new Date('2026-02-20T10:00:00.000Z'),
        Section: {
          id: 'sec-1',
          title: 'Section 1',
          chapter: { id: 'ch-1', title: 'Chapter 1' },
        },
        Course: { id: 'course-1', title: 'Course 1' },
      },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/learning');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns learning analytics payload', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/learning?courseId=course-1&timeRange=week'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.analytics.userId).toBe('user-1');
    expect(body.analytics.totalTimeSpent).toBe(60);
    expect(body.analytics.overallProgress).toBe(100);
    expect(Array.isArray(body.analytics.weeklyActivity)).toBe(true);
    expect(Array.isArray(body.analytics.sectionProgress)).toBe(true);
  });

  it('returns 400 for invalid query params', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/learning?timeRange=invalid');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 on unexpected errors', async () => {
    userProgress.findMany.mockRejectedValueOnce(new Error('db fail'));
    const req = new NextRequest('http://localhost:3000/api/analytics/learning');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch learning analytics');
  });
});
