jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
  handleAIAccessError: jest.fn(() => null),
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn((fn: () => Promise<unknown>) => fn()),
  OperationTimeoutError: class OperationTimeoutError extends Error {
    operationName: string;
    timeoutMs: number;

    constructor(operationName: string, timeoutMs: number) {
      super(`Timeout: ${operationName}`);
      this.operationName = operationName;
      this.timeoutMs = timeoutMs;
    }
  },
  TIMEOUT_DEFAULTS: {
    AI_ANALYSIS: 30000,
    AI_GENERATION: 45000,
  },
}));

import { POST } from '@/app/api/sam/exam-builder/generate/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { NextRequest, NextResponse } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockRunSAMChat = runSAMChatWithPreference as jest.Mock;
const mockHandleAIAccessError = handleAIAccessError as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;
const mockWithRetryableTimeout = withRetryableTimeout as jest.Mock;

const typedDb = db as Record<string, unknown>;
typedDb.section = typedDb.section || { findUnique: jest.fn() };
typedDb.sAMInteraction = typedDb.sAMInteraction || { create: jest.fn() };

const mockSectionFindUnique = (typedDb.section as { findUnique: jest.Mock }).findUnique;
const mockInteractionCreate = (typedDb.sAMInteraction as { create: jest.Mock }).create;

const validRequestBody = {
  config: {
    questionCount: 2,
    bloomsDistribution: {
      REMEMBER: 100,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    },
    questionTypes: ['MULTIPLE_CHOICE'],
    difficulty: 'MEDIUM',
    generationMode: 'AI_GUIDED',
    includeHints: true,
    includeExplanations: true,
    includeMisconceptions: false,
    realWorldContext: true,
    creativity: 5,
  },
  sectionContext: {
    courseId: 'course-1',
    chapterId: 'chapter-1',
    sectionId: 'section-1',
    courseTitle: 'Course Title',
    chapterTitle: 'Chapter Title',
    sectionTitle: 'Section Title',
    sectionContent: 'This section explains loops and conditions.',
    learningObjectives: ['Understand loops'],
  },
};

describe('/api/sam/exam-builder/generate route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockWithRetryableTimeout.mockImplementation((fn: () => Promise<unknown>) => fn());
    mockHandleAIAccessError.mockReturnValue(null);

    mockSectionFindUnique.mockResolvedValue({
      id: 'section-1',
      title: 'Section Title',
      description: 'Section description',
      learningObjectives: 'Understand loops',
      chapter: {
        title: 'Chapter Title',
        course: {
          userId: 'user-1',
          title: 'Course Title',
          description: 'Course description',
        },
      },
      learningObjectiveItems: [
        { objective: 'Understand loops', bloomsLevel: 'UNDERSTAND' },
      ],
    });

    mockInteractionCreate.mockResolvedValue({ id: 'interaction-1' });

    mockRunSAMChat.mockResolvedValue(
      JSON.stringify([
        {
          question: 'Which keyword starts a loop in JavaScript?',
          questionType: 'MULTIPLE_CHOICE',
          options: [
            { text: 'for', isCorrect: true },
            { text: 'loop', isCorrect: false },
            { text: 'repeat', isCorrect: false },
            { text: 'iterate', isCorrect: false },
          ],
          correctAnswer: 'for',
          explanation: 'The for keyword defines a for-loop in JavaScript.',
          hint: 'Think about the classic counting loop syntax.',
          cognitiveSkills: ['INFORMATION_PROCESSING'],
          relatedConcepts: ['iteration', 'control-flow'],
        },
        {
          question: 'What part of a for-loop updates the counter?',
          questionType: 'MULTIPLE_CHOICE',
          options: [
            { text: 'initializer', isCorrect: false },
            { text: 'condition', isCorrect: false },
            { text: 'increment expression', isCorrect: true },
            { text: 'body', isCorrect: false },
          ],
          correctAnswer: 'increment expression',
          explanation: 'The increment expression runs after each loop iteration.',
          hint: 'It appears after the second semicolon.',
          cognitiveSkills: ['INFORMATION_PROCESSING'],
          relatedConcepts: ['iteration'],
        },
      ])
    );
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new NextRequest('http://localhost:3000/api/sam/exam-builder/generate', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
    });

    const res = await POST(req);

    expect(res.status).toBe(429);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/exam-builder/generate', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when request schema validation fails', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/exam-builder/generate', {
      method: 'POST',
      body: JSON.stringify({ config: { questionCount: 0 }, sectionContext: {} }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 404 when section is missing or not owned by user', async () => {
    mockSectionFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/exam-builder/generate', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
    });

    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it('returns generated questions for valid requests', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/exam-builder/generate', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.questions).toHaveLength(2);
    expect(body.questions[0].questionType).toBe('MULTIPLE_CHOICE');
    expect(body.metadata.generationMode).toBe('AI_GUIDED');
    expect(mockRunSAMChat).toHaveBeenCalled();
    expect(mockInteractionCreate).toHaveBeenCalled();
  });

  it('returns 504 on operation timeout', async () => {
    mockWithRetryableTimeout.mockImplementationOnce(() => {
      throw new OperationTimeoutError('examBuilderGenerate', 45000);
    });

    const req = new NextRequest('http://localhost:3000/api/sam/exam-builder/generate', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
    });

    const res = await POST(req);

    expect(res.status).toBe(504);
  });

  it('returns mapped access-error response when provider access fails', async () => {
    mockWithRetryableTimeout.mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });
    mockHandleAIAccessError.mockReturnValueOnce(
      NextResponse.json({ error: 'AI access denied' }, { status: 402 })
    );

    const req = new NextRequest('http://localhost:3000/api/sam/exam-builder/generate', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
    });

    const res = await POST(req);

    expect(res.status).toBe(402);
  });
});
