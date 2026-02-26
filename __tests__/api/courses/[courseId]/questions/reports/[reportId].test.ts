import { DELETE } from '@/app/api/courses/[courseId]/questions/reports/[reportId]/route';
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

const questionReport = ensureModel('questionReport', ['findUnique', 'delete']);

describe('/api/courses/[courseId]/questions/reports/[reportId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    questionReport.findUnique.mockResolvedValue({
      id: 'r1',
      question: { courseId: 'c1' },
    });
    questionReport.delete.mockResolvedValue({ id: 'r1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ userId: 'teacher-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/c1/questions/reports/r1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ courseId: 'c1', reportId: 'r1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when report is not found for course', async () => {
    questionReport.findUnique.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/c1/questions/reports/missing', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ courseId: 'c1', reportId: 'missing' }) });
    expect(res.status).toBe(404);
  });

  it('dismisses report for course instructor', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses/c1/questions/reports/r1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ courseId: 'c1', reportId: 'r1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.dismissed).toBe(true);
    expect(questionReport.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
  });
});
