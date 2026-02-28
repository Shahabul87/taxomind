jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET, DELETE } from '@/app/api/teacher/depth-analysis-v2/[analysisId]/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;
const mockDb = db as Record<string, any>;

const params = { params: Promise.resolve({ analysisId: 'analysis-1' }) };

function makeAnalysis(overrides: Record<string, unknown> = {}) {
  return {
    id: 'analysis-1',
    courseId: 'course-1',
    version: 2,
    status: 'COMPLETED',
    analysisMethod: 'AI_HYBRID',
    overallScore: 84,
    depthScore: 82,
    consistencyScore: 85,
    flowScore: 83,
    qualityScore: 86,
    bloomsDistribution: {},
    bloomsBalance: 70,
    chapterAnalysis: [],
    issueCountCritical: 0,
    issueCountHigh: 1,
    issueCountMedium: 2,
    issueCountLow: 1,
    totalIssues: 4,
    learningOutcomes: [],
    skillsGained: [],
    knowledgeGaps: [],
    duplicateContent: [],
    thinSections: [],
    contentFlowAnalysis: [],
    previousVersionId: null,
    analyzedAt: new Date('2026-01-10T00:00:00Z'),
    updatedAt: new Date('2026-01-10T00:00:00Z'),
    issues: [],
    course: {
      id: 'course-1',
      title: 'Algorithms 101',
      userId: 'teacher-1',
    },
    ...overrides,
  };
}

describe('GET/DELETE /api/teacher/depth-analysis-v2/[analysisId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'teacher-1' } });
    mockDb.courseDepthAnalysisV2 = {
      findUnique: jest.fn(),
      delete: jest.fn().mockResolvedValue({ id: 'analysis-1' }),
    };
    mockDb.depthAnalysisIssue = {
      count: jest.fn().mockResolvedValue(0),
    };
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when analysis does not exist', async () => {
    mockDb.courseDepthAnalysisV2.findUnique.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('GET returns 403 when analysis belongs to another user', async () => {
    mockDb.courseDepthAnalysisV2.findUnique.mockResolvedValueOnce(
      makeAnalysis({ course: { id: 'course-1', title: 'x', userId: 'teacher-2' } })
    );

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('GET returns analysis details for owner', async () => {
    mockDb.courseDepthAnalysisV2.findUnique.mockResolvedValueOnce(makeAnalysis());

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('analysis-1');
    expect(body.data.courseTitle).toBe('Algorithms 101');
    expect(body.data.issueCount.total).toBe(4);
  });

  it('DELETE returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await DELETE(new NextRequest('http://localhost:3000/api/x'), params);
    expect(res.status).toBe(401);
  });

  it('DELETE removes the analysis for the owner', async () => {
    mockDb.courseDepthAnalysisV2.findUnique.mockResolvedValueOnce(
      makeAnalysis({
        course: { userId: 'teacher-1' },
      })
    );

    const res = await DELETE(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);
    expect(mockDb.courseDepthAnalysisV2.delete).toHaveBeenCalledWith({
      where: { id: 'analysis-1' },
    });
  });
});
