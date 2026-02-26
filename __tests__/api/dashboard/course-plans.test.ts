/**
 * Tests for Course Plans Route - app/api/dashboard/course-plans/route.ts
 */

import { GET, POST } from '@/app/api/dashboard/course-plans/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardCoursePlan) {
  (db as Record<string, unknown>).dashboardCoursePlan = {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardCoursePlan;
  if (!model.count) model.count = jest.fn();
  if (!model.findMany) model.findMany = jest.fn();
  if (!model.create) model.create = jest.fn();
}

const mockPlan = (db as Record<string, any>).dashboardCoursePlan;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/course-plans${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/course-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Course plans route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockPlan.count.mockResolvedValue(2);
    mockPlan.findMany.mockResolvedValue([{ id: 'cp1', userId: 'user-1', title: 'Course Plan' }]);
    mockPlan.create.mockResolvedValue({ id: 'cp2', userId: 'user-1', title: 'New Plan' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns paginated course plans', async () => {
    const res = await GET(getReq('page=1&limit=10&status=ACTIVE'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.metadata.total).toBe(2);
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ title: '' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST rejects startDate >= targetCompletionDate', async () => {
    const res = await POST(postReq({
      title: 'New Plan',
      startDate: '2026-03-10T00:00:00.000Z',
      targetCompletionDate: '2026-03-01T00:00:00.000Z',
      daysPerWeek: 3,
      timePerSession: 60,
      difficultyLevel: 'BEGINNER',
      courseType: 'VIDEO',
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates course plan', async () => {
    const res = await POST(postReq({
      title: 'New Plan',
      startDate: '2026-03-01T00:00:00.000Z',
      targetCompletionDate: '2026-03-20T00:00:00.000Z',
      daysPerWeek: 3,
      timePerSession: 60,
      difficultyLevel: 'BEGINNER',
      courseType: 'VIDEO',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPlan.create).toHaveBeenCalled();
  });
});

