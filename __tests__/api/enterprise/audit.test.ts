jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/enterprise/audit/route';
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

const auditLog = ensureModel('auditLog', ['findMany', 'count', 'groupBy', 'create']);

describe('/api/enterprise/audit route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });

    auditLog.findMany.mockResolvedValue([
      {
        id: 'audit-1',
        action: 'CREATE',
        entityType: 'COURSE',
        entityId: 'course-1',
        severity: 'INFO',
        createdAt: new Date('2026-02-20T00:00:00.000Z'),
      },
    ]);
    auditLog.count.mockResolvedValue(1);
    auditLog.groupBy
      .mockResolvedValueOnce([{ action: 'CREATE', _count: 1 }])
      .mockResolvedValueOnce([{ severity: 'INFO', _count: 1 }])
      .mockResolvedValueOnce([{ entityType: 'COURSE', _count: 1 }])
      .mockResolvedValueOnce([{ userId: 'admin-1', _count: 1 }]);
    auditLog.create.mockResolvedValue({
      id: 'audit-new',
      action: 'CREATE',
      entityType: 'COURSE',
      entityId: 'course-2',
    });
  });

  it('GET returns 401 when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/enterprise/audit');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET returns 403 for non-admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const req = new NextRequest('http://localhost:3000/api/enterprise/audit');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('GET returns audit logs and summary for admin', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/audit?page=1&limit=10');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.pagination.total).toBe(1);
    expect(body.data.summary.totalLogs).toBe(1);
  });

  it('POST creates audit log entry for admin', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/audit', {
      method: 'POST',
      headers: { 'user-agent': 'jest-agent' },
      body: JSON.stringify({
        organizationId: 'org-1',
        action: 'CREATE',
        entityType: 'COURSE',
        entityId: 'course-2',
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(auditLog.create).toHaveBeenCalled();
  });

  it('POST returns 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/audit', {
      method: 'POST',
      body: JSON.stringify({
        action: 'BAD_ACTION',
        entityType: 'COURSE',
        entityId: 'x',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
