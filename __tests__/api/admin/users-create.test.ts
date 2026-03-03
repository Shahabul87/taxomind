/**
 * Tests for Admin Users Create Route - app/api/admin/users/create/route.ts
 *
 * Covers: POST (create user with validation, duplicate check, audit log)
 * Auth: Uses currentUser() from @/lib/auth + role check
 */

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { POST } from '@/app/api/admin/users/create/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/users/create', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Request;
}

const validUserData = {
  email: 'newuser@test.com',
  name: 'New User',
  password: 'StrongPass1!',
  isTeacher: false,
};

// =========================================================================
// POST /api/admin/users/create
// =========================================================================
describe('POST /api/admin/users/create', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'ADMIN',
    });

    (db.user.findUnique as jest.Mock).mockResolvedValue(null);
    (db.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      email: 'newuser@test.com',
      name: 'New User',
      isTeacher: false,
      createdAt: new Date('2025-06-01'),
    });
    (db.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });
  });

  it('returns 401 when not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createPostRequest(validUserData));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 for non-admin user', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: 'USER',
    });

    const res = await POST(createPostRequest(validUserData));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('Forbidden');
  });

  it('creates user successfully', async () => {
    const res = await POST(createPostRequest(validUserData));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('newuser@test.com');
    expect(body.message).toContain('created successfully');
  });

  it('creates teacher successfully', async () => {
    (db.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      email: 'teacher@test.com',
      name: 'New Teacher',
      isTeacher: true,
      createdAt: new Date('2025-06-01'),
    });

    const res = await POST(
      createPostRequest({ ...validUserData, email: 'teacher@test.com', isTeacher: true })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain('Teacher');
  });

  it('returns 409 when email already exists', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-user',
      email: 'newuser@test.com',
    });

    const res = await POST(createPostRequest(validUserData));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toContain('already exists');
  });

  it('returns 400 for invalid email', async () => {
    const res = await POST(
      createPostRequest({ ...validUserData, email: 'not-an-email' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for weak password (no uppercase)', async () => {
    const res = await POST(
      createPostRequest({ ...validUserData, password: 'weakpass1!' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for short password', async () => {
    const res = await POST(
      createPostRequest({ ...validUserData, password: 'Sh1!' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('creates audit log entry after user creation', async () => {
    await POST(createPostRequest(validUserData));

    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'CREATE',
          entityType: 'USER',
          userId: 'admin-1',
        }),
      })
    );
  });

  it('returns 500 on database error', async () => {
    (db.user.create as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await POST(createPostRequest(validUserData));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
  });
});
