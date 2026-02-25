/**
 * Tests for POST /api/ai/exercise-generator
 *
 * Source: app/api/ai/exercise-generator/route.ts
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
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000 },
}));

import { getCombinedSession } from '@/lib/auth/combined-session';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { POST } from '@/app/api/ai/exercise-generator/route';
import {
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

const BASE_URL = 'http://localhost:3000/api/ai/exercise-generator';

const VALID_BODY = {
  topic: 'Data Structures',
  exerciseCount: 3,
};

describe('POST /api/ai/exercise-generator', () => {
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

  it('returns 400 when topic is missing', async () => {
    const res = await POST(createAIRequest(BASE_URL, { exerciseCount: 2 }));
    await assertBadRequest(res);
  });

  it('returns 400 when exerciseType is invalid', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, exerciseType: 'quiz' }));
    await assertBadRequest(res);
  });

  it('returns 400 when exerciseCount exceeds 10', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, exerciseCount: 15 }));
    await assertBadRequest(res);
  });

  it('returns 200 with exercises on success', async () => {
    const mockExercises = JSON.stringify([
      { title: 'Exercise 1', type: 'problem_solving', difficulty: 'intermediate' },
    ]);
    mockAIPreference(runSAMChatWithPreference as jest.Mock, mockExercises);

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.exercises).toHaveLength(1);
  });

  it('falls back to mock when AI returns non-array', async () => {
    mockAIPreference(runSAMChatWithPreference as jest.Mock, '{"not": "array"}');

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('validation failed');
  });

  it('falls back to mock when AI throws', async () => {
    (runSAMChatWithPreference as jest.Mock).mockRejectedValue(new Error('Provider down'));
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('unavailable');
  });

  it('returns 504 on OperationTimeoutError', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('exercise-gen', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(504);
  });

  it('includes metadata in successful response', async () => {
    const mockExercises = JSON.stringify([{ title: 'Ex1' }]);
    mockAIPreference(runSAMChatWithPreference as jest.Mock, mockExercises);

    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, exerciseType: 'coding_challenge', difficulty: 'advanced' }));
    const body = await res.json();
    expect(body.metadata.exerciseType).toBe('coding_challenge');
    expect(body.metadata.difficulty).toBe('advanced');
  });
});
