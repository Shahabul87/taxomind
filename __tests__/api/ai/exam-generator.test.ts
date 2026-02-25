/**
 * Tests for POST /api/ai/exam-generator
 *
 * Source: app/api/ai/exam-generator/route.ts
 * Uses: getCombinedSession, runSAMChatWithPreference, withRateLimit, withRetryableTimeout
 */

jest.mock('@/lib/auth/combined-session', () => ({
  getCombinedSession: jest.fn(),
}));
jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
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
  TIMEOUT_DEFAULTS: { AI_GENERATION: 30000, AI_ANALYSIS: 30000 },
}));
jest.mock('@/lib/sam/utils/blooms-normalizer', () => ({
  normalizeToUppercaseSafe: jest.fn((v: string) => v.toUpperCase()),
}));

import { getCombinedSession } from '@/lib/auth/combined-session';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { POST } from '@/app/api/ai/exam-generator/route';
import {
  MOCK_USER_ID,
  mockCombinedSession,
  mockRateLimit,
  mockAIPreference,
  mockTimeout,
  createAIRequest,
  assertUnauthorized,
  assertRateLimited,
  assertBadRequest,
  assertSuccess,
} from './_ai-route-helpers';

const BASE_URL = 'http://localhost:3000/api/ai/exam-generator';

const VALID_BODY = {
  sectionTitle: 'Introduction to Algorithms',
  questionCount: 5,
  difficulty: 'medium',
  questionTypes: 'mixed',
};

describe('POST /api/ai/exam-generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit(withRateLimit as jest.Mock);
    mockCombinedSession(getCombinedSession as jest.Mock);
    mockTimeout(withRetryableTimeout as jest.Mock);
  });

  // ----- Auth -----

  it('returns 401 when user is not authenticated', async () => {
    mockCombinedSession(getCombinedSession as jest.Mock, null);
    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertUnauthorized(res);
  });

  // ----- Rate limit -----

  it('returns 429 when rate limited', async () => {
    mockRateLimit(withRateLimit as jest.Mock, true);
    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertRateLimited(res);
  });

  // ----- Validation -----

  it('returns 400 when sectionTitle is missing', async () => {
    const res = await POST(createAIRequest(BASE_URL, { questionCount: 5 }));
    await assertBadRequest(res);
    const body = await res.json();
    expect(body.error).toBe('Invalid request format');
  });

  it('returns 400 when questionCount exceeds 50', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, questionCount: 100 }));
    await assertBadRequest(res);
  });

  it('returns 400 when difficulty is invalid', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, difficulty: 'extreme' }));
    await assertBadRequest(res);
  });

  // ----- Happy path -----

  it('returns 200 with questions on successful AI response', async () => {
    const mockQuestions = JSON.stringify([
      { id: 'q1', type: 'multiple-choice', bloomsLevel: 'understand', question: 'What is...?' },
    ]);
    mockAIPreference(runSAMChatWithPreference as jest.Mock, mockQuestions);

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.questions).toHaveLength(1);
    expect(body.questions[0].bloomsLevel).toBe('UNDERSTAND');
  });

  it('normalizes bloomsLevel to uppercase in AI response', async () => {
    const mockQuestions = JSON.stringify([
      { id: 'q1', bloomsLevel: 'analyze', question: 'Compare...' },
    ]);
    mockAIPreference(runSAMChatWithPreference as jest.Mock, mockQuestions);

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    const body = await res.json();
    expect(body.questions[0].bloomsLevel).toBe('ANALYZE');
  });

  it('falls back to mock questions when AI returns non-array', async () => {
    mockAIPreference(runSAMChatWithPreference as jest.Mock, '{"notAnArray": true}');

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.warning).toContain('validation failed');
  });

  // ----- Error handling -----

  it('falls back to mock questions when AI provider throws', async () => {
    (runSAMChatWithPreference as jest.Mock).mockRejectedValue(new Error('API error'));
    // withRetryableTimeout still calls through, so the inner error is caught by the route
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('unavailable');
  });

  it('returns 504 when OperationTimeoutError is thrown at outer level', async () => {
    (withRateLimit as jest.Mock).mockImplementation(() => {
      throw new OperationTimeoutError('exam-generation', 30000);
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(504);
  });

  it('applies default values for optional fields', async () => {
    const minBody = { sectionTitle: 'Basics' };
    const mockQuestions = JSON.stringify([{ id: 'q1', bloomsLevel: 'remember', question: 'What?' }]);
    mockAIPreference(runSAMChatWithPreference as jest.Mock, mockQuestions);

    const res = await POST(createAIRequest(BASE_URL, minBody));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('includes metadata in successful response', async () => {
    const mockQuestions = JSON.stringify([{ id: 'q1', bloomsLevel: 'apply', question: 'How?' }]);
    mockAIPreference(runSAMChatWithPreference as jest.Mock, mockQuestions);

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    const body = await res.json();
    expect(body.metadata).toBeDefined();
    expect(body.metadata.generatedAt).toBeDefined();
  });
});
