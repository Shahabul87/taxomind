import { GET, POST, PUT } from '@/app/api/collaboration/session/route';
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

const collaborationSession = ensureModel('collaborationSession', ['findFirst', 'create']);
const collaborationParticipant = ensureModel('collaborationParticipant', ['create', 'updateMany', 'findFirst', 'update', 'delete', 'count']);

describe('/api/collaboration/session route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue({ id: 'enr-1' });
    collaborationSession.findFirst.mockResolvedValue(null);
    collaborationSession.create.mockResolvedValue({ id: 'cs-1', sessionId: 'session_1' });
    collaborationParticipant.findFirst.mockResolvedValue({ id: 'cp-1', sessionId: 'cs-1', userId: 'user-1' });
    collaborationParticipant.count.mockResolvedValue(1);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/collaboration/session');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('GET returns 400 when required params are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/collaboration/session?courseId=c1');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('GET returns 403 when user is not enrolled', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/collaboration/session?courseId=c1&chapterId=ch1&sectionId=s1');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('POST returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/collaboration/session', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'c1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('PUT returns 400 for invalid action payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/collaboration/session', {
      method: 'PUT',
      body: JSON.stringify({ sessionId: 'cs-1' }),
    });
    const res = await PUT(req);

    expect(res.status).toBe(400);
  });
});
