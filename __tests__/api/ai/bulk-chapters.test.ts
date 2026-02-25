/**
 * Tests for POST /api/ai/bulk-chapters
 *
 * Source: app/api/ai/bulk-chapters/route.ts
 * Uses: getCombinedSession, runSAMChatWithMetadata, withRateLimit, withRetryableTimeout, db
 * Fetches course from DB and generates multiple chapters at once.
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
import { db } from '@/lib/db';
import { POST } from '@/app/api/ai/bulk-chapters/route';
import {
  MOCK_USER_ID,
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

const BASE_URL = 'http://localhost:3000/api/ai/bulk-chapters';

const VALID_BODY = {
  courseId: 'course-1',
  chapterCount: 3,
  difficulty: 'intermediate',
  targetDuration: '3 hours',
};

const MOCK_COURSE = {
  id: 'course-1',
  title: 'Web Development',
  description: 'Learn web dev',
  userId: MOCK_USER_ID,
  whatYouWillLearn: ['HTML', 'CSS', 'JS'],
  chapters: [],
};

function makeMockChapter(index: number) {
  return {
    title: `Chapter ${index}`,
    description: `Description for chapter ${index}`,
    learningOutcomes: ['Outcome 1'],
    prerequisites: 'None',
    estimatedTime: '3 hours',
    difficulty: 'intermediate',
    sections: [
      {
        title: 'Intro',
        description: 'Introduction',
        type: 'video',
        estimatedTime: '20 min',
        learningObjectives: ['Learn'],
        keyPoints: ['Point 1'],
      },
    ],
    assessmentSuggestions: [
      { type: 'Quiz', description: 'Test', estimatedTime: '15 min' },
    ],
  };
}

describe('POST /api/ai/bulk-chapters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit(withRateLimit as jest.Mock);
    mockCombinedSession(getCombinedSession as jest.Mock);
    mockTimeout(withRetryableTimeout as jest.Mock);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
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

  it('returns 400 when courseId is missing', async () => {
    const res = await POST(createAIRequest(BASE_URL, { chapterCount: 3, difficulty: 'beginner', targetDuration: '2h' }));
    await assertBadRequest(res);
  });

  it('returns 400 when chapterCount is less than 2', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, chapterCount: 1 }));
    await assertBadRequest(res);
  });

  it('returns 400 when difficulty is invalid', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, difficulty: 'master' }));
    await assertBadRequest(res);
  });

  it('returns 404 when course not found', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(404);
  });

  it('returns 200 with chapters on success', async () => {
    const mockChapters = [makeMockChapter(1), makeMockChapter(2), makeMockChapter(3)];
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: JSON.stringify(mockChapters),
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);
  });

  it('falls back to mock when AI returns insufficient valid chapters', async () => {
    // Return only 1 valid chapter when 3 were requested
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: JSON.stringify([makeMockChapter(1)]),
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('incomplete');
  });

  it('falls back to mock when AI throws', async () => {
    (runSAMChatWithMetadata as jest.Mock).mockRejectedValue(new Error('API error'));
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('unavailable');
  });

  it('returns 504 on OperationTimeoutError in inner catch', async () => {
    (withRetryableTimeout as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('bulk-chapters', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(504);
  });

  it('returns 504 on OperationTimeoutError in outer catch', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('bulk-chapters', 30000),
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
