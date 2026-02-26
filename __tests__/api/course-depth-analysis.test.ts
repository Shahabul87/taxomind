jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
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

jest.mock('@sam-ai/educational/depth-analysis', () => ({
  createEnhancedDepthAnalysisEngine: jest.fn(() => ({
    analyzeCourse: jest.fn(),
  })),
  deterministicRubricEngine: { evaluate: jest.fn() },
  deepContentAnalyzer: { analyze: jest.fn() },
  distributionAnalyzer: { analyze: jest.fn() },
  generateCourseContentHash: jest.fn(() => 'hash'),
  getCitationString: jest.fn(() => 'citation'),
  getValidatedDistribution: jest.fn(() => ({
    remember: 10,
    understand: 20,
    apply: 20,
    analyze: 20,
    evaluate: 15,
    create: 15,
  })),
  olcEvaluator: { evaluate: jest.fn() },
  qmEvaluator: { evaluate: jest.fn() },
  serializeAnalysisResult: jest.fn((x: unknown) => x),
  transcriptAnalyzer: { analyze: jest.fn() },
}));

jest.mock('@/lib/adapters', () => ({
  PrismaCourseDepthAnalysisStore: jest.fn(),
}));

import { GET, POST } from '@/app/api/course-depth-analysis/route';
import { currentUser } from '@/lib/auth';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;

const mockCourseFindUnique = db.course.findUnique as jest.Mock;
const mockCourseBloomsFindUnique = db.courseBloomsAnalysis.findUnique as jest.Mock;

describe('api/course-depth-analysis route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockReturnValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockCourseFindUnique.mockResolvedValue({ id: 'course-1', userId: 'user-1', chapters: [] });
    mockCourseBloomsFindUnique.mockResolvedValue(null);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/course-depth-analysis?courseId=course-1');

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns 400 when courseId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/course-depth-analysis');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('courseId is required');
  });

  it('GET returns 404 when course does not exist', async () => {
    mockCourseFindUnique.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/course-depth-analysis?courseId=missing');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Course not found');
  });

  it('POST returns rate-limit response when limiter blocks', async () => {
    mockWithRateLimit.mockReturnValueOnce(NextResponse.json({ error: 'rate limited' }, { status: 429 }));
    const req = new NextRequest('http://localhost:3000/api/course-depth-analysis', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'course-1' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(429);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/course-depth-analysis', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'course-1' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('POST returns 404 when course does not exist', async () => {
    mockCourseFindUnique.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/course-depth-analysis', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'missing' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Course not found');
  });
});
