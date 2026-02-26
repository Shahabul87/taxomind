jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/calendar/accounts/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/calendar/accounts route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      accounts: [{ id: 'acc-1', provider: 'google' }],
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/calendar/accounts');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 when user is not found', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/calendar/accounts');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('returns google account presence flag', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/accounts');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.hasGoogleAccount).toBe(true);
  });
});
