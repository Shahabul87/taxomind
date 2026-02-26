jest.mock('@/app/calendar/_lib/calendar-sync', () => ({
  CalendarSync: jest.fn().mockImplementation(() => ({
    syncWithGoogle: jest.fn(),
    exportToGoogle: jest.fn(),
    updateGoogleEvent: jest.fn(),
  })),
}));

import { POST } from '@/app/api/calendar/sync/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/calendar/sync route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      accounts: [{ provider: 'google', access_token: 'a', refresh_token: 'r', expires_at: 999999 }],
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/calendar/sync', {
      method: 'POST',
      body: JSON.stringify({ provider: 'google', action: 'import' }),
    });
    const res = await POST(req as never);

    expect(res.status).toBe(401);
  });

  it('returns 404 when user is not found', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/calendar/sync', {
      method: 'POST',
      body: JSON.stringify({ provider: 'google', action: 'import' }),
    });
    const res = await POST(req as never);

    expect(res.status).toBe(404);
  });

  it('returns 404 when provider account is not found', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'user-1', accounts: [] });

    const req = new NextRequest('http://localhost:3000/api/calendar/sync', {
      method: 'POST',
      body: JSON.stringify({ provider: 'google', action: 'import' }),
    });
    const res = await POST(req as never);

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid action', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/sync', {
      method: 'POST',
      body: JSON.stringify({ provider: 'google', action: 'invalid_action' }),
    });
    const res = await POST(req as never);

    expect(res.status).toBe(400);
  });
});
