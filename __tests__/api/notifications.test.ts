jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { DELETE, GET, PATCH, POST } from '@/app/api/notifications/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const notification = ensureModel('notification', [
  'create',
  'findMany',
  'count',
  'updateMany',
  'findFirst',
  'delete',
]);

describe('/api/notifications route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    notification.create.mockResolvedValue({ id: 'n1', title: 'Hi', message: 'Msg', type: 'info' });
    notification.findMany.mockResolvedValue([{ id: 'n1', title: 'Hi' }]);
    notification.count.mockResolvedValue(1);
    notification.updateMany.mockResolvedValue({ count: 1 });
    notification.findFirst.mockResolvedValue({ id: 'n1', userId: 'user-1' });
    notification.delete.mockResolvedValue({ id: 'n1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/notifications');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('POST creates a notification with valid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ title: 'Hi', message: 'Msg' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.id).toBe('n1');
  });

  it('PATCH marks all notifications as read', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ markAllAsRead: true }),
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(notification.updateMany).toHaveBeenCalled();
  });

  it('DELETE removes notification by id for owner', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications?id=n1', {
      method: 'DELETE',
    });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
