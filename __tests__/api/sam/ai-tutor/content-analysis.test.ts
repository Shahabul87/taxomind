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

import { POST } from '@/app/api/sam/ai-tutor/content-analysis/route';
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

describe('/api/sam/ai-tutor/content-analysis route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockWithRetryableTimeout.mockImplementation((fn: () => Promise<unknown>) => fn());
    mockHandleAIAccessError.mockReturnValue(null);
    mockRunSAMChat.mockResolvedValue(
      [
        'key topics: loops, conditions, functions.',
        'difficulty: intermediate.',
        'learning objectives: understand loops, write functions.',
        'study questions: what is a loop?.',
        'interactive activities: coding drills, pair review.',
        'chapters: introduction, practice.',
        'engagement factors: examples, visuals.',
        'accessibility: captions, clear contrast.',
      ].join(' ')
    );
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-analysis', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'text' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(429);
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-analysis', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'text' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 for unsupported content type', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-analysis', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'audio', contentData: {}, analysisType: 'overview', learningContext: {} }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns analysis payload for text content', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-analysis', {
      method: 'POST',
      body: JSON.stringify({
        contentType: 'text',
        contentData: {
          title: 'Intro to JS',
          type: 'lesson',
          wordCount: 350,
          content: 'JavaScript functions can be declared and invoked.',
        },
        analysisType: 'learning-support',
        learningContext: {
          gradeLevel: 'high-school',
        },
        userRole: 'student',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.contentType).toBe('text');
    expect(body.analysis.type).toBe('text');
    expect(body.suggestions).toContain('Ask questions about confusing concepts');
    expect(mockRunSAMChat).toHaveBeenCalled();
  });

  it('returns content-specific suggestions for code with teacher role', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-analysis', {
      method: 'POST',
      body: JSON.stringify({
        contentType: 'code',
        contentData: {
          title: 'Loop example',
          description: 'for loop',
          language: 'javascript',
          code: 'for (let i=0;i<3;i++) { console.log(i) }',
        },
        analysisType: 'pedagogical',
        learningContext: {},
        userRole: 'teacher',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.analysis.type).toBe('code');
    expect(body.suggestions).toContain('Generate assessment questions');
    expect(body.suggestions).toHaveLength(4);
  });

  it('returns 504 on timeout', async () => {
    mockWithRetryableTimeout.mockImplementationOnce(() => {
      throw new OperationTimeoutError('contentAnalysis-analyze', 30000);
    });

    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-analysis', {
      method: 'POST',
      body: JSON.stringify({
        contentType: 'text',
        contentData: {
          title: 'Timeout doc',
          type: 'lesson',
          wordCount: 120,
          content: 'timeout path content',
        },
        analysisType: 'overview',
        learningContext: {},
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(504);
  });

  it('returns mapped access-error response when provider access fails', async () => {
    mockWithRetryableTimeout.mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });
    mockHandleAIAccessError.mockReturnValueOnce(
      NextResponse.json({ error: 'AI access denied' }, { status: 402 })
    );

    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-analysis', {
      method: 'POST',
      body: JSON.stringify({
        contentType: 'text',
        contentData: {
          title: 'Quota doc',
          type: 'lesson',
          wordCount: 120,
          content: 'quota path content',
        },
        analysisType: 'overview',
        learningContext: {},
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(402);
  });
});
