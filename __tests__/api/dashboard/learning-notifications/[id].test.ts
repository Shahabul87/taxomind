/**
 * Tests for Dashboard Learning Notification Detail Route - app/api/dashboard/learning-notifications/[id]/route.ts
 */

import { GET, PATCH, DELETE } from '@/app/api/dashboard/learning-notifications/[id]/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).learningNotification) {
  (db as Record<string, unknown>).learningNotification = {
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).learningNotification;
  if (!model.findFirst) model.findFirst = jest.fn();
  if (!model.update) model.update = jest.fn();
  if (!model.delete) model.delete = jest.fn();
}

const mockLearningNotification = (db as Record<string, any>).learningNotification;
const params = { params: Promise.resolve({ id: 'ln-1' }) };

function getReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/learning-notifications/ln-1');
}

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/learning-notifications/ln-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/learning-notifications/ln-1', {
    method: 'DELETE',
  });
}

describe('Dashboard learning notification detail route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockLearningNotification.findFirst.mockResolvedValue({
      id: 'ln-1',
      userId: 'user-1',
      read: false,
      dismissed: false,
    });
    mockLearningNotification.update.mockResolvedValue({
      id: 'ln-1',
      read: true,
      dismissed: true,
    });
    mockLearningNotification.delete.mockResolvedValue({ id: 'ln-1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq(), params);
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when notification is not found', async () => {
    mockLearningNotification.findFirst.mockResolvedValue(null);

    const res = await GET(getReq(), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('GET returns notification for owner', async () => {
    const res = await GET(getReq(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('ln-1');
  });

  it('PATCH returns 400 for invalid payload', async () => {
    const res = await PATCH(patchReq({ read: 'yes' as any }), params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH updates read and dismissed fields', async () => {
    const res = await PATCH(patchReq({ read: true, dismissed: true }), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockLearningNotification.update).toHaveBeenCalledWith({
      where: { id: 'ln-1' },
      data: expect.objectContaining({
        read: true,
        dismissed: true,
        readAt: expect.any(Date),
        dismissedAt: expect.any(Date),
      }),
    });
  });

  it('DELETE removes notification for owner', async () => {
    const res = await DELETE(deleteReq(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);
    expect(mockLearningNotification.delete).toHaveBeenCalledWith({ where: { id: 'ln-1' } });
  });
});

