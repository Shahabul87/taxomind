jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn().mockResolvedValue('Question 1: Sample?\nA) A\nB) B\nCorrect Answer: A\nExplanation: ok'),
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

import { POST } from '@/app/api/sam/ai-tutor/assessment-engine/route';
import { currentUser } from '@/lib/auth';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;

describe('api/sam/ai-tutor/assessment-engine route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockReturnValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockReturnValueOnce(NextResponse.json({ error: 'limited' }, { status: 429 }));
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/assessment-engine', {
      method: 'POST',
      body: JSON.stringify({ action: 'generate_assessment' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/assessment-engine', {
      method: 'POST',
      body: JSON.stringify({ action: 'generate_assessment' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid action', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/assessment-engine', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid_action' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid action');
  });

  it('returns 200 for generate_assessment action', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/assessment-engine', {
      method: 'POST',
      body: JSON.stringify({
        action: 'generate_assessment',
        assessmentType: 'quiz',
        subject: 'Math',
        topic: 'Algebra',
        difficulty: 'medium',
        questionCount: 1,
        learningObjectives: ['Solve equations'],
        bloomsLevels: ['apply'],
        questionTypes: ['multiple-choice'],
        duration: '10 minutes',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.action).toBe('generate_assessment');
    expect(body.userId).toBe('user-1');
  });
});
