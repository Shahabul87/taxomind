import { GET } from '@/app/api/courses/[courseId]/chapters/progress/route';
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

const userSectionCompletion = ensureModel('userSectionCompletion', ['findMany']);

describe('/api/courses/[courseId]/chapters/progress route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      chapters: [
        { id: 'ch1', title: 'Intro', sections: [{ id: 's1' }, { id: 's2' }] },
        { id: 'ch2', title: 'Deep', sections: [{ id: 's3' }] },
      ],
    });
    userSectionCompletion.findMany.mockResolvedValue([
      { sectionId: 's1', progress: 1, completedAt: null },
      { sectionId: 's3', progress: 0.5, completedAt: new Date('2026-02-26T00:00:00.000Z') },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/c1/chapters/progress');
    const res = await GET(req, { params: Promise.resolve({ courseId: 'c1' }) });
    expect(res.status).toBe(401);
  });

  it('returns chapter progress summary', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses/c1/chapters/progress');
    const res = await GET(req, { params: Promise.resolve({ courseId: 'c1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.courseId).toBe('c1');
    expect(body.chapters).toHaveLength(2);
    expect(body.chapters[0].percent).toBe(50);
    expect(body.chapters[1].percent).toBe(100);
  });
});
