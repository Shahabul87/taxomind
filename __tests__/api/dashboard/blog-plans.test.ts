/**
 * Tests for Blog Plans Route - app/api/dashboard/blog-plans/route.ts
 */

import { GET, POST } from '@/app/api/dashboard/blog-plans/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardBlogPlan) {
  (db as Record<string, unknown>).dashboardBlogPlan = {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardBlogPlan;
  if (!model.count) model.count = jest.fn();
  if (!model.findMany) model.findMany = jest.fn();
  if (!model.create) model.create = jest.fn();
}

const mockPlan = (db as Record<string, any>).dashboardBlogPlan;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/blog-plans${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/blog-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Blog plans route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockPlan.count.mockResolvedValue(3);
    mockPlan.findMany.mockResolvedValue([{ id: 'bp1', userId: 'user-1', title: 'Blog Plan' }]);
    mockPlan.create.mockResolvedValue({ id: 'bp2', userId: 'user-1', title: 'Created Plan' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns paginated blog plans', async () => {
    const res = await GET(getReq('page=1&limit=5&status=ACTIVE'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.metadata.total).toBe(3);
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ title: '' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates blog plan', async () => {
    const res = await POST(postReq({
      title: 'Created Plan',
      topics: ['AI'],
      startPublishingDate: '2026-03-01T00:00:00.000Z',
      postFrequency: 'WEEKLY',
      contentGoal: 'TRAFFIC',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Created Plan',
        }),
      })
    );
  });
});

