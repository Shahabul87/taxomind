/**
 * Tests for Admin Account Detail Route - app/api/admin/accounts/[adminId]/route.ts
 *
 * Covers: GET (fetch admin details), PATCH (update admin), DELETE (delete admin)
 * Auth: Uses adminAuth() from @/config/auth/auth.admin - SUPERADMIN for write ops
 */

jest.mock('@/config/auth/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

// @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import {
  GET,
  PATCH,
  DELETE,
} from '@/app/api/admin/accounts/[adminId]/route';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/config/auth/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

function createRequest(
  method: string,
  body?: Record<string, unknown>
) {
  return new NextRequest(
    'http://localhost:3000/api/admin/accounts/target-admin-id',
    {
      method,
      ...(body && {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  );
}

const mockParams = Promise.resolve({ adminId: 'target-admin-id' });

const superAdminSession = {
  user: {
    id: 'superadmin-1',
    email: 'superadmin@test.com',
    role: 'SUPERADMIN',
  },
};

const regularAdminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
};

// =========================================================================
// GET /api/admin/accounts/[adminId]
// =========================================================================
describe('GET /api/admin/accounts/[adminId]', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(superAdminSession);
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await GET(createRequest('GET'), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for non-superadmin accessing other admin', async () => {
    mockAdminAuth.mockResolvedValue(regularAdminSession);

    const res = await GET(createRequest('GET'), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('allows admin to view their own profile', async () => {
    const selfParams = Promise.resolve({ adminId: 'admin-1' });
    mockAdminAuth.mockResolvedValue(regularAdminSession);

    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'ADMIN',
      department: null,
      phone: null,
      bio: null,
      image: null,
      emailVerified: new Date(),
      isTwoFactorEnabled: false,
      totpEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await GET(createRequest('GET'), { params: selfParams });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.admin.id).toBe('admin-1');
  });

  it('returns 404 when admin not found', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(createRequest('GET'), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns admin details for superadmin', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'target-admin-id',
      email: 'target@test.com',
      name: 'Target Admin',
      role: 'ADMIN',
      department: 'Engineering',
      phone: null,
      bio: null,
      image: null,
      emailVerified: new Date(),
      isTwoFactorEnabled: false,
      totpEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await GET(createRequest('GET'), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.admin.email).toBe('target@test.com');
  });

  it('returns 500 on database error', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const res = await GET(createRequest('GET'), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// =========================================================================
// PATCH /api/admin/accounts/[adminId]
// =========================================================================
describe('PATCH /api/admin/accounts/[adminId]', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(superAdminSession);
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'target-admin-id',
      email: 'target@test.com',
      role: 'ADMIN',
    });
    (db.adminAccount.update as jest.Mock).mockResolvedValue({
      id: 'target-admin-id',
      email: 'target@test.com',
      name: 'Updated Name',
      role: 'ADMIN',
      department: null,
      phone: null,
      updatedAt: new Date(),
    });
    (db.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });
  });

  it('returns 403 for non-superadmin', async () => {
    mockAdminAuth.mockResolvedValue(regularAdminSession);

    const res = await PATCH(createRequest('PATCH', { name: 'New Name' }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('updates admin name successfully', async () => {
    const res = await PATCH(createRequest('PATCH', { name: 'Updated Name' }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.admin.name).toBe('Updated Name');
  });

  it('prevents superadmin self-demotion', async () => {
    const selfParams = Promise.resolve({ adminId: 'superadmin-1' });

    const res = await PATCH(createRequest('PATCH', { role: 'ADMIN' }), {
      params: selfParams,
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('SELF_DEMOTION');
  });

  it('returns 404 when target admin not found', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(createRequest('PATCH', { name: 'New Name' }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid data', async () => {
    const res = await PATCH(createRequest('PATCH', { role: 'INVALID_ROLE' }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 on database error', async () => {
    (db.adminAccount.update as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const res = await PATCH(createRequest('PATCH', { name: 'New Name' }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// =========================================================================
// DELETE /api/admin/accounts/[adminId]
// =========================================================================
describe('DELETE /api/admin/accounts/[adminId]', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(superAdminSession);
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'target-admin-id',
      email: 'target@test.com',
      role: 'ADMIN',
    });
    (db.adminAccount.delete as jest.Mock).mockResolvedValue({
      id: 'target-admin-id',
    });
    (db.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });
  });

  it('returns 403 for non-superadmin', async () => {
    mockAdminAuth.mockResolvedValue(regularAdminSession);

    const res = await DELETE(createRequest('DELETE'), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('prevents self-deletion', async () => {
    const selfParams = Promise.resolve({ adminId: 'superadmin-1' });

    const res = await DELETE(createRequest('DELETE'), {
      params: selfParams,
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('SELF_DELETE');
  });

  it('returns 404 when admin not found', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await DELETE(createRequest('DELETE'), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('deletes admin account successfully', async () => {
    const res = await DELETE(createRequest('DELETE'), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('deleted successfully');
  });

  it('creates audit log on deletion', async () => {
    await DELETE(createRequest('DELETE'), { params: mockParams });

    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'DELETE',
          entityType: 'ADMIN_ACCOUNT',
          entityId: 'target-admin-id',
        }),
      })
    );
  });

  it('returns 500 on database error', async () => {
    (db.adminAccount.delete as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const res = await DELETE(createRequest('DELETE'), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
