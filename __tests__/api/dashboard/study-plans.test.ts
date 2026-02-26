/**
 * Tests for Dashboard Study Plans Route - app/api/dashboard/study-plans/route.ts
 */

import { GET, POST } from '@/app/api/dashboard/study-plans/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardStudyPlan) {
  (db as Record<string, unknown>).dashboardStudyPlan = {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
} else {
  const m = (db as Record<string, any>).dashboardStudyPlan;
  if (!m.count) m.count = jest.fn();
  if (!m.findMany) m.findMany = jest.fn();
  if (!m.create) m.create = jest.fn();
}

const mockPlan = (db as Record<string, any>).dashboardStudyPlan;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/study-plans${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/study-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Study plans route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockPlan.count.mockResolvedValue(1);
    mockPlan.findMany.mockResolvedValue([{ id: 'sp1', userId: 'user-1', title: 'Plan 1' }]);
    mockPlan.create.mockResolvedValue({ id: 'sp2', userId: 'user-1', title: 'Plan 2' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns paginated plans', async () => {
    const res = await GET(getReq('page=1&limit=10'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagination.total).toBe(1);
  });

  it('POST validates start/end date order', async () => {
    const res = await POST(postReq({
      planType: 'new',
      newCourseTitle: 'Course',
      title: 'Plan',
      startDate: '2026-04-10T00:00:00.000Z',
      endDate: '2026-04-01T00:00:00.000Z',
      weeklyHoursGoal: 6,
    }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates study plan', async () => {
    const res = await POST(postReq({
      planType: 'new',
      newCourseTitle: 'Course',
      title: 'Plan',
      startDate: '2026-04-01T00:00:00.000Z',
      endDate: '2026-04-20T00:00:00.000Z',
      weeklyHoursGoal: 6,
    }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});

