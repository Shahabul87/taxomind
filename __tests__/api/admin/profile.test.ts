/**
 * Tests for Admin Profile Route - app/api/admin/profile/route.ts
 *
 * Covers: GET (fetch admin profile), PATCH (update admin profile)
 * Auth: Uses adminAuth() from @/auth.admin
 */

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

// @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import { GET, PATCH } from '@/app/api/admin/profile/route';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

// Add adminAuditLog model mock (not in global jest.setup.js)
if (!(db as Record<string, unknown>).adminAuditLog) {
  (db as Record<string, unknown>).adminAuditLog = {
    create: jest.fn(),
    findMany: jest.fn(() => Promise.resolve([])),
    count: jest.fn(() => Promise.resolve(0)),
  };
}

function createPatchRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Request;
}

const adminSession = {
  user: {
    id: 'admin-1',
    email: 'admin@test.com',
    role: 'ADMIN',
  },
};

const mockAdminProfile = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@test.com',
  image: null,
  role: 'ADMIN',
  phone: null,
  department: 'Engineering',
  bio: 'Test bio',
  createdAt: new Date('2025-01-01'),
  emailVerified: new Date('2025-01-01'),
  isTwoFactorEnabled: false,
  _count: { auditLogs: 42 },
};

// =========================================================================
// GET /api/admin/profile
// =========================================================================
describe('GET /api/admin/profile', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(adminSession);
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 401 when session has no user ID', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { email: 'admin@test.com', role: 'ADMIN' },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('No user ID');
  });

  it('returns 403 for non-admin user', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', role: 'USER' },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('Forbidden');
  });

  it('returns admin profile successfully', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue(
      mockAdminProfile
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('admin@test.com');
    expect(body.data.role).toBe('ADMIN');
    expect(body.data.totalActions).toBe(42);
    expect(body.data.joinDate).toBeDefined();
  });

  it('returns 404 when admin profile not found', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });

  it('allows SUPERADMIN access', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'superadmin-1', email: 'sa@test.com', role: 'SUPERADMIN' },
    });
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      ...mockAdminProfile,
      id: 'superadmin-1',
      role: 'SUPERADMIN',
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.role).toBe('SUPERADMIN');
  });

  it('returns 500 on database error', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to fetch');
  });
});

// =========================================================================
// PATCH /api/admin/profile
// =========================================================================
describe('PATCH /api/admin/profile', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(adminSession);
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue(null); // no email conflict
    (db.adminAccount.update as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      name: 'Updated Name',
      email: 'admin@test.com',
      image: null,
      phone: '+1234567890',
      department: 'Engineering',
      bio: 'Updated bio',
    });
    (db.adminAuditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await PATCH(createPatchRequest({ name: 'New Name' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 403 for non-admin user', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', role: 'USER' },
    });

    const res = await PATCH(createPatchRequest({ name: 'New Name' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('Forbidden');
  });

  it('updates profile name successfully', async () => {
    const res = await PATCH(createPatchRequest({ name: 'Updated Name' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Updated Name');
    expect(body.message).toBe('Profile updated successfully');
  });

  it('returns 409 when email already in use', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'other-admin',
      email: 'taken@test.com',
    });

    const res = await PATCH(createPatchRequest({ email: 'taken@test.com' }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toContain('Email already in use');
  });

  it('returns 400 for invalid email format', async () => {
    const res = await PATCH(createPatchRequest({ email: 'not-an-email' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('creates audit log on profile update', async () => {
    await PATCH(createPatchRequest({ name: 'Updated Name' }));

    expect(db.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'PROFILE_UPDATED',
          resource: 'AdminAccount',
        }),
      })
    );
  });

  it('returns 500 on database error', async () => {
    (db.adminAccount.update as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const res = await PATCH(createPatchRequest({ name: 'Updated Name' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to update');
  });
});
