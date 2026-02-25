/**
 * Tests for Admin Users AI Access Route - app/api/admin/users/[userId]/ai-access/route.ts
 *
 * Covers: GET (fetch AI access status), PUT (toggle AI access)
 * Auth: Uses adminAuth() from @/auth.admin directly
 */

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

// @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import { GET, PUT } from '@/app/api/admin/users/[userId]/ai-access/route';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

function createGetRequest() {
  return new NextRequest(
    'http://localhost:3000/api/admin/users/test-user-id/ai-access',
    { method: 'GET' }
  );
}

function createPutRequest(body: Record<string, unknown>) {
  return new NextRequest(
    'http://localhost:3000/api/admin/users/test-user-id/ai-access',
    {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

const mockParams = Promise.resolve({ userId: 'test-user-id' });

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
};

// =========================================================================
// GET /api/admin/users/[userId]/ai-access
// =========================================================================
describe('GET /api/admin/users/[userId]/ai-access', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(adminSession);
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await GET(createGetRequest(), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for non-admin user', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', role: 'USER' },
    });

    const res = await GET(createGetRequest(), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 404 when user not found', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(createGetRequest(), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('USER_NOT_FOUND');
  });

  it('returns AI access status for existing user', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
      name: 'Test User',
      email: 'user@test.com',
      hasAIAccess: true,
      isPremium: false,
      premiumPlan: null,
      premiumExpiresAt: null,
    });

    const res = await GET(createGetRequest(), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('test-user-id');
    expect(body.data.hasAIAccess).toBe(true);
  });

  it('returns 500 on database error', async () => {
    (db.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await GET(createGetRequest(), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// =========================================================================
// PUT /api/admin/users/[userId]/ai-access
// =========================================================================
describe('PUT /api/admin/users/[userId]/ai-access', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(adminSession);
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await PUT(createPutRequest({ hasAIAccess: true }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 for invalid body (missing hasAIAccess)', async () => {
    const res = await PUT(createPutRequest({ invalidField: true }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when user not found', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await PUT(createPutRequest({ hasAIAccess: true }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('USER_NOT_FOUND');
  });

  it('grants AI access successfully', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
      email: 'user@test.com',
      hasAIAccess: false,
    });
    (db.user.update as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
      hasAIAccess: true,
      isPremium: false,
      premiumPlan: null,
      premiumExpiresAt: null,
    });

    const res = await PUT(createPutRequest({ hasAIAccess: true }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.hasAIAccess).toBe(true);
    expect(body.message).toContain('granted');
  });

  it('revokes AI access successfully', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
      email: 'user@test.com',
      hasAIAccess: true,
    });
    (db.user.update as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
      hasAIAccess: false,
      isPremium: false,
      premiumPlan: null,
      premiumExpiresAt: null,
    });

    const res = await PUT(createPutRequest({ hasAIAccess: false }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.hasAIAccess).toBe(false);
    expect(body.message).toContain('revoked');
  });

  it('returns 500 on database error', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
      email: 'user@test.com',
      hasAIAccess: false,
    });
    (db.user.update as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await PUT(createPutRequest({ hasAIAccess: true }), {
      params: mockParams,
    });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
