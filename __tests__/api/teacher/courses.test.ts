jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/teacher/courses/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

describe('GET /api/teacher/courses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    mockDb.course = {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'course-1',
          title: 'Course One',
          price: 49,
          isPublished: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          category: { name: 'Programming' },
        },
      ]),
    };
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/teacher/courses'));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid query params', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/teacher/courses?page=0&pageSize=10')
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid query parameters');
  });

  it('returns courses with pagination data', async () => {
    mockDb.course.count.mockResolvedValueOnce(11);

    const res = await GET(
      new NextRequest(
        'http://localhost:3000/api/teacher/courses?page=1&pageSize=10&sortBy=createdAt&sortOrder=desc'
      )
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.courses).toHaveLength(1);
    expect(body.data.pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: 11,
      totalPages: 2,
    });
    expect(mockDb.course.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ userId: 'teacher-1' }),
    });
  });

  it('scopes queries by organizationId when present on session user', async () => {
    mockCurrentUser.mockResolvedValueOnce({
      id: 'teacher-1',
      organizationId: 'org-1',
    });

    await GET(new NextRequest('http://localhost:3000/api/teacher/courses'));

    expect(mockDb.course.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: 'teacher-1',
        organizationId: 'org-1',
      }),
    });
  });

  it('returns 500 on unexpected errors', async () => {
    mockDb.course.count.mockRejectedValueOnce(new Error('db failed'));

    const res = await GET(new NextRequest('http://localhost:3000/api/teacher/courses'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Server error');
  });
});
