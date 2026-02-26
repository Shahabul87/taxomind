import { POST } from '@/app/api/sections/[sectionId]/complete/route';
import { currentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/sections/[sectionId]/complete route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sections/s1/complete', { method: 'POST' });
    const res = await POST(req, { params: { sectionId: 's1' } } as any);
    expect(res.status).toBe(401);
  });

  it('returns 503 maintenance response when authenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/sections/s1/complete', { method: 'POST' });
    const res = await POST(req, { params: { sectionId: 's1' } } as any);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toContain('temporarily disabled');
  });
});
