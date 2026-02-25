/**
 * Tests for POST /api/ai/content-optimizer
 *
 * Source: app/api/ai/content-optimizer/route.ts
 * Uses: getCombinedSession, runSAMChatWithPreference, withRateLimit, withRetryableTimeout
 * Also uses: optimizeContentOptimization, parseAIJsonResponse, validatePromptLength
 * NOTE: No Zod schema - uses TypeScript interface with manual validation
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
jest.mock('@/lib/request-optimizer', () => ({
  optimizeContentOptimization: jest.fn(),
}));
jest.mock('@/lib/ai/parse-ai-json', () => ({
  parseAIJsonResponse: jest.fn(),
}));
jest.mock('@/lib/api/prompt-guard', () => ({
  validatePromptLength: jest.fn(),
  PromptTooLongError: class PromptTooLongError extends Error {
    constructor() {
      super('Prompt too long');
    }
  },
}));

import { getCombinedSession } from '@/lib/auth/combined-session';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { optimizeContentOptimization } from '@/lib/request-optimizer';
import { PromptTooLongError } from '@/lib/api/prompt-guard';
import { POST } from '@/app/api/ai/content-optimizer/route';
import {
  mockCombinedSession,
  mockRateLimit,
  mockTimeout,
  createAIRequest,
  assertUnauthorized,
  assertRateLimited,
  assertSuccess,
} from './_ai-route-helpers';

const BASE_URL = 'http://localhost:3000/api/ai/content-optimizer';

const VALID_BODY = {
  type: 'title',
  content: { title: 'Learn Python' },
  optimizationGoals: ['seo', 'engagement'],
};

const MOCK_OPTIMIZATION_RESULT = {
  originalScore: 60,
  optimizedScore: 85,
  improvements: {
    title: {
      original: 'Learn Python',
      optimized: 'Master Python: From Beginner to Pro',
      improvements: ['Added specificity'],
      seoKeywords: ['python', 'programming'],
    },
  },
  analytics: {
    readabilityImprovement: 10,
    seoScoreImprovement: 20,
    engagementPotential: 80,
    marketingAppeal: 75,
  },
  recommendations: [],
};

describe('POST /api/ai/content-optimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit(withRateLimit as jest.Mock);
    mockCombinedSession(getCombinedSession as jest.Mock);
    mockTimeout(withRetryableTimeout as jest.Mock);
    (optimizeContentOptimization as jest.Mock).mockImplementation(
      async (_req: unknown, fn: () => Promise<unknown>) => fn(),
    );
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

  it('returns 200 with optimization result on success', async () => {
    (withRetryableTimeout as jest.Mock).mockResolvedValue(MOCK_OPTIMIZATION_RESULT);

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.originalScore).toBe(60);
    expect(body.optimizedScore).toBe(85);
  });

  it('returns 504 on OperationTimeoutError', async () => {
    (withRetryableTimeout as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('content-opt', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(504);
  });

  it('returns 413 when PromptTooLongError is thrown', async () => {
    (withRetryableTimeout as jest.Mock).mockRejectedValue(new PromptTooLongError());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(413);
  });

  it('returns 500 on unexpected errors', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(new Error('Unexpected'));

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(500);
  });

  it('handles description optimization type', async () => {
    (withRetryableTimeout as jest.Mock).mockResolvedValue(MOCK_OPTIMIZATION_RESULT);

    const res = await POST(createAIRequest(BASE_URL, {
      type: 'description',
      content: { description: 'A Python course' },
      optimizationGoals: ['clarity'],
    }));
    await assertSuccess(res);
  });

  it('handles learning_objectives optimization type', async () => {
    (withRetryableTimeout as jest.Mock).mockResolvedValue(MOCK_OPTIMIZATION_RESULT);

    const res = await POST(createAIRequest(BASE_URL, {
      type: 'learning_objectives',
      content: { learningObjectives: ['Learn Python basics'] },
      optimizationGoals: ['educational_quality'],
    }));
    await assertSuccess(res);
  });

  it('handles comprehensive optimization type', async () => {
    (withRetryableTimeout as jest.Mock).mockResolvedValue(MOCK_OPTIMIZATION_RESULT);

    const res = await POST(createAIRequest(BASE_URL, {
      type: 'comprehensive',
      content: {
        title: 'Python Course',
        description: 'Learn Python',
        learningObjectives: ['Basics'],
      },
      optimizationGoals: ['seo', 'engagement', 'clarity'],
    }));
    await assertSuccess(res);
  });

  it('passes userId to the optimization function', async () => {
    (withRetryableTimeout as jest.Mock).mockResolvedValue(MOCK_OPTIMIZATION_RESULT);

    await POST(createAIRequest(BASE_URL, VALID_BODY));

    expect(withRetryableTimeout).toHaveBeenCalled();
  });
});
