/**
 * Tests for Dashboard Session Detail Route - app/api/dashboard/sessions/[id]/route.ts
 */

import { GET, PATCH, DELETE } from '@/app/api/dashboard/sessions/[id]/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardStudySession) {
  (db as Record<string, unknown>).dashboardStudySession = {
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardStudySession;
  if (!model.findFirst) model.findFirst = jest.fn();
  if (!model.update) model.update = jest.fn();
  if (!model.delete) model.delete = jest.fn();
}

const mockSession = (db as Record<string, any>).dashboardStudySession;
const params = { params: Promise.resolve({ id: 's1' }) };

function getReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/sessions/s1');
}

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/sessions/s1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/sessions/s1', {
    method: 'DELETE',
  });
}

describe('Dashboard session detail route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockSession.findFirst.mockResolvedValue({
      id: 's1',
      userId: 'user-1',
      title: 'Session',
      status: 'ACTIVE',
    });
    mockSession.update.mockResolvedValue({
      id: 's1',
      userId: 'user-1',
      title: 'Updated',
      status: 'COMPLETED',
    });
    mockSession.delete.mockResolvedValue({ id: 's1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq(), params);
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when session is not found', async () => {
    mockSession.findFirst.mockResolvedValue(null);

    const res = await GET(getReq(), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('GET returns session for owner', async () => {
    const res = await GET(getReq(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('s1');
  });

  it('PATCH returns 400 for invalid payload', async () => {
    const res = await PATCH(patchReq({ duration: 2 }), params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH updates session and converts startTime to Date', async () => {
    const res = await PATCH(
      patchReq({ title: 'Updated', startTime: '2026-03-01T10:00:00.000Z', status: 'COMPLETED' }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({
          title: 'Updated',
          status: 'COMPLETED',
          startTime: expect.any(Date),
        }),
      })
    );
  });

  it('DELETE returns 404 when session is missing', async () => {
    mockSession.findFirst.mockResolvedValue(null);

    const res = await DELETE(deleteReq(), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('DELETE removes owned session', async () => {
    const res = await DELETE(deleteReq(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.success).toBe(true);
    expect(mockSession.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
  });
});

