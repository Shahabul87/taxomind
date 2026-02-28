jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { DELETE, GET, PATCH } from '@/app/api/enterprise/organizations/[id]/route';
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

const organization = ensureModel('organization', ['findUnique', 'update', 'delete']);
const auditLog = ensureModel('auditLog', ['create']);

describe('/api/enterprise/organizations/[id] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    organization.findUnique.mockResolvedValue(null);
    organization.update.mockResolvedValue({ id: 'org-1', name: 'Updated Org' });
    organization.delete.mockResolvedValue({ id: 'org-1' });
    auditLog.create.mockResolvedValue({ id: 'audit-1' });
  });

  it('GET returns 401 for non-admin users', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'USER' } });

    const req = new NextRequest('http://localhost:3000/api/enterprise/organizations/org-1');
    const res = await GET(req, { params: Promise.resolve({ id: 'org-1' }) });

    expect(res.status).toBe(401);
  });

  it('GET returns 404 when organization is not found', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/organizations/missing');
    const res = await GET(req, { params: Promise.resolve({ id: 'missing' }) });

    expect(res.status).toBe(404);
  });

  it('GET returns computed organization metrics', async () => {
    organization.findUnique.mockResolvedValueOnce({
      id: 'org-1',
      name: 'Acme',
      users: [{ isActive: true }, { isActive: false }, { isActive: true }],
      courses: [
        { id: 'c1', isPublished: true, _count: { chapters: 3, Enrollment: 5 } },
        { id: 'c2', isPublished: false, _count: { chapters: 2, Enrollment: 1 } },
      ],
      analytics: [],
      _count: {
        users: 3,
        courses: 2,
        analytics: 4,
        auditLogs: 7,
        complianceEvents: 1,
      },
    });

    const req = new NextRequest('http://localhost:3000/api/enterprise/organizations/org-1');
    const res = await GET(req, { params: Promise.resolve({ id: 'org-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.metrics).toEqual({
      totalUsers: 3,
      activeUsers: 2,
      totalCourses: 2,
      publishedCourses: 1,
      totalChapters: 5,
      totalEnrollments: 6,
      totalAnalytics: 4,
      totalAuditLogs: 7,
      totalComplianceEvents: 1,
    });
  });

  it('PATCH returns 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/organizations/org-1', {
      method: 'PATCH',
      body: JSON.stringify({ maxUsers: 0 }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'org-1' }) });

    expect(res.status).toBe(400);
  });

  it('PATCH returns 404 when target organization does not exist', async () => {
    organization.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/enterprise/organizations/org-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renamed Org' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'org-1' }) });

    expect(res.status).toBe(404);
  });

  it('PATCH updates organization and writes audit trail', async () => {
    organization.findUnique.mockResolvedValueOnce({ id: 'org-1', name: 'Acme' });
    organization.update.mockResolvedValueOnce({ id: 'org-1', name: 'Renamed Org' });

    const req = new NextRequest('http://localhost:3000/api/enterprise/organizations/org-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renamed Org' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'org-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(auditLog.create).toHaveBeenCalled();
  });

  it('DELETE blocks deletion when organization has users or courses', async () => {
    organization.findUnique.mockResolvedValueOnce({
      id: 'org-1',
      name: 'Acme',
      _count: { users: 2, courses: 0 },
    });

    const req = new NextRequest('http://localhost:3000/api/enterprise/organizations/org-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'org-1' }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details.users).toBe(2);
  });

  it('DELETE removes empty organization', async () => {
    organization.findUnique.mockResolvedValueOnce({
      id: 'org-1',
      name: 'Acme',
      _count: { users: 0, courses: 0 },
    });

    const req = new NextRequest('http://localhost:3000/api/enterprise/organizations/org-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'org-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(organization.delete).toHaveBeenCalledWith({ where: { id: 'org-1' } });
    expect(auditLog.create).toHaveBeenCalled();
  });
});
