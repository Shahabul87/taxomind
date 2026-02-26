import { GET, POST } from '@/app/api/adaptive-content/route';
import { currentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/adaptive-content route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/adaptive-content');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('POST returns success when authenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/adaptive-content', { method: 'POST' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Content adapted successfully');
  });
});
