/**
 * Tests for POST /api/ai/content-curator
 *
 * Source: app/api/ai/content-curator/route.ts
 * Uses: getCombinedSession, runSAMChatWithMetadata, withRateLimit, withRetryableTimeout
 * Schema imported from @/lib/ai-course-types (ContentCurationRequestSchema)
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
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000 },
}));

import { getCombinedSession } from '@/lib/auth/combined-session';
import { runSAMChatWithMetadata } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { POST } from '@/app/api/ai/content-curator/route';
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

const BASE_URL = 'http://localhost:3000/api/ai/content-curator';

const VALID_BODY = {
  sectionTopic: 'React Hooks',
  learningObjectives: ['Understand useState', 'Master useEffect'],
  contentTypes: ['video', 'article'],
  targetAudience: 'JavaScript developers',
  difficulty: 'intermediate',
};

const MOCK_CURATION_RESPONSE = {
  recommendedContent: {
    videos: [
      {
        title: 'React Hooks Tutorial',
        description: 'Comprehensive guide',
        estimatedTime: '45 min',
        difficulty: 'intermediate',
        qualityScore: 8.5,
        relevanceScore: 9,
        tags: ['react', 'hooks'],
        reasoning: 'High quality',
      },
    ],
    articles: [],
    blogs: [],
    exercises: [],
  },
  studyNotes: 'Key notes about hooks',
  keyConcepts: ['useState', 'useEffect'],
  practiceQuestions: ['What is useState?'],
  contentMixRecommendation: {
    totalItems: 1,
    videoPercentage: 100,
    articlePercentage: 0,
    blogPercentage: 0,
    exercisePercentage: 0,
  },
  learningPath: [
    { step: 1, activity: 'Watch video', estimatedTime: '45 min', contentType: 'video' },
  ],
};

describe('POST /api/ai/content-curator', () => {
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

  it('returns 400 when sectionTopic is missing', async () => {
    const { sectionTopic, ...noTopic } = VALID_BODY;
    const res = await POST(createAIRequest(BASE_URL, noTopic));
    await assertBadRequest(res);
  });

  it('returns 400 when learningObjectives is empty', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, learningObjectives: [] }));
    await assertBadRequest(res);
  });

  it('returns 400 when contentTypes is empty', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, contentTypes: [] }));
    await assertBadRequest(res);
  });

  it('returns 400 when difficulty is invalid', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, difficulty: 'master' }));
    await assertBadRequest(res);
  });

  it('returns 200 with curated content on success', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: JSON.stringify(MOCK_CURATION_RESPONSE),
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.recommendedContent).toBeDefined();
  });

  it('falls back to mock when AI response validation fails', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: JSON.stringify({ incomplete: true }),
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
      new OperationTimeoutError('content-curation', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(504);
  });

  it('returns 500 on unexpected errors', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(new Error('Unexpected'));

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(500);
  });

  it('includes metadata with provider info on success', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: JSON.stringify(MOCK_CURATION_RESPONSE),
      provider: 'deepseek',
      model: 'deepseek-chat',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    const body = await res.json();
    expect(body.metadata.provider).toBe('deepseek');
  });

  it('accepts optional keywords and estimatedTime', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: JSON.stringify(MOCK_CURATION_RESPONSE),
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, {
      ...VALID_BODY,
      keywords: ['hooks', 'state'],
      estimatedTime: '2 hours',
    }));
    await assertSuccess(res);
  });
});
