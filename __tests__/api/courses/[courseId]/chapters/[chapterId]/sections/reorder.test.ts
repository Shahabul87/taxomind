import { PUT } from '@/app/api/courses/[courseId]/chapters/[chapterId]/sections/reorder/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

function props(courseId = 'course-1', chapterId = 'chapter-1') {
  return { params: Promise.resolve({ courseId, chapterId }) };
}

describe('/api/courses/[courseId]/chapters/[chapterId]/sections/reorder route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'course-1', userId: 'user-1' });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({ id: 'chapter-1', courseId: 'course-1' });
    (db.section.update as jest.Mock).mockResolvedValue({});
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections/reorder', {
      method: 'PUT',
      body: JSON.stringify({ list: [] }),
    });

    const res = await PUT(req as never, props());
    expect(res.status).toBe(401);
  });

  it('returns 401 when course is not owned', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections/reorder', {
      method: 'PUT',
      body: JSON.stringify({ list: [{ id: 's1', position: 1 }] }),
    });

    const res = await PUT(req as never, props());
    expect(res.status).toBe(401);
  });

  it('returns 404 when chapter is not found', async () => {
    (db.chapter.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections/reorder', {
      method: 'PUT',
      body: JSON.stringify({ list: [{ id: 's1', position: 1 }] }),
    });

    const res = await PUT(req as never, props());
    expect(res.status).toBe(404);
  });

  it('updates each section position and returns 200', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections/reorder', {
      method: 'PUT',
      body: JSON.stringify({
        list: [
          { id: 's1', position: 2 },
          { id: 's2', position: 1 },
        ],
      }),
    });

    const res = await PUT(req as never, props());

    expect(res.status).toBe(200);
    expect(db.section.update).toHaveBeenCalledTimes(2);
  });
});
