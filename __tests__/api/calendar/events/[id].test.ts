import { DELETE, PUT } from '@/app/api/calendar/events/[id]/route';
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

const calendarEvent = ensureModel('calendarEvent', ['findFirst', 'update', 'delete']);

function params(id = 'event-1') {
  return { params: Promise.resolve({ id }) };
}

describe('/api/calendar/events/[id] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    calendarEvent.findFirst.mockResolvedValue({ id: 'event-1', userId: 'user-1' });
    calendarEvent.update.mockResolvedValue({ id: 'event-1', title: 'Updated Event' });
    calendarEvent.delete.mockResolvedValue({ id: 'event-1' });
  });

  it('PUT returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/calendar/events/event-1', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated Event' }),
    });

    const res = await PUT(req as never, params());
    expect(res.status).toBe(401);
  });

  it('PUT returns 400 on invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/events/event-1', {
      method: 'PUT',
      body: JSON.stringify({ title: '' }),
    });

    const res = await PUT(req as never, params());
    expect(res.status).toBe(400);
  });

  it('PUT returns 404 when event does not exist', async () => {
    calendarEvent.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/calendar/events/event-1', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Event',
        startDate: '2026-03-01T10:00:00.000Z',
        endDate: '2026-03-01T11:00:00.000Z',
      }),
    });

    const res = await PUT(req as never, params());
    expect(res.status).toBe(404);
  });

  it('PUT updates event for owner', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/events/event-1', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Event',
        startDate: '2026-03-01T10:00:00.000Z',
        endDate: '2026-03-01T11:00:00.000Z',
      }),
    });

    const res = await PUT(req as never, params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('DELETE removes event for owner', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/events/event-1', { method: 'DELETE' });
    const res = await DELETE(req as never, params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(calendarEvent.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } });
  });
});
