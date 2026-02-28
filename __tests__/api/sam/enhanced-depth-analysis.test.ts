jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@sam-ai/educational/depth-analysis', () => ({
  createEnhancedDepthAnalysisEngine: jest.fn(() => ({
    analyze: jest.fn(),
    getHistoricalTrends: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('@sam-ai/educational', () => ({
  createMultiFrameworkEvaluator: jest.fn(() => ({ evaluate: jest.fn().mockResolvedValue({ metadata: { frameworksUsed: [] }, compositeScore: 0 }) })),
  createAlignmentEngine: jest.fn(() => ({ analyzeAlignment: jest.fn().mockResolvedValue({ summary: { totalObjectives: 0, fullyCoveredObjectives: 0 }, alignmentScore: 0, gaps: [] }) })),
  createEvidenceService: jest.fn(() => ({ summarizeEvidence: jest.fn().mockResolvedValue({}) })),
  PrismaAnalysisEvidenceStore: jest.fn(),
  createContentIngestionPipeline: jest.fn(() => ({ ingest: jest.fn().mockResolvedValue({ processedSources: 0 }) })),
  PrismaContentSourceStore: jest.fn(),
  createDepthAnalysisLLMAdapter: jest.fn(() => ({
    classifyBlooms: jest.fn(),
    classifyDOK: jest.fn(),
    classifyMultiFramework: jest.fn(),
    analyzeAlignment: jest.fn(),
    generateRecommendations: jest.fn(),
  })),
}));

var mockGetCachedAnalysis = jest.fn().mockResolvedValue(null);

jest.mock('@/lib/adapters', () => ({
  PrismaCourseDepthAnalysisStore: jest.fn().mockImplementation(() => ({
    getCachedAnalysis: mockGetCachedAnalysis,
  })),
}));

import { GET, POST } from '@/app/api/sam/enhanced-depth-analysis/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const { createEnhancedDepthAnalysisEngine: mockCreateEngine } = jest.requireMock(
  '@sam-ai/educational/depth-analysis'
) as {
  createEnhancedDepthAnalysisEngine: jest.Mock;
};

describe('/api/sam/enhanced-depth-analysis route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockCreateEngine.mockReturnValue({
      analyze: jest.fn(),
      getHistoricalTrends: jest.fn().mockResolvedValue([]),
    });
    mockGetCachedAnalysis.mockResolvedValue(null);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/enhanced-depth-analysis');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('GET returns 400 when courseId query parameter is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/enhanced-depth-analysis');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('GET returns 400 for unknown endpoint', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/enhanced-depth-analysis?courseId=course-1&endpoint=unknown');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/enhanced-depth-analysis', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyze', data: { courseId: 'course-1' } }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('POST returns 400 when action is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/enhanced-depth-analysis', {
      method: 'POST',
      body: JSON.stringify({ data: { courseId: 'course-1' } }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('POST returns 400 for unknown action', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/enhanced-depth-analysis', {
      method: 'POST',
      body: JSON.stringify({ action: 'nope', data: { courseId: 'course-1' } }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('POST returns 400 validation error for invalid analyze payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/enhanced-depth-analysis', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyze', data: {} }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
