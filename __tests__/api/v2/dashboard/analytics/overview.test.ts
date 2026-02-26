import { GET } from '@/app/api/v2/dashboard/analytics/overview/route';
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

const learningActivity = ensureModel('learningActivity', ['aggregate', 'findMany']);
const enrollment = ensureModel('enrollment', ['findMany']);
const userProgress = ensureModel('user_progress', ['findMany']);
const selfAssessmentAttempt = ensureModel('selfAssessmentAttempt', ['findMany']);
const learningStreak = ensureModel('learningStreak', ['findUnique']);
const samInteraction = ensureModel('sAMInteraction', ['count']);
const samRecommendation = ensureModel('sAMRecommendation', ['count']);
const samLearningGoal = ensureModel('sAMLearningGoal', ['count']);

function req(query = '') {
  return new NextRequest(
    `http://localhost:3000/api/v2/dashboard/analytics/overview${query ? `?${query}` : ''}`
  );
}

describe('GET /api/v2/dashboard/analytics/overview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    learningActivity.aggregate.mockResolvedValue({
      _sum: { actualDuration: null, estimatedDuration: 180 },
    });
    learningActivity.findMany
      .mockResolvedValueOnce([
        { createdAt: new Date('2026-02-20T10:00:00.000Z'), actualDuration: 60, estimatedDuration: null },
        { createdAt: new Date('2026-02-21T10:00:00.000Z'), actualDuration: null, estimatedDuration: 120 },
      ])
      .mockResolvedValueOnce([
        { createdAt: new Date('2026-02-20T10:00:00.000Z'), type: 'VIDEO' },
        { createdAt: new Date('2026-02-20T12:00:00.000Z'), type: 'QUIZ' },
        { createdAt: new Date('2026-02-21T10:00:00.000Z'), type: 'VIDEO' },
      ]);

    enrollment.findMany.mockResolvedValue([
      {
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
        updatedAt: new Date('2026-02-22T00:00:00.000Z'),
        Course: {
          id: 'course-1',
          title: 'Course 1',
          imageUrl: 'img.png',
          chapters: [{ sections: [{ id: 's1' }, { id: 's2' }] }, { sections: [{ id: 's3' }] }],
        },
      },
    ]);
    userProgress.findMany.mockResolvedValue([
      { sectionId: 's1', courseId: 'course-1' },
      { sectionId: 's2', courseId: 'course-1' },
    ]);
    selfAssessmentAttempt.findMany.mockResolvedValue([
      {
        scorePercentage: 80,
        totalQuestions: 10,
        correctAnswers: 8,
        createdAt: new Date('2026-02-21T00:00:00.000Z'),
      },
      {
        scorePercentage: 60,
        totalQuestions: 10,
        correctAnswers: 6,
        createdAt: new Date('2026-02-22T00:00:00.000Z'),
      },
    ]);
    learningStreak.findUnique.mockResolvedValue({ currentStreak: 5, longestStreak: 10 });
    samInteraction.count.mockResolvedValue(7);
    samRecommendation.count.mockResolvedValue(4);
    samLearningGoal.count.mockResolvedValue(3);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns analytics overview data', async () => {
    const res = await GET(req('timeRange=7d&courseId=course-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.timeRange).toBe('7d');
    expect(body.data.studyTime.totalMinutes).toBe(180);
    expect(body.data.courseProgress[0].progress).toBe(67);
    expect(body.data.performance).toMatchObject({
      examAttempts: 2,
      avgScore: 70,
      accuracy: 70,
      currentStreak: 5,
      longestStreak: 10,
    });
    expect(body.data.samInsights).toMatchObject({
      recentInteractions: 7,
      pendingRecommendations: 4,
      activeGoals: 3,
    });
    expect(Array.isArray(body.data.heatmap)).toBe(true);
  });

  it('returns 400 for invalid query', async () => {
    const res = await GET(req('timeRange=invalid'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid query parameters');
  });

  it('returns fallback values when a helper query fails', async () => {
    learningActivity.aggregate.mockRejectedValueOnce(new Error('boom'));
    learningActivity.findMany.mockReset();
    learningActivity.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.studyTime).toMatchObject({
      totalMinutes: 0,
      totalHours: 0,
      avgMinutesPerDay: 0,
    });
  });

  it('returns 500 on unexpected top-level errors', async () => {
    mockAuth.mockRejectedValueOnce(new Error('auth failed'));

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch analytics overview');
  });
});
