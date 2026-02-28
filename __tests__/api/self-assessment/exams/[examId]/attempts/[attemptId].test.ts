jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/self-assessment/exams/[examId]/attempts/[attemptId]/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

const params = {
  params: Promise.resolve({ examId: 'exam-1', attemptId: 'attempt-1' }),
};

function attempt(status = 'IN_PROGRESS') {
  return {
    id: 'attempt-1',
    examId: 'exam-1',
    userId: 'user-1',
    status,
    attemptNumber: 1,
    startedAt: new Date('2026-01-01T00:00:00Z'),
    submittedAt: null,
    timeSpent: 0,
    totalQuestions: 1,
    correctAnswers: null,
    totalPoints: 10,
    earnedPoints: null,
    scorePercentage: null,
    isPassed: null,
    bloomsBreakdown: null,
    cognitiveProfile: null,
    learningRecommendations: null,
    exam: {
      id: 'exam-1',
      title: 'Exam',
      description: 'desc',
      passingScore: 70,
      timeLimit: 60,
      showResults: true,
      questions: [
        {
          id: 'q1',
          question: '2+2?',
          questionType: 'MULTIPLE_CHOICE',
          options: [],
          points: 10,
          bloomsLevel: 'REMEMBER',
          difficulty: 'EASY',
          hint: null,
          order: 1,
          correctAnswer: '4',
          explanation: 'math',
        },
      ],
    },
    answers: [
      {
        questionId: 'q1',
        answer: '4',
        isCorrect: true,
        pointsEarned: 10,
        feedback: 'ok',
        aiEvaluation: null,
      },
    ],
  };
}

describe('GET/PUT /api/self-assessment/exams/[examId]/attempts/[attemptId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.selfAssessmentAttempt = {
      findUnique: jest.fn().mockResolvedValue(attempt()),
      update: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
    };
    mockDb.selfAssessmentAnswer = {
      upsert: jest.fn().mockResolvedValue({}),
    };
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    expect(res.status).toBe(401);
  });

  it('GET returns 400 when attempt does not match exam', async () => {
    mockDb.selfAssessmentAttempt.findUnique.mockResolvedValueOnce({
      ...attempt(),
      examId: 'exam-other',
    });

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('does not match exam');
  });

  it('PUT blocks non in-progress attempts', async () => {
    mockDb.selfAssessmentAttempt.findUnique.mockResolvedValueOnce({
      id: 'attempt-1',
      userId: 'user-1',
      examId: 'exam-1',
      status: 'SUBMITTED',
    });

    const res = await PUT(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers: [{ questionId: 'q1', answer: '4' }],
          timeSpent: 10,
        }),
      }),
      params
    );

    expect(res.status).toBe(400);
  });

  it('PUT saves answers and time for in-progress attempts', async () => {
    const res = await PUT(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers: [{ questionId: 'q1', answer: '4' }],
          timeSpent: 60,
        }),
      }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.selfAssessmentAnswer.upsert).toHaveBeenCalledTimes(1);
    expect(mockDb.selfAssessmentAttempt.update).toHaveBeenCalledWith({
      where: { id: 'attempt-1' },
      data: { timeSpent: 60 },
    });
  });
});
