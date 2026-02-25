/**
 * Tests for API Protection Utilities
 * Source: lib/api-protection.ts
 *
 * Covers: requireAuth, requireRole, requirePermission, requireAdminRole,
 *         withAuth, withRole, withPermission, validateResourceOwnership
 * - Authentication check (throws UnauthorizedError)
 * - Role-based authorization (throws ForbiddenError)
 * - Permission-based authorization
 * - Higher-order function wrappers (withAuth, withRole, withPermission)
 * - Resource ownership validation
 * - Admin session fallback
 */

// --- Module-level mocks (before imports) ---

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/lib/role-management', () => ({
  hasPermission: jest.fn(),
}));

// @/lib/auth, @/lib/db are globally mocked

import {
  requireAuth,
  requireRole,
  requirePermission,
  requireAdminRole,
  requireTeacherOrAdmin,
  withAuth,
  withRole,
  withPermission,
  validateResourceOwnership,
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/api-protection';
import { currentUser, currentRole } from '@/lib/auth';
import { adminAuth } from '@/auth.admin';
import { hasPermission } from '@/lib/role-management';

const mockCurrentUser = currentUser as jest.Mock;
const mockCurrentRole = currentRole as jest.Mock;
const mockAdminAuth = adminAuth as jest.Mock;
const mockHasPermission = hasPermission as jest.Mock;

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------

describe('requireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue(null);
  });

  it('returns user when regular session exists', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', email: 'a@b.com' });

    const user = await requireAuth();

    expect(user).toEqual({ id: 'user-1', email: 'a@b.com' });
  });

  it('falls back to admin session when no regular user', async () => {
    mockCurrentUser.mockResolvedValue(null);
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@b.com', role: 'ADMIN' },
    });

    const user = await requireAuth();

    expect(user).toEqual(
      expect.objectContaining({ id: 'admin-1', email: 'admin@b.com' }),
    );
  });

  it('throws UnauthorizedError when no session exists', async () => {
    mockCurrentUser.mockResolvedValue(null);
    mockAdminAuth.mockResolvedValue(null);

    await expect(requireAuth()).rejects.toThrow(UnauthorizedError);
    await expect(requireAuth()).rejects.toThrow('Authentication required');
  });

  it('throws UnauthorizedError when admin session check fails', async () => {
    mockCurrentUser.mockResolvedValue(null);
    mockAdminAuth.mockRejectedValue(new Error('Session expired'));

    await expect(requireAuth()).rejects.toThrow(UnauthorizedError);
  });

  it('handles admin session with no user property', async () => {
    mockCurrentUser.mockResolvedValue(null);
    mockAdminAuth.mockResolvedValue({ user: null });

    await expect(requireAuth()).rejects.toThrow(UnauthorizedError);
  });
});

// ---------------------------------------------------------------------------
// requireRole
// ---------------------------------------------------------------------------

describe('requireRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockCurrentRole.mockResolvedValue(null);
    mockAdminAuth.mockResolvedValue(null);
  });

  it('returns user and role when role matches', async () => {
    mockCurrentRole.mockResolvedValue('ADMIN');

    const result = await requireRole('ADMIN');

    expect(result.user).toEqual({ id: 'user-1' });
    expect(result.role).toBe('ADMIN');
  });

  it('accepts role from admin session when no regular role', async () => {
    mockCurrentRole.mockResolvedValue(null);
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const result = await requireRole('ADMIN');

    expect(result.role).toBe('ADMIN');
  });

  it('accepts any of multiple allowed roles', async () => {
    mockCurrentRole.mockResolvedValue('SUPERADMIN');

    const result = await requireRole(['ADMIN', 'SUPERADMIN']);

    expect(result.role).toBe('SUPERADMIN');
  });

  it('throws ForbiddenError when role does not match', async () => {
    mockCurrentRole.mockResolvedValue('ADMIN');

    await expect(requireRole('SUPERADMIN')).rejects.toThrow(ForbiddenError);
  });

  it('throws UnauthorizedError when no role found at all', async () => {
    mockCurrentRole.mockResolvedValue(null);
    mockAdminAuth.mockResolvedValue(null);

    await expect(requireRole('ADMIN')).rejects.toThrow(UnauthorizedError);
    await expect(requireRole('ADMIN')).rejects.toThrow('Role not found');
  });

  it('throws UnauthorizedError when admin role check fails', async () => {
    mockCurrentRole.mockResolvedValue(null);
    mockAdminAuth.mockRejectedValue(new Error('Timeout'));

    await expect(requireRole('ADMIN')).rejects.toThrow(UnauthorizedError);
  });
});

// ---------------------------------------------------------------------------
// requirePermission
// ---------------------------------------------------------------------------

describe('requirePermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockAdminAuth.mockResolvedValue(null);
  });

  it('returns user when permission is granted', async () => {
    mockHasPermission.mockResolvedValue(true);

    const user = await requirePermission('manage_courses');

    expect(user).toEqual({ id: 'user-1' });
  });

  it('throws ForbiddenError when permission is denied', async () => {
    mockHasPermission.mockResolvedValue(false);

    await expect(requirePermission('manage_users')).rejects.toThrow(ForbiddenError);
    await expect(requirePermission('manage_users')).rejects.toThrow('manage_users');
  });
});

