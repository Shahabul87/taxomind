jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET, PATCH, POST } from '@/app/api/enterprise/organizations/route';
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

const organization = ensureModel('organization', [
  'findMany',
  'count',
  'findUnique',
  'create',
  'updateMany',
]);
const auditLog = ensureModel('auditLog', ['create']);

describe('/api/enterprise/organizations route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });

    organization.findMany.mockResolvedValue([
      {
        id: 'org-1',
        name: 'Acme Org',
        subscriptionTier: 'PROFESSIONAL',
        _count: { users: 8, courses: 3, analytics: 10 },
      },
    ]);
    organization.count.mockResolvedValue(1);
    organization.findUnique.mockResolvedValue(null);
    organization.create.mockResolvedValue({
      id: 'org-1',
      name: 'Acme Org',
      slug: 'acme-org',
      _count: { users: 0, courses: 0 },
    });
    organization.updateMany.mockResolvedValue({ count: 2 });
    auditLog.create.mockResolvedValue({ id: 'audit-1' });
  });

  it('GET returns demo organizations when no active session is found', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/enterprise/organizations'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);
    expect(body.data[0].id).toBe('demo-org-1');
  });

  it('GET rejects non-admin sessions', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'USER' } });

    const res = await GET(new NextRequest('http://localhost:3000/api/enterprise/organizations'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('GET returns enriched organization list for admin users', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/enterprise/organizations?page=2&limit=5&search=acme&tier=PROFESSIONAL&active=true'
    );

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].userCount).toBe(8);
    expect(body.data[0].courseCount).toBe(3);
    expect(body.data[0].analyticsCount).toBe(10);
    expect(body.pagination).toEqual({ page: 2, limit: 5, total: 1, totalPages: 1 });
    expect(organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
          subscriptionTier: 'PROFESSIONAL',
          isActive: true,
        }),
        skip: 5,
        take: 5,
      })
    );
  });

  it('POST returns 400 when slug already exists', async () => {
    organization.findUnique.mockResolvedValueOnce({ id: 'existing-org' });

    const req = new NextRequest('http://localhost:3000/api/enterprise/organizations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme', slug: 'acme', maxUsers: 5, maxCourses: 2 }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('POST creates an organization and logs an audit record', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/organizations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme', slug: 'acme', maxUsers: 5, maxCourses: 2 }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'admin-1',
          action: 'CREATE',
          entityType: 'ORGANIZATION',
        }),
      })
    );
  });

  it('PATCH returns 400 when ids array is missing or empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/organizations', {
      method: 'PATCH',
      body: JSON.stringify({ ids: [], updates: { isActive: false } }),
    });
    const res = await PATCH(req);

    expect(res.status).toBe(400);
  });

  it('PATCH bulk-updates organizations for admin users', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/organizations', {
      method: 'PATCH',
      body: JSON.stringify({
        ids: ['org-1', 'org-2'],
        updates: { isActive: false, maxUsers: 50 },
      }),
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.updatedCount).toBe(2);
    expect(organization.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['org-1', 'org-2'] } },
      data: { isActive: false, maxUsers: 50 },
    });
  });
});
