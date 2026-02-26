jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

import { GET, PUT } from '@/app/api/admin/users/[userId]/ai-access/route';
import { adminAuth } from '@/auth.admin';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

describe('api/admin/users/[userId]/ai-access route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
  });

  it('GET returns 401 when admin auth fails', async () => {
    mockAdminAuth.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/admin/users/user-1/ai-access'),
      { params: Promise.resolve({ userId: 'user-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET returns user AI access details', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'user@test.com',
      hasAIAccess: true,
      isPremium: false,
      premiumPlan: null,
      premiumExpiresAt: null,
    });

    const res = await GET(
      new NextRequest('http://localhost:3000/api/admin/users/user-1/ai-access'),
      { params: Promise.resolve({ userId: 'user-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('user-1');
    expect(body.data.hasAIAccess).toBe(true);
  });

  it('PUT toggles AI access', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      hasAIAccess: false,
    });
    (db.user.update as jest.Mock).mockResolvedValue({
      id: 'user-1',
      hasAIAccess: true,
      isPremium: false,
      premiumPlan: null,
      premiumExpiresAt: null,
    });

    const req = new NextRequest('http://localhost:3000/api/admin/users/user-1/ai-access', {
      method: 'PUT',
      body: JSON.stringify({ hasAIAccess: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req, { params: Promise.resolve({ userId: 'user-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.hasAIAccess).toBe(true);
  });
});
