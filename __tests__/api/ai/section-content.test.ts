/**
 * Tests for POST /api/ai/section-content
 *
 * Source: app/api/ai/section-content/route.ts
 * Uses: getCombinedSession, runSAMChatWithMetadata, withRateLimit, withRetryableTimeout, db
 * Has database ownership check for section -> chapter -> course
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
import { withRetryableTimeout } from '@/lib/sam/utils/timeout';
import { db } from '@/lib/db';
import { POST } from '@/app/api/ai/section-content/route';
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

const BASE_URL = 'http://localhost:3000/api/ai/section-content';

const VALID_BODY = {
  sectionTitle: 'Understanding React State',
  chapterTitle: 'React Basics',
  courseId: 'course-1',
  chapterId: 'chapter-1',
  sectionId: 'section-1',
  contentType: 'learningObjectives',
};

function mockSectionOwnership(userId: string = MOCK_USER_ID) {
  (db.section.findUnique as jest.Mock).mockResolvedValue({
    id: 'section-1',
    chapterId: 'chapter-1',
    chapter: {
      courseId: 'course-1',
      course: { userId },
    },
  });
}

describe('POST /api/ai/section-content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit(withRateLimit as jest.Mock);
    mockCombinedSession(getCombinedSession as jest.Mock);
    mockTimeout(withRetryableTimeout as jest.Mock);
    mockSectionOwnership();
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
    const { sectionTitle, ...noTitle } = VALID_BODY;
    const res = await POST(createAIRequest(BASE_URL, noTitle));
    await assertBadRequest(res);
  });

  it('returns 400 when contentType is invalid', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, contentType: 'essay' }));
    await assertBadRequest(res);
  });

  it('returns 404 when section not found', async () => {
    (db.section.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(404);
  });

  it('returns 403 when user does not own the course', async () => {
    mockSectionOwnership('other-user-id');

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(403);
  });

  it('returns 200 with learning objectives on success', async () => {
    const htmlContent = '<ul><li>Understand state management in React</li></ul>';
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: htmlContent,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.content).toContain('<ul>');
  });

  it('returns 200 with description on success', async () => {
    const htmlContent = '<p>This section covers React state management in depth.</p>';
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: htmlContent,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, contentType: 'description' }));
    await assertSuccess(res);
  });

  it('falls back to mock when AI returns non-HTML', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: 'Plain text without HTML tags',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    const body = await res.json();
    expect(body.warning).toContain('validation failed');
  });

  it('falls back to mock when AI throws', async () => {
    (runSAMChatWithMetadata as jest.Mock).mockRejectedValue(new Error('API error'));
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('unavailable');
  });
});
