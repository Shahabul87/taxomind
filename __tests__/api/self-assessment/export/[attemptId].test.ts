jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/self-assessment/export/[attemptId]/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

const params = { params: Promise.resolve({ attemptId: 'attempt-1' }) };

function makeAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: 'attempt-1',
    userId: 'user-1',
    examId: 'exam-1',
    attemptNumber: 1,
    status: 'GRADED',
    startedAt: new Date('2026-01-01T10:00:00Z'),
    submittedAt: new Date('2026-01-01T10:10:00Z'),
    timeSpent: 600,
    scorePercentage: 80,
    isPassed: true,
    earnedPoints: 8,
    totalPoints: 10,
    totalQuestions: 1,
    bloomsBreakdown: {
      REMEMBER: { questionsCount: 1, correctCount: 1, scorePercentage: 100 },
    },
    cognitiveProfile: {
      overallMastery: 80,
      strengths: ['REMEMBER'],
      weaknesses: [],
      recommendedFocus: [],
    },
    learningRecommendations: [
      { type: 'practice', title: 'Keep practicing', description: 'Review', priority: 'MEDIUM' },
    ],
    aiEvaluationSummary: { model: 'test' },
    answers: [
      {
        answer: 'A',
        isCorrect: true,
        pointsEarned: 8,
        feedback: 'Good',
        demonstratedLevel: 'REMEMBER',
        timeSpent: 10,
        question: {
          id: 'q1',
          question: 'Question 1',
          questionType: 'MULTIPLE_CHOICE',
          correctAnswer: 'A',
          bloomsLevel: 'REMEMBER',
          difficulty: 'EASY',
          points: 10,
          explanation: 'Because',
          order: 1,
        },
      },
    ],
    exam: {
      id: 'exam-1',
      title: 'Exam One',
      description: 'desc',
      topic: 'topic',
      subtopics: ['a'],
      passingScore: 70,
      timeLimit: 60,
      totalQuestions: 1,
      totalPoints: 10,
      targetBloomsDistribution: {},
    },
    ...overrides,
  };
}

describe('GET /api/self-assessment/export/[attemptId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.selfAssessmentAttempt = {
      findUnique: jest.fn().mockResolvedValue(makeAttempt()),
    };
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/self-assessment/export/attempt-1');

    const res = await GET(req, params);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid format query', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/self-assessment/export/attempt-1?format=xml'
    );

    const res = await GET(req, params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid parameters');
  });

  it('returns 404 when attempt does not exist', async () => {
    mockDb.selfAssessmentAttempt.findUnique.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/self-assessment/export/attempt-1');

    const res = await GET(req, params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Attempt not found');
  });

  it('returns 403 when attempt belongs to another user', async () => {
    mockDb.selfAssessmentAttempt.findUnique.mockResolvedValueOnce(
      makeAttempt({ userId: 'other-user' })
    );
    const req = new NextRequest('http://localhost:3000/api/self-assessment/export/attempt-1');

    const res = await GET(req, params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Access denied');
  });

  it('returns JSON export payload for a graded attempt', async () => {
    const req = new NextRequest('http://localhost:3000/api/self-assessment/export/attempt-1');

    const res = await GET(req, params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.exam.id).toBe('exam-1');
    expect(body.score.scorePercentage).toBe(80);
    expect(body.questionPerformance).toHaveLength(1);
  });
});
