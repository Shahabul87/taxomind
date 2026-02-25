/**
 * Tests for POST /api/ai/chapter-content
 *
 * Source: app/api/ai/chapter-content/route.ts
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
import { POST } from '@/app/api/ai/chapter-content/route';
import {
  MOCK_USER_ID,
  MOCK_AI_METADATA_RESPONSE,
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

const BASE_URL = 'http://localhost:3000/api/ai/chapter-content';

const VALID_BODY = {
  chapterTitle: 'Getting Started with React',
  type: 'description' as const,
};

describe('POST /api/ai/chapter-content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit(withRateLimit as jest.Mock);
    mockCombinedSession(getCombinedSession as jest.Mock);
    mockTimeout(withRetryableTimeout as jest.Mock);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCombinedSession(getCombinedSession as jest.Mock, null);
    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertUnauthorized(res);
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit(withRateLimit as jest.Mock, true);
    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertRateLimited(res);
  });

  it('returns 400 when chapterTitle is missing', async () => {
    const res = await POST(createAIRequest(BASE_URL, { type: 'description' }));
    await assertBadRequest(res);
  });

  it('returns 400 when type is invalid', async () => {
    const res = await POST(createAIRequest(BASE_URL, { chapterTitle: 'Test', type: 'summary' }));
    await assertBadRequest(res);
  });

  it('returns 200 with description content on success', async () => {
    const longContent = '<p>' + 'A'.repeat(60) + '</p>';
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: longContent,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.content).toContain('<p>');
    expect(body.metadata.type).toBe('description');
  });

  it('returns 200 with objectives content on success', async () => {
    const objectives = '<ul><li>' + 'B'.repeat(60) + '</li></ul>';
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: objectives,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, type: 'objectives' }));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.metadata.type).toBe('objectives');
  });

  it('falls back to mock content when AI provider throws', async () => {
    (runSAMChatWithMetadata as jest.Mock).mockRejectedValue(new Error('API error'));
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('unavailable');
  });

  it('falls back when AI returns content shorter than 50 chars', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: 'Short',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toBeDefined();
  });

  it('accepts optional courseContext and chapterContext', async () => {
    const longContent = '<p>' + 'C'.repeat(60) + '</p>';
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: longContent,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const bodyWithContext = {
      ...VALID_BODY,
      courseContext: { title: 'React Course', difficulty: 'intermediate' },
      chapterContext: { position: 0 },
    };
    const res = await POST(createAIRequest(BASE_URL, bodyWithContext));
    await assertSuccess(res);
  });

  it('returns 504 when OperationTimeoutError is thrown', async () => {
    (withRateLimit as jest.Mock).mockResolvedValue(null);
    (getCombinedSession as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('chapter-content', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(504);
  });
});
