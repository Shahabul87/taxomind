/**
 * Tests for Security Alerts Route - app/api/security/alerts/route.ts
 */

import { GET, POST } from '@/app/api/security/alerts/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

if (!(db as Record<string, unknown>).securityEvent) {
  (db as Record<string, unknown>).securityEvent = {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  };
}

if (!(db as Record<string, unknown>).adminAccount) {
  (db as Record<string, unknown>).adminAccount = {
    findUnique: jest.fn(),
  };
}

function getReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/security/alerts');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/security/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Security alerts route', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue(null);

    (db.securityEvent.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'e1',
        eventType: 'LOGIN_ANOMALY',
        severity: 'HIGH',
        source: 'SYSTEM',
        description: 'Suspicious login',
        details: { sessionId: 'abc', fingerprintHash: 'def', note: 'x' },
        affectedUsers: ['user-1', 'user-2'],
        status: 'OPEN',
        createdAt: new Date('2026-01-01'),
        resolvedAt: null,
      },
    ]);

    (db.securityEvent.count as jest.Mock).mockResolvedValue(1);

    (db.securityEvent.create as jest.Mock).mockResolvedValue({
      id: 'e-created',
      eventType: 'MANUAL_ALERT',
      severity: 'MEDIUM',
      status: 'OPEN',
    });
  });

  it('GET returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET filters sensitive fields for non-admin users', async () => {
    const res = await GET(getReq({ limit: '10', offset: '0' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.events[0].affectedUsers).toBeUndefined();
    expect(body.events[0].details.sessionId).toBeUndefined();
    expect(body.events[0].details.fingerprintHash).toBeUndefined();
    expect(db.securityEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ affectedUsers: { has: 'user-1' } }),
      })
    );
  });

  it('GET returns unfiltered events for admin users', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', role: 'ADMIN' });

    const res = await GET(getReq({ severity: 'HIGH' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.events[0].affectedUsers).toEqual(['user-1', 'user-2']);
    expect(db.securityEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ severity: 'HIGH' }) })
    );
  });

  it('POST returns 403 for non-admin users', async () => {
    const res = await POST(postReq({ eventType: 'MANUAL_ALERT', severity: 'LOW', description: 'x' }));
    expect(res.status).toBe(403);
  });

  it('POST returns 400 when required fields are missing', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', role: 'ADMIN' });

    const res = await POST(postReq({ eventType: 'MANUAL_ALERT' }));
    expect(res.status).toBe(400);
  });

  it('POST creates security alert for admin', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', role: 'SUPERADMIN' });

    const res = await POST(postReq({
      eventType: 'MANUAL_ALERT',
      severity: 'MEDIUM',
      description: 'Manual event',
      details: { source: 'test' },
      affectedUsers: ['user-2'],
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(db.securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'MANUAL_ALERT',
          severity: 'MEDIUM',
          description: 'Manual event',
          status: 'OPEN',
        }),
      })
    );
  });
});
