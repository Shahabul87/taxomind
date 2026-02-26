/**
 * Tests for Dashboard Activity Detail Route - app/api/dashboard/activities/[id]/route.ts
 */

import { GET, PATCH, DELETE } from '@/app/api/dashboard/activities/[id]/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardActivity) {
  (db as Record<string, unknown>).dashboardActivity = {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardActivity;
  if (!model.findUnique) model.findUnique = jest.fn();
  if (!model.update) model.update = jest.fn();
  if (!model.delete) model.delete = jest.fn();
}

const mockDashboardActivity = (db as Record<string, any>).dashboardActivity;

function getReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/activities/act-1');
}

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/activities/act-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/activities/act-1', {
    method: 'DELETE',
  });
}

const params = { params: { id: 'act-1' } };

describe('Dashboard activity detail route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockDashboardActivity.findUnique.mockResolvedValue({
      id: 'act-1',
      userId: 'user-1',
      title: 'Existing activity',
      status: 'NOT_STARTED',
    });
    mockDashboardActivity.update.mockResolvedValue({
      id: 'act-1',
      userId: 'user-1',
      title: 'Updated activity',
      status: 'IN_PROGRESS',
      courseId: 'course-1',
    });
    mockDashboardActivity.delete.mockResolvedValue({ id: 'act-1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq(), params);
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when activity is missing', async () => {
    mockDashboardActivity.findUnique.mockResolvedValue(null);

    const res = await GET(getReq(), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('GET returns 403 for activity owned by another user', async () => {
    mockDashboardActivity.findUnique.mockResolvedValue({ id: 'act-1', userId: 'other-user' });

    const res = await GET(getReq(), params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('GET returns activity data for owner', async () => {
    const res = await GET(getReq(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('act-1');
  });

  it('PATCH returns 400 for invalid payload', async () => {
    const res = await PATCH(patchReq({ actualMinutes: 0 }), params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH updates owned activity', async () => {
    const res = await PATCH(patchReq({ status: 'IN_PROGRESS', courseId: 'course-1' }), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDashboardActivity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'act-1' },
        data: expect.objectContaining({
          status: 'IN_PROGRESS',
          courseId: 'course-1',
        }),
      })
    );
  });

  it('DELETE removes owned activity', async () => {
    const res = await DELETE(deleteReq(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Activity deleted successfully');
    expect(mockDashboardActivity.delete).toHaveBeenCalledWith({ where: { id: 'act-1' } });
  });

  it('DELETE returns 403 for non-owner', async () => {
    mockDashboardActivity.findUnique.mockResolvedValue({ id: 'act-1', userId: 'other-user' });

    const res = await DELETE(deleteReq(), params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

