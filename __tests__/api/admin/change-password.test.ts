/**
 * Tests for Admin Change Password Route - app/api/admin/change-password/route.ts
 *
 * Covers: POST (change password with current password verification)
 * Auth: Uses currentUser() from @/lib/auth
 */

jest.mock('@/lib/passwordUtils', () => ({
  verifyPassword: jest.fn(),
}));

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { POST } from '@/app/api/admin/change-password/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

// Dynamic import mock - must access via require after test runs
let mockVerifyPassword: jest.Mock;

beforeEach(async () => {
  const passwordUtils = await import('@/lib/passwordUtils');
  mockVerifyPassword = passwordUtils.verifyPassword as jest.Mock;
});

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/change-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Request;
}

const validPasswordData = {
  currentPassword: 'OldPass1!',
  newPassword: 'NewPass1!',
  confirmPassword: 'NewPass1!',
};

// =========================================================================
// POST /api/admin/change-password
// =========================================================================
describe('POST /api/admin/change-password', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
    });

    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      password: 'hashed_OldPass1!',
    });

    (db.user.update as jest.Mock).mockResolvedValue({ id: 'admin-1' });
    (db.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });

    // Current password matches, new password does not match current
    mockVerifyPassword
      .mockResolvedValueOnce(true) // current password valid
      .mockResolvedValueOnce(false); // new password is different
  });

  it('returns 401 when not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createPostRequest(validPasswordData));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when user has no email', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'admin-1' });

    const res = await POST(createPostRequest(validPasswordData));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('changes password successfully', async () => {
    const res = await POST(createPostRequest(validPasswordData));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Password changed successfully');
  });

  it('creates audit log on password change', async () => {
    await POST(createPostRequest(validPasswordData));

    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'UPDATE',
          entityType: 'USER',
          userId: 'admin-1',
        }),
      })
    );
  });

  it('returns 404 when user not found in database', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createPostRequest(validPasswordData));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('User not found');
  });

  it('returns 401 when current password is incorrect', async () => {
    mockVerifyPassword.mockReset();
    mockVerifyPassword.mockResolvedValueOnce(false); // current password invalid

    const res = await POST(createPostRequest(validPasswordData));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Current password is incorrect');
  });

  it('returns 400 when new password same as current', async () => {
    mockVerifyPassword.mockReset();
    mockVerifyPassword
      .mockResolvedValueOnce(true) // current password valid
      .mockResolvedValueOnce(true); // new password is same as old

    const res = await POST(createPostRequest(validPasswordData));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('must be different');
  });

  it('returns 400 when passwords do not match', async () => {
    const res = await POST(
      createPostRequest({
        ...validPasswordData,
        confirmPassword: 'DifferentPass1!',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for weak password (no special char)', async () => {
    const res = await POST(
      createPostRequest({
        currentPassword: 'OldPass1!',
        newPassword: 'NewPassword1',
        confirmPassword: 'NewPassword1',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 500 on database error', async () => {
    (db.user.update as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await POST(createPostRequest(validPasswordData));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to change password');
  });
});
