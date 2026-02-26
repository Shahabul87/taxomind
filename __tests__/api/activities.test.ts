import { POST } from '@/app/api/activities/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  const dbRecord = db as Record<string, Record<string, jest.Mock> | undefined>;
  if (!dbRecord[modelName]) {
    dbRecord[modelName] = {} as Record<string, jest.Mock>;
  }
  for (const method of methods) {
    if (!(dbRecord[modelName] as Record<string, jest.Mock>)[method]) {
      (dbRecord[modelName] as Record<string, jest.Mock>)[method] = jest.fn();
    }
  }
  return dbRecord[modelName] as Record<string, jest.Mock>;
}

const activity = ensureModel('activity', ['create']);

describe('/api/activities route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    activity.create.mockResolvedValue({ id: 'activity-1', title: 'Task' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/activities', {
      method: 'POST',
      body: JSON.stringify({ title: 'Task' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when title is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/activities', {
      method: 'POST',
      body: JSON.stringify({ type: 'plan', status: 'open', priority: 'high', userId: 'user-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 403 when userId does not match session user', async () => {
    const req = new NextRequest('http://localhost:3000/api/activities', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Task',
        type: 'plan',
        status: 'open',
        priority: 'high',
        userId: 'other-user',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('creates activity successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/activities', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Task',
        description: 'desc',
        type: 'plan',
        status: 'open',
        priority: 'high',
        progress: 20,
        dueDate: '2026-03-01T10:00:00.000Z',
        userId: 'user-1',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('activity-1');
    expect(activity.create).toHaveBeenCalled();
  });

  it('returns 500 when create fails', async () => {
    activity.create.mockRejectedValueOnce(new Error('db down'));

    const req = new NextRequest('http://localhost:3000/api/activities', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Task',
        type: 'plan',
        status: 'open',
        priority: 'high',
        userId: 'user-1',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
