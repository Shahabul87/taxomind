/**
 * Tests for Admin Email Queue Route - app/api/admin/email-queue/route.ts
 *
 * Covers: POST (email queue operations), GET (queue status)
 * Auth: Uses adminAuth() from @/auth.admin
 */

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

import { POST, GET } from '@/app/api/admin/email-queue/route';
import { adminAuth } from '@/auth.admin';
import { NextRequest } from 'next/server';

const mockAdminAuth = adminAuth as jest.Mock;

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
};

describe('GET /api/admin/email-queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/admin/email-queue');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns queue status for admin', async () => {
    mockAdminAuth.mockResolvedValue(adminSession);
    const req = new NextRequest('http://localhost:3000/api/admin/email-queue');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns data array', async () => {
    mockAdminAuth.mockResolvedValue(adminSession);
    const req = new NextRequest('http://localhost:3000/api/admin/email-queue');
    const res = await GET(req);
    const data = await res.json();

    expect(data.data).toBeDefined();
  });

  it('returns 500 on server error', async () => {
    mockAdminAuth.mockRejectedValue(new Error('Auth failed'));
    const req = new NextRequest('http://localhost:3000/api/admin/email-queue');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/admin/email-queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/admin/email-queue', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns success for admin POST', async () => {
    mockAdminAuth.mockResolvedValue(adminSession);
    const req = new NextRequest('http://localhost:3000/api/admin/email-queue', {
      method: 'POST',
      body: JSON.stringify({ action: 'retry' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns message indicating stub implementation', async () => {
    mockAdminAuth.mockResolvedValue(adminSession);
    const req = new NextRequest('http://localhost:3000/api/admin/email-queue', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.message).toBeDefined();
  });

  it('returns 500 on server error', async () => {
    mockAdminAuth.mockRejectedValue(new Error('Auth system down'));
    const req = new NextRequest('http://localhost:3000/api/admin/email-queue', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
