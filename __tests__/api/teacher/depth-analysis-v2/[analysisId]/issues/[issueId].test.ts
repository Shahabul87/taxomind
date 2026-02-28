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
import { GET, PATCH } from '@/app/api/teacher/depth-analysis-v2/[analysisId]/issues/[issueId]/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;
const mockDb = db as Record<string, any>;

const params = {
  params: Promise.resolve({
    analysisId: 'analysis-1',
    issueId: 'issue-1',
  }),
};

function makeIssue(overrides: Record<string, unknown> = {}) {
  return {
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
    description: 'Need examples',
    evidence: [],
    impactArea: 'CLARITY',
    impactDescription: 'Learners confused',
    fixAction: 'ADD',
    fixWhat: 'Examples',
    fixWhy: 'Improve understanding',
    fixHow: 'Add real scenarios',
    suggestedContent: null,
    fixExamples: [],
    resolvedAt: null,
    resolvedBy: null,
    userNotes: null,
    skippedReason: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    analysis: {
      course: {
        userId: 'teacher-1',
      },
    },
    ...overrides,
  };
}

describe('GET/PATCH /api/teacher/depth-analysis-v2/[analysisId]/issues/[issueId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'teacher-1' } });
    mockDb.depthAnalysisIssue = {
      findUnique: jest.fn().mockResolvedValue(makeIssue()),
      update: jest.fn().mockResolvedValue(
        makeIssue({
          status: 'RESOLVED',
          userNotes: 'resolved',
          resolvedAt: new Date('2026-01-02T00:00:00Z'),
          resolvedBy: 'teacher-1',
          analysis: undefined,
        })
      ),
      groupBy: jest.fn().mockResolvedValue([{ severity: 'HIGH', _count: 1 }]),
      count: jest.fn().mockResolvedValue(1),
    };
    mockDb.courseDepthAnalysisV2 = {
      update: jest.fn().mockResolvedValue({ id: 'analysis-1' }),
    };
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when issue is missing or mismatched analysis', async () => {
    mockDb.depthAnalysisIssue.findUnique.mockResolvedValueOnce(
      makeIssue({ analysisId: 'analysis-other' })
    );

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('GET returns 403 when issue belongs to another user', async () => {
    mockDb.depthAnalysisIssue.findUnique.mockResolvedValueOnce(
      makeIssue({
        analysis: { course: { userId: 'teacher-2' } },
      })
    );

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('GET returns issue details for the owner', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('issue-1');
    expect(body.data.title).toBe('Missing examples');
  });

  it('PATCH returns 400 for invalid update payload', async () => {
    const res = await PATCH(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userNotes: 'a'.repeat(2001) }),
      }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH updates issue and refreshes open-issue counts', async () => {
    const res = await PATCH(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED', userNotes: 'resolved' }),
      }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.depthAnalysisIssue.update).toHaveBeenCalledWith({
      where: { id: 'issue-1' },
      data: expect.objectContaining({
        status: 'RESOLVED',
        userNotes: 'resolved',
        resolvedAt: expect.any(Date),
        resolvedBy: 'teacher-1',
      }),
    });
    expect(mockDb.courseDepthAnalysisV2.update).toHaveBeenCalledWith({
      where: { id: 'analysis-1' },
      data: expect.objectContaining({
        totalIssues: 1,
      }),
    });
  });
});
