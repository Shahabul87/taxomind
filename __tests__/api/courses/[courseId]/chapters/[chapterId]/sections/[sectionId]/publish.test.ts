jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { PATCH } from '@/app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/publish/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/publish route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'teacher-1' } });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'c1', userId: 'teacher-1' });
    (db.section.update as jest.Mock).mockResolvedValue({ id: 's1', isPublished: true });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/x', { method: 'PATCH' });
    const res = await PATCH(req, {
      params: Promise.resolve({ courseId: 'c1', chapterId: 'ch1', sectionId: 's1' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 404 when course ownership check fails', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/x', { method: 'PATCH' });
    const res = await PATCH(req, {
      params: Promise.resolve({ courseId: 'c1', chapterId: 'ch1', sectionId: 's1' }),
    });
    expect(res.status).toBe(404);
  });

  it('publishes section and returns payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/x', { method: 'PATCH' });
    const res = await PATCH(req, {
      params: Promise.resolve({ courseId: 'c1', chapterId: 'ch1', sectionId: 's1' }),
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.isPublished).toBe(true);
  });
});
