jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET, PATCH, POST } from '@/app/api/enterprise/security/route';
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

const securityEvent = ensureModel('securityEvent', [
  'findMany',
  'count',
  'groupBy',
  'create',
  'findUnique',
  'update',
]);
const auditLog = ensureModel('auditLog', ['create']);
const complianceEvent = ensureModel('complianceEvent', ['create']);

describe('/api/enterprise/security route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });

    securityEvent.findMany.mockResolvedValue([
      {
        id: 'se-1',
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        status: 'OPEN',
        createdAt: new Date('2026-02-20T00:00:00.000Z'),
      },
    ]);
    securityEvent.count.mockResolvedValue(1);
    securityEvent.groupBy
      .mockResolvedValueOnce([{ status: 'OPEN', _count: 1 }])
      .mockResolvedValueOnce([{ severity: 'MEDIUM', _count: 1 }])
      .mockResolvedValueOnce([{ eventType: 'SUSPICIOUS_ACTIVITY', _count: 1 }]);
    securityEvent.create.mockResolvedValue({
      id: 'se-new',
      eventType: 'DATA_BREACH',
      severity: 'CRITICAL',
      organizationId: 'org-1',
      status: 'OPEN',
    });
    securityEvent.findUnique.mockResolvedValue({
      id: 'se-1',
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity: 'MEDIUM',
      organizationId: 'org-1',
      status: 'OPEN',
    });
    securityEvent.update.mockResolvedValue({
      id: 'se-1',
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity: 'MEDIUM',
      organizationId: 'org-1',
      status: 'RESOLVED',
    });
    auditLog.create.mockResolvedValue({ id: 'audit-1' });
    complianceEvent.create.mockResolvedValue({ id: 'comp-1' });
  });

  it('GET returns demo data when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/enterprise/security');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.events)).toBe(true);
  });

  it('GET returns 401 for non-admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const req = new NextRequest('http://localhost:3000/api/enterprise/security');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns security events and summary', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/security?page=1&limit=10');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.pagination.total).toBe(1);
    expect(body.data.summary.totalEvents).toBe(1);
  });

  it('POST creates security event and compliance event for critical severity', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/security', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-1',
        eventType: 'DATA_BREACH',
        severity: 'CRITICAL',
        description: 'Critical breach',
        status: 'OPEN',
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(complianceEvent.create).toHaveBeenCalled();
    expect(auditLog.create).toHaveBeenCalled();
  });

  it('PATCH validates required id and not found conditions', async () => {
    const missingIdReq = new NextRequest('http://localhost:3000/api/enterprise/security', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'RESOLVED' }),
    });
    const missingIdRes = await PATCH(missingIdReq);
    expect(missingIdRes.status).toBe(400);

    securityEvent.findUnique.mockResolvedValueOnce(null);
    const notFoundReq = new NextRequest('http://localhost:3000/api/enterprise/security', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'missing', status: 'RESOLVED' }),
    });
    const notFoundRes = await PATCH(notFoundReq);
    expect(notFoundRes.status).toBe(404);
  });

  it('PATCH updates security event status', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/security', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'se-1',
        status: 'RESOLVED',
        resolvedAt: '2026-02-21T00:00:00.000Z',
      }),
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(securityEvent.update).toHaveBeenCalled();
    expect(auditLog.create).toHaveBeenCalled();
  });
});
