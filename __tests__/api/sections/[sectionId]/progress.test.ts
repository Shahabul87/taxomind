jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/sections/[sectionId]/progress/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;
const params = { params: { sectionId: 'section-1' } };

describe('GET/POST /api/sections/[sectionId]/progress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.section = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'section-1',
        chapterId: 'chapter-1',
        chapter: {
          courseId: 'course-1',
          course: {
            userId: 'teacher-1',
            Enrollment: [{ userId: 'user-1' }],
          },
        },
      }),
      findMany: jest.fn().mockResolvedValue([{ id: 'section-1' }]),
    };
    mockDb.user_progress = {
      upsert: jest.fn().mockResolvedValue({ id: 'progress-1', progressPercent: 95 }),
      findFirst: jest.fn().mockResolvedValue({ progressPercent: 75, timeSpent: 120 }),
    };
    mockDb.userSectionCompletion = {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([{ sectionId: 'section-1' }]),
    };
    mockDb.userChapterCompletion = {
      upsert: jest.fn().mockResolvedValue({}),
    };
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ progress: 50 }),
      }),
      params
    );
    expect(res.status).toBe(401);
  });

  it('POST updates progress and completion records', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ progress: 95, watchTime: 180 }),
      }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.user_progress.upsert).toHaveBeenCalled();
    expect(mockDb.userSectionCompletion.upsert).toHaveBeenCalled();
  });

  it('GET returns stored progress for section', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.progress.progressPercent).toBe(75);
  });
});
