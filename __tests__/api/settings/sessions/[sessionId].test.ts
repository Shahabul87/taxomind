/**
 * Tests for Settings Session Detail Route - app/api/settings/sessions/[sessionId]/route.ts
 */

import { DELETE } from '@/app/api/settings/sessions/[sessionId]/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).activeSession) {
  (db as Record<string, unknown>).activeSession = {
    findUnique: jest.fn(),
    delete: jest.fn(),
  };
}

const mockActiveSession = (db as Record<string, any>).activeSession;

function requestWithToken(token?: string) {
  return {
    cookies: {
      get: jest.fn((key: string) => {
        if ((key === 'authjs.session-token' || key === '__Secure-authjs.session-token') && token) {
          return { value: token };
        }
        return undefined;
      }),
    },
  } as any;
}

function params(sessionId = 'session-1') {
  return { params: { sessionId } } as any;
}

describe('Settings session detail route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockActiveSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      sessionToken: 'other-token',
    });
    mockActiveSession.delete.mockResolvedValue({ id: 'session-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await DELETE(requestWithToken('current-token'), params());
    expect(res.status).toBe(401);
  });

  it('returns 400 when sessionId is missing', async () => {
    const res = await DELETE(requestWithToken('current-token'), params(''));
    expect(res.status).toBe(400);
  });

  it('returns 404 when session does not exist', async () => {
    mockActiveSession.findUnique.mockResolvedValue(null);

    const res = await DELETE(requestWithToken('current-token'), params());
    expect(res.status).toBe(404);
  });

  it('returns 403 when session belongs to another user', async () => {
    mockActiveSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-2',
      sessionToken: 'other-token',
    });

    const res = await DELETE(requestWithToken('current-token'), params());
    expect(res.status).toBe(403);
  });

  it('returns 400 when trying to delete current session', async () => {
    mockActiveSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      sessionToken: 'current-token',
    });

    const res = await DELETE(requestWithToken('current-token'), params());
    expect(res.status).toBe(400);
  });

  it('deletes a non-current user-owned session', async () => {
    const res = await DELETE(requestWithToken('current-token'), params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockActiveSession.delete).toHaveBeenCalledWith({ where: { id: 'session-1' } });
  });
});
