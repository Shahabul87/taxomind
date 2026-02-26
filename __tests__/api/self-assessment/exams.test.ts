/**
 * Tests for Self-Assessment Exams Route - app/api/self-assessment/exams/route.ts
 *
 * Covers:
 *   GET  - List user's self-assessment exams (auth, pagination, filtering, validation)
 *   POST - Create a new self-assessment exam (auth, validation, AI generation, rate limiting)
 */

jest.unmock('zod');

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithMetadata: jest.fn().mockResolvedValue({
    content: '[]',
    provider: 'test-provider',
    model: 'test-model',
  }),
  handleAIAccessError: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/timeout', () => {
  class MockOperationTimeoutError extends Error {
    operationName: string;
    timeoutMs: number;
    constructor(op: string, ms: number) {
      super(`Operation ${op} timed out after ${ms}ms`);
      this.operationName = op;
      this.timeoutMs = ms;
    }
  }
  return {
    OperationTimeoutError: MockOperationTimeoutError,
    withRetryableTimeout: jest.fn(async (fn: () => Promise<unknown>) => fn()),
    TIMEOUT_DEFAULTS: { AI_GENERATION: 60000, AI_ANALYSIS: 30000 },
  };
});

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/blooms-normalizer', () => ({
  normalizeToUppercaseSafe: jest.fn((val: string) => {
    if (!val) return null;
    const upper = val.toUpperCase();
    const valid = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    return valid.includes(upper) ? upper : null;
  }),
}));

jest.mock('@sam-ai/educational', () => ({
  createExamEngine: jest.fn(() => ({
    generateExam: jest.fn().mockResolvedValue({
      questions: [],
      bloomsAnalysis: { distribution: {} },
    }),
  })),
}));

jest.mock('@/lib/adapters', () => ({
  getUserScopedSAMConfig: jest.fn().mockResolvedValue({}),
  getDatabaseAdapter: jest.fn(() => ({})),
}));

