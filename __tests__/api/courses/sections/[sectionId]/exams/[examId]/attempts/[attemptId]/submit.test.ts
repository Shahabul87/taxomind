/**
 * Tests for Exam Submit Route - app/api/courses/sections/[sectionId]/exams/[examId]/attempts/[attemptId]/submit/route.ts
 *
 * Covers: POST (auth, validation, attempt lookup, already submitted, objective grading, transaction, scoring)
 */

// Mock external SAM/AI dependencies before imports
jest.mock('@sam-ai/educational', () => ({
  createEvaluationEngine: jest.fn(() => ({
    evaluateAnswer: jest.fn(),
  })),
  createUnifiedBloomsEngine: jest.fn(() => ({
    updateCognitiveProgress: jest.fn(),
  })),
}));

jest.mock('@sam-ai/safety', () => ({
  wrapEvaluationWithSafety: jest.fn(),
}));

jest.mock('@/lib/adapters', () => ({
  getUserScopedSAMConfig: jest.fn(() => Promise.resolve({ provider: 'mock' })),
  getDatabaseAdapter: jest.fn(() => ({})),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn((fn: () => Promise<unknown>) => fn()),
  OperationTimeoutError: class OperationTimeoutError extends Error {
    operationName: string;
    timeoutMs: number;
    constructor(op: string, ms: number) {
      super(`Timeout: ${op}`);
      this.operationName = op;
      this.timeoutMs = ms;
    }
  },
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000 },
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  handleAIAccessError: jest.fn(() => null),
}));

jest.mock('@/lib/database/query-optimizer', () => ({
  QueryPerformanceMonitor: {
    startQuery: jest.fn(() => jest.fn()),
  },
}));

