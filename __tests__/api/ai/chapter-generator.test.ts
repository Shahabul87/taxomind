/**
 * Tests for POST /api/ai/chapter-generator
 *
 * Source: app/api/ai/chapter-generator/route.ts
 * Uses: getCombinedSession, runSAMChatWithMetadata, withRateLimit, withRetryableTimeout
 * Schema imported from @/lib/ai-course-types (ChapterGenerationRequestSchema)
 */

jest.mock('@/lib/auth/combined-session', () => ({
  getCombinedSession: jest.fn(),
}));
jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithMetadata: jest.fn(),
  handleAIAccessError: jest.fn(() => null),
}));
jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));
jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn(),
  OperationTimeoutError: class OperationTimeoutError extends Error {
    operationName: string;
    timeoutMs: number;
    constructor(op: string, ms: number) {
      super(`Timeout: ${op}`);
      this.operationName = op;
      this.timeoutMs = ms;
    }
  },
  TIMEOUT_DEFAULTS: { AI_GENERATION: 30000 },
}));

import { getCombinedSession } from '@/lib/auth/combined-session';
import { runSAMChatWithMetadata } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { POST } from '@/app/api/ai/chapter-generator/route';
import {
  mockCombinedSession,
  mockRateLimit,
  mockAIMetadata,
  mockTimeout,
  createAIRequest,
  assertUnauthorized,
  assertRateLimited,
  assertBadRequest,
  assertSuccess,
} from './_ai-route-helpers';

const BASE_URL = 'http://localhost:3000/api/ai/chapter-generator';

const VALID_BODY = {
  courseContext: 'A web development course for beginners',
  chapterTopic: 'HTML Fundamentals',
  position: 1,
  learningObjectives: ['Learn HTML tags', 'Build a webpage'],
  difficulty: 'beginner',
};

const MOCK_CHAPTER_RESPONSE = {
  title: 'HTML Fundamentals',
  description: 'Learn the basics of HTML.',
  learningOutcomes: ['Create HTML pages', 'Use semantic tags'],
  prerequisites: 'None',
  estimatedTime: '4 hours',
  difficulty: 'beginner',
  sections: [
    {
      title: 'Intro to HTML',
      description: 'Overview of HTML',
      type: 'video',
      estimatedTime: '20 min',
      learningObjectives: ['Understand HTML'],
      keyPoints: ['Tags', 'Elements'],
    },
  ],
  assessmentSuggestions: [
    { type: 'Quiz', description: 'HTML basics quiz', estimatedTime: '15 min' },
  ],
};

describe('POST /api/ai/chapter-generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit(withRateLimit as jest.Mock);
    mockCombinedSession(getCombinedSession as jest.Mock);
    mockTimeout(withRetryableTimeout as jest.Mock);
  });

  it('returns 401 when not authenticated', async () => {
    mockCombinedSession(getCombinedSession as jest.Mock, null);
    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertUnauthorized(res);
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit(withRateLimit as jest.Mock, true);
    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertRateLimited(res);
  });

  it('returns 400 when courseContext is missing', async () => {
    const { courseContext, ...noContext } = VALID_BODY;
    const res = await POST(createAIRequest(BASE_URL, noContext));
    await assertBadRequest(res);
  });

  it('returns 400 when learningObjectives is empty', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, learningObjectives: [] }));
    await assertBadRequest(res);
  });

  it('returns 400 when difficulty is invalid', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, difficulty: 'expert' }));
    await assertBadRequest(res);
  });

  it('returns 200 with chapter data on success', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: JSON.stringify(MOCK_CHAPTER_RESPONSE),
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('HTML Fundamentals');
  });

  it('falls back to mock when AI response validation fails', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: JSON.stringify({ title: 'Partial', description: 'Incomplete' }),
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('validation failed');
  });

  it('falls back to mock when AI provider throws', async () => {
    (runSAMChatWithMetadata as jest.Mock).mockRejectedValue(new Error('API error'));
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('unavailable');
  });

  it('returns 504 on OperationTimeoutError', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('chapter-gen', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(504);
  });

  it('returns 500 on unexpected errors', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(new Error('Unexpected'));

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(500);
  });
});
