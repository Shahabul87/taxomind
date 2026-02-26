import { PUT } from '@/app/api/courses/[courseId]/chapters/reorder/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/courses/[courseId]/chapters/reorder route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'c1', userId: 'teacher-1' });
    (db.chapter.update as jest.Mock).mockResolvedValue({});
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/c1/chapters/reorder', {
      method: 'PUT',
      body: JSON.stringify({ list: [] }),
    });
    const res = await PUT(req, { params: Promise.resolve({ courseId: 'c1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 401 when user does not own the course', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/c1/chapters/reorder', {
      method: 'PUT',
      body: JSON.stringify({ list: [{ id: 'ch1', position: 1 }] }),
    });
    const res = await PUT(req, { params: Promise.resolve({ courseId: 'c1' }) });
    expect(res.status).toBe(401);
  });

  it('updates chapter positions and returns success', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses/c1/chapters/reorder', {
      method: 'PUT',
      body: JSON.stringify({
        list: [
          { id: 'ch1', position: 2 },
          { id: 'ch2', position: 1 },
        ],
      }),
    });
    const res = await PUT(req, { params: Promise.resolve({ courseId: 'c1' }) });

    expect(res.status).toBe(200);
    expect(db.chapter.update).toHaveBeenCalledTimes(2);
  });
});
