import { POST } from '@/app/api/courses/[courseId]/questions/[questionId]/report/route';
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

const courseQuestion = ensureModel('courseQuestion', ['findFirst']);
const questionReport = ensureModel('questionReport', ['create']);

describe('/api/courses/[courseId]/questions/[questionId]/report route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    courseQuestion.findFirst.mockResolvedValue({ id: 'q1', courseId: 'c1' });
    questionReport.create.mockResolvedValue({ id: 'r1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/c1/questions/q1/report', {
      method: 'POST',
      body: JSON.stringify({ reason: 'spam' }),
    });
    const res = await POST(req, { params: Promise.resolve({ courseId: 'c1', questionId: 'q1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when question is missing', async () => {
    courseQuestion.findFirst.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/c1/questions/missing/report', {
      method: 'POST',
      body: JSON.stringify({ reason: 'spam' }),
    });
    const res = await POST(req, { params: Promise.resolve({ courseId: 'c1', questionId: 'missing' }) });
    expect(res.status).toBe(404);
  });

  it('reports question successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses/c1/questions/q1/report', {
      method: 'POST',
      body: JSON.stringify({ reason: 'spam content' }),
    });
    const res = await POST(req, { params: Promise.resolve({ courseId: 'c1', questionId: 'q1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.reported).toBe(true);
  });
});
