jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/teacher/depth-analysis-v2/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;
const mockDb = db as Record<string, any>;

describe('GET /api/teacher/depth-analysis-v2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'teacher-1' } });
    mockDb.course = {
      findFirst: jest.fn().mockResolvedValue({
        id: 'course-1',
        title: 'Algorithms 101',
      }),
    };
    mockDb.courseDepthAnalysisV2 = {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'analysis-1',
          version: 2,
          status: 'COMPLETED',
          overallScore: 83,
          depthScore: 81,
          consistencyScore: 84,
          flowScore: 80,
          qualityScore: 86,
          bloomsBalance: 74,
          issueCountCritical: 0,
          issueCountHigh: 1,
          issueCountMedium: 2,
          issueCountLow: 3,
          totalIssues: 6,
          analysisMethod: 'AI_HYBRID',
          analyzedAt: new Date('2026-01-12T12:00:00Z'),
        },
      ]),
    };
  });

  it('returns 401 for unauthenticated requests', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/teacher/depth-analysis-v2?courseId=course-1')
    );

    expect(res.status).toBe(401);
  });

  it('returns 400 when required query params are invalid', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/teacher/depth-analysis-v2'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when course does not belong to the user', async () => {
    mockDb.course.findFirst.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/teacher/depth-analysis-v2?courseId=course-1')
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns paginated analyses when request is valid', async () => {
    const res = await GET(
      new NextRequest(
        'http://localhost:3000/api/teacher/depth-analysis-v2?courseId=course-1&page=1&pageSize=10'
      )
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.courseTitle).toBe('Algorithms 101');
    expect(body.data.analyses[0].scores.overall).toBe(83);
    expect(body.data.pagination.totalPages).toBe(1);
    expect(mockDb.courseDepthAnalysisV2.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { courseId: 'course-1' },
        skip: 0,
        take: 10,
      })
    );
  });

  it('returns 500 on unexpected errors', async () => {
    mockDb.course.findFirst.mockRejectedValueOnce(new Error('query failed'));

    const res = await GET(
      new NextRequest('http://localhost:3000/api/teacher/depth-analysis-v2?courseId=course-1')
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
