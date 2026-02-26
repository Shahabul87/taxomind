jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/analytics/dashboard/route';
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
const learningMetrics = ensureModel('learning_metrics', ['aggregate', 'findFirst', 'groupBy']);
const enrollment = ensureModel('enrollment', ['count', 'findUnique', 'findMany']);
const realtimeActivities = ensureModel('realtime_activities', ['findMany', 'groupBy']);
const userAchievements = ensureModel('user_achievements', ['findMany']);
const studyStreaks = ensureModel('study_streaks', ['findFirst']);
const learningPathEnrollment = ensureModel('learningPathEnrollment', ['findMany']);
const userProgress = ensureModel('user_progress', ['count', 'aggregate', 'groupBy']);
const section = ensureModel('section', ['count', 'findMany']);

describe('GET /api/analytics/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });

    learningMetrics.aggregate.mockResolvedValue({
      _sum: { totalStudyTime: 120, totalSessions: 4 },
      _avg: { overallProgress: 55 },
    });
    learningMetrics.findFirst.mockResolvedValue({
      learningVelocity: 0.9,
      strugglingAreas: ['arrays'],
      averageSessionDuration: 20,
      riskScore: 0.1,
    });
    learningMetrics.groupBy.mockResolvedValue([]);

    enrollment.count.mockResolvedValue(2);
    enrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
    enrollment.findMany.mockResolvedValue([]);

    realtimeActivities.findMany.mockResolvedValue([]);
    realtimeActivities.groupBy.mockResolvedValue([]);

    userAchievements.findMany.mockResolvedValue([]);
    studyStreaks.findFirst.mockResolvedValue({ currentStreak: 3 });
    learningPathEnrollment.findMany.mockResolvedValue([]);
    userProgress.count.mockResolvedValue(0);
    userProgress.aggregate.mockResolvedValue({ _avg: { progressPercent: 0 } });
    userProgress.groupBy.mockResolvedValue([]);
    section.count.mockResolvedValue(0);
    section.findMany.mockResolvedValue([]);
    course.findUnique.mockResolvedValue({ id: 'course-1', userId: 'user-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/dashboard');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid view parameter', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/dashboard?view=bad-view');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid view parameter');
  });

  it('returns student dashboard data by default', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/dashboard?view=student');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.overview).toMatchObject({
      totalLearningTime: 120,
      coursesEnrolled: 2,
      currentStreak: 3,
    });
    expect(Array.isArray(body.recentActivity)).toBe(true);
    expect(Array.isArray(body.recommendations)).toBe(true);
  });

  it('returns 400 when teacher view is missing courseId', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/dashboard?view=teacher');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('courseId required for teacher view');
  });

  it('returns 403 for teacher view when course ownership fails', async () => {
    course.findUnique.mockResolvedValueOnce(null);
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/dashboard?view=teacher&courseId=course-1'
    );
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('returns teacher dashboard data for owned course', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER' });
    course.findUnique.mockResolvedValueOnce({ id: 'course-1', userId: 'teacher-1' });
    enrollment.count.mockResolvedValueOnce(10); // course overview enrollments
    realtimeActivities.findMany
      .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }]) // active students distinct
      .mockResolvedValueOnce([]); // engagement trends
    userProgress.count.mockResolvedValueOnce(4); // completions
    userProgress.aggregate.mockResolvedValueOnce({ _avg: { progressPercent: 40 } });
    enrollment.findMany.mockResolvedValueOnce([]); // at-risk students path
    learningMetrics.groupBy.mockResolvedValueOnce([]); // student performance

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/dashboard?view=teacher&courseId=course-1&timeframe=7d'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.overview.totalEnrollments).toBe(10);
    expect(Array.isArray(body.studentPerformance)).toBe(true);
    expect(Array.isArray(body.contentAnalytics)).toBe(true);
    expect(Array.isArray(body.insights)).toBe(true);
  });

  it('returns 500 on unexpected errors', async () => {
    learningMetrics.aggregate.mockRejectedValueOnce(new Error('db fail'));
    const req = new NextRequest('http://localhost:3000/api/analytics/dashboard?view=student');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch dashboard data');
  });
});
