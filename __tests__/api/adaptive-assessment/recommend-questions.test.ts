jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
  handleAIAccessError: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn(async (fn: () => Promise<unknown>) => fn()),
  OperationTimeoutError: class OperationTimeoutError extends Error {
    operationName = 'adaptiveQuestionRecommend';
    timeoutMs = 1000;
  },
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 1000 },
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

import { POST } from '@/app/api/adaptive-assessment/recommend-questions/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;

describe('/api/adaptive-assessment/recommend-questions route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.section.findUnique as jest.Mock).mockResolvedValue(null);
  });

  it('returns rate limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 })
    );

    const req = new NextRequest('http://localhost:3000/api/adaptive-assessment/recommend-questions', {
      method: 'POST',
      body: JSON.stringify({ sectionId: 'section-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/adaptive-assessment/recommend-questions', {
      method: 'POST',
      body: JSON.stringify({ sectionId: 'section-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/adaptive-assessment/recommend-questions', {
      method: 'POST',
      body: JSON.stringify({ sectionId: 123, questionCount: 50 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when section is not found', async () => {
    const req = new NextRequest('http://localhost:3000/api/adaptive-assessment/recommend-questions', {
      method: 'POST',
      body: JSON.stringify({ sectionId: 'missing-section', questionCount: 5 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