jest.mock('@/lib/sam/progress-recorder', () => ({
  recordExamProgress: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/adapters/achievement-adapter', () => ({
  getAchievementEngine: jest.fn(() => Promise.resolve({
    trackProgress: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock('@prisma/client', () => ({
  BloomsLevel: {
    REMEMBER: 'REMEMBER',
    UNDERSTAND: 'UNDERSTAND',
    APPLY: 'APPLY',
    ANALYZE: 'ANALYZE',
    EVALUATE: 'EVALUATE',
    CREATE: 'CREATE',
  },
  EvaluationType: {
    AUTO_GRADED: 'AUTO_GRADED',
    AI_EVALUATED: 'AI_EVALUATED',
    MANUAL: 'MANUAL',
  },
  Prisma: {
    JsonNull: 'DbNull',
    InputJsonValue: {},
  },
}));

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked

import { POST } from '@/app/api/courses/sections/[sectionId]/exams/[examId]/attempts/[attemptId]/submit/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

const mockCurrentUser = currentUser as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;

// Add models not in global mock
for (const model of ['userExamAttempt', 'userAnswer', 'enhancedAnswer', 'aIEvaluationRecord']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = {
      findUnique: jest.fn(),
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    };
  }
}

// Mock transaction
const mockTx = {
  userAnswer: { createMany: jest.fn(() => Promise.resolve({ count: 2 })) },
  enhancedAnswer: { createMany: jest.fn(() => Promise.resolve({ count: 0 })) },
  aIEvaluationRecord: { create: jest.fn(() => Promise.resolve({})) },
  userExamAttempt: {
    update: jest.fn(() => Promise.resolve({
      id: 'attempt-1',
      submittedAt: new Date(),
      scorePercentage: 50,
      isPassed: false,
      correctAnswers: 1,
      totalQuestions: 2,
      status: 'SUBMITTED',
    })),
  },
};

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(
    'http://localhost:3000/api/courses/sections/sec-1/exams/exam-1/attempts/attempt-1/submit',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

function createParams(overrides?: Partial<{ sectionId: string; examId: string; attemptId: string }>) {
  return {
    params: Promise.resolve({
      sectionId: 'sec-1',
      examId: 'exam-1',
      attemptId: 'attempt-1',
      ...overrides,
    }),
  };
}

const VALID_SUBMISSION = {
  answers: [
    { questionId: 'q1', answer: 'A' },
    { questionId: 'q2', answer: 'true' },
  ],
  timeSpent: 120,
};

const MOCK_ATTEMPT = {
  id: 'attempt-1',
  userId: 'user-1',
  examId: 'exam-1',
  submittedAt: null,
  Exam: {
    id: 'exam-1',
    passingScore: 60,
    sectionId: 'sec-1',
    ExamQuestion: [
      {
        id: 'q1',
        question: 'What is 2+2?',
        questionType: 'MULTIPLE_CHOICE',
        correctAnswer: 'A',
        points: 10,
        bloomsLevel: 'REMEMBER',
        order: 1,
      },
      {
        id: 'q2',
        question: 'Is the sky blue?',
        questionType: 'TRUE_FALSE',
        correctAnswer: true,
        points: 10,
        bloomsLevel: 'REMEMBER',
        order: 2,
      },
    ],
    enhancedQuestions: [],
    section: {
      id: 'sec-1',
      chapterId: 'ch-1',
      learningObjectiveItems: [],
      chapter: { courseId: 'course-1' },
    },
  },
};

describe('POST /api/courses/sections/[sectionId]/exams/[examId]/attempts/[attemptId]/submit', () => {
  beforeAll(() => {
    // Polyfill crypto.randomUUID for jsdom
    if (typeof globalThis.crypto?.randomUUID !== 'function') {
      const nodeCrypto = require('crypto');
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: () => nodeCrypto.randomUUID(),
        configurable: true,
        writable: true,
      });
    }
  });

  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Student' });
    mockWithRateLimit.mockResolvedValue(null);
    (db.userExamAttempt as any).findUnique.mockResolvedValue(MOCK_ATTEMPT);
    (db.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => {
      return fn(mockTx);
    });
    mockTx.userAnswer.createMany.mockResolvedValue({ count: 2 });
    mockTx.userExamAttempt.update.mockResolvedValue({
      id: 'attempt-1',
      submittedAt: new Date(),
      scorePercentage: 100,
      isPassed: true,
      correctAnswers: 2,
      totalQuestions: 2,
      status: 'SUBMITTED',
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createRequest(VALID_SUBMISSION), createParams());

    expect(res.status).toBe(401);
  });

  it('returns rate limit response when rate limited', async () => {
    const rateLimitRes = new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 });
    mockWithRateLimit.mockResolvedValue(rateLimitRes);

    const res = await POST(createRequest(VALID_SUBMISSION), createParams());

    expect(res.status).toBe(429);
  });

  it('returns 400 for invalid submission format', async () => {
    const res = await POST(
      createRequest({ answers: 'not-an-array', timeSpent: 'abc' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid submission format');
  });

  it('returns 400 when answers array is missing', async () => {
    const res = await POST(
      createRequest({ timeSpent: 120 }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid submission format');
  });

  it('returns 404 when attempt is not found', async () => {
    (db.userExamAttempt as any).findUnique.mockResolvedValue(null);

    const res = await POST(createRequest(VALID_SUBMISSION), createParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });

  it('returns 400 when exam has already been submitted', async () => {
    (db.userExamAttempt as any).findUnique.mockResolvedValue({
      ...MOCK_ATTEMPT,
      submittedAt: new Date(),
    });

    const res = await POST(createRequest(VALID_SUBMISSION), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('already been submitted');
  });

  it('grades objective questions correctly and returns success', async () => {
    const res = await POST(createRequest(VALID_SUBMISSION), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.attempt).toBeDefined();
    expect(body.summary).toBeDefined();
  });

  it('saves answers via transaction', async () => {
    await POST(createRequest(VALID_SUBMISSION), createParams());

    expect(db.$transaction).toHaveBeenCalled();
    expect(mockTx.userAnswer.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          attemptId: 'attempt-1',
          questionId: 'q1',
        }),
        expect.objectContaining({
          attemptId: 'attempt-1',
          questionId: 'q2',
        }),
      ]),
    });
  });

  it('updates attempt with score and submission time', async () => {
    await POST(createRequest(VALID_SUBMISSION), createParams());

    expect(mockTx.userExamAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'attempt-1' },
        data: expect.objectContaining({
          submittedAt: expect.any(Date),
          timeSpent: 120,
          totalQuestions: 2,
          status: 'SUBMITTED',
        }),
      })
    );
  });

  it('calculates correct score for all-correct answers', async () => {
    // Both answers match: q1='A' (MULTIPLE_CHOICE) and q2=true (TRUE_FALSE)
    mockTx.userExamAttempt.update.mockImplementation(async (args: Record<string, unknown>) => {
      const data = (args as { data: Record<string, unknown> }).data;
      return {
        id: 'attempt-1',
        ...data,
      };
    });

    const res = await POST(createRequest(VALID_SUBMISSION), createParams());
    const body = await res.json();

    expect(body.success).toBe(true);
    // With both correct: scorePercentage = (20/20)*100 = 100, isPassed = true (>=60)
    expect(mockTx.userExamAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scorePercentage: 100,
          isPassed: true,
          correctAnswers: 2,
        }),
      })
    );
  });

  it('calculates correct score for partial answers', async () => {
    // q1 wrong, q2 correct
    const partialSubmission = {
      answers: [
        { questionId: 'q1', answer: 'B' }, // Wrong
        { questionId: 'q2', answer: 'true' }, // Correct
      ],
      timeSpent: 90,
    };

    mockTx.userExamAttempt.update.mockImplementation(async (args: Record<string, unknown>) => {
      const data = (args as { data: Record<string, unknown> }).data;
      return { id: 'attempt-1', ...data };
    });

    const res = await POST(createRequest(partialSubmission), createParams());
    const body = await res.json();

    expect(body.success).toBe(true);
    // q1 wrong (0pts), q2 correct (10pts) => 10/20 = 50%, not passed (<60)
    expect(mockTx.userExamAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scorePercentage: 50,
          isPassed: false,
          correctAnswers: 1,
        }),
      })
    );
  });

  it('handles unanswered questions as incorrect', async () => {
    const partialSubmission = {
      answers: [
        { questionId: 'q1', answer: 'A' },
        // q2 not answered
      ],
      timeSpent: 60,
    };

    mockTx.userExamAttempt.update.mockImplementation(async (args: Record<string, unknown>) => {
      const data = (args as { data: Record<string, unknown> }).data;
      return { id: 'attempt-1', ...data };
    });

    await POST(createRequest(partialSubmission), createParams());

    expect(mockTx.userExamAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          correctAnswers: 1,
          scorePercentage: 50,
        }),
      })
    );
  });

  it('returns summary with scoring details', async () => {
    mockTx.userExamAttempt.update.mockResolvedValue({
      id: 'attempt-1',
      submittedAt: new Date(),
      scorePercentage: 100,
      isPassed: true,
    });

    const res = await POST(createRequest(VALID_SUBMISSION), createParams());
    const body = await res.json();

    expect(body.summary).toEqual(expect.objectContaining({
      scorePercentage: expect.any(Number),
      isPassed: expect.any(Boolean),
      correctAnswers: expect.any(Number),
      totalQuestions: 2,
      earnedPoints: expect.any(Number),
      totalPoints: expect.any(Number),
      timeSpent: 120,
    }));
  });

  it('returns null aiEvaluation for objective-only exams', async () => {
    const res = await POST(createRequest(VALID_SUBMISSION), createParams());
    const body = await res.json();

    expect(body.aiEvaluation).toBeNull();
  });

  it('returns 500 on unexpected errors', async () => {
    (db.userExamAttempt as any).findUnique.mockRejectedValue(new Error('DB error'));

    const res = await POST(createRequest(VALID_SUBMISSION), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Internal server error');
  });
});
