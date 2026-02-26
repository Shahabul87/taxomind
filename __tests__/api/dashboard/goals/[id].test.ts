/**
 * Tests for Goal Detail Route - app/api/dashboard/goals/[id]/route.ts
 */

import { GET, PATCH, DELETE } from '@/app/api/dashboard/goals/[id]/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardGoal) {
  (db as Record<string, unknown>).dashboardGoal = {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardGoal;
  if (!model.findUnique) model.findUnique = jest.fn();
  if (!model.update) model.update = jest.fn();
  if (!model.delete) model.delete = jest.fn();
}

const mockGoal = (db as Record<string, any>).dashboardGoal;
const params = { params: { id: 'g1' } };

function getReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/goals/g1');
}

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/goals/g1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/goals/g1', {
    method: 'DELETE',
  });
}

describe('Dashboard goal detail route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGoal.findUnique.mockResolvedValue({
      id: 'g1',
      userId: 'user-1',
      title: 'Goal A',
    });
    mockGoal.update.mockResolvedValue({
      id: 'g1',
      userId: 'user-1',
      title: 'Goal Updated',
    });
    mockGoal.delete.mockResolvedValue({ id: 'g1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq(), params);
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when goal is missing', async () => {
    mockGoal.findUnique.mockResolvedValue(null);

    const res = await GET(getReq(), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('GET returns 403 when goal belongs to another user', async () => {
    mockGoal.findUnique.mockResolvedValue({ id: 'g1', userId: 'other-user' });

    const res = await GET(getReq(), params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('PATCH returns 400 for invalid payload', async () => {
    const res = await PATCH(patchReq({ progress: 999 }), params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH updates goal and milestones', async () => {
    const res = await PATCH(
      patchReq({
        title: 'Goal Updated',
        milestones: [{ title: 'M1', targetDate: '2026-03-10T00:00:00.000Z' }],
      }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockGoal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'g1' },
        data: expect.objectContaining({
          title: 'Goal Updated',
          milestones: expect.objectContaining({
            deleteMany: {},
            create: expect.any(Array),
          }),
        }),
      })
    );
  });

  it('DELETE returns 403 for non-owner', async () => {
    mockGoal.findUnique.mockResolvedValue({ id: 'g1', userId: 'other-user' });

    const res = await DELETE(deleteReq(), params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('DELETE removes owned goal', async () => {
    const res = await DELETE(deleteReq(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Goal deleted successfully');
  });
});

