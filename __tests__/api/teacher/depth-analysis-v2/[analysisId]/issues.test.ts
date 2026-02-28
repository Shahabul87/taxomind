jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/teacher/depth-analysis-v2/[analysisId]/issues/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;
const mockDb = db as Record<string, any>;

const params = { params: Promise.resolve({ analysisId: 'analysis-1' }) };

describe('GET /api/teacher/depth-analysis-v2/[analysisId]/issues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'teacher-1' } });
    mockDb.courseDepthAnalysisV2 = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'analysis-1',
        course: { userId: 'teacher-1' },
      }),
    };
    mockDb.depthAnalysisIssue = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'issue-1',
          analysisId: 'analysis-1',
          type: 'CONTENT',
          severity: 'HIGH',
          status: 'OPEN',
          chapterId: null,
          chapterTitle: null,
          chapterPosition: null,
          sectionId: null,
          sectionTitle: null,
          sectionPosition: null,
          contentType: null,
          title: 'Missing examples',
          description: 'Need more examples',
          evidence: [],
          impactArea: 'CLARITY',
          impactDescription: 'Learners struggle',
          fixAction: 'ADD',
          fixWhat: 'Examples',
          fixWhy: 'Improve comprehension',
          fixHow: 'Add practical scenario',
          suggestedContent: null,
          fixExamples: [],
          resolvedAt: null,
          resolvedBy: null,
          userNotes: null,
          skippedReason: null,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
        },
      ]),
      groupBy: jest
        .fn()
        .mockResolvedValueOnce([{ severity: 'HIGH', _count: 1 }])
        .mockResolvedValueOnce([{ status: 'OPEN', _count: 1 }]),
    };
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    expect(res.status).toBe(401);
  });

  it('returns 404 when analysis is not found', async () => {
    mockDb.courseDepthAnalysisV2.findUnique.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 when analysis belongs to another user', async () => {
    mockDb.courseDepthAnalysisV2.findUnique.mockResolvedValueOnce({
      id: 'analysis-1',
      course: { userId: 'teacher-2' },
    });

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 400 when filters are invalid', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/x?severity=INVALID_VALUE'),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns filtered issues with summary counts', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/x?severity=HIGH&status=OPEN'),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.issues).toHaveLength(1);
    expect(body.data.summary.bySeverity.HIGH).toBe(1);
    expect(body.data.summary.byStatus.OPEN).toBe(1);
    expect(body.data.summary.total).toBe(1);
  });
});
