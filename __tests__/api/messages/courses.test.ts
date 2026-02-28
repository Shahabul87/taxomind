jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/messages/courses/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;
const mockDb = db as Record<string, any>;

describe('GET /api/messages/courses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockDb.course = {
      findMany: jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: 'course-enrolled',
            title: 'Biology',
            imageUrl: null,
            user: { id: 'inst-1', name: 'Instructor', email: 'i@test.com', image: null },
            Enrollment: [
              {
                User: { id: 'user-2', name: 'Peer', email: 'p@test.com', image: null },
              },
            ],
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'course-created',
            title: 'Physics',
            imageUrl: null,
            user: { id: 'user-1', name: 'Me', email: 'me@test.com', image: null },
            Enrollment: [
              {
                User: { id: 'user-3', name: 'Student', email: 's@test.com', image: null },
              },
            ],
          },
        ]),
    };
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/messages/courses'));
    expect(res.status).toBe(401);
  });

  it('returns enrolled and created courses with participant formatting', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/messages/courses'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.enrolledCourses[0].role).toBe('STUDENT');
    expect(body.createdCourses[0].role).toBe('INSTRUCTOR');
    expect(body.enrolledCourses[0].participants).toHaveLength(2);
  });

  it('returns 500 on unexpected db errors', async () => {
    mockDb.course.findMany.mockReset();
    mockDb.course.findMany.mockRejectedValue(new Error('db failed'));
    const res = await GET(new NextRequest('http://localhost:3000/api/messages/courses'));
    expect(res.status).toBe(500);
  });
});
