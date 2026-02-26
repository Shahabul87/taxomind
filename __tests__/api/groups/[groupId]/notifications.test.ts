import { GET, PATCH } from '@/app/api/groups/[groupId]/notifications/route';
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

const groupNotification = ensureModel('groupNotification', ['findMany', 'update']);

describe('/api/groups/[groupId]/notifications route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    groupNotification.findMany.mockResolvedValue([{ id: 'n1', isRead: false }]);
    groupNotification.update.mockResolvedValue({ id: 'n1', isRead: true });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/groups/g1/notifications');
    const res = await GET(req, { params: Promise.resolve({ groupId: 'g1' }) });
    expect(res.status).toBe(401);
  });

  it('GET returns notifications list', async () => {
    const req = new NextRequest('http://localhost:3000/api/groups/g1/notifications');
    const res = await GET(req, { params: Promise.resolve({ groupId: 'g1' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it('PATCH marks notification as read', async () => {
    const req = new NextRequest('http://localhost:3000/api/groups/g1/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ notificationId: 'n1' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ groupId: 'g1' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.isRead).toBe(true);
  });
});
