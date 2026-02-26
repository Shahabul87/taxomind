/**
 * Tests for Dashboard Notification Detail Route - app/api/dashboard/notifications/[id]/route.ts
 */

import { PATCH, DELETE } from '@/app/api/dashboard/notifications/[id]/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardNotification) {
  (db as Record<string, unknown>).dashboardNotification = {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardNotification;
  if (!model.findUnique) model.findUnique = jest.fn();
  if (!model.update) model.update = jest.fn();
  if (!model.delete) model.delete = jest.fn();
}

const mockNotification = (db as Record<string, any>).dashboardNotification;
const params = { params: { id: 'n1' } };

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/notifications/n1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/notifications/n1', {
    method: 'DELETE',
  });
}

describe('Dashboard notification detail route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockNotification.findUnique.mockResolvedValue({ id: 'n1', userId: 'user-1', read: false });
    mockNotification.update.mockResolvedValue({ id: 'n1', read: true });
    mockNotification.delete.mockResolvedValue({ id: 'n1' });
  });

  it('PATCH returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PATCH(patchReq({ read: true }), params);
    expect(res.status).toBe(401);
  });

  it('PATCH returns 404 when notification is missing', async () => {
    mockNotification.findUnique.mockResolvedValue(null);

    const res = await PATCH(patchReq({ read: true }), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('PATCH returns 403 when notification belongs to another user', async () => {
    mockNotification.findUnique.mockResolvedValue({ id: 'n1', userId: 'other-user', read: false });

    const res = await PATCH(patchReq({ read: true }), params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('PATCH marks notification as read', async () => {
    const res = await PATCH(patchReq({ read: true }), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockNotification.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: expect.objectContaining({
        read: true,
        readAt: expect.any(Date),
      }),
    });
  });

  it('DELETE returns 403 when notification belongs to another user', async () => {
    mockNotification.findUnique.mockResolvedValue({ id: 'n1', userId: 'other-user' });

    const res = await DELETE(deleteReq(), params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('DELETE removes notification for owner', async () => {
    const res = await DELETE(deleteReq(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Notification deleted successfully');
    expect(mockNotification.delete).toHaveBeenCalledWith({ where: { id: 'n1' } });
  });
});

