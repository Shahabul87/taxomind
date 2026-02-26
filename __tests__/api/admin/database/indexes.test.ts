jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@prisma/client', () => ({
  Prisma: {
    raw: jest.fn((value: string) => value),
  },
}));

import { GET, POST } from '@/app/api/admin/database/indexes/route';
import { adminAuth } from '@/auth.admin';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

describe('api/admin/database/indexes route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
  });

  it('GET returns 401 when user is not admin', async () => {
    mockAdminAuth.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/admin/database/indexes'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('GET returns index list', async () => {
    (db.$queryRaw as jest.Mock).mockResolvedValue([
      { schemaname: 'public', tablename: 'Course', indexname: 'idx_course_published', indexdef: '...' },
    ]);

    const res = await GET(new NextRequest('http://localhost:3000/api/admin/database/indexes'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.indexes).toHaveLength(1);
  });

  it('POST returns 400 for invalid action', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/database/indexes', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid-action' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid action');
  });
});
