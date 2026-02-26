/**
 * Tests for Dashboard Activities Route - app/api/dashboard/activities/route.ts
 */

import { GET, POST } from '@/app/api/dashboard/activities/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardActivity) {
  (db as Record<string, unknown>).dashboardActivity = {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
}
if (!(db as Record<string, unknown>).$queryRaw) {
  (db as Record<string, unknown>).$queryRaw = jest.fn();
}
if (!(db as Record<string, unknown>).$executeRaw) {
  (db as Record<string, unknown>).$executeRaw = jest.fn();
}

const mockDashboardActivity = (db as Record<string, any>).dashboardActivity;
const mockQueryRaw = (db as Record<string, any>).$queryRaw;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/activities${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Dashboard activities route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    // ensureTableExists: table already exists
    mockQueryRaw.mockResolvedValue([{ exists: true }]);

    mockDashboardActivity.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3);
    mockDashboardActivity.findMany.mockResolvedValue([
      {
        id: 'act-1',
        userId: 'user-1',
        type: 'QUIZ',
        title: 'Quiz 1',
        status: 'NOT_STARTED',
        priority: 'HIGH',
      },
    ]);
    mockDashboardActivity.create.mockResolvedValue({
      id: 'act-new',
      userId: 'user-1',
      title: 'Assignment',
      type: 'ASSIGNMENT',
      courseId: 'course-1',
      course: { id: 'course-1', title: 'Math', description: 'Algebra' },
    });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns paginated activities with metadata counts', async () => {
    const res = await GET(getReq('page=2&limit=10&status=NOT_STARTED&priority=HIGH'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toEqual({ page: 2, limit: 10, total: 5 });
    expect(body.metadata).toEqual({ completedCount: 1, overdueCount: 2, upcomingCount: 3 });
    expect(mockDashboardActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ title: '', type: 'UNKNOWN' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates an activity for authenticated user', async () => {
    const res = await POST(postReq({
      type: 'ASSIGNMENT',
      title: 'Assignment',
      points: 20,
      priority: 'HIGH',
      courseId: 'course-1',
      tags: ['math'],
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDashboardActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'ASSIGNMENT',
          title: 'Assignment',
          courseId: 'course-1',
        }),
      })
    );
  });

  it('GET returns 500 when db errors', async () => {
    mockDashboardActivity.count.mockReset();
    mockDashboardActivity.count.mockRejectedValue(new Error('relation dashboard_activities does not exist'));

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
