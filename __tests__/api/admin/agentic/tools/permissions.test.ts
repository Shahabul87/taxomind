jest.mock('@/auth.admin', () => ({ adminAuth: jest.fn() }));

jest.mock('@sam-ai/agentic', () => ({
  UserRole: { STUDENT: 'STUDENT', MENTOR: 'MENTOR', INSTRUCTOR: 'INSTRUCTOR', ADMIN: 'ADMIN' },
  createPrismaPermissionStore: jest.fn(() => ({ grant: jest.fn().mockResolvedValue({ id: 'perm-1' }), revoke: jest.fn().mockResolvedValue(undefined) })),
  createPermissionManager: jest.fn(() => ({ setRolePermissions: jest.fn().mockResolvedValue([{ id: 'perm-role-1' }]) })),
}));

import { DELETE, GET, POST } from '@/app/api/admin/agentic/tools/permissions/route';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAdminAuth = adminAuth as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model as Record<string, jest.Mock>;
}

const agentPermission = ensureModel('agentPermission', ['findMany', 'create', 'deleteMany']);

describe('/api/admin/agentic/tools/permissions route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    agentPermission.findMany.mockResolvedValue([{ id: 'perm-1', userId: 'u1', toolId: 't1', category: 'cat', levels: ['execute'], grantedBy: 'admin-1', grantedAt: new Date(), expiresAt: null, conditions: null }]);
    agentPermission.create.mockResolvedValue({
      id: 'perm-1',
      userId: 'u1',
      toolId: null,
      category: null,
      levels: ['execute'],
      grantedBy: 'admin-1',
      grantedAt: new Date(),
      expiresAt: null,
      conditions: null,
    });
    agentPermission.deleteMany.mockResolvedValue({ count: 1 });
  });

  it('GET returns 401 when unauthorized', async () => {
    mockAdminAuth.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/admin/agentic/tools/permissions'));
    expect(res.status).toBe(401);
  });

  it('GET lists permissions', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/admin/agentic/tools/permissions'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.permissions).toHaveLength(1);
  });

  it('POST returns 400 for invalid body', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/agentic/tools/permissions', { method: 'POST', body: JSON.stringify({ userId: '' }) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST grants permission using levels', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/agentic/tools/permissions', { method: 'POST', body: JSON.stringify({ userId: 'u1', levels: ['execute'] }) });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('DELETE revokes permission', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/agentic/tools/permissions', { method: 'DELETE', body: JSON.stringify({ userId: 'u1' }) });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
  });
});
