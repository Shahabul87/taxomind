/**
 * Tests for Enterprise Compliance Route - app/api/enterprise/compliance/route.ts
 */

import { GET, POST } from '@/app/api/enterprise/compliance/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

if (!(db as Record<string, unknown>).complianceEvent) {
  (db as Record<string, unknown>).complianceEvent = {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    create: jest.fn(),
  };
}

const mockComplianceEvent = (db as Record<string, any>).complianceEvent;

function getRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/enterprise/compliance');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

function postRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/enterprise/compliance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/enterprise/compliance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });

    mockComplianceEvent.findMany.mockResolvedValue([
      {
        id: 'evt-1',
        eventType: 'DATA_ACCESS',
        complianceFramework: 'GDPR',
        status: 'COMPLIANT',
        severity: 'LOW',
        createdAt: new Date(),
        organization: { id: 'org-1', name: 'Org', slug: 'org' },
      },
    ]);
    mockComplianceEvent.count.mockResolvedValue(2);
    mockComplianceEvent.groupBy
      .mockResolvedValueOnce([{ status: 'COMPLIANT', _count: 1 }, { status: 'RESOLVED', _count: 1 }])
      .mockResolvedValueOnce([{ severity: 'LOW', _count: 2 }])
      .mockResolvedValueOnce([{ complianceFramework: 'GDPR', _count: 2 }]);
  });

  it('returns demo data when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(getRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.events).toHaveLength(2);
  });

  it('returns 401 for non-admin session', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });

    const res = await GET(getRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns filtered compliance events and summary for admin', async () => {
    mockComplianceEvent.findMany.mockResolvedValue([
      {
        id: 'evt-critical',
        eventType: 'SECURITY_INCIDENT',
        complianceFramework: 'GDPR',
        status: 'UNDER_REVIEW',
        severity: 'CRITICAL',
        createdAt: new Date(),
        organization: { name: 'Org', slug: 'org' },
      },
    ]);

    const res = await GET(getRequest({ framework: 'GDPR', severity: 'CRITICAL' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.events).toHaveLength(1);
    expect(body.data.summary).toBeDefined();
    expect(mockComplianceEvent.findMany).toHaveBeenCalled();
  });

  it('returns 400 for invalid query params', async () => {
    const res = await GET(getRequest({ eventType: 'INVALID_EVENT' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 500 when database query fails', async () => {
    mockComplianceEvent.findMany.mockRejectedValue(new Error('db down'));

    const res = await GET(getRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch compliance events');
  });
});

describe('POST /api/enterprise/compliance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });

    mockComplianceEvent.create.mockResolvedValue({
      id: 'evt-new',
      eventType: 'DATA_ACCESS',
      complianceFramework: 'GDPR',
      organization: { id: 'org-1', name: 'Org', slug: 'org' },
    });
    (db.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });
  });

  it('returns 401 when user is not admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });

    const res = await POST(postRequest({}) as never);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid payload', async () => {
    const res = await POST(postRequest({ eventType: 'DATA_ACCESS' }) as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('creates compliance event and audit log', async () => {
    const res = await POST(postRequest({
      organizationId: 'org-1',
      eventType: 'DATA_ACCESS',
      complianceFramework: 'GDPR',
      details: { reason: 'User requested export' },
      severity: 'LOW',
      status: 'UNDER_REVIEW',
    }) as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockComplianceEvent.create).toHaveBeenCalled();
    expect(db.auditLog.create).toHaveBeenCalled();
  });

  it('returns 500 when create fails', async () => {
    mockComplianceEvent.create.mockRejectedValue(new Error('db write failure'));

    const res = await POST(postRequest({
      organizationId: 'org-1',
      eventType: 'DATA_ACCESS',
      complianceFramework: 'GDPR',
      details: { reason: 'User requested export' },
    }) as never);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to record compliance event');
  });
});
