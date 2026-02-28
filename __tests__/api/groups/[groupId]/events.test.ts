jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET, POST } from '@/app/api/groups/[groupId]/events/route';
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

const groupMember = ensureModel('groupMember', ['findFirst']);
const groupEvent = ensureModel('groupEvent', ['create', 'findMany']);

function props(groupId = 'group-1') {
  return { params: Promise.resolve({ groupId }) };
}

describe('/api/groups/[groupId]/events route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    groupMember.findFirst.mockResolvedValue({ id: 'member-1' });
    groupEvent.create.mockResolvedValue({ id: 'event-1', title: 'Study Session' });
    groupEvent.findMany.mockResolvedValue([{ id: 'event-1', title: 'Study Session' }]);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new Request('http://localhost:3000/api/groups/group-1/events', {
      method: 'POST',
      body: JSON.stringify({ title: 'Study Session' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());
    expect(res.status).toBe(401);
  });

  it('POST returns 422 on invalid payload', async () => {
    const req = new Request('http://localhost:3000/api/groups/group-1/events', {
      method: 'POST',
      body: JSON.stringify({ title: 'ab' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());
    expect(res.status).toBe(422);
  });

  it('POST returns 403 when user is not group member', async () => {
    groupMember.findFirst.mockResolvedValueOnce(null);
    const req = new Request('http://localhost:3000/api/groups/group-1/events', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Study Session',
        date: '2026-03-01',
        startTime: '10:00',
        endTime: '11:00',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());
    expect(res.status).toBe(403);
  });

  it('POST creates event for valid member', async () => {
    const req = new Request('http://localhost:3000/api/groups/group-1/events', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Study Session',
        date: '2026-03-01',
        startTime: '10:00',
        endTime: '11:00',
        isOnline: true,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('event-1');
    expect(groupEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          groupId: 'group-1',
          organizerId: 'user-1',
          title: 'Study Session',
        }),
      })
    );
  });

  it('GET returns events by status filter', async () => {
    const req = new Request('http://localhost:3000/api/groups/group-1/events?status=upcoming');
    const res = await GET(req as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(groupEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { groupId: 'group-1', status: 'upcoming' },
      })
    );
  });
});
