/**
 * Tests for POST /api/ai/chapter-sections
 *
 * Source: app/api/ai/chapter-sections/route.ts
 * Uses: getCombinedSession, runSAMChatWithMetadata, withRateLimit, withRetryableTimeout, db
 * Has database ownership check for chapter -> course
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
import { db } from '@/lib/db';
import { POST } from '@/app/api/ai/chapter-sections/route';
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

const BASE_URL = 'http://localhost:3000/api/ai/chapter-sections';

const VALID_BODY = {
  chapterTitle: 'Introduction to HTML',
  courseId: 'course-1',
  chapterId: 'chapter-1',
  sectionCount: 4,
};

function mockChapterOwnership(userId: string = MOCK_USER_ID) {
  (db.chapter.findUnique as jest.Mock).mockResolvedValue({
    id: 'chapter-1',
    courseId: 'course-1',
    course: { userId },
  });
}

describe('POST /api/ai/chapter-sections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit(withRateLimit as jest.Mock);
    mockCombinedSession(getCombinedSession as jest.Mock);
    mockTimeout(withRetryableTimeout as jest.Mock);
    mockChapterOwnership();
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

  it('returns 400 when chapterTitle is missing', async () => {
    const res = await POST(createAIRequest(BASE_URL, { courseId: 'c', chapterId: 'ch' }));
    await assertBadRequest(res);
  });

  it('returns 404 when chapter not found or access denied', async () => {
    (db.chapter.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(404);
  });

  it('returns 200 with sections on success', async () => {
    const mockSections = JSON.stringify([
      { title: 'Intro', description: 'Overview', estimatedTime: '20 min' },
      { title: 'Tags', description: 'HTML Tags', estimatedTime: '30 min' },
      { title: 'Practice', description: 'Hands-on', estimatedTime: '25 min' },
      { title: 'Review', description: 'Assessment', estimatedTime: '15 min' },
    ]);
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: mockSections,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.sections).toHaveLength(4);
  });

  it('falls back when AI returns wrong section count', async () => {
    const wrongCount = JSON.stringify([{ title: 'Only one' }]);
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: wrongCount,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('validation failed');
  });

  it('falls back when AI throws', async () => {
    (runSAMChatWithMetadata as jest.Mock).mockRejectedValue(new Error('API down'));
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('unavailable');
  });

  it('returns 504 on OperationTimeoutError', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('chapter-sections', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(504);
  });
});
