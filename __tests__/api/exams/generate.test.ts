/**
 * Tests for Exam Generate Route - app/api/exams/generate/route.ts
 *
 * Covers: POST (AI-powered exam generation with Bloom's taxonomy)
 * Covers: rate limiting, auth, validation, section lookup, authorization,
 * success path, DB operations, and Bloom's profile creation.
 * Uses dynamic import to keep memory footprint within SWC transformer limits.
 */

jest.unmock('zod');

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
  handleAIAccessError: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  OperationTimeoutError: class extends Error { operationName = ''; timeoutMs = 0; },
  withRetryableTimeout: jest.fn(async (fn: () => Promise<unknown>) => fn()),
  TIMEOUT_DEFAULTS: { AI_GENERATION: 60000, AI_ANALYSIS: 30000 },
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

function makeReq(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/exams/generate', {
    method: 'POST', body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function vb(o: Record<string, unknown> = {}) {
  return {
    sectionId: 'section-1', title: 'Test Exam', questionCount: 2,
    mode: 'AI_GUIDED', passingScore: 70,
    includeHints: true, includeExplanations: true, ...o,
  };
}

const mockSec = {
  id: 'section-1', title: 'Intro to TypeScript',
  description: 'Learn TS basics', learningObjectives: 'Types and interfaces',
  learningObjectiveItems: [
    { id: 'lo-1', objective: 'Understand type safety', bloomsLevel: 'UNDERSTAND' },
  ],
  SectionBloomsMapping: [],
  chapter: {
    title: 'Chapter 1',
    course: { id: 'c1', title: 'TS Fundamentals', description: 'A TS course', userId: 'user-1' },
  },
};

const aiResp = JSON.stringify([
  {
    question: 'What is TypeScript?', questionType: 'MULTIPLE_CHOICE',
    options: [
      { text: 'A superset of JavaScript', isCorrect: true },
      { text: 'A database', isCorrect: false },
      { text: 'An OS', isCorrect: false },
      { text: 'A framework', isCorrect: false },
    ],
    correctAnswer: 'A superset of JavaScript',
    explanation: 'TS extends JS.', hint: 'Think about JS.',
    cognitiveSkills: ['INFO'], relatedConcepts: ['JavaScript', 'Static Typing'],
  },
  {
    question: 'Explain type inference.', questionType: 'SHORT_ANSWER',
    correctAnswer: 'TS infers types.', explanation: 'Compiler deduces.',
    hint: 'No explicit types.', cognitiveSkills: ['LOGIC'], relatedConcepts: ['Type System'],
  },
]);

describe('POST /api/exams/generate', () => {
  let POST: any, cu: any, d: any, rs: any, he: any, wt: any, OTE: any, rl: any;

  beforeAll(async () => {
    const m = await import('@/app/api/exams/generate/route');
    POST = m.POST;
    cu = require('@/lib/auth').currentUser;
    d = require('@/lib/db').db;
    rs = require('@/lib/sam/ai-provider').runSAMChatWithPreference;
    he = require('@/lib/sam/ai-provider').handleAIAccessError;
    wt = require('@/lib/sam/utils/timeout').withRetryableTimeout;
    OTE = require('@/lib/sam/utils/timeout').OperationTimeoutError;
    rl = require('@/lib/sam/middleware/rate-limiter').withRateLimit;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cu.mockResolvedValue({ id: 'user-1', name: 'Test User' });
    rl.mockResolvedValue(null);
    he.mockReturnValue(null);
    wt.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    d.section.findUnique.mockResolvedValue(mockSec);
    d.exam.create.mockResolvedValue({
      id: 'exam-1', title: 'Test Exam', description: undefined,
      timeLimit: undefined, passingScore: 70, sectionId: 'section-1',
    });
    d.enhancedQuestion.create.mockImplementation(
      async (a: any) => ({ id: `eq-${Date.now()}`, ...a.data })
    );
    d.examBloomsProfile.create.mockResolvedValue({ id: 'ebp-1' });
    rs.mockResolvedValue(aiResp);
  });

  it('returns rate limit response when rate limited', async () => {
    const r = { status: 429, json: () => Promise.resolve({ error: 'Rate limited' }) };
    rl.mockResolvedValue(r);
    expect(await POST(makeReq(vb()))).toBe(r);
  });

  it('returns 401 when user is null', async () => {
    cu.mockResolvedValue(null);
    expect((await POST(makeReq(vb()))).status).toBe(401);
  });

  it('returns 401 when user has no id', async () => {
    cu.mockResolvedValue({ id: undefined });
    expect((await POST(makeReq(vb()))).status).toBe(401);
  });

  it('returns 400 when sectionId is empty', async () => {
    expect((await POST(makeReq(vb({ sectionId: '' })))).status).toBe(400);
  });

  it('returns 400 when title is empty', async () => {
    expect((await POST(makeReq(vb({ title: '' })))).status).toBe(400);
  });

  it('returns 400 when questionCount exceeds 50', async () => {
    expect((await POST(makeReq(vb({ questionCount: 100 })))).status).toBe(400);
  });

  it('returns 400 when mode is invalid', async () => {
    expect((await POST(makeReq(vb({ mode: 'INVALID' })))).status).toBe(400);
  });

  it('returns 400 when passingScore exceeds 100', async () => {
    expect((await POST(makeReq(vb({ passingScore: 150 })))).status).toBe(400);
  });

  it('returns 404 when section does not exist', async () => {
    d.section.findUnique.mockResolvedValue(null);
    const body = await (await POST(makeReq(vb()))).json();
    expect(body.error).toBe('Section not found');
  });

  it('returns 403 when user does not own the course', async () => {
    d.section.findUnique.mockResolvedValue({
      ...mockSec,
      chapter: { ...mockSec.chapter, course: { ...mockSec.chapter.course, userId: 'other' } },
    });
    expect((await POST(makeReq(vb()))).status).toBe(403);
  });

  it('returns 200 on success with exam data', async () => {
    const body = await (await POST(makeReq(vb()))).json();
    expect(body.success).toBe(true);
    expect(body.exam.id).toBe('exam-1');
    expect(body.exam.title).toBe('Test Exam');
    expect(body.exam.passingScore).toBe(70);
  });

  it('returns questions array on success', async () => {
    const body = await (await POST(makeReq(vb()))).json();
    expect(Array.isArray(body.questions)).toBe(true);
  });

  it('returns bloomsProfile with expected properties', async () => {
    const body = await (await POST(makeReq(vb()))).json();
    expect(body.exam.bloomsProfile).toHaveProperty('cognitiveComplexity');
    expect(body.exam.bloomsProfile).toHaveProperty('balanceScore');
  });

  it('creates exam record with correct data', async () => {
    await POST(makeReq(vb()));
    expect(d.exam.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Test Exam', sectionId: 'section-1',
          passingScore: 70, isPublished: false,
        }),
      })
    );
  });

  it('creates enhanced questions in DB', async () => {
    await POST(makeReq(vb()));
    expect(d.enhancedQuestion.create).toHaveBeenCalled();
  });
});
