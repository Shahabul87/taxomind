import { GET, POST } from '@/app/api/collaborative/initialize/route';
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

const collaborativeSession = ensureModel('collaborativeSession', ['upsert', 'findFirst']);

describe('/api/collaborative/initialize route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.course.findFirst as jest.Mock).mockResolvedValue({ id: 'course-1', userId: 'user-1' });
    (db.post.findFirst as jest.Mock).mockResolvedValue(null);
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue(null);
    collaborativeSession.findFirst.mockResolvedValue(null);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/collaborative/initialize', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'course', contentId: 'course-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('POST returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/collaborative/initialize', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'course' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('POST returns 403 when user lacks permission', async () => {
    (db.course.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/collaborative/initialize', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'course', contentId: 'course-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it('GET returns 400 when required query params are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/collaborative/initialize');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('GET returns disabled state when no active collaborative session exists', async () => {
    const req = new NextRequest('http://localhost:3000/api/collaborative/initialize?contentType=course&contentId=course-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.enabled).toBe(false);
  });
});
