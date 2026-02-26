/**
 * Tests for Blog Plan Detail Route - app/api/dashboard/blog-plans/[id]/route.ts
 */

import { GET, PATCH, DELETE } from '@/app/api/dashboard/blog-plans/[id]/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardBlogPlan) {
  (db as Record<string, unknown>).dashboardBlogPlan = {
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardBlogPlan;
  if (!model.findFirst) model.findFirst = jest.fn();
  if (!model.update) model.update = jest.fn();
  if (!model.delete) model.delete = jest.fn();
}

const mockPlan = (db as Record<string, any>).dashboardBlogPlan;
const params = { params: { id: 'bp1' } };

function getReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/blog-plans/bp1');
}

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/blog-plans/bp1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/blog-plans/bp1', {
    method: 'DELETE',
  });
}

describe('Blog plan detail route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockPlan.findFirst.mockResolvedValue({ id: 'bp1', userId: 'user-1', title: 'Blog Plan' });
    mockPlan.update.mockResolvedValue({ id: 'bp1', userId: 'user-1', title: 'Updated Plan' });
    mockPlan.delete.mockResolvedValue({ id: 'bp1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq(), params);
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when plan not found', async () => {
    mockPlan.findFirst.mockResolvedValue(null);

    const res = await GET(getReq(), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('PATCH returns 400 for invalid payload', async () => {
    const res = await PATCH(patchReq({ topics: [] }), params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH updates owned blog plan', async () => {
    const res = await PATCH(
      patchReq({
        title: 'Updated Plan',
        topics: ['AI'],
        startPublishingDate: '2026-03-01T00:00:00.000Z',
        postFrequency: 'WEEKLY',
        contentGoal: 'TRAFFIC',
      }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('DELETE removes owned blog plan', async () => {
    const res = await DELETE(deleteReq(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('bp1');
  });
});

