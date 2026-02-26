import { PATCH } from '@/app/api/courses/[courseId]/chapters/[chapterId]/publish/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/courses/[courseId]/chapters/[chapterId]/publish route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'c1', userId: 'teacher-1' });
    (db.chapter.findUnique as jest.Mock).mockResolvedValue({
      id: 'ch1',
      title: 'Intro',
      description: 'Desc',
      learningOutcomes: ['x'],
      isPublished: false,
      sections: [],
    });
    (db.chapter.update as jest.Mock).mockResolvedValue({ id: 'ch1', isPublished: true });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/x', { method: 'PATCH' });
    const res = await PATCH(req, { params: Promise.resolve({ courseId: 'c1', chapterId: 'ch1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 400 when chapter misses required fields', async () => {
    (db.chapter.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'ch1',
      title: '',
      description: 'Desc',
      learningOutcomes: ['x'],
      isPublished: false,
      sections: [],
    });
    const req = new NextRequest('http://localhost:3000/api/x', { method: 'PATCH' });
    const res = await PATCH(req, { params: Promise.resolve({ courseId: 'c1', chapterId: 'ch1' }) });
    expect(res.status).toBe(400);
  });

  it('toggles chapter publish state', async () => {
    const req = new NextRequest('http://localhost:3000/api/x', { method: 'PATCH' });
    const res = await PATCH(req, { params: Promise.resolve({ courseId: 'c1', chapterId: 'ch1' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.id).toBe('ch1');
  });
});
