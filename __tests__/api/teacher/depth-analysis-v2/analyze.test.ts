jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

jest.mock('@/lib/sam/depth-analysis-v2', () => ({
  createEnhancedAnalyzerV2: jest.fn(() => ({
    analyze: jest.fn(),
  })),
  generateContentHash: jest.fn(() => 'hash-1'),
  runAIAnalysis: jest.fn(),
  determineAnalysisMode: jest.fn(() => ({
    mode: 'quick',
    estimatedTime: '30s',
    totalTokens: 200,
  })),
  BLOOMS_DEPTH_WEIGHTS: {
    REMEMBER: 1,
    UNDERSTAND: 2,
    APPLY: 3,
    ANALYZE: 4,
    EVALUATE: 5,
    CREATE: 6,
  },
}));

jest.mock('@/lib/sam/ai-provider', () => {
  class MockAIAccessDeniedError extends Error {
    enforcement: { suggestedTier: string };
    constructor(message = 'denied') {
      super(message);
      this.enforcement = { suggestedTier: 'PROFESSIONAL' };
    }
  }

  return {
    AIAccessDeniedError: MockAIAccessDeniedError,
  };
});

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/teacher/depth-analysis-v2/analyze/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { generateContentHash, runAIAnalysis } from '@/lib/sam/depth-analysis-v2';

const mockAuth = auth as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;
const mockGenerateContentHash = generateContentHash as jest.Mock;
const mockRunAIAnalysis = runAIAnalysis as jest.Mock;
const mockDb = db as Record<string, any>;

const COURSE_ID = '11111111-1111-1111-1111-111111111111';

function postRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/teacher/depth-analysis-v2/analyze', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function mockCourse() {
  return {
    id: COURSE_ID,
    title: 'Distributed Systems',
    description: 'desc',
    courseGoals: null,
    whatYouWillLearn: [],
    prerequisites: null,
    difficulty: null,
    chapters: [],
  };
}

describe('POST /api/teacher/depth-analysis-v2/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockAuth.mockResolvedValue({ user: { id: 'teacher-1' } });
    mockGenerateContentHash.mockReturnValue('hash-1');

    mockDb.course = {
      findFirst: jest.fn().mockResolvedValue(mockCourse()),
    };
    mockDb.courseDepthAnalysisV2 = {
      findFirst: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn(),
    };
    mockDb.depthAnalysisIssue = {
      createMany: jest.fn(),
    };
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: 'too many requests' }, { status: 429 })
    );

    const res = await POST(postRequest({ courseId: COURSE_ID }));
    expect(res.status).toBe(429);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await POST(postRequest({ courseId: COURSE_ID }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when request payload fails validation', async () => {
    const res = await POST(postRequest({ forceReanalyze: false }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when course is not found or inaccessible', async () => {
    mockDb.course.findFirst.mockResolvedValueOnce(null);

    const res = await POST(postRequest({ courseId: COURSE_ID }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns existing analysis when content is unchanged', async () => {
    mockDb.courseDepthAnalysisV2.findFirst
      .mockResolvedValueOnce({
        id: 'analysis-prev',
        version: 3,
        contentHash: 'hash-1',
      })
      .mockResolvedValueOnce({
        id: 'analysis-prev',
        version: 3,
        issues: [],
      });

    const res = await POST(postRequest({ courseId: COURSE_ID, forceReanalyze: false }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ALREADY_EXISTS');
    expect(body.data.analysisId).toBe('analysis-prev');
    expect(mockRunAIAnalysis).not.toHaveBeenCalled();
  });
});