import { GET, POST } from '@/app/api/self-assessment/exams/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { handleAIAccessError } from '@/lib/sam/ai-provider';
import { OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockFindMany = db.selfAssessmentExam.findMany as jest.Mock;
const mockExamCount = db.selfAssessmentExam.count as jest.Mock;
const mockCreate = db.selfAssessmentExam.create as jest.Mock;
const mockFindUnique = db.selfAssessmentExam.findUnique as jest.Mock;
const mockUpdate = db.selfAssessmentExam.update as jest.Mock;
const mockCreateManyQ = db.selfAssessmentQuestion.createMany as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;
const mockHandleAIAccessError = handleAIAccessError as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/self-assessment/exams');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url.toString(), { method: 'GET' });
}

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/self-assessment/exams', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeMockExam(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exam-1',
    title: 'JavaScript Basics',
    description: 'A test on JS fundamentals',
    topic: 'JavaScript',
    courseId: null,
    status: 'DRAFT',
    timeLimit: 60,
    passingScore: 70,
    avgScore: null,
    generatedByAI: true,
    enableAdaptive: false,
    targetBloomsDistribution: { REMEMBER: 20, UNDERSTAND: 30, APPLY: 50 },
    createdAt: new Date('2026-02-01T10:00:00Z'),
    updatedAt: new Date('2026-02-01T10:00:00Z'),
    publishedAt: null,
    _count: {
      questions: 10,
      attempts: 2,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// GET /api/self-assessment/exams
// ---------------------------------------------------------------------------

describe('GET /api/self-assessment/exams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
    mockFindMany.mockResolvedValue([makeMockExam()]);
    mockExamCount.mockResolvedValue(1);
  });

  // ---- Authentication ----

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(createGetRequest());
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ id: null });
    const res = await GET(createGetRequest());
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  // ---- Success cases ----

  it('returns exams with default pagination', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.exams).toHaveLength(1);
    expect(body.pagination).toEqual({
      total: 1,
      limit: 20,
      offset: 0,
      hasMore: false,
    });
  });

  it('formats exam response correctly', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    const exam = body.exams[0];
    expect(exam.id).toBe('exam-1');
    expect(exam.title).toBe('JavaScript Basics');
    expect(exam.description).toBe('A test on JS fundamentals');
    expect(exam.topic).toBe('JavaScript');
    expect(exam.status).toBe('DRAFT');
    expect(exam.totalQuestions).toBe(10);
    expect(exam.totalAttempts).toBe(2);
    expect(exam.generatedByAI).toBe(true);
    expect(exam.enableAdaptive).toBe(false);
    expect(typeof exam.createdAt).toBe('string');
    expect(typeof exam.updatedAt).toBe('string');
    expect(exam.publishedAt).toBeNull();
  });

  it('queries db with correct user filter', async () => {
    await GET(createGetRequest());

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
        }),
      })
    );
  });

  // ---- Pagination ----

  it('respects custom limit and offset', async () => {
    await GET(createGetRequest({ limit: '5', offset: '10' }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        skip: 10,
      })
    );
  });

  it('returns hasMore true when more results exist', async () => {
    mockExamCount.mockResolvedValue(30);

    const res = await GET(createGetRequest({ limit: '10', offset: '0' }));
    const body = await res.json();

    expect(body.pagination.hasMore).toBe(true);
  });

  it('returns hasMore false when at end', async () => {
    mockExamCount.mockResolvedValue(5);

    const res = await GET(createGetRequest({ limit: '20', offset: '0' }));
    const body = await res.json();

    expect(body.pagination.hasMore).toBe(false);
  });

  // ---- Filtering ----

  it('filters by status when provided', async () => {
    await GET(createGetRequest({ status: 'PUBLISHED' }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          status: 'PUBLISHED',
        }),
      })
    );
  });

  it('filters by courseId when provided', async () => {
    await GET(createGetRequest({ courseId: 'course-abc' }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          courseId: 'course-abc',
        }),
      })
    );
  });

  // ---- Validation ----

  it('returns 400 for invalid status', async () => {
    const res = await GET(createGetRequest({ status: 'INVALID' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for limit exceeding max', async () => {
    const res = await GET(createGetRequest({ limit: '100' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for negative offset', async () => {
    const res = await GET(createGetRequest({ offset: '-1' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for limit of 0', async () => {
    const res = await GET(createGetRequest({ limit: '0' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  // ---- Empty results ----

  it('returns empty array when no exams exist', async () => {
    mockFindMany.mockResolvedValue([]);
    mockExamCount.mockResolvedValue(0);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.exams).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  // ---- Error handling ----

  it('returns 500 on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch exams');
  });
});

// ---------------------------------------------------------------------------
// POST /api/self-assessment/exams
// ---------------------------------------------------------------------------

describe('POST /api/self-assessment/exams', () => {
  const validBody = {
    title: 'JavaScript Fundamentals',
    description: 'Test your JS knowledge',
    topic: 'JavaScript',
    passingScore: 70,
    generateWithAI: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockReturnValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
    mockCreate.mockResolvedValue({
      id: 'new-exam-1',
      title: 'JavaScript Fundamentals',
      description: 'Test your JS knowledge',
      topic: 'JavaScript',
      status: 'DRAFT',
      generatedByAI: false,
      enableAdaptive: false,
      createdAt: new Date('2026-02-15T10:00:00Z'),
    });
    mockFindUnique.mockResolvedValue({
      id: 'new-exam-1',
      title: 'JavaScript Fundamentals',
      description: 'Test your JS knowledge',
      topic: 'JavaScript',
      status: 'DRAFT',
      generatedByAI: false,
      enableAdaptive: false,
      createdAt: new Date('2026-02-15T10:00:00Z'),
      _count: { questions: 0 },
    });
    mockHandleAIAccessError.mockReturnValue(null);
  });

  // ---- Rate limiting ----

  it('returns rate limit response when rate limited', async () => {
    const rateLimitResponse = { status: 429 };
    mockWithRateLimit.mockReturnValue(rateLimitResponse);

    const res = await POST(createPostRequest(validBody));
    expect(res).toEqual(rateLimitResponse);
  });

  // ---- Authentication ----

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await POST(createPostRequest(validBody));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ id: null });
    const res = await POST(createPostRequest(validBody));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  // ---- Validation ----

  it('returns 400 for title shorter than 3 chars', async () => {
    const res = await POST(createPostRequest({ ...validBody, title: 'AB' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for missing title', async () => {
    const bodyWithoutTitle = { ...validBody };
    delete (bodyWithoutTitle as Record<string, unknown>).title;
    const res = await POST(createPostRequest(bodyWithoutTitle));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for passingScore above 100', async () => {
    const res = await POST(createPostRequest({ ...validBody, passingScore: 101 }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for negative passingScore', async () => {
    const res = await POST(createPostRequest({ ...validBody, passingScore: -1 }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  // ---- Successful creation without AI ----

  it('creates exam without AI generation', async () => {
    const res = await POST(createPostRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.exam.id).toBe('new-exam-1');
    expect(body.exam.title).toBe('JavaScript Fundamentals');
    expect(body.exam.status).toBe('DRAFT');
    expect(body.generation).toBeNull();
    expect(body.message).toBe('Exam created successfully');
  });

  it('passes correct data to db.selfAssessmentExam.create', async () => {
    await POST(createPostRequest(validBody));

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        title: 'JavaScript Fundamentals',
        topic: 'JavaScript',
        passingScore: 70,
        generatedByAI: false,
        status: 'DRAFT',
      }),
    });
  });

  it('uses title as topic when topic is not provided', async () => {
    const bodyNoTopic = { ...validBody };
    delete (bodyNoTopic as Record<string, unknown>).topic;

    await POST(createPostRequest(bodyNoTopic));

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        topic: 'JavaScript Fundamentals',
      }),
    });
  });

  it('sets default bloom distribution when aiConfig has no distribution', async () => {
    await POST(createPostRequest(validBody));

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetBloomsDistribution: {
          REMEMBER: 15,
          UNDERSTAND: 20,
          APPLY: 25,
          ANALYZE: 20,
          EVALUATE: 15,
          CREATE: 5,
        },
      }),
    });
  });

  // ---- Successful creation with AI (topic-based) ----

  it('creates exam with AI generation and returns generation metadata', async () => {
    const aiBody = {
      ...validBody,
      generateWithAI: true,
      aiConfig: {
        totalQuestions: 10,
        difficulty: 'medium',
      },
    };

    // Mock the AI provider to return questions
    const { runSAMChatWithMetadata } = require('@/lib/sam/ai-provider');
    (runSAMChatWithMetadata as jest.Mock).mockResolvedValue({
      content: JSON.stringify([
        {
          type: 'MULTIPLE_CHOICE',
          difficulty: 'MEDIUM',
          bloomsLevel: 'UNDERSTAND',
          question: 'What is a closure?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          explanation: 'Closures capture scope.',
          hint: 'Think about scope.',
          points: 1,
          estimatedTime: 60,
          tags: ['javascript'],
        },
      ]),
      provider: 'anthropic',
      model: 'claude-3',
    });

    mockCreate.mockResolvedValue({
      id: 'new-exam-ai',
      title: 'JavaScript Fundamentals',
      status: 'DRAFT',
    });

    mockFindUnique.mockResolvedValue({
      id: 'new-exam-ai',
      title: 'JavaScript Fundamentals',
      description: 'Test your JS knowledge',
      topic: 'JavaScript',
      status: 'DRAFT',
      generatedByAI: true,
      enableAdaptive: false,
      createdAt: new Date('2026-02-15T10:00:00Z'),
      _count: { questions: 1 },
    });

    const res = await POST(createPostRequest(aiBody));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.exam.totalQuestions).toBe(1);
    expect(body.generation).not.toBeNull();
  });

  // ---- AI generation failure is graceful ----

  it('creates exam even when AI generation fails', async () => {
    const aiBody = {
      ...validBody,
      generateWithAI: true,
      aiConfig: {
        totalQuestions: 5,
      },
    };

    // Make AI call throw
    const { runSAMChatWithMetadata } = require('@/lib/sam/ai-provider');
    (runSAMChatWithMetadata as jest.Mock).mockRejectedValue(new Error('AI unavailable'));

    mockFindUnique.mockResolvedValue({
      id: 'new-exam-1',
      title: 'JavaScript Fundamentals',
      description: 'Test your JS knowledge',
      topic: 'JavaScript',
      status: 'DRAFT',
      generatedByAI: true,
      enableAdaptive: false,
      createdAt: new Date('2026-02-15T10:00:00Z'),
      _count: { questions: 0 },
    });

    const res = await POST(createPostRequest(aiBody));
    const body = await res.json();

    // Exam should still be created successfully (without questions)
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.exam.totalQuestions).toBe(0);
  });

  // ---- OperationTimeoutError ----

  it('returns 504 on operation timeout', async () => {
    mockCreate.mockRejectedValue(new OperationTimeoutError('createExam', 60000));

    const res = await POST(createPostRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(504);
    expect(body.error).toBe('Operation timed out. Please try again.');
  });

  // ---- AI Access Error ----

  it('returns AI access error response when applicable', async () => {
    const mockAccessResponse = { status: 403 };
    mockHandleAIAccessError.mockReturnValue(mockAccessResponse);

    const customError = new Error('AI access denied');
    mockCreate.mockRejectedValue(customError);

    const res = await POST(createPostRequest(validBody));
    expect(res).toEqual(mockAccessResponse);
  });

  // ---- Error handling ----

  it('returns 500 on unexpected database error', async () => {
    mockCreate.mockRejectedValue(new Error('DB connection lost'));
    mockHandleAIAccessError.mockReturnValue(null);

    const res = await POST(createPostRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to create exam');
  });

  // ---- Optional fields and defaults ----

  it('creates exam with all optional fields', async () => {
    const fullBody = {
      title: 'Complete Exam',
      description: 'Full description',
      instructions: 'Read carefully',
      topic: 'React',
      subtopics: ['hooks', 'state'],
      courseId: 'course-1',
      timeLimit: 90,
      passingScore: 80,
      shuffleQuestions: true,
      showResults: false,
      allowRetakes: false,
      maxAttempts: 3,
      generateWithAI: false,
      enableAdaptive: true,
    };

    await POST(createPostRequest(fullBody));

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Complete Exam',
        description: 'Full description',
        instructions: 'Read carefully',
        topic: 'React',
        subtopics: ['hooks', 'state'],
        courseId: 'course-1',
        timeLimit: 90,
        passingScore: 80,
        shuffleQuestions: true,
        showResults: false,
        allowRetakes: false,
        maxAttempts: 3,
        enableAdaptive: true,
      }),
    });
  });

  it('uses default passing score of 70 when not provided', async () => {
    const bodyNoScore = { title: 'Test Exam', generateWithAI: false };

    await POST(createPostRequest(bodyNoScore));

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        passingScore: 70,
      }),
    });
  });
});