// ---------------------------------------------------------------------------
// requireAdminRole / requireTeacherOrAdmin
// ---------------------------------------------------------------------------

describe('requireAdminRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockAdminAuth.mockResolvedValue(null);
  });

  it('passes when role is ADMIN', async () => {
    mockCurrentRole.mockResolvedValue('ADMIN');

    const result = await requireAdminRole();

    expect(result.role).toBe('ADMIN');
  });

  it('fails when role is not ADMIN', async () => {
    mockCurrentRole.mockResolvedValue('SUPERADMIN');

    await expect(requireAdminRole()).rejects.toThrow(ForbiddenError);
  });
});

describe('requireTeacherOrAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockAdminAuth.mockResolvedValue(null);
  });

  it('delegates to requireRole with ADMIN', async () => {
    mockCurrentRole.mockResolvedValue('ADMIN');

    const result = await requireTeacherOrAdmin();

    expect(result.role).toBe('ADMIN');
  });
});

// ---------------------------------------------------------------------------
// withAuth
// ---------------------------------------------------------------------------

describe('withAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue(null);
  });

  it('executes handler when authenticated', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    const handler = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const wrapped = withAuth(handler);
    const response = await wrapped();

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it('returns 401 when not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const handler = jest.fn();

    const wrapped = withAuth(handler);
    const response = await wrapped();
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(401);
    expect(body.error).toBe('Authentication required');
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected errors', async () => {
    mockCurrentUser.mockRejectedValue(new Error('Unexpected'));
    const handler = jest.fn();

    const wrapped = withAuth(handler);
    const response = await wrapped();

    expect(response.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// withRole
// ---------------------------------------------------------------------------

describe('withRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockAdminAuth.mockResolvedValue(null);
  });

  it('executes handler when role matches', async () => {
    mockCurrentRole.mockResolvedValue('ADMIN');
    const handler = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const wrapped = withRole('ADMIN', handler);
    const response = await wrapped();

    expect(response.status).toBe(200);
  });

  it('returns 403 when role does not match', async () => {
    mockCurrentRole.mockResolvedValue('ADMIN');
    const handler = jest.fn();

    const wrapped = withRole('SUPERADMIN', handler);
    const response = await wrapped();
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(403);
    expect(body.error).toContain('Access denied');
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 401 when not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const handler = jest.fn();

    const wrapped = withRole('ADMIN', handler);
    const response = await wrapped();

    expect(response.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// withPermission
// ---------------------------------------------------------------------------

describe('withPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockAdminAuth.mockResolvedValue(null);
  });

  it('executes handler when permission is granted', async () => {
    mockHasPermission.mockResolvedValue(true);
    const handler = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const wrapped = withPermission('view_analytics', handler);
    const response = await wrapped();

    expect(response.status).toBe(200);
  });

  it('returns 403 when permission is denied', async () => {
    mockHasPermission.mockResolvedValue(false);
    const handler = jest.fn();

    const wrapped = withPermission('manage_users', handler);
    const response = await wrapped();

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// validateResourceOwnership
// ---------------------------------------------------------------------------

describe('validateResourceOwnership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue(null);
  });

  it('allows owner to access their resource', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockCurrentRole.mockResolvedValue(null);

    const result = await validateResourceOwnership('user-1');

    expect(result.isOwner).toBe(true);
    expect(result.isAdmin).toBe(false);
  });

  it('allows admin to access any resource', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'admin-1' });
    mockCurrentRole.mockResolvedValue('ADMIN');

    const result = await validateResourceOwnership('user-1');

    expect(result.isOwner).toBe(false);
    expect(result.isAdmin).toBe(true);
  });

  it('denies non-owner non-admin access', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-2' });
    mockCurrentRole.mockResolvedValue(null);

    await expect(validateResourceOwnership('user-1')).rejects.toThrow(ForbiddenError);
  });

  it('denies admin override when allowAdminOverride is false', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'admin-1' });
    mockCurrentRole.mockResolvedValue('ADMIN');

    await expect(
      validateResourceOwnership('user-1', false),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

describe('Error types', () => {
  it('UnauthorizedError has correct name and default message', () => {
    const error = new UnauthorizedError();

    expect(error.name).toBe('UnauthorizedError');
    expect(error.message).toBe('Unauthorized');
    expect(error).toBeInstanceOf(Error);
  });

  it('ForbiddenError has correct name and default message', () => {
    const error = new ForbiddenError();

    expect(error.name).toBe('ForbiddenError');
    expect(error.message).toBe('Forbidden');
    expect(error).toBeInstanceOf(Error);
  });

  it('UnauthorizedError accepts custom message', () => {
    const error = new UnauthorizedError('Custom msg');

    expect(error.message).toBe('Custom msg');
  });

  it('ForbiddenError accepts custom message', () => {
    const error = new ForbiddenError('No access');

    expect(error.message).toBe('No access');
  });
});
