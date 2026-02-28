jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { POST } from '@/app/api/groups/[groupId]/events/[eventId]/attend/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

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

const groupEventAttendee = ensureModel('groupEventAttendee', ['findUnique', 'update', 'create']);
const groupEvent = ensureModel('groupEvent', ['findUnique']);

function props(groupId = 'group-1', eventId = 'event-1') {
  return { params: Promise.resolve({ groupId, eventId }) };
}

describe('/api/groups/[groupId]/events/[eventId]/attend route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    groupEventAttendee.findUnique.mockResolvedValue(null);
    groupEventAttendee.update.mockResolvedValue({ id: 'attendee-1', status: 'attending' });
    groupEventAttendee.create.mockResolvedValue({ id: 'attendee-1', status: 'attending' });
    groupEvent.findUnique.mockResolvedValue({
      id: 'event-1',
      maxAttendees: 10,
      _count: { GroupEventAttendee: 2 },
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new Request('http://localhost:3000/api/groups/group-1/events/event-1/attend', {
      method: 'POST',
      body: JSON.stringify({ status: 'attending' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());
    expect(res.status).toBe(401);
  });

  it('updates existing attendance record', async () => {
    groupEventAttendee.findUnique.mockResolvedValueOnce({ id: 'attendee-1', status: 'interested' });
    const req = new Request('http://localhost:3000/api/groups/group-1/events/event-1/attend', {
      method: 'POST',
      body: JSON.stringify({ status: 'attending' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('attendee-1');
    expect(groupEventAttendee.update).toHaveBeenCalledWith({
      where: { id: 'attendee-1' },
      data: { status: 'attending' },
    });
  });

  it('returns 400 when event is full and user tries attending', async () => {
    groupEvent.findUnique.mockResolvedValueOnce({
      id: 'event-1',
      maxAttendees: 1,
      _count: { GroupEventAttendee: 1 },
    });
    const req = new Request('http://localhost:3000/api/groups/group-1/events/event-1/attend', {
      method: 'POST',
      body: JSON.stringify({ status: 'attending' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());

    expect(res.status).toBe(400);
  });

  it('creates new attendee record when event has capacity', async () => {
    const req = new Request('http://localhost:3000/api/groups/group-1/events/event-1/attend', {
      method: 'POST',
      body: JSON.stringify({ status: 'attending' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('attendee-1');
    expect(groupEventAttendee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: 'event-1',
          userId: 'user-1',
          status: 'attending',
        }),
      })
    );
  });
});
