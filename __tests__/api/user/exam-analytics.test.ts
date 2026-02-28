jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET } from '@/app/api/user/exam-analytics/route';
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

const userExamAttempt = ensureModel('userExamAttempt', ['findMany']);

describe('/api/user/exam-analytics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    userExamAttempt.findMany.mockResolvedValue([]);
  });

  it('returns 401 when no current user exists', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/user/exam-analytics');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns empty analytics payload when user has no attempts', async () => {
    const req = new NextRequest('http://localhost:3000/api/user/exam-analytics?period=month');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.summary.totalAttempts).toBe(0);
    expect(body.summary.averageScore).toBe(0);
    expect(body.trends.scoreOverTime).toEqual([]);
    expect(body.recommendations).toEqual([]);
  });

  it('returns aggregated analytics when attempts exist', async () => {
    userExamAttempt.findMany.mockResolvedValueOnce([
      {
        id: 'a1',
        examId: 'exam-1',
        attemptNumber: 1,
        scorePercentage: 60,
        isPassed: false,
        timeSpent: 1200,
        totalQuestions: 10,
        correctAnswers: 6,
        submittedAt: new Date('2026-02-01T09:00:00.000Z'),
        Exam: {
          id: 'exam-1',
          title: 'Arrays Quiz',
          passingScore: 70,
          timeLimit: 30,
          section: {
            title: 'Arrays',
            chapter: {
              title: 'DSA',
              course: { id: 'course-1', title: 'Data Structures' },
            },
          },
        },
        UserAnswer: [
          { isCorrect: true, ExamQuestion: { bloomsLevel: 'REMEMBER' } },
          { isCorrect: false, ExamQuestion: { bloomsLevel: 'APPLY' } },
        ],
      },
      {
        id: 'a2',
        examId: 'exam-1',
        attemptNumber: 2,
        scorePercentage: 80,
        isPassed: true,
        timeSpent: 900,
        totalQuestions: 10,
        correctAnswers: 8,
        submittedAt: new Date('2026-02-03T09:00:00.000Z'),
        Exam: {
          id: 'exam-1',
          title: 'Arrays Quiz',
          passingScore: 70,
          timeLimit: 30,
          section: {
            title: 'Arrays',
            chapter: {
              title: 'DSA',
              course: { id: 'course-1', title: 'Data Structures' },
            },
          },
        },
        UserAnswer: [
          { isCorrect: true, ExamQuestion: { bloomsLevel: 'REMEMBER' } },
          { isCorrect: true, ExamQuestion: { bloomsLevel: 'APPLY' } },
        ],
      },
    ]);

    const req = new NextRequest(
      'http://localhost:3000/api/user/exam-analytics?courseId=course-1&period=month'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.summary.totalAttempts).toBe(2);
    expect(body.summary.passRate).toBe(50);
    expect(body.summary.averageScore).toBe(70);
    expect(body.recentAttempts).toHaveLength(2);
    expect(userExamAttempt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          Exam: expect.objectContaining({
            section: { chapter: { courseId: 'course-1' } },
          }),
        }),
      })
    );
  });
});
