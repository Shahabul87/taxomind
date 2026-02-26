import { GET, POST, PUT } from '@/app/api/collaboration/breakout-room/route';
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

const collaborationSession = ensureModel('collaborationSession', ['findUnique']);

describe('/api/collaboration/breakout-room route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    collaborationSession.findUnique.mockResolvedValue({ id: 'cs-1', sessionId: 'session-1', participants: [{ userId: 'user-1' }] });
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/collaboration/breakout-room', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'session-1', room: { name: 'R', topic: 'T', timeLimit: 10 } }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('POST returns 400 when required params are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/collaboration/breakout-room', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'session-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('GET returns 400 when sessionId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/collaboration/breakout-room');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('GET returns 403 when user is not participant', async () => {
    collaborationSession.findUnique.mockResolvedValueOnce({ id: 'cs-1', sessionId: 'session-1', participants: [] });

    const req = new NextRequest('http://localhost:3000/api/collaboration/breakout-room?sessionId=session-1');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('PUT returns 400 on invalid action', async () => {
    const req = new NextRequest('http://localhost:3000/api/collaboration/breakout-room', {
      method: 'PUT',
      body: JSON.stringify({ roomId: 'room-1', action: 'invalid' }),
    });
    const res = await PUT(req);

    expect(res.status).toBe(400);
  });
});
