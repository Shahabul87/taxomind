import { GET, PATCH } from '@/app/api/security/alerts/[alertId]/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const securityEvent = ensureModel('securityEvent', ['findUnique', 'update']);
const adminAccount = ensureModel('adminAccount', ['findUnique']);

describe('/api/security/alerts/[alertId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    securityEvent.findUnique.mockResolvedValue({
      id: 'alert-1',
      affectedUsers: ['user-1', 'user-2'],
      status: 'OPEN',
      details: {
        sessionId: 'session-secret',
        fingerprintHash: 'fingerprint-secret',
        location: 'US',
      },
    });

    securityEvent.update.mockResolvedValue({ id: 'alert-1', status: 'RESOLVED' });
    adminAccount.findUnique.mockResolvedValue(null);
  });

  it('GET returns 401 when user is unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/security/alerts/alert-1');
    const res = await GET(req, { params: { alertId: 'alert-1' } });

    expect(res.status).toBe(401);
  });

  it('GET returns 404 when alert does not exist', async () => {
    securityEvent.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/security/alerts/missing');
    const res = await GET(req, { params: { alertId: 'missing' } });

    expect(res.status).toBe(404);
  });

  it('GET filters sensitive fields for non-admin users', async () => {
    const req = new NextRequest('http://localhost:3000/api/security/alerts/alert-1');
    const res = await GET(req, { params: { alertId: 'alert-1' } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.alert.affectedUsers).toEqual(['user-1']);
    expect(body.alert.details.sessionId).toBeUndefined();
    expect(body.alert.details.fingerprintHash).toBeUndefined();
  });

  it('GET returns 403 when user is not allowed to view the alert', async () => {
    securityEvent.findUnique.mockResolvedValueOnce({
      id: 'alert-1',
      affectedUsers: ['user-2'],
      status: 'OPEN',
      details: {},
    });

    const req = new NextRequest('http://localhost:3000/api/security/alerts/alert-1');
    const res = await GET(req, { params: { alertId: 'alert-1' } });

    expect(res.status).toBe(403);
  });

  it('PATCH returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/security/alerts/alert-1', {
      method: 'PATCH',
      body: JSON.stringify({ resolution: 'handled' }),
    });
    const res = await PATCH(req, { params: { alertId: 'alert-1' } });

    expect(res.status).toBe(400);
  });

  it('PATCH returns 403 when user cannot resolve the alert', async () => {
    securityEvent.findUnique.mockResolvedValueOnce({
      id: 'alert-1',
      affectedUsers: ['user-2'],
      status: 'OPEN',
    });

    const req = new NextRequest('http://localhost:3000/api/security/alerts/alert-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'RESOLVED' }),
    });
    const res = await PATCH(req, { params: { alertId: 'alert-1' } });

    expect(res.status).toBe(403);
  });

  it('PATCH resolves alert when requested by admin', async () => {
    adminAccount.findUnique.mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' });

    const req = new NextRequest('http://localhost:3000/api/security/alerts/alert-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'RESOLVED', resolution: 'investigated' }),
    });
    const res = await PATCH(req, { params: { alertId: 'alert-1' } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(securityEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'alert-1' },
        data: expect.objectContaining({
          status: 'RESOLVED',
          resolvedAt: expect.any(Date),
        }),
      })
    );
  });
});
