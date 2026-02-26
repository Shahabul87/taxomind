import { GET } from '@/app/api/courses/[courseId]/resources/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('GET /api/courses/[courseId]/resources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/resources'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(401);
  });

  it('returns 404 when course not found', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/resources'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Course not found');
  });

  it('returns downloadable and external resources', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'course-1',
      chapters: [
        {
          id: 'ch-1',
          title: 'Chapter 1',
          resources: JSON.stringify([
            'https://example.com/guide.pdf',
            { name: 'Reference Link', url: 'https://docs.example.com/ref' },
            { name: 'Notes.txt' },
          ]),
        },
      ],
    });

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/resources'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.courseId).toBe('course-1');
    expect(Array.isArray(body.downloadable)).toBe(true);
    expect(Array.isArray(body.external)).toBe(true);
    expect(body.downloadable.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 500 when db query fails', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-1' });
    (db.course.findUnique as jest.Mock).mockRejectedValueOnce(new Error('db down'));

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/resources'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(500);
  });
});
