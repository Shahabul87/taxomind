/**
 * Tests for Dashboard Goals Route - app/api/dashboard/goals/route.ts
 */

import { GET, POST } from '@/app/api/dashboard/goals/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardGoal) {
  (db as Record<string, unknown>).dashboardGoal = {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardGoal;
  if (!model.count) model.count = jest.fn();
  if (!model.findMany) model.findMany = jest.fn();
  if (!model.create) model.create = jest.fn();
}

const mockGoal = (db as Record<string, any>).dashboardGoal;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/goals${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Dashboard goals route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGoal.count.mockResolvedValue(2);
    mockGoal.findMany.mockResolvedValue([{ id: 'g1', userId: 'user-1', title: 'Goal A' }]);
    mockGoal.create.mockResolvedValue({ id: 'g2', userId: 'user-1', title: 'Goal B' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns paginated goals', async () => {
    const res = await GET(getReq('page=1&limit=5&status=ACTIVE'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagination).toEqual({ page: 1, limit: 5, total: 2 });
    expect(mockGoal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          status: 'ACTIVE',
        }),
      })
    );
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ title: '' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates a goal with milestones', async () => {
    const res = await POST(postReq({
      title: 'Goal B',
      type: 'CUSTOM',
      targetDate: '2026-03-30T00:00:00.000Z',
      milestones: [{ title: 'M1', targetDate: '2026-03-10T00:00:00.000Z' }],
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockGoal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Goal B',
          milestones: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({ title: 'M1', position: 0 }),
            ]),
          }),
        }),
      })
    );
  });

  it('GET returns 500 on unexpected db errors', async () => {
    mockGoal.count.mockRejectedValue(new Error('db fail'));

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

