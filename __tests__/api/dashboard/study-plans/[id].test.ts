/**
 * Tests for Study Plan Detail Route - app/api/dashboard/study-plans/[id]/route.ts
 */

import { GET, PATCH, DELETE } from '@/app/api/dashboard/study-plans/[id]/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardStudyPlan) {
  (db as Record<string, unknown>).dashboardStudyPlan = {
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
} else {
  const m = (db as Record<string, any>).dashboardStudyPlan;
  if (!m.findFirst) m.findFirst = jest.fn();
  if (!m.update) m.update = jest.fn();
  if (!m.delete) m.delete = jest.fn();
}

const mockPlan = (db as Record<string, any>).dashboardStudyPlan;
const params = { params: { id: 'sp1' } };

function getReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/study-plans/sp1');
}

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/study-plans/sp1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/study-plans/sp1', {
    method: 'DELETE',
  });
}

describe('Study plan detail route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockPlan.findFirst.mockResolvedValue({ id: 'sp1', userId: 'user-1', title: 'Plan' });
    mockPlan.update.mockResolvedValue({ id: 'sp1', userId: 'user-1', title: 'Updated' });
    mockPlan.delete.mockResolvedValue({ id: 'sp1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(getReq(), params);
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when not found', async () => {
    mockPlan.findFirst.mockResolvedValue(null);
    const res = await GET(getReq(), params);
    expect(res.status).toBe(404);
  });

  it('PATCH returns validation error for invalid payload', async () => {
    const res = await PATCH(patchReq({ weeklyHoursGoal: 999 }), params);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH validates date ordering', async () => {
    const res = await PATCH(
      patchReq({ startDate: '2026-04-20T00:00:00.000Z', endDate: '2026-04-01T00:00:00.000Z' }),
      params
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH updates plan', async () => {
    const res = await PATCH(patchReq({ title: 'Updated' }), params);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('DELETE removes plan', async () => {
    const res = await DELETE(deleteReq(), params);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);
  });
});

