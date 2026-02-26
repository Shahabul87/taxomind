import { GET, POST } from '@/app/api/peer-review/reviews/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const reviewAssignment = ensureModel('reviewAssignment', ['findFirst', 'update']);
const peerReview = ensureModel('peerReview', ['create', 'findMany']);
const reviewerProfile = ensureModel('reviewerProfile', ['upsert']);

function getReq(query = '') {
  return new NextRequest(
    `http://localhost:3000/api/peer-review/reviews${query ? `?${query}` : ''}`
  );
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/peer-review/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/peer-review/reviews route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'reviewer-1', role: 'TEACHER' });

    reviewAssignment.findFirst.mockResolvedValue({
      id: 'assignment-1',
      submissionId: 'submission-1',
      status: 'ASSIGNED',
      rubric: {
        totalPoints: 100,
        criteria: [
          { id: 'c1', name: 'Clarity', maxScore: 10, weight: 50 },
          { id: 'c2', name: 'Accuracy', maxScore: 10, weight: 50 },
        ],
      },
    });
    reviewAssignment.update.mockResolvedValue({ id: 'assignment-1', status: 'COMPLETED' });

    peerReview.create.mockResolvedValue({
      id: 'review-1',
      submittedAt: new Date('2026-03-01T00:00:00.000Z'),
      scores: [
        { criterionId: 'c1', score: 8, feedback: 'good' },
        { criterionId: 'c2', score: 9, feedback: 'great' },
      ],
    });
    peerReview.findMany.mockResolvedValue([
      {
        id: 'review-1',
        reviewer: { id: 'reviewer-1', name: 'Reviewer 1' },
        overallScore: 85,
        overallFeedback: 'Solid work',
        strengths: ['clear structure'],
        improvements: ['more examples'],
        confidence: 'HIGH',
        scores: [
          { criterion: { name: 'Clarity', maxScore: 10 }, score: 8, feedback: 'good' },
        ],
        submittedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
      {
        id: 'review-2',
        reviewer: { id: 'reviewer-2', name: 'Reviewer 2' },
        overallScore: 75,
        overallFeedback: 'Needs work',
        strengths: ['effort'],
        improvements: ['accuracy'],
        confidence: 'MEDIUM',
        scores: [
          { criterion: { name: 'Clarity', maxScore: 10 }, score: 7, feedback: 'okay' },
        ],
        submittedAt: new Date('2026-03-01T01:00:00.000Z'),
      },
    ]);

    reviewerProfile.upsert.mockResolvedValue({ userId: 'reviewer-1', totalReviews: 10 });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(getReq('submissionId=submission-1'));
    expect(res.status).toBe(401);
  });

  it('GET returns 400 when submissionId is missing', async () => {
    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET returns review aggregation data', async () => {
    const res = await GET(getReq('submissionId=submission-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.reviewCount).toBe(2);
    expect(body.data.aggregatedScore).toMatchObject({
      average: 80,
      min: 75,
      max: 85,
    });
    expect(body.data.reviews[0].reviewer).toEqual({ id: 'reviewer-1', name: 'Reviewer 1' });
  });

  it('POST returns 404 when assignment is not found', async () => {
    reviewAssignment.findFirst.mockResolvedValueOnce(null);

    const res = await POST(postReq({
      assignmentId: 'missing',
      scores: [{ criterionId: 'c1', score: 8, feedback: 'good' }],
      overallFeedback: 'This has enough chars',
      timeSpentMinutes: 10,
    }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('POST returns 400 when not all rubric criteria are scored', async () => {
    const res = await POST(postReq({
      assignmentId: 'assignment-1',
      scores: [{ criterionId: 'c1', score: 8, feedback: 'good' }],
      overallFeedback: 'Detailed feedback text',
      timeSpentMinutes: 15,
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.missingCriteria).toContain('c2');
  });

  it('POST submits review and updates assignment/profile', async () => {
    const res = await POST(postReq({
      assignmentId: 'assignment-1',
      scores: [
        { criterionId: 'c1', score: 8, feedback: 'good' },
        { criterionId: 'c2', score: 9, feedback: 'great' },
      ],
      overallFeedback: 'Strong submission overall',
      strengths: ['organization'],
      improvements: ['add examples'],
      timeSpentMinutes: 20,
      confidence: 'HIGH',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.reviewId).toBe('review-1');
    expect(body.data.overallScore).toBe(85);
    expect(reviewAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'assignment-1' } })
    );
    expect(reviewerProfile.upsert).toHaveBeenCalled();
  });

  it('POST returns 400 for invalid request payload', async () => {
    const res = await POST(postReq({
      assignmentId: '',
      scores: [],
      overallFeedback: 'short',
      timeSpentMinutes: 0,
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
