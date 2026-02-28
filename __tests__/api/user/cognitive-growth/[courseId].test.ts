jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET } from '@/app/api/user/cognitive-growth/[courseId]/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

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
const enrollment = ensureModel('enrollment', ['findFirst']);
const userCognitiveProfile = ensureModel('userCognitiveProfile', ['findUnique', 'create']);
const userCourseGrowth = ensureModel('userCourseGrowth', ['findUnique', 'create']);
const studentBloomsProgress = ensureModel('studentBloomsProgress', ['findFirst']);
const userExamAttempt = ensureModel('userExamAttempt', ['count', 'findMany']);
const userProgress = ensureModel('user_progress', ['count', 'findFirst']);

describe('/api/user/cognitive-growth/[courseId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    course.findUnique.mockResolvedValue({ id: 'course-1', title: 'Algorithms' });
    enrollment.findFirst.mockResolvedValue({ id: 'enroll-1' });

    userCognitiveProfile.findUnique.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      overallLevel: 2,
      levelName: 'UNDERSTANDER',
      rememberScore: 60,
      understandScore: 55,
      applyScore: 40,
      analyzeScore: 35,
      evaluateScore: 30,
      createScore: 20,
    });

    userCourseGrowth.findUnique.mockResolvedValue({
      userId: 'user-1',
      courseId: 'course-1',
      startingLevel: 1.5,
      currentLevel: 2.4,
      levelGrowth: 0.9,
      startingDistribution: {
        remember: 40,
        understand: 35,
        apply: 20,
        analyze: 10,
        evaluate: 5,
        create: 0,
      },
      currentDistribution: {
        remember: 60,
        understand: 55,
        apply: 40,
        analyze: 35,
        evaluate: 30,
        create: 20,
      },
      activitiesCompleted: 0,
      assessmentsTaken: 0,
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      lastUpdatedAt: new Date('2026-02-01T00:00:00.000Z'),
      completedAt: null,
    });

    studentBloomsProgress.findFirst.mockResolvedValue(null);
    userExamAttempt.count.mockResolvedValue(2);
    userExamAttempt.findMany.mockResolvedValue([
      { score: 80, maxScore: 100 },
      { score: 45, maxScore: 50 },
    ]);
    userProgress.count.mockResolvedValue(5);
    userProgress.findFirst.mockResolvedValue(null);
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/user/cognitive-growth/course-1');
    const res = await GET(req, { params: Promise.resolve({ courseId: 'course-1' }) });

    expect(res.status).toBe(401);
  });

  it('returns 400 when courseId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/user/cognitive-growth/');
    const res = await GET(req, { params: Promise.resolve({ courseId: '' }) });

    expect(res.status).toBe(400);
  });

  it('returns 404 when course does not exist', async () => {
    course.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/user/cognitive-growth/missing-course');
    const res = await GET(req, { params: Promise.resolve({ courseId: 'missing-course' }) });

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not enrolled in course', async () => {
    enrollment.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/user/cognitive-growth/course-1');
    const res = await GET(req, { params: Promise.resolve({ courseId: 'course-1' }) });

    expect(res.status).toBe(403);
  });

  it('returns course growth analytics for enrolled user', async () => {
    const req = new NextRequest('http://localhost:3000/api/user/cognitive-growth/course-1', {
      headers: { 'x-request-id': 'req-1' },
    });
    const res = await GET(req, { params: Promise.resolve({ courseId: 'course-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.courseId).toBe('course-1');
    expect(body.data.courseTitle).toBe('Algorithms');
    expect(body.data.assessmentsTaken).toBe(2);
    expect(body.data.activitiesCompleted).toBe(5);
    expect(body.data.averageScore).toBe(85);
    expect(body.data.isCompleted).toBe(false);
    expect(body.data.topImprovements.length).toBeGreaterThan(0);
    expect(body.metadata.requestId).toBe('req-1');
  });
});
