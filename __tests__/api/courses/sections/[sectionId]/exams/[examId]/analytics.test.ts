import { GET } from '@/app/api/courses/sections/[sectionId]/exams/[examId]/analytics/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/courses/sections/[sectionId]/exams/[examId]/analytics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/sections/section-1/exams/exam-1/analytics'),
      { params: Promise.resolve({ sectionId: 'section-1', examId: 'exam-1' }) }
    );

    expect(res.status).toBe(401);
  });

  it('returns 400 when examId is missing', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-1' });

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/sections/section-1/exams//analytics'),
      { params: Promise.resolve({ sectionId: 'section-1', examId: '' }) }
    );

    expect(res.status).toBe(400);
  });

  it('returns empty analytics when no attempts exist', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-1' });
    (db.userExamAttempt.findMany as jest.Mock).mockResolvedValueOnce([]);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/sections/section-1/exams/exam-1/analytics'),
      { params: Promise.resolve({ sectionId: 'section-1', examId: 'exam-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.attempts).toEqual([]);
    expect(body.summary).toBeNull();
    expect(body.trends).toBeNull();
    expect(body.questionAnalysis).toBeNull();
  });

  it('returns attempt trends and summary', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-1' });
    (db.userExamAttempt.findMany as jest.Mock).mockResolvedValueOnce([
      {
        attemptNumber: 1,
        scorePercentage: 60,
        isPassed: false,
        timeSpent: 1200,
        correctAnswers: 6,
        totalQuestions: 10,
        submittedAt: new Date('2026-02-01T10:00:00.000Z'),
        UserAnswer: [
          {
            isCorrect: false,
            timeSpent: 180,
            pointsEarned: 0,
            ExamQuestion: {
              id: 'q-1',
              question: 'Question 1',
              questionType: 'MULTIPLE_CHOICE',
              points: 1,
              order: 1,
            },
          },
        ],
        ExamAnalytics: null,
        Exam: {
          id: 'exam-1',
          title: 'Exam 1',
          description: null,
          passingScore: 70,
          timeLimit: 30,
        },
      },
      {
        attemptNumber: 2,
        scorePercentage: 78,
        isPassed: true,
        timeSpent: 1100,
        correctAnswers: 8,
        totalQuestions: 10,
        submittedAt: new Date('2026-02-02T10:00:00.000Z'),
        UserAnswer: [
          {
            isCorrect: true,
            timeSpent: 140,
            pointsEarned: 1,
            ExamQuestion: {
              id: 'q-1',
              question: 'Question 1',
              questionType: 'MULTIPLE_CHOICE',
              points: 1,
              order: 1,
            },
          },
        ],
        ExamAnalytics: null,
        Exam: {
          id: 'exam-1',
          title: 'Exam 1',
          description: null,
          passingScore: 70,
          timeLimit: 30,
        },
      },
    ]);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/sections/section-1/exams/exam-1/analytics'),
      { params: Promise.resolve({ sectionId: 'section-1', examId: 'exam-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.attempts).toHaveLength(2);
    expect(body.summary.totalAttempts).toBe(2);
    expect(body.summary.latestScore).toBe(78);
    expect(body.summary.bestScore).toBe(78);
    expect(Array.isArray(body.questionAnalysis.difficult)).toBe(true);
    expect(Array.isArray(body.recommendations)).toBe(true);
  });
});
