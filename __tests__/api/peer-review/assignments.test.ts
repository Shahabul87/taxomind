import { GET, POST } from '@/app/api/peer-review/assignments/route';
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

const reviewRubric = ensureModel('reviewRubric', ['findUnique']);
const reviewAssignment = ensureModel('reviewAssignment', ['createMany', 'findMany']);

function getReq(query = '') {
  return new NextRequest(
    `http://localhost:3000/api/peer-review/assignments${query ? `?${query}` : ''}`
  );
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/peer-review/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/peer-review/assignments route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER' });
    reviewRubric.findUnique.mockResolvedValue({ id: 'rubric-1' });
    reviewAssignment.createMany.mockResolvedValue({ count: 4 });
    reviewAssignment.findMany.mockResolvedValue([
      {
        id: 'a1',
        submissionId: 'sub-1',
        status: 'ASSIGNED',
        dueDate: new Date('2026-03-10T00:00:00.000Z'),
        isBlind: true,
        rubric: { id: 'rubric-1', name: 'Rubric', criteria: [{ id: 'c1' }], totalPoints: 100 },
        review: null,
        assignedAt: new Date('2026-03-01T00:00:00.000Z'),
        startedAt: null,
        completedAt: null,
      },
      {
        id: 'a2',
        submissionId: 'sub-2',
        status: 'COMPLETED',
        dueDate: new Date('2026-03-10T00:00:00.000Z'),
        isBlind: false,
        rubric: { id: 'rubric-1', name: 'Rubric', criteria: [{ id: 'c1' }, { id: 'c2' }], totalPoints: 100 },
        review: { id: 'r1', submittedAt: new Date('2026-03-02T00:00:00.000Z'), overallScore: 88 },
        assignedAt: new Date('2026-03-01T00:00:00.000Z'),
        startedAt: new Date('2026-03-01T04:00:00.000Z'),
        completedAt: new Date('2026-03-02T00:00:00.000Z'),
      },
    ]);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('POST returns 403 for non-privileged users', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });

    const res = await POST(postReq({
      rubricId: 'rubric-1',
      submissionIds: ['s1'],
      reviewerIds: ['u1'],
      dueDate: '2026-03-10T00:00:00.000Z',
    }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('POST returns 404 when rubric does not exist', async () => {
    reviewRubric.findUnique.mockResolvedValueOnce(null);

    const res = await POST(postReq({
      rubricId: 'missing-rubric',
      submissionIds: ['s1'],
      reviewerIds: ['u1'],
      dueDate: '2026-03-10T00:00:00.000Z',
    }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('POST creates round-robin assignments', async () => {
    const res = await POST(postReq({
      rubricId: 'rubric-1',
      submissionIds: ['s1', 's2'],
      reviewerIds: ['u1', 'u2'],
      reviewsPerSubmission: 2,
      dueDate: '2026-03-10T00:00:00.000Z',
      isBlind: true,
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.assignmentsCreated).toBe(4);
    expect(reviewAssignment.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ submissionId: 's1', reviewerId: 'u1' }),
          expect.objectContaining({ submissionId: 's1', reviewerId: 'u2' }),
        ]),
      })
    );
  });

  it('GET returns assignment list with summary', async () => {
    const res = await GET(getReq('status=ASSIGNED'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.assignments).toHaveLength(2);
    expect(body.data.assignments[0].submissionId).toBeUndefined();
    expect(body.data.summary).toEqual({
      total: 2,
      assigned: 1,
      inProgress: 0,
      completed: 1,
    });
    expect(reviewAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { reviewerId: 'teacher-1', status: 'ASSIGNED' },
      })
    );
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({
      rubricId: '',
      submissionIds: [],
      reviewerIds: [],
      dueDate: '2026-03-10',
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
