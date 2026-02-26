import { DELETE, GET, POST, PUT } from '@/app/api/calendar/route';
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

const calendarEvent = ensureModel('calendarEvent', ['findFirst', 'findMany', 'create', 'update', 'delete']);

describe('/api/calendar route', () => {
  beforeAll(() => {
    if (typeof globalThis.crypto?.randomUUID !== 'function') {
      const nodeCrypto = require('crypto');
      if (!globalThis.crypto) {
        globalThis.crypto = {} as Crypto;
      }
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: () => nodeCrypto.randomUUID(),
        configurable: true,
        writable: true,
      });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    calendarEvent.findFirst.mockResolvedValue({ id: 'event-1', userId: 'user-1' });
    calendarEvent.findMany.mockResolvedValue([{ id: 'event-1', title: 'Session', recurringType: null }]);
    calendarEvent.create.mockResolvedValue({ id: 'event-2', title: 'New event' });
    calendarEvent.update.mockResolvedValue({ id: 'event-1', title: 'Updated' });
    calendarEvent.delete.mockResolvedValue({ id: 'event-1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/calendar');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns specific event when id query is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar?id=event-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('event-1');
  });

  it('POST creates event for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar', {
      method: 'POST',
      body: JSON.stringify({
        title: 'New event',
        startDate: '2026-03-10T10:00:00.000Z',
        endDate: '2026-03-10T11:00:00.000Z',
        category: 'study',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('event-2');
    expect(calendarEvent.create).toHaveBeenCalled();
  });

  it('PUT returns 400 when event id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated' }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it('DELETE returns 400 when event id query is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar', { method: 'DELETE' });

    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });
});
