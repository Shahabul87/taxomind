import { GET, POST } from '@/app/api/collaboration/message/route';
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

describe('/api/collaboration/message route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'User 1', image: null } });
    collaborationSession.findUnique.mockResolvedValue({
      id: 'cs-1',
      sessionId: 'session-1',
      participants: [{ userId: 'user-1' }],
    });
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/collaboration/message', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('POST returns 400 when payload is invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/collaboration/message', {
      method: 'POST',
      body: JSON.stringify({ sessionId: '', message: { content: '' } }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('POST returns 404 when session does not exist', async () => {
    collaborationSession.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/collaboration/message', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'session-1', message: { content: 'Hello' } }),
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it('GET returns 400 when sessionId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/collaboration/message');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('GET returns 403 when user is not participant', async () => {
    collaborationSession.findUnique.mockResolvedValueOnce({ id: 'cs-1', sessionId: 'session-1', participants: [] });

    const req = new NextRequest('http://localhost:3000/api/collaboration/message?sessionId=session-1');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });
});
