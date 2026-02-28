jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
  handleAIAccessError: jest.fn(() => null),
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn((fn: () => Promise<unknown>) => fn()),
  OperationTimeoutError: class OperationTimeoutError extends Error {
    operationName: string;
    timeoutMs: number;

    constructor(operationName: string, timeoutMs: number) {
      super(`Timeout: ${operationName}`);
      this.operationName = operationName;
      this.timeoutMs = timeoutMs;
    }
  },
  TIMEOUT_DEFAULTS: {
    AI_ANALYSIS: 30000,
  },
}));

import { POST } from '@/app/api/sam/ai-tutor/visual-processor/route';
import { currentUser } from '@/lib/auth';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { NextRequest, NextResponse } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockRunSAMChat = runSAMChatWithPreference as jest.Mock;
const mockHandleAIAccessError = handleAIAccessError as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;
const mockWithRetryableTimeout = withRetryableTimeout as jest.Mock;

describe('/api/sam/ai-tutor/visual-processor route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockWithRetryableTimeout.mockImplementation((fn: () => Promise<unknown>) => fn());
    mockHandleAIAccessError.mockReturnValue(null);
    mockRunSAMChat.mockResolvedValue(
      [
        'visual elements: diagram and labels.',
        'learning opportunities: compare shapes.',
        'discussion questions: Why is this relationship important?',
        'curriculum connections: systems thinking.',
        'activities: annotation drill.',
        'assessments: quick check.',
        'accessibility: high contrast.',
        'resources: textbook chapter 1.',
      ].join(' ')
    );
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/visual-processor', {
      method: 'POST',
      body: JSON.stringify({ processingType: 'image_analysis' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/visual-processor', {
      method: 'POST',
      body: JSON.stringify({ processingType: 'image_analysis' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 for unknown processing type', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/visual-processor', {
      method: 'POST',
      body: JSON.stringify({ processingType: 'unknown', visualData: {}, learningContext: {} }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns image analysis payload for valid requests', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/visual-processor', {
      method: 'POST',
      body: JSON.stringify({
        processingType: 'image_analysis',
        visualData: {
          imageDescription: 'A biology diagram of a cell with labeled organelles',
          imageUrl: 'https://example.com/cell.png',
          subject: 'Biology',
          learningObjectives: 'Identify cell components',
        },
        learningContext: {
          level: 'beginner',
          visualLearning: 'high',
          currentTopic: 'Cell structure',
        },
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.processingType).toBe('image_analysis');
    expect(body.result.type).toBe('image_analysis');
    expect(body.learningApplications).toContain('Use for visual comprehension exercises');
    expect(mockRunSAMChat).toHaveBeenCalled();
  });

  it('returns 504 on timeout', async () => {
    mockWithRetryableTimeout.mockImplementationOnce(() => {
      throw new OperationTimeoutError('visualProcessor-chat', 30000);
    });

    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/visual-processor', {
      method: 'POST',
      body: JSON.stringify({
        processingType: 'image_analysis',
        visualData: {
          imageDescription: 'timeout path image',
          subject: 'Biology',
          learningObjectives: 'Identify parts',
        },
        learningContext: {
          level: 'beginner',
          visualLearning: 'high',
          currentTopic: 'Cell structure',
        },
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(504);
  });

  it('returns mapped access-error response when AI access fails', async () => {
    mockWithRetryableTimeout.mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });
    mockHandleAIAccessError.mockReturnValueOnce(
      NextResponse.json({ error: 'AI access denied' }, { status: 402 })
    );

    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/visual-processor', {
      method: 'POST',
      body: JSON.stringify({
        processingType: 'image_analysis',
        visualData: {
          imageDescription: 'quota path image',
          subject: 'Biology',
          learningObjectives: 'Identify parts',
        },
        learningContext: {
          level: 'beginner',
          visualLearning: 'high',
          currentTopic: 'Cell structure',
        },
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(402);
  });
});
