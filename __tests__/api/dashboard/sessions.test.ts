/**
 * Tests for Dashboard Sessions Route - app/api/dashboard/sessions/route.ts
 */

jest.mock('@prisma/client', () => ({
  Prisma: {},
  SessionStatus: {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
}));

import { GET, POST } from '@/app/api/dashboard/sessions/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardStudySession) {
  (db as Record<string, unknown>).dashboardStudySession = {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardStudySession;
  if (!model.count) model.count = jest.fn();
  if (!model.findMany) model.findMany = jest.fn();
  if (!model.create) model.create = jest.fn();
}

const mockSession = (db as Record<string, any>).dashboardStudySession;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/sessions${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Dashboard sessions route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockSession.count.mockResolvedValue(6);
    mockSession.findMany.mockResolvedValue([
      { id: 's1', userId: 'user-1', title: 'Morning Session', status: 'ACTIVE' },
    ]);
    mockSession.create.mockResolvedValue({
      id: 's2',
      userId: 'user-1',
      title: 'New Session',
      course: { id: 'c1', title: 'Math' },
    });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns paginated sessions', async () => {
    const res = await GET(getReq('page=2&limit=3'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagination).toEqual({ page: 2, limit: 3, total: 6 });
    expect(mockSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 3,
        take: 3,
      })
    );
  });

  it('GET applies upcoming filter when requested', async () => {
    const res = await GET(getReq('upcoming=true&page=1&limit=10'));

    expect(res.status).toBe(200);
    expect(mockSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          status: 'ACTIVE',
          startTime: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      })
    );
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ title: '', duration: 5 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates a session for authenticated user', async () => {
    const res = await POST(postReq({
      title: 'New Session',
      startTime: '2026-03-01T09:00:00.000Z',
      duration: 60,
      notes: 'review',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'New Session',
          duration: 60,
        }),
      })
    );
  });

  it('GET returns 500 on unexpected db errors', async () => {
    mockSession.count.mockRejectedValue(new Error('db fail'));

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
