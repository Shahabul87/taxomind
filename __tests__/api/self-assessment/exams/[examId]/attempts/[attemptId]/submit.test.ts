jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

jest.mock('@/lib/adapters', () => ({
  getUserScopedSAMConfig: jest.fn().mockResolvedValue({}),
  getDatabaseAdapter: jest.fn(() => ({})),
}));

jest.mock('@sam-ai/educational', () => ({
  createEvaluationEngine: jest.fn(() => ({
    evaluateAnswer: jest.fn().mockResolvedValue({
      score: 1,
      feedback: 'ok',
      demonstratedBloomsLevel: 'UNDERSTAND',
    }),
  })),
}));

jest.mock('@/lib/adapters/achievement-adapter', () => ({
  getAchievementEngine: jest.fn(() =>
    Promise.resolve({
      trackProgress: jest.fn().mockResolvedValue(undefined),
    })
  ),
}));

jest.mock('@/lib/sam/utils/timeout', () => {
  class MockTimeoutError extends Error {
    operationName: string;
    timeoutMs: number;
    constructor(operationName: string, timeoutMs: number) {
      super('timeout');
      this.operationName = operationName;
      this.timeoutMs = timeoutMs;
    }
  }
  return {
    withRetryableTimeout: jest.fn(async (fn: () => Promise<unknown>) => fn()),
    OperationTimeoutError: MockTimeoutError,
    TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000 },
  };
});

jest.mock('@/lib/sam/ai-provider', () => ({
  handleAIAccessError: jest.fn(() => null),
}));

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/self-assessment/exams/[examId]/attempts/[attemptId]/submit/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

const mockCurrentUser = currentUser as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;
const mockDb = db as Record<string, any>;

const params = {
  params: Promise.resolve({ examId: 'exam-1', attemptId: 'attempt-1' }),
};

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/x', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: 'attempt-1',
    userId: 'user-1',
    examId: 'exam-1',
    status: 'IN_PROGRESS',
    exam: {
      id: 'exam-1',
      passingScore: 70,
      courseId: 'course-1',
      questions: [
        {
          id: 'q1',
          question: '2 + 2 = ?',
          questionType: 'MULTIPLE_CHOICE',
          correctAnswer: '4',
          acceptableVariations: [],
          points: 10,
          bloomsLevel: 'REMEMBER',
        },
      ],
    },
    ...overrides,
  };
}

describe('POST /api/self-assessment/exams/[examId]/attempts/[attemptId]/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.selfAssessmentAttempt = {
      findUnique: jest.fn().mockResolvedValue(makeAttempt()),
      update: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
      findMany: jest.fn().mockResolvedValue([{ scorePercentage: 100 }]),
    };
    mockDb.selfAssessmentAnswer = {
      upsert: jest.fn().mockResolvedValue({}),
    };
    mockDb.selfAssessmentExam = {
      update: jest.fn().mockResolvedValue({ id: 'exam-1' }),
    };
    mockDb.selfAssessmentQuestion = {
      update: jest.fn().mockResolvedValue({ id: 'q1' }),
    };
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: 'too many requests' }, { status: 429 })
    );

    const res = await POST(
      request({
        answers: [{ questionId: 'q1', answer: '4' }],
        timeSpent: 12,
      }),
      params
    );

    expect(res.status).toBe(429);
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await POST(
      request({
        answers: [{ questionId: 'q1', answer: '4' }],
        timeSpent: 12,
      }),
      params
    );

    expect(res.status).toBe(401);
  });

  it('returns 404 when attempt is not found', async () => {
    mockDb.selfAssessmentAttempt.findUnique.mockResolvedValueOnce(null);

    const res = await POST(
      request({
        answers: [{ questionId: 'q1', answer: '4' }],
        timeSpent: 12,
      }),
      params
    );

    expect(res.status).toBe(404);
  });

  it('returns 400 when attempt is already submitted', async () => {
    mockDb.selfAssessmentAttempt.findUnique.mockResolvedValueOnce(
      makeAttempt({ status: 'SUBMITTED' })
    );

    const res = await POST(
      request({
        answers: [{ questionId: 'q1', answer: '4' }],
        timeSpent: 12,
      }),
      params
    );

    expect(res.status).toBe(400);
  });

  it('grades attempt successfully and returns result', async () => {
    const res = await POST(
      request({
        answers: [{ questionId: 'q1', answer: '4' }],
        timeSpent: 12,
      }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.result.status).toBe('GRADED');
    expect(body.result.correctAnswers).toBe(1);
    expect(body.result.scorePercentage).toBe(100);
    expect(mockDb.selfAssessmentAttempt.update).toHaveBeenCalled();
    expect(mockDb.selfAssessmentAnswer.upsert).toHaveBeenCalledTimes(1);
  });
});
