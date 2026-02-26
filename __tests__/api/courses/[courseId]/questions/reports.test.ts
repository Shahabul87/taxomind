import { GET } from '@/app/api/courses/[courseId]/questions/reports/route';
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

const questionReport = ensureModel('questionReport', ['findMany']);

describe('/api/courses/[courseId]/questions/reports route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ userId: 'teacher-1' });
    questionReport.findMany.mockResolvedValue([{ id: 'r1' }]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/c1/questions/reports');
    const res = await GET(req, { params: Promise.resolve({ courseId: 'c1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not instructor of course', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce({ userId: 'other' });
    const req = new NextRequest('http://localhost:3000/api/courses/c1/questions/reports');
    const res = await GET(req, { params: Promise.resolve({ courseId: 'c1' }) });
    expect(res.status).toBe(403);
  });

  it('returns reports for instructor', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses/c1/questions/reports');
    const res = await GET(req, { params: Promise.resolve({ courseId: 'c1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.reports)).toBe(true);
  });
});
