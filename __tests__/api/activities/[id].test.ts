import { DELETE, PATCH } from '@/app/api/activities/[id]/route';
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

const activity = ensureModel('activity', ['findUnique', 'update', 'delete']);

function params(id = 'activity-1') {
  return { params: Promise.resolve({ id }) };
}

describe('/api/activities/[id] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    activity.findUnique.mockResolvedValue({ id: 'activity-1', userId: 'user-1' });
    activity.update.mockResolvedValue({ id: 'activity-1', progress: 50 });
    activity.delete.mockResolvedValue({ id: 'activity-1' });
  });

  it('PATCH returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/activities/activity-1', {
      method: 'PATCH',
      body: JSON.stringify({ progress: 50 }),
    });

    const res = await PATCH(req, params());
    expect(res.status).toBe(401);
  });

  it('PATCH returns 404 when activity does not exist', async () => {
    activity.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/activities/activity-1', {
      method: 'PATCH',
      body: JSON.stringify({ progress: 50 }),
    });

    const res = await PATCH(req, params());
    expect(res.status).toBe(404);
  });

  it('PATCH returns 403 when user does not own activity', async () => {
    activity.findUnique.mockResolvedValueOnce({ id: 'activity-1', userId: 'other-user' });

    const req = new NextRequest('http://localhost:3000/api/activities/activity-1', {
      method: 'PATCH',
      body: JSON.stringify({ progress: 50 }),
    });

    const res = await PATCH(req, params());
    expect(res.status).toBe(403);
  });

  it('PATCH updates activity and converts date fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/activities/activity-1', {
      method: 'PATCH',
      body: JSON.stringify({
        dueDate: '2026-03-10T00:00:00.000Z',
        completedDate: '2026-03-11T00:00:00.000Z',
        progress: 50,
      }),
    });

    const res = await PATCH(req, params());

    expect(res.status).toBe(200);
    expect(activity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dueDate: expect.any(Date),
          completedDate: expect.any(Date),
          progress: 50,
        }),
      })
    );
  });

  it('DELETE returns 204 on success', async () => {
    const req = new NextRequest('http://localhost:3000/api/activities/activity-1', { method: 'DELETE' });
    const res = await DELETE(req, params());

    expect(res.status).toBe(204);
    expect(activity.delete).toHaveBeenCalledWith({ where: { id: 'activity-1' } });
  });
});
