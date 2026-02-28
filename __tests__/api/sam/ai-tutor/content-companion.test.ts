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

import { POST } from '@/app/api/sam/ai-tutor/content-companion/route';
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

describe('/api/sam/ai-tutor/content-companion route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockWithRetryableTimeout.mockImplementation((fn: () => Promise<unknown>) => fn());
    mockHandleAIAccessError.mockReturnValue(null);
    mockRunSAMChat.mockResolvedValue(
      [
        'practice: Try restating the idea in your own words.',
        'connect this to loops in earlier lessons.',
        'visual: Create a small diagram.',
        'next: Revisit key terms.',
      ].join(' ')
    );
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-companion', {
      method: 'POST',
      body: JSON.stringify({ interactionType: 'video_timestamp_help' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(429);
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-companion', {
      method: 'POST',
      body: JSON.stringify({ interactionType: 'video_timestamp_help' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 for unknown interaction type', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-companion', {
      method: 'POST',
      body: JSON.stringify({ interactionType: 'unknown', contentContext: {}, userInput: {}, learningState: {} }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns contextual response for video timestamp help', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-companion', {
      method: 'POST',
      body: JSON.stringify({
        interactionType: 'video_timestamp_help',
        contentContext: {},
        userInput: {
          videoTitle: 'Async JS',
          timestamp: '02:15',
          transcriptSegment: 'Promises resolve asynchronously',
          userQuestion: 'Why does this run later?',
        },
        learningState: {
          currentTopic: 'Event loop',
          difficultyLevel: 'intermediate',
          learningStyle: 'visual',
        },
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.interactionType).toBe('video_timestamp_help');
    expect(body.response.type).toBe('video_help');
    expect(body.followUpSuggestions).toContain('Ask about another part of the video');
    expect(mockRunSAMChat).toHaveBeenCalled();
  });

  it('returns quiz hint payload with requested assistance level', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-companion', {
      method: 'POST',
      body: JSON.stringify({
        interactionType: 'quiz_hint_request',
        contentContext: {},
        userInput: {
          question: 'What is closure?',
          studentAnswer: 'A function maybe',
          questionType: 'short_answer',
          bloomsLevel: 'UNDERSTAND',
        },
        learningState: {
          performanceLevel: 'medium',
          learningStyle: 'textual',
          subjectMastery: 'intermediate',
        },
        assistanceLevel: 'moderate',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.response.type).toBe('quiz_hint');
    expect(body.response.assistanceLevel).toBe('moderate');
    expect(body.followUpSuggestions).toContain('Ask for a different type of hint');
  });

  it('returns 504 on timeout', async () => {
    mockWithRetryableTimeout.mockImplementationOnce(() => {
      throw new OperationTimeoutError('contentCompanion-chat', 30000);
    });

    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-companion', {
      method: 'POST',
      body: JSON.stringify({
        interactionType: 'video_timestamp_help',
        contentContext: {},
        userInput: {
          videoTitle: 'Timeout video',
          timestamp: '00:30',
          transcriptSegment: 'segment',
          userQuestion: 'question',
        },
        learningState: {
          currentTopic: 'Topic',
          difficultyLevel: 'basic',
          learningStyle: 'visual',
        },
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

    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/content-companion', {
      method: 'POST',
      body: JSON.stringify({
        interactionType: 'video_timestamp_help',
        contentContext: {},
        userInput: {
          videoTitle: 'Quota video',
          timestamp: '00:30',
          transcriptSegment: 'segment',
          userQuestion: 'question',
        },
        learningState: {
          currentTopic: 'Topic',
          difficultyLevel: 'basic',
          learningStyle: 'visual',
        },
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(402);
  });
});
