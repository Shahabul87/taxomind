import { GET, POST } from '@/app/api/calendar/events/route';
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

const calendarEvent = ensureModel('calendarEvent', ['findMany', 'create']);

describe('/api/calendar/events route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    calendarEvent.findMany.mockResolvedValue([
      {
        id: 'e1',
        title: 'Study Session',
        description: null,
        startDate: new Date('2026-03-01T10:00:00.000Z'),
        endDate: new Date('2026-03-01T11:00:00.000Z'),
        allDay: false,
        location: null,
        color: null,
        recurringType: null,
        recurringEndDate: null,
        taskId: null,
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
        parentEventId: null,
        externalId: null,
        source: null,
        lastSync: null,
      },
    ]);
    calendarEvent.create.mockResolvedValue({ id: 'e2', title: 'New Event' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/calendar/events?userId=user-1');
    const res = await GET(req as never);
    expect(res.status).toBe(401);
  });

  it('GET returns 400 when userId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/events');
    const res = await GET(req as never);
    expect(res.status).toBe(400);
  });

  it('GET returns 403 when userId does not match session user', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/events?userId=other-user');
    const res = await GET(req as never);
    expect(res.status).toBe(403);
  });

  it('GET returns events for authorized user', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/events?userId=user-1');
    const res = await GET(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].id).toBe('e1');
    expect(typeof body.data[0].startDate).toBe('string');
  });

  it('POST returns validation error for invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify({ title: '' }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it('POST creates event for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify({
        id: 'e2',
        title: 'New Event',
        startDate: '2026-03-02T10:00:00.000Z',
        endDate: '2026-03-02T11:00:00.000Z',
      }),
    });
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('e2');
  });
});
