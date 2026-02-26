import { GET } from '@/app/api/activities/user/[userId]/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

function params(userId = 'user-1') {
  return { params: Promise.resolve({ userId }) };
}

describe('/api/activities/user/[userId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/activities/user/user-1');
    const res = await GET(req, params());

    expect(res.status).toBe(401);
  });

  it('returns 403 when user requests another user activities', async () => {
    const req = new NextRequest('http://localhost:3000/api/activities/user/user-2');
    const res = await GET(req, params('user-2'));

    expect(res.status).toBe(403);
  });

  it('returns sample activities with summary stats', async () => {
    const req = new NextRequest('http://localhost:3000/api/activities/user/user-1');
    const res = await GET(req, params('user-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.activities)).toBe(true);
    expect(body.total).toBe(body.activities.length);
    expect(typeof body.completedCount).toBe('number');
    expect(typeof body.overdueCount).toBe('number');
  });

  it('returns 500 when auth throws', async () => {
    mockAuth.mockRejectedValueOnce(new Error('auth failure'));

    const req = new NextRequest('http://localhost:3000/api/activities/user/user-1');
    const res = await GET(req, params('user-1'));

    expect(res.status).toBe(500);
  });
});
