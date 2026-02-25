/**
 * Tests for POST /api/ai/course-content
 *
 * Source: app/api/ai/course-content/route.ts
 * Uses: getCombinedSession, runSAMChatWithMetadata, withRateLimit, withRetryableTimeout
 * Schema: courseTitle (string), type (description | objectives), userPrompt?, focusArea?
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
import { POST } from '@/app/api/ai/course-content/route';
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

const BASE_URL = 'http://localhost:3000/api/ai/course-content';

const VALID_BODY = {
  courseTitle: 'Python Programming',
  type: 'description',
};

describe('POST /api/ai/course-content', () => {
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

  it('returns 400 when courseTitle is missing', async () => {
    const res = await POST(createAIRequest(BASE_URL, { type: 'description' }));
    await assertBadRequest(res);
  });

  it('returns 400 when type is invalid', async () => {
    const res = await POST(createAIRequest(BASE_URL, { courseTitle: 'X', type: 'summary' }));
    await assertBadRequest(res);
  });

  it('returns 200 with description content on success', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: 'A comprehensive Python programming course.',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.content).toContain('Python');
  });

  it('returns 200 with objectives content on success', async () => {
    const objectives = '<ul><li>Master Python basics</li></ul>';
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: objectives,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, type: 'objectives' }));
    await assertSuccess(res);
  });

  it('falls back to mock when AI throws', async () => {
    (runSAMChatWithMetadata as jest.Mock).mockRejectedValue(new Error('API error'));
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('unavailable');
  });

  it('returns 504 on OperationTimeoutError', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('course-content', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(504);
  });
});
