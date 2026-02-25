/**
 * Tests for Admin Accounts Route - app/api/admin/accounts/route.ts
 *
 * Covers: GET (list admin accounts), POST (create admin account)
 * Auth: Uses adminAuth() from @/config/auth/auth.admin - SUPERADMIN only
 */

jest.mock('@/config/auth/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

// @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import { GET, POST } from '@/app/api/admin/accounts/route';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/config/auth/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

function createGetRequest() {
  return new NextRequest('http://localhost:3000/api/admin/accounts', {
    method: 'GET',
  });
}

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/accounts', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const superAdminSession = {
  user: {
    id: 'superadmin-1',
    email: 'superadmin@test.com',
    role: 'SUPERADMIN',
  },
};

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
};

// =========================================================================
// GET /api/admin/accounts
// =========================================================================
describe('GET /api/admin/accounts', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(superAdminSession);
  });

  it('returns 403 when not superadmin', async () => {
    mockAdminAuth.mockResolvedValue(adminSession);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('lists admin accounts for superadmin', async () => {
    const mockAdmins = [
      {
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'ADMIN',
        department: null,
        phone: null,
        emailVerified: new Date(),
        isTwoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (db.adminAccount.findMany as jest.Mock).mockResolvedValue(mockAdmins);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.admins).toHaveLength(1);
    expect(body.data.total).toBe(1);
  });

  it('returns 500 on database error', async () => {
    (db.adminAccount.findMany as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// =========================================================================
// POST /api/admin/accounts
// =========================================================================
describe('POST /api/admin/accounts', () => {
  const validAdminData = {
    email: 'newadmin@test.com',
    name: 'New Admin',
    password: 'SecurePass1!',
    role: 'ADMIN',
  };

  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(superAdminSession);
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue(null);
    (db.adminAccount.create as jest.Mock).mockResolvedValue({
      id: 'new-admin-id',
      email: 'newadmin@test.com',
      name: 'New Admin',
      role: 'ADMIN',
      department: null,
      createdAt: new Date(),
    });
    (db.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });
  });

  it('returns 403 when not superadmin', async () => {
    mockAdminAuth.mockResolvedValue(adminSession);

    const res = await POST(createPostRequest(validAdminData));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('creates admin account successfully', async () => {
    const res = await POST(createPostRequest(validAdminData));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.admin.email).toBe('newadmin@test.com');
  });

  it('returns 409 when admin email already exists', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-admin',
      email: 'newadmin@test.com',
    });

    const res = await POST(createPostRequest(validAdminData));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe('ADMIN_EXISTS');
  });

  it('returns 400 for invalid email', async () => {
    const res = await POST(
      createPostRequest({ ...validAdminData, email: 'invalid' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for short name', async () => {
    const res = await POST(
      createPostRequest({ ...validAdminData, name: 'X' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for short password', async () => {
    const res = await POST(
      createPostRequest({ ...validAdminData, password: 'short' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates audit log entry', async () => {
    await POST(createPostRequest(validAdminData));

    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'CREATE',
          entityType: 'ADMIN_ACCOUNT',
          userId: 'superadmin-1',
        }),
      })
    );
  });

  it('returns 500 on database error', async () => {
    (db.adminAccount.create as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const res = await POST(createPostRequest(validAdminData));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
