/**
 * Tests for Settings Sessions Route - app/api/settings/sessions/route.ts
 */

import { DELETE, GET } from '@/app/api/settings/sessions/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).activeSession) {
  (db as Record<string, unknown>).activeSession = {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  };
}

const mockActiveSession = (db as Record<string, any>).activeSession;

function requestWithToken(token?: string) {
  return {
    cookies: {
      get: jest.fn((key: string) => {
        if (key === 'authjs.session-token' && token) return { value: token };
        return undefined;
      }),
    },
  } as any;
}

describe('Settings sessions route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockActiveSession.findMany.mockResolvedValue([
      {
        id: 's1',
        deviceName: 'MacBook',
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'macOS',
        ipAddress: '127.0.0.1',
        location: 'NY',
        lastActive: new Date(),
        createdAt: new Date(),
        sessionToken: 'current-token',
      },
    ]);
    mockActiveSession.deleteMany.mockResolvedValue({ count: 2 });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(requestWithToken('current-token'));
    expect(res.status).toBe(401);
  });

  it('GET returns formatted sessions and current session flag', async () => {
    const res = await GET(requestWithToken('current-token'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].isCurrent).toBe(true);
  });

  it('DELETE returns 400 when current session token is missing', async () => {
    const res = await DELETE(requestWithToken());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('DELETE removes other sessions', async () => {
    const res = await DELETE(requestWithToken('current-token'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockActiveSession.deleteMany).toHaveBeenCalled();
    expect(body.data.deletedCount).toBe(2);
  });
});
