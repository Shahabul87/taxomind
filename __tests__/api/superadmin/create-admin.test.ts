jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/data/admin', () => ({
  adminEmailExists: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

import { POST } from '@/app/api/superadmin/create-admin/route';
import { adminAuth } from '@/auth.admin';
import { adminEmailExists } from '@/data/admin';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAdminAuth = adminAuth as jest.Mock;
const mockAdminEmailExists = adminEmailExists as jest.Mock;
const mockHash = hash as jest.Mock;

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

const adminAccount = ensureModel('adminAccount', ['findUnique', 'create']);
const adminAuditLog = ensureModel('adminAuditLog', ['create']);

function req(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/superadmin/create-admin', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/superadmin/create-admin route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({ user: { id: 'superadmin-1' } });
    adminAccount.findUnique.mockResolvedValue({ role: 'SUPERADMIN', email: 'root@test.com' });
    mockAdminEmailExists.mockResolvedValue(false);
    mockHash.mockResolvedValue('hashed-password');
    adminAccount.create.mockResolvedValue({
      id: 'admin-2',
      email: 'newadmin@test.com',
      role: 'ADMIN',
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    adminAuditLog.create.mockResolvedValue({ id: 'audit-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAdminAuth.mockResolvedValueOnce(null);
    const res = await POST(req({ email: 'newadmin@test.com' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when requester is not SUPERADMIN', async () => {
    adminAccount.findUnique.mockResolvedValueOnce({ role: 'ADMIN', email: 'admin@test.com' });
    const res = await POST(req({ email: 'newadmin@test.com' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 on invalid email payload', async () => {
    const res = await POST(req({ email: 'not-an-email' }));
    expect(res.status).toBe(400);
  });

  it('returns 409 when admin email already exists', async () => {
    mockAdminEmailExists.mockResolvedValueOnce(true);
    const res = await POST(req({ email: 'newadmin@test.com' }));
    expect(res.status).toBe(409);
  });

  it('creates admin and audit entry for valid request', async () => {
    const res = await POST(req({ email: 'newadmin@test.com' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.admin.email).toBe('newadmin@test.com');
    expect(body.data.credentials.password).toBeTruthy();
    expect(mockHash).toHaveBeenCalled();
    expect(adminAuditLog.create).toHaveBeenCalled();
  });
});
