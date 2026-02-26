import { GET, POST } from '@/app/api/cognitive-load/route';
import { currentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/cognitive-load route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/cognitive-load');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('POST returns success for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/cognitive-load', { method: 'POST' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Cognitive load data processed');
  });
});
