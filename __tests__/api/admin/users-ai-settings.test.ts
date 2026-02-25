/**
 * Tests for Admin Users AI Settings Route - app/api/admin/users/[userId]/ai-settings/route.ts
 *
 * Covers: GET (fetch AI settings/usage), PUT (update settings, reset usage, custom limits)
 * Auth: Uses adminAuth() from @/auth.admin directly
 */

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

// @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import { GET, PUT } from '@/app/api/admin/users/[userId]/ai-settings/route';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

function createGetRequest() {
  return new NextRequest(
    'http://localhost:3000/api/admin/users/test-user-id/ai-settings',
    { method: 'GET' }
  );
}

function createPutRequest(body: Record<string, unknown>) {
  return new NextRequest(
    'http://localhost:3000/api/admin/users/test-user-id/ai-settings',
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

const mockUser = {
  id: 'test-user-id',
  email: 'user@test.com',
  subscriptionTier: 'FREE',
  dailyAiUsageCount: 5,
  monthlyAiUsageCount: 20,
  UserAIPreferences: {
    id: 'prefs-1',
    dailyLimit: null,
    monthlyLimit: null,
    preferredChatProvider: null,
    updatedAt: new Date('2025-06-01'),
  },
};

// =========================================================================
// GET /api/admin/users/[userId]/ai-settings
// =========================================================================
describe('GET /api/admin/users/[userId]/ai-settings', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(adminSession);
    (db.platformAISettings.findFirst as jest.Mock).mockResolvedValue(null);
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await GET(createGetRequest(), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for non-admin user', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
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

  it('returns AI settings with default tier limits', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const res = await GET(createGetRequest(), { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('test-user-id');
    expect(body.data.dailyAiUsageCount).toBe(5);
    expect(body.data.monthlyAiUsageCount).toBe(20);
    expect(body.data.subscriptionTier).toBe('FREE');
    // Default FREE tier limits
    expect(body.data.tierDailyLimit).toBe(10);
    expect(body.data.tierMonthlyLimit).toBe(50);
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
// PUT /api/admin/users/[userId]/ai-settings
// =========================================================================
describe('PUT /api/admin/users/[userId]/ai-settings', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(adminSession);
    (db.platformAISettings.findFirst as jest.Mock).mockResolvedValue(null);

    // For the update flow: first findUnique returns original user, second returns updated
    (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (db.user.update as jest.Mock).mockResolvedValue({ id: 'test-user-id' });
    (db.userAIPreferences.upsert as jest.Mock).mockResolvedValue({
      id: 'prefs-1',
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await PUT(
      createPutRequest({ customDailyLimit: 100 }),
      { params: mockParams }
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/admin/users/test-user-id/ai-settings',
      {
        method: 'PUT',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const res = await PUT(req, { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('INVALID_JSON');
  });

  it('returns 400 for invalid data (negative daily limit)', async () => {
    const res = await PUT(
      createPutRequest({ customDailyLimit: -5 }),
      { params: mockParams }
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when user not found', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await PUT(
      createPutRequest({ customDailyLimit: 100 }),
      { params: mockParams }
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('USER_NOT_FOUND');
  });

  it('resets daily usage successfully', async () => {
    // Second findUnique for updated user fetch
    (db.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce({
        ...mockUser,
        dailyAiUsageCount: 0,
      });

    const res = await PUT(
      createPutRequest({ resetDailyUsage: true }),
      { params: mockParams }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dailyAiUsageCount: 0 }),
      })
    );
  });

  it('sets custom limits successfully', async () => {
    (db.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce({
        ...mockUser,
        UserAIPreferences: {
          ...mockUser.UserAIPreferences,
          dailyLimit: 200,
          monthlyLimit: 1000,
        },
      });

    const res = await PUT(
      createPutRequest({ customDailyLimit: 200, customMonthlyLimit: 1000 }),
      { params: mockParams }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Settings updated');
  });

  it('returns 500 on database error', async () => {
    (db.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await PUT(
      createPutRequest({ customDailyLimit: 100 }),
      { params: mockParams }
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
