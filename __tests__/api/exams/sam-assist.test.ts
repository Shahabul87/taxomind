jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@sam-ai/educational', () => ({
  createEvaluationEngine: jest.fn(() => ({})),
}));

jest.mock('@/lib/adapters', () => ({
  getUserScopedSAMConfig: jest.fn(async () => ({})),
  getDatabaseAdapter: jest.fn(() => ({})),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn(async (fn: () => Promise<unknown> | unknown) => fn()),
  OperationTimeoutError: class OperationTimeoutError extends Error {
    operationName: string;
    timeoutMs: number;
    constructor(message = 'timeout') {
      super(message);
      this.operationName = 'op';
      this.timeoutMs = 1000;
    }
  },
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 1000 },
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  handleAIAccessError: jest.fn(() => null),
}));

import { POST } from '@/app/api/exams/sam-assist/route';
import { currentUser } from '@/lib/auth';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;

describe('/api/exams/sam-assist route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1', role: 'ADMIN', name: 'Teacher' });
  });

  it('returns early when rate-limited', async () => {
    mockWithRateLimit.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const req = new NextRequest('http://localhost:3000/api/exams/sam-assist', {
      method: 'POST',
      body: JSON.stringify({ action: 'grading-assistance', data: {} }),
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/exams/sam-assist', {
      method: 'POST',
      body: JSON.stringify({ action: 'grading-assistance', data: {} }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 for unknown action', async () => {
    const req = new NextRequest('http://localhost:3000/api/exams/sam-assist', {
      method: 'POST',
      body: JSON.stringify({ action: 'unknown-action', data: {} }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid action');
  });
});
