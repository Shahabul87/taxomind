/**
 * Tests for Admin Users Route - app/api/admin/users/route.ts
 *
 * Covers: GET (list/search/filter/paginate), PATCH (update/suspend/activate/2fa/etc),
 * DELETE (with self-deletion prevention)
 */

// Polyfill crypto.randomUUID for jsdom environment
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2, 11),
    },
    writable: true,
  });
}

// Mock api-protection to pass through the handler (auth tested via withRole mock)
jest.mock('@/lib/api-protection', () => {
  const mockRequireRole = jest.fn();
  return {
    withRole: jest.fn((_roles: unknown, handler: (...args: unknown[]) => Promise<Response>) => {
      // Return a wrapper that calls requireRole then the handler
      return async (...args: unknown[]): Promise<Response> => {
        const err = mockRequireRole();
        if (err) return err;
        return handler(...args);
      };
    }),
    requireRole: mockRequireRole,
    requireAuth: jest.fn(),
    UnauthorizedError: class extends Error { constructor(m = 'Unauthorized') { super(m); } },
    ForbiddenError: class extends Error { constructor(m = 'Forbidden') { super(m); } },
  };
});

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/lib/role-management', () => ({
  hasPermission: jest.fn().mockResolvedValue(true),
}));

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { GET, PATCH, DELETE } from '@/app/api/admin/users/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-protection';

const mockCurrentUser = currentUser as jest.Mock;
const mockAdminAuth = adminAuth as jest.Mock;
const mockRequireRole = requireRole as jest.Mock;

function createGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/admin/users');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

function createPatchRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/users', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createDeleteRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/users', {
    method: 'DELETE',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// =========================================================================
// GET /api/admin/users
// =========================================================================
describe('GET /api/admin/users', () => {
  beforeEach(() => {
    // withRole pass-through (no auth error)
    mockRequireRole.mockReturnValue(null);

    // Mock admin auth for DELETE handler's dynamic import
    mockCurrentUser.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com' });
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
    });

    (db.user.count as jest.Mock).mockResolvedValue(2);
    (db.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        isTeacher: false,
        image: null,
        createdAt: new Date('2025-01-15'),
        lastLoginAt: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
        isAccountLocked: false,
        isTwoFactorEnabled: false,
        _count: { courses: 0, Enrollment: 2 },
      },
      {
        id: 'u2',
        name: 'Bob',
        email: 'bob@example.com',
        isTeacher: true,
        image: null,
        createdAt: new Date('2025-03-01'),
        lastLoginAt: null,
        isAccountLocked: true,
        isTwoFactorEnabled: true,
        _count: { courses: 3, Enrollment: 0 },
      },
    ]);
  });

  it('returns 401 when withRole rejects (not authenticated)', async () => {
    mockRequireRole.mockReturnValue(
      new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 })
    );

    const res = await GET(createGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns paginated user list for admin', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.metadata.pagination.total).toBe(2);
    expect(body.metadata.pagination.page).toBe(1);
    expect(body.metadata.pagination.limit).toBe(10);
  });

  it('applies search filter', async () => {
    await GET(createGetRequest({ search: 'alice' }));

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.objectContaining({ contains: 'alice' }) }),
          ]),
        }),
      })
    );
  });

  it('applies userType filter for teachers', async () => {
    await GET(createGetRequest({ userType: 'teacher' }));

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isTeacher: true }),
      })
    );
  });

  it('applies status filter for Suspended', async () => {
    await GET(createGetRequest({ status: 'Suspended' }));

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isAccountLocked: true }),
      })
    );
  });

  it('transforms status correctly (Active, Inactive, Suspended)', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    // Alice: lastLoginAt 5 min ago, not locked → Active
    expect(body.data[0].status).toBe('Active');
    // Bob: isAccountLocked true → Suspended
    expect(body.data[1].status).toBe('Suspended');
  });

  it('applies pagination parameters', async () => {
    await GET(createGetRequest({ page: '2', limit: '5' }));

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 })
    );
  });

  it('applies sort parameters', async () => {
    await GET(createGetRequest({ sortBy: 'name', sortOrder: 'asc' }));

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: 'asc' } })
    );
  });

  it('returns 500 on database error', async () => {
    (db.user.count as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// =========================================================================
// PATCH /api/admin/users
// =========================================================================
describe('PATCH /api/admin/users', () => {
  beforeEach(() => {
    mockRequireRole.mockReturnValue(null);

    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'Target User',
      email: 'target@example.com',
    });
    (db.user.update as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'Target User',
      email: 'target@example.com',
      isTeacher: false,
      isAccountLocked: false,
      isTwoFactorEnabled: false,
    });
  });

  it('returns 400 for missing userId', async () => {
    const res = await PATCH(createPatchRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when user not found', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(createPatchRequest({ userId: 'nonexistent' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('updates teacher status', async () => {
    const res = await PATCH(createPatchRequest({ userId: 'user-1', isTeacher: true }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isTeacher: true }),
      })
    );
  });

  it('suspends user', async () => {
    const res = await PATCH(
      createPatchRequest({ userId: 'user-1', action: 'suspend' })
    );

    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isAccountLocked: true,
          lockReason: 'Suspended by admin',
        }),
      })
    );
  });

  it('activates user', async () => {
    const res = await PATCH(
      createPatchRequest({ userId: 'user-1', action: 'activate' })
    );

    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isAccountLocked: false,
          failedLoginAttempts: 0,
        }),
      })
    );
  });

  it('disables 2FA', async () => {
    const res = await PATCH(
      createPatchRequest({ userId: 'user-1', action: 'disable-2fa' })
    );

    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isTwoFactorEnabled: false,
          totpEnabled: false,
        }),
      })
    );
  });

  it('verifies email', async () => {
    const res = await PATCH(
      createPatchRequest({ userId: 'user-1', action: 'verify-email' })
    );

    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ emailVerified: expect.any(Date) }),
      })
    );
  });

  it('rejects duplicate email on update action', async () => {
    (db.user.findUnique as jest.Mock).mockImplementation(({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id === 'user-1') return Promise.resolve({ id: 'user-1' });
      if (where.email === 'taken@example.com')
        return Promise.resolve({ id: 'other-user' });
      return Promise.resolve(null);
    });

    const res = await PATCH(
      createPatchRequest({
        userId: 'user-1',
        action: 'update',
        data: { email: 'taken@example.com' },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.message).toContain('Email already in use');
  });

  it('returns 500 on database error', async () => {
    (db.user.update as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await PATCH(createPatchRequest({ userId: 'user-1', action: 'suspend' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// =========================================================================
// DELETE /api/admin/users
// =========================================================================
describe('DELETE /api/admin/users', () => {
  beforeEach(() => {
    mockRequireRole.mockReturnValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com' });
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
    });

    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'target-user',
      email: 'target@example.com',
      name: 'Target User',
      isTeacher: false,
    });
    (db.user.delete as jest.Mock).mockResolvedValue({ id: 'target-user' });
  });

  it('returns 400 for missing userId', async () => {
    const res = await DELETE(createDeleteRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when user not found', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await DELETE(createDeleteRequest({ userId: 'nonexistent' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('prevents admin from deleting themselves', async () => {
    const res = await DELETE(createDeleteRequest({ userId: 'admin-1' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toContain('cannot delete your own account');
  });

  it('deletes user successfully', async () => {
    const res = await DELETE(createDeleteRequest({ userId: 'target-user' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deletedUserId).toBe('target-user');
    expect(db.user.delete).toHaveBeenCalledWith({ where: { id: 'target-user' } });
  });

  it('returns constraint error for foreign key violations', async () => {
    (db.user.delete as jest.Mock).mockRejectedValue(
      new Error('Foreign key constraint failed')
    );

    const res = await DELETE(createDeleteRequest({ userId: 'target-user' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('CONSTRAINT_ERROR');
  });

  it('returns 500 on generic database error', async () => {
    (db.user.delete as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

    const res = await DELETE(createDeleteRequest({ userId: 'target-user' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
  });
});
