/**
 * Tests for POST /api/ai/lesson-generator
 *
 * Source: app/api/ai/lesson-generator/route.ts
 * Uses: getCombinedSession, runSAMChatWithMetadata, withRateLimit, withRetryableTimeout
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
import { POST } from '@/app/api/ai/lesson-generator/route';
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

const BASE_URL = 'http://localhost:3000/api/ai/lesson-generator';

const VALID_BODY = {
  sectionTitle: 'Understanding Variables',
};

describe('POST /api/ai/lesson-generator', () => {
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

  it('returns 400 when sectionTitle is missing', async () => {
    const res = await POST(createAIRequest(BASE_URL, {}));
    await assertBadRequest(res);
  });

  it('returns 400 when contentType is invalid', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, contentType: 'podcast' }));
    await assertBadRequest(res);
  });

  it('returns 200 with lesson content on success', async () => {
    const htmlContent = '<h1>Variables</h1><p>' + 'Content '.repeat(20) + '</p>';
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: htmlContent,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.content).toContain('<h1>');
  });

  it('includes metadata with contentType and difficulty', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: '<p>' + 'X'.repeat(100) + '</p>',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, {
      ...VALID_BODY,
      contentType: 'tutorial',
      difficulty: 'advanced',
    }));
    const body = await res.json();
    expect(body.metadata.contentType).toBe('tutorial');
    expect(body.metadata.difficulty).toBe('advanced');
  });

  it('falls back to mock content when AI throws', async () => {
    (runSAMChatWithMetadata as jest.Mock).mockRejectedValue(new Error('API down'));
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('unavailable');
  });

  it('returns 504 on OperationTimeoutError', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('lesson-gen', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(504);
  });

  it('accepts all optional fields', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: '<p>' + 'Z'.repeat(100) + '</p>',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, {
      ...VALID_BODY,
      chapterTitle: 'Chapter 1',
      courseTitle: 'Programming 101',
      contentType: 'blog',
      difficulty: 'beginner',
      tone: 'casual',
      includeExamples: false,
      includeExercises: false,
      includeResources: false,
      learningObjectives: ['Understand variables'],
      userPrompt: 'Keep it short',
    }));
    await assertSuccess(res);
  });

  it('returns 500 on unexpected errors', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(new Error('Unexpected'));

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(500);
  });
});
