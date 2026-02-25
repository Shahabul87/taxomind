/**
 * Tests for Admin Users Detail Route - app/api/admin/users/[userId]/route.ts
 *
 * Covers: GET (fetch single user), PATCH (update teacher status), DELETE (delete user)
 * Auth: Uses withRole(AdminRole.ADMIN) wrapper from api-protection
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

// Polyfill Response.json() static method (Web API used by this route)
if (typeof Response !== 'undefined' && !Response.json) {
  (Response as unknown as Record<string, unknown>).json = function (
    data: unknown,
    init?: ResponseInit
  ) {
    const body = JSON.stringify(data);
    const response = new Response(body, {
      ...init,
      headers: {
        ...((init as Record<string, unknown>)?.headers as Record<string, string>),
        'content-type': 'application/json',
      },
    });
    return response;
  };
}

// Mock api-protection to pass through the handler (auth tested via withRole mock)
jest.mock('@/lib/api-protection', () => {
  const mockRequireRole = jest.fn();
  return {
    withRole: jest.fn(
      (_roles: unknown, handler: (...args: unknown[]) => Promise<Response>) => {
        return async (...args: unknown[]): Promise<Response> => {
          const err = mockRequireRole();
          if (err) return err;
          return handler(...args);
        };
      }
    ),
    requireRole: mockRequireRole,
    requireAuth: jest.fn(),
    UnauthorizedError: class extends Error {
      constructor(m = 'Unauthorized') {
        super(m);
      }
    },
    ForbiddenError: class extends Error {
      constructor(m = 'Forbidden') {
        super(m);
      }
    },
  };
});

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/lib/db-migration', () => {
  const { db } = jest.requireMock('@/lib/db');
  return {
    db,
    getEnterpriseDB: jest.fn(() => db),
  };
});

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { GET, PATCH, DELETE } from '@/app/api/admin/users/[userId]/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-protection';
import { getEnterpriseDB } from '@/lib/db-migration';

const mockCurrentUser = currentUser as jest.Mock;
const mockRequireRole = requireRole as jest.Mock;
const mockGetEnterpriseDB = getEnterpriseDB as jest.Mock;

function createRequest(method: string, body?: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/users/test-user-id', {
    method,
    ...(body && {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  });
}

const mockParams = Promise.resolve({ userId: 'test-user-id' });

// =========================================================================
// GET /api/admin/users/[userId]
// =========================================================================
describe('GET /api/admin/users/[userId]', () => {
  beforeEach(() => {
    mockRequireRole.mockReturnValue(null);
    mockCurrentUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
    });
  });

  it('returns user details when user exists', async () => {
    const mockUser = {
      id: 'test-user-id',
      name: 'Test User',
      email: 'user@test.com',
      isTeacher: false,
      createdAt: new Date('2025-06-01'),
      emailVerified: new Date('2025-06-01'),
      isTwoFactorEnabled: false,
    };
    (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const res = await GET(createRequest('GET'), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user.id).toBe('test-user-id');
    expect(body.user.email).toBe('user@test.com');
  });

  it('returns 404 when user not found', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(createRequest('GET'), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('User not found');
  });

  it('returns 401 when withRole rejects (not authenticated)', async () => {
    mockRequireRole.mockReturnValue(
      new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
      })
    );

    const res = await GET(createRequest('GET'), { params: mockParams });
    expect(res.status).toBe(401);
  });

  it('returns 500 on database error', async () => {
    (db.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await GET(createRequest('GET'), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch user');
  });
});

// =========================================================================
// PATCH /api/admin/users/[userId]
// =========================================================================
describe('PATCH /api/admin/users/[userId]', () => {
  beforeEach(() => {
    mockRequireRole.mockReturnValue(null);
    mockCurrentUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
    });
    mockGetEnterpriseDB.mockReturnValue(db);

    (db.user.update as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
      name: 'Test User',
      email: 'user@test.com',
      isTeacher: true,
      createdAt: new Date('2025-06-01'),
      emailVerified: new Date('2025-06-01'),
    });
  });

  it('updates teacher status successfully', async () => {
    const res = await PATCH(createRequest('PATCH', { isTeacher: true }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('User type updated successfully');
    expect(body.user).toBeDefined();
  });

  it('returns 400 when isTeacher field is missing', async () => {
    const res = await PATCH(createRequest('PATCH', {}), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('isTeacher field is required');
  });

  it('returns 500 on database error', async () => {
    (db.user.update as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await PATCH(createRequest('PATCH', { isTeacher: false }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to update user type');
  });
});

// =========================================================================
// DELETE /api/admin/users/[userId]
// =========================================================================
describe('DELETE /api/admin/users/[userId]', () => {
  beforeEach(() => {
    mockRequireRole.mockReturnValue(null);
    mockCurrentUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
    });
    mockGetEnterpriseDB.mockReturnValue(db);
  });

  it('deletes user successfully', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
      email: 'user@test.com',
    });
    (db.user.delete as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
    });

    const res = await DELETE(createRequest('DELETE'), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('User deleted successfully');
    expect(body.deletedUserId).toBe('test-user-id');
  });

  it('returns 404 when user not found', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await DELETE(createRequest('DELETE'), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('User not found');
  });

  it('prevents self-deletion', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'test-user-id',
      email: 'admin@test.com',
    });
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
      email: 'admin@test.com',
    });

    const res = await DELETE(createRequest('DELETE'), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Cannot delete your own account');
  });

  it('returns 500 on database error', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
    });
    (db.user.delete as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await DELETE(createRequest('DELETE'), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to delete user');
  });
});
