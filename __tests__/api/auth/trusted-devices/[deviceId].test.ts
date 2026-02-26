jest.mock('@/lib/security/session-manager', () => ({
  SessionManager: {
    revokeTrustedDevice: jest.fn(),
  },
}));

import { DELETE, PATCH } from '@/app/api/auth/trusted-devices/[deviceId]/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { SessionManager } from '@/lib/security/session-manager';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockRevokeTrustedDevice = SessionManager.revokeTrustedDevice as jest.Mock;

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

const authSession = ensureModel('authSession', ['updateMany']);

describe('/api/auth/trusted-devices/[deviceId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockRevokeTrustedDevice.mockResolvedValue({ success: true, message: 'Revoked' });
    authSession.updateMany.mockResolvedValue({ count: 1 });
  });

  it('DELETE returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/auth/trusted-devices/device-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: { deviceId: 'device-1' } });

    expect(res.status).toBe(401);
  });

  it('DELETE returns 400 when revoke fails', async () => {
    mockRevokeTrustedDevice.mockResolvedValueOnce({ success: false, message: 'Not trusted' });

    const req = new NextRequest('http://localhost:3000/api/auth/trusted-devices/device-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: { deviceId: 'device-1' } });

    expect(res.status).toBe(400);
  });

  it('DELETE revokes trusted device successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/trusted-devices/device-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: { deviceId: 'device-1' } });

    expect(res.status).toBe(200);
    expect(mockRevokeTrustedDevice).toHaveBeenCalledWith('user-1', 'device-1');
  });

  it('PATCH returns 400 when required data is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/trusted-devices/device-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, { params: { deviceId: 'device-1' } });

    expect(res.status).toBe(400);
  });

  it('PATCH returns 404 when device is not found', async () => {
    authSession.updateMany.mockResolvedValueOnce({ count: 0 });

    const req = new NextRequest('http://localhost:3000/api/auth/trusted-devices/device-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'My Device' }),
    });
    const res = await PATCH(req, { params: { deviceId: 'device-1' } });

    expect(res.status).toBe(404);
  });

  it('PATCH updates trusted device name', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/trusted-devices/device-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'My Device' }),
    });
    const res = await PATCH(req, { params: { deviceId: 'device-1' } });

    expect(res.status).toBe(200);
    expect(authSession.updateMany).toHaveBeenCalled();
  });
});
