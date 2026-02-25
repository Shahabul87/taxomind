/**
 * Tests for POST /api/ai/course-planner
 *
 * Source: app/api/ai/course-planner/route.ts
 * Uses: getCombinedSession, runSAMChatWithMetadata, withRateLimit, withRetryableTimeout
 * Schema imported from @/lib/ai-course-types (CourseGenerationRequestSchema)
 */

jest.mock('@/lib/auth/combined-session', () => ({
  getCombinedSession: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
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
import { POST } from '@/app/api/ai/course-planner/route';
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

const BASE_URL = 'http://localhost:3000/api/ai/course-planner';

const VALID_BODY = {
  topic: 'Machine Learning Fundamentals',
  targetAudience: 'Software developers',
  duration: '40 hours',
  difficulty: 'intermediate',
  learningGoals: ['Understand ML basics', 'Build a model'],
};

const MOCK_COURSE_RESPONSE = {
  title: 'ML Fundamentals',
  description: 'A comprehensive ML course.',
  courseGoals: 'Master ML basics.',
  prerequisites: [],
  estimatedDuration: 40,
  targetAudience: 'Software developers',
  difficulty: 'intermediate',
  chapters: [
    {
      title: 'Intro to ML',
      description: 'Overview',
      learningObjectives: ['Understand ML'],
      estimatedTime: '5 hours',
      difficulty: 'beginner',
      prerequisites: [],
      sections: [
        {
          title: 'What is ML?',
          description: 'Definition',
          contentType: 'video',
          estimatedTime: '30 min',
          learningObjectives: ['Define ML'],
        },
      ],
    },
  ],
  whatYouWillLearn: ['ML basics'],
  courseStructure: {
    totalChapters: 1,
    totalSections: 1,
    contentMix: { video: 50, article: 30, exercise: 20 },
  },
};

describe('POST /api/ai/course-planner', () => {
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
    const res = await POST(createAIRequest(BASE_URL, { targetAudience: 'devs', duration: '10h', difficulty: 'beginner', learningGoals: ['x'] }));
    await assertBadRequest(res);
  });

  it('returns 400 when learningGoals is empty', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, learningGoals: [] }));
    await assertBadRequest(res);
  });

  it('returns 400 when difficulty is invalid enum', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, difficulty: 'expert' }));
    await assertBadRequest(res);
  });

  it('returns 400 when duration is missing', async () => {
    const { duration, ...noDuration } = VALID_BODY;
    const res = await POST(createAIRequest(BASE_URL, noDuration));
    await assertBadRequest(res);
  });

  it('returns 200 with course plan on success', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: JSON.stringify(MOCK_COURSE_RESPONSE),
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.title).toBeDefined();
  });

  it('falls back to mock when AI JSON validation fails', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: JSON.stringify({ invalid: true }),
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('validation failed');
  });

  it('falls back to mock when AI returns non-JSON', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: 'This is not JSON at all',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toBeDefined();
  });

  it('falls back to mock when AI provider throws', async () => {
    (runSAMChatWithMetadata as jest.Mock).mockRejectedValue(new Error('API error'));
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('unavailable');
  });

  it('returns 504 on OperationTimeoutError inside inner catch', async () => {
    (withRetryableTimeout as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('course-planner', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(504);
  });

  it('returns 500 on unexpected errors', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(new Error('Unexpected'));

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(500);
  });

  it('includes metadata with provider info in successful response', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: JSON.stringify(MOCK_COURSE_RESPONSE),
      provider: 'deepseek',
      model: 'deepseek-chat',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    const body = await res.json();
    expect(body.metadata?.provider).toBe('deepseek');
  });

  it('accepts optional description and preferredContentTypes', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: JSON.stringify(MOCK_COURSE_RESPONSE),
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, {
      ...VALID_BODY,
      description: 'Extra context',
      preferredContentTypes: ['video', 'exercise'],
    }));
    await assertSuccess(res);
  });
});
