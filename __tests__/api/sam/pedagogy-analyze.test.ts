/**
 * Tests for SAM Pedagogy Analyze Route - app/api/sam/pedagogy/analyze/route.ts
 *
 * Covers: POST (analyze content pedagogically), GET (evaluator info)
 * Auth: Uses auth() from @/auth (session-based)
 */

const mockPedagogyResult = {
  passed: true,
  overallScore: 85,
  evaluatorResults: {
    blooms: {
      passed: true, score: 80, confidence: 0.9,
      dominantLevel: 'ANALYZE', targetLevel: 'ANALYZE',
      alignmentStatus: 'aligned', levelDistance: 0,
      detectedDistribution: {}, verbAnalysis: {}, activityAnalysis: {},
    },
    scaffolding: null,
    zpd: null,
  },
  allIssues: [],
  allRecommendations: ['Good content structure'],
  metadata: {
    evaluatorsRun: ['blooms'],
    totalTimeMs: 150,
    studentProfileUsed: false,
  },
};

// @sam-ai/pedagogy is globally mocked via __mocks__/@sam-ai/pedagogy/index.js

jest.mock('@/lib/sam/ai-provider', () => ({
  withSubscriptionGate: jest.fn().mockResolvedValue({ allowed: true }),
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn((fn: () => Promise<unknown>) => fn()),
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000 },
}));

import { POST, GET } from '@/app/api/sam/pedagogy/analyze/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

// Get the mock function reference from the globally mocked module
const { evaluatePedagogically: mockEvaluateFn } = jest.requireMock('@sam-ai/pedagogy') as {
  evaluatePedagogically: jest.Mock;
};

// Get all mock references from globally mocked modules
const { withSubscriptionGate: mockGate } = jest.requireMock('@/lib/sam/ai-provider') as {
  withSubscriptionGate: jest.Mock;
};
const { withRateLimit: mockRateLimit } = jest.requireMock('@/lib/sam/middleware/rate-limiter') as {
  withRateLimit: jest.Mock;
};
const { withRetryableTimeout: mockTimeout } = jest.requireMock('@/lib/sam/utils/timeout') as {
  withRetryableTimeout: jest.Mock;
};

describe('POST /api/sam/pedagogy/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore all mock implementations after clearAllMocks (restoreMocks: true strips them)
    mockEvaluateFn.mockResolvedValue(mockPedagogyResult);
    mockGate.mockResolvedValue({ allowed: true });
    mockRateLimit.mockReturnValue(null);
    mockTimeout.mockImplementation((fn: () => Promise<unknown>) => fn());
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/sam/pedagogy/analyze', {
      method: 'POST',
      body: JSON.stringify({ content: 'test content for analysis', type: 'lesson' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('analyzes content pedagogically', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/pedagogy/analyze', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This lesson teaches students to analyze complex data structures.',
        type: 'lesson',
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    // Response shape from transformResult: evaluators, issues, recommendations, metadata
    expect(data.data.evaluators).toBeDefined();
    expect(data.data.metadata).toBeDefined();
    expect(data.data.recommendations).toBeDefined();
  });

  it('returns 400 for invalid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/pedagogy/analyze', {
      method: 'POST',
      body: JSON.stringify({ content: 'short', type: 'invalid-type' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('validates content minimum length', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/pedagogy/analyze', {
      method: 'POST',
      body: JSON.stringify({ content: 'short', type: 'lesson' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('supports target Blooms level', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/pedagogy/analyze', {
      method: 'POST',
      body: JSON.stringify({
        content: 'Analyze and evaluate the following data structures for efficiency.',
        type: 'assessment',
        targetBloomsLevel: 'ANALYZE',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('supports evaluator selection', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/pedagogy/analyze', {
      method: 'POST',
      body: JSON.stringify({
        content: 'Explain the concept of recursion and demonstrate with examples.',
        type: 'lesson',
        evaluators: ['blooms', 'scaffolding'],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('returns metadata in response', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/pedagogy/analyze', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This lesson covers fundamental programming concepts for beginners.',
        type: 'lesson',
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.data.metadata).toBeDefined();
    expect(data.data.metadata.processingTimeMs).toBeDefined();
    expect(data.data.metadata.evaluatorsRun).toBeDefined();
  });

  it('returns 500 on engine error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    // Override withRetryableTimeout to throw directly
    const { withRetryableTimeout } = jest.requireMock('@/lib/sam/utils/timeout') as {
      withRetryableTimeout: jest.Mock;
    };
    withRetryableTimeout.mockRejectedValueOnce(new Error('Engine failure'));

    const req = new NextRequest('http://localhost:3000/api/sam/pedagogy/analyze', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This is valid content for analysis testing purposes.',
        type: 'lesson',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/sam/pedagogy/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/sam/pedagogy/analyze');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns evaluator information', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/pedagogy/analyze');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.evaluators).toBeDefined();
    expect(data.data.evaluators).toHaveLength(3);
    expect(data.data.bloomsLevels).toBeDefined();
    expect(data.data.zpdZones).toBeDefined();
  });
});
