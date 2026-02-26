jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn().mockResolvedValue('AI insight output'),
  handleAIAccessError: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn((fn: () => Promise<unknown>) => fn()),
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

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

import { GET, POST } from '@/app/api/sam/ai-tutor/teacher-insights/route';
import { currentUser } from '@/lib/auth';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;

describe('api/sam/ai-tutor/teacher-insights route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    mockWithRateLimit.mockReturnValue(null);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/teacher-insights');

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns 400 for invalid metric', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/teacher-insights?metric=invalid');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid metric type');
  });

  it('POST returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockReturnValueOnce(NextResponse.json({ error: 'limited' }, { status: 429 }));
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/teacher-insights', {
      method: 'POST',
      body: JSON.stringify({ action: 'generate_intervention' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/teacher-insights', {
      method: 'POST',
      body: JSON.stringify({ action: 'generate_intervention' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST returns 400 for invalid action', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/teacher-insights', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid_action' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid action');
  });
});
