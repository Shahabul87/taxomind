jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/analytics/real-time/activities/route';
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

const course = ensureModel('course', ['findUnique']);
const userProgress = ensureModel('user_progress', ['findMany']);
const learningMetrics = ensureModel('learning_metrics', ['findFirst']);
const enrollment = ensureModel('enrollment', ['findFirst']);

describe('/api/analytics/real-time/activities route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });

    course.findUnique.mockResolvedValue({ id: 'course-1', userId: 'teacher-1' });
    userProgress.findMany.mockResolvedValue([
      {
        userId: 'student-1',
        courseId: 'course-1',
        progressPercent: 50,
        timeSpent: 12,
        lastAccessedAt: new Date(),
        timestamp: new Date(),
        eventName: 'section_view',
        metadata: {},
        sessionId: 's-1',
        section: { title: 'Intro' },
        User: { id: 'student-1', name: 'Student 1', email: 's1@test.com' },
        Course: { id: 'course-1', title: 'Course 1' },
        Section: { id: 'sec-1', title: 'Intro' },
      },
    ]);
    learningMetrics.findFirst.mockResolvedValue({ engagementTrend: 'UP' });
    enrollment.findFirst.mockResolvedValue({ id: 'enr-1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/real-time/activities');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns 403 when course ownership check fails', async () => {
    course.findUnique.mockResolvedValueOnce(null);
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/real-time/activities?courseId=course-1'
    );
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('GET returns processed activity data', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/real-time/activities?courseId=course-1'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.activities)).toBe(true);
    expect(body.activities[0]).toMatchObject({
      studentId: 'student-1',
      courseId: 'course-1',
      progress: 50,
    });
  });

  it('POST handles supported actions and invalid actions', async () => {
    const validReq = new NextRequest('http://localhost:3000/api/analytics/real-time/activities', {
      method: 'POST',
      body: JSON.stringify({
        action: 'flag_struggling',
        studentId: 'student-1',
        data: { teacherId: 'teacher-1', reason: 'Low score', courseId: 'course-1' },
      }),
    });
    const validRes = await POST(validReq);
    expect(validRes.status).toBe(200);

    const invalidReq = new NextRequest('http://localhost:3000/api/analytics/real-time/activities', {
      method: 'POST',
      body: JSON.stringify({ action: 'unknown', studentId: 'student-1', data: {} }),
    });
    const invalidRes = await POST(invalidReq);
    expect(invalidRes.status).toBe(400);
  });
});
