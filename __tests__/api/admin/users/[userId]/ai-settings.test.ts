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

import { GET, PUT } from '@/app/api/admin/users/[userId]/ai-settings/route';
import { adminAuth } from '@/auth.admin';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

describe('api/admin/users/[userId]/ai-settings route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (db.platformAISettings.findFirst as jest.Mock).mockResolvedValue(null);
  });

  it('GET returns 401 when admin auth fails', async () => {
    mockAdminAuth.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/admin/users/user-1/ai-settings'),
      { params: Promise.resolve({ userId: 'user-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET returns AI settings payload for user', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      subscriptionTier: 'FREE',
      dailyAiUsageCount: 3,
      monthlyAiUsageCount: 12,
      UserAIPreferences: {
        dailyLimit: null,
        monthlyLimit: null,
        preferredChatProvider: null,
        updatedAt: new Date('2025-01-01'),
      },
    });

    const res = await GET(
      new NextRequest('http://localhost:3000/api/admin/users/user-1/ai-settings'),
      { params: Promise.resolve({ userId: 'user-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('user-1');
    expect(body.data.tierDailyLimit).toBe(10);
  });

  it('PUT returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/users/user-1/ai-settings', {
      method: 'PUT',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PUT(req, { params: Promise.resolve({ userId: 'user-1' }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('INVALID_JSON');
  });
});
