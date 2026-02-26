import { PATCH } from '@/app/api/courses/[courseId]/unpublish/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/courses/[courseId]/unpublish route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'c1', userId: 'teacher-1' });
    (db.course.update as jest.Mock).mockResolvedValue({ id: 'c1', isPublished: false });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/c1/unpublish', { method: 'PATCH' });
    const res = await PATCH(req, { params: Promise.resolve({ courseId: 'c1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when course is not found for user', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/c1/unpublish', { method: 'PATCH' });
    const res = await PATCH(req, { params: Promise.resolve({ courseId: 'c1' }) });
    expect(res.status).toBe(404);
  });

  it('unpublishes course for owner', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses/c1/unpublish', { method: 'PATCH' });
    const res = await PATCH(req, { params: Promise.resolve({ courseId: 'c1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('c1');
    expect(body.isPublished).toBe(false);
  });
});
