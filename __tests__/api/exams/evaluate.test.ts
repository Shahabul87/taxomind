/**
 * Tests for Exam Evaluate Route - app/api/exams/evaluate/route.ts
 *
 * Covers: POST (evaluate exam answers), GET (fetch evaluation results)
 */

jest.unmock('zod');

jest.mock('@/lib/sam/ai-provider', () => ({
  handleAIAccessError: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  OperationTimeoutError: class extends Error { operationName = ''; timeoutMs = 0; },
  withRetryableTimeout: jest.fn(async (fn: () => Promise<unknown>) => fn()),
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000 },
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

jest.mock('@sam-ai/educational', () => ({
  createEvaluationEngine: jest.fn(() => ({
    evaluateAnswer: jest.fn().mockResolvedValue({
      score: 8, maxScore: 10, accuracy: 0.8, completeness: 0.9,
      relevance: 0.85, depth: 0.7, feedback: 'Good answer.',
      strengths: ['Clear'], improvements: ['More detail'],
      nextSteps: ['Review'], demonstratedBloomsLevel: 'UNDERSTAND',
      misconceptions: [],
    }),
    storeEvaluationResult: jest.fn().mockResolvedValue(undefined),
  })),
  createUnifiedBloomsEngine: jest.fn(() => ({
    updateCognitiveProgress: jest.fn().mockResolvedValue(undefined),
    logLearningActivity: jest.fn().mockResolvedValue(undefined),
    createProgressIntervention: jest.fn().mockResolvedValue(undefined),
    calculateSpacedRepetition: jest.fn(),
  })),
}));

jest.mock('@sam-ai/safety', () => ({
  wrapEvaluationWithSafety: jest.fn(async (result: Record<string, unknown>) => ({
    ...result,
    safetyValidation: { passed: true, score: 0.95, wasRewritten: false },
  })),
}));

jest.mock('@sam-ai/memory', () => ({
  createMasteryTracker: jest.fn(() => ({
    processEvaluation: jest.fn().mockResolvedValue({
      levelChanged: false, changeDirection: 'stable',
      currentMastery: { level: 'DEVELOPING' },
    }),
  })),
  createSpacedRepetitionScheduler: jest.fn(() => ({
    scheduleFromEvaluation: jest.fn().mockResolvedValue({
      daysUntilReview: 3, quality: 4, isNew: false,
    }),
  })),
}));

jest.mock('@/lib/adapters', () => ({
  getUserScopedSAMConfig: jest.fn().mockResolvedValue({ provider: 'mock' }),
  getDatabaseAdapter: jest.fn(() => ({})),
}));

jest.mock('@/lib/sam/taxomind-context', () => ({
  getStudentProfileStore: jest.fn(() => ({})),
  getReviewScheduleStore: jest.fn(() => ({})),
}));

jest.mock('@/lib/sam/cross-feature-bridge', () => ({
  bridgeAssessmentToSkillTrack: jest.fn().mockResolvedValue(undefined),
  bridgeAssessmentToBehaviorMonitor: jest.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePostReq(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/exams/evaluate', {
    method: 'POST', body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeGetReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/exams/evaluate');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString(), { method: 'GET' });
}

function postBody(o: Record<string, unknown> = {}) {
  return {
    attemptId: 'attempt-1',
    answers: [{ questionId: 'q-1', answer: 'A superset of JavaScript' }],
    ...o,
  };
}

const mockAttempt = {
  id: 'attempt-1', userId: 'user-1', status: 'IN_PROGRESS',
  totalQuestions: 1, timeSpent: 600,
  Exam: {
    id: 'exam-1', title: 'Test Exam', passingScore: 70, sectionId: 'section-1',
    enhancedQuestions: [{
      id: 'q-1', question: 'What is TS?', questionType: 'MULTIPLE_CHOICE',
      correctAnswer: 'a superset of javascript', points: 10, bloomsLevel: 'REMEMBER',
      explanation: 'TS extends JS.',
      options: [
        { text: 'A superset of JavaScript', isCorrect: true },
        { text: 'A database', isCorrect: false },
      ],
      relatedConcepts: ['JS'], cognitiveSkills: ['INFO'],
    }],
    section: {
      learningObjectiveItems: [{ id: 'lo-1', objective: 'Type safety' }],
      chapter: { courseId: 'course-1' },
    },
  },
};

const mockGetAttempt = {
  id: 'attempt-1', userId: 'user-1', status: 'GRADED',
  scorePercentage: 85, isPassed: true,
  startedAt: new Date('2026-02-01'), submittedAt: new Date('2026-02-01'),
  timeSpent: 600,
  Exam: {
    id: 'exam-1', title: 'Test Exam', passingScore: 70,
    enhancedQuestions: [],
  },
  enhancedAnswers: [{
    questionId: 'q-1', answer: 'A', isCorrect: true, pointsEarned: 10,
    evaluationType: 'AUTO_GRADED',
    question: { question: 'What is TS?' },
    aiEvaluations: [],
  }],
};

// ---------------------------------------------------------------------------
// POST Tests
// ---------------------------------------------------------------------------

describe('POST /api/exams/evaluate', () => {
  let POST: any, cu: any, d: any, rl: any, he: any, wt: any, OTE: any;

  beforeAll(async () => {
    const m = await import('@/app/api/exams/evaluate/route');
    POST = m.POST;
    cu = require('@/lib/auth').currentUser;
    d = require('@/lib/db').db;
    rl = require('@/lib/sam/middleware/rate-limiter').withRateLimit;
    he = require('@/lib/sam/ai-provider').handleAIAccessError;
    wt = require('@/lib/sam/utils/timeout').withRetryableTimeout;
    OTE = require('@/lib/sam/utils/timeout').OperationTimeoutError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cu.mockResolvedValue({ id: 'user-1' });
    rl.mockResolvedValue(null);
    he.mockReturnValue(null);
    wt.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    d.userExamAttempt.findUnique.mockResolvedValue(mockAttempt);
    d.enhancedAnswer.create.mockResolvedValue({ id: 'a-1' });
    d.userExamAttempt.update.mockResolvedValue({ id: 'attempt-1', status: 'GRADED' });
  });

  it('returns 401 when unauthenticated', async () => {
    cu.mockResolvedValue(null);
    expect((await POST(makePostReq(postBody()))).status).toBe(401);
  });

  it('returns 400 on validation error (missing attemptId)', async () => {
    expect((await POST(makePostReq({ attemptId: '', answers: [{ questionId: 'q', answer: 'a' }] }))).status).toBe(400);
  });

  it('returns 400 on validation error (empty answers)', async () => {
    expect((await POST(makePostReq({ attemptId: 'a1', answers: [] }))).status).toBe(400);
  });

  it('returns 404 when attempt not found', async () => {
    d.userExamAttempt.findUnique.mockResolvedValue(null);
    expect((await POST(makePostReq(postBody()))).status).toBe(404);
  });

  it('returns 403 when attempt belongs to another user', async () => {
    d.userExamAttempt.findUnique.mockResolvedValue({ ...mockAttempt, userId: 'other-user' });
    expect((await POST(makePostReq(postBody()))).status).toBe(403);
  });

  it('returns 400 when attempt already graded', async () => {
    d.userExamAttempt.findUnique.mockResolvedValue({ ...mockAttempt, status: 'GRADED' });
    expect((await POST(makePostReq(postBody()))).status).toBe(400);
  });

  it('returns 200 with evaluation results on success', async () => {
    const body = await (await POST(makePostReq(postBody()))).json();
    expect(body.success).toBe(true);
    expect(body.attempt.status).toBe('GRADED');
    expect(typeof body.summary.scorePercentage).toBe('number');
  });

  it('creates enhancedAnswer in DB', async () => {
    await POST(makePostReq(postBody()));
    expect(d.enhancedAnswer.create).toHaveBeenCalled();
  });

  it('updates attempt status to GRADED', async () => {
    await POST(makePostReq(postBody()));
    expect(d.userExamAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'attempt-1' },
        data: expect.objectContaining({ status: 'GRADED' }),
      })
    );
  });

  it('returns 504 on timeout', async () => {
    const e = new OTE();
    e.operationName = 'eval'; e.timeoutMs = 30000;
    wt.mockRejectedValue(e);
    expect((await POST(makePostReq(postBody()))).status).toBe(504);
  });

  it('returns 500 on unexpected error', async () => {
    d.userExamAttempt.findUnique.mockRejectedValue(new Error('DB'));
    expect((await POST(makePostReq(postBody()))).status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET Tests
// ---------------------------------------------------------------------------

describe('GET /api/exams/evaluate', () => {
  let GET: any, cu: any, d: any;

  beforeAll(async () => {
    const m = await import('@/app/api/exams/evaluate/route');
    GET = m.GET;
    cu = require('@/lib/auth').currentUser;
    d = require('@/lib/db').db;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cu.mockResolvedValue({ id: 'user-1' });
    d.userExamAttempt.findUnique.mockResolvedValue(mockGetAttempt);
  });

  it('returns 401 when unauthenticated', async () => {
    cu.mockResolvedValue(null);
    expect((await GET(makeGetReq({ attemptId: 'a1' }))).status).toBe(401);
  });

  it('returns 400 when attemptId is missing', async () => {
    expect((await GET(makeGetReq())).status).toBe(400);
  });

  it('returns 404 when attempt not found', async () => {
    d.userExamAttempt.findUnique.mockResolvedValue(null);
    expect((await GET(makeGetReq({ attemptId: 'a1' }))).status).toBe(404);
  });

  it('returns 403 when attempt belongs to another user', async () => {
    d.userExamAttempt.findUnique.mockResolvedValue({ ...mockGetAttempt, userId: 'other' });
    expect((await GET(makeGetReq({ attemptId: 'a1' }))).status).toBe(403);
  });

  it('returns attempt and answers on success', async () => {
    const body = await (await GET(makeGetReq({ attemptId: 'attempt-1' }))).json();
    expect(body.attempt.id).toBe('attempt-1');
    expect(body.exam.id).toBe('exam-1');
    expect(Array.isArray(body.answers)).toBe(true);
  });

  it('returns 500 on unexpected error', async () => {
    d.userExamAttempt.findUnique.mockRejectedValue(new Error('DB'));
    expect((await GET(makeGetReq({ attemptId: 'a1' }))).status).toBe(500);
  });
});
