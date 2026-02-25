/**
 * Tests for Admin Database Indexes Route - app/api/admin/database/indexes/route.ts
 *
 * Covers: GET (list current indexes), POST (create indexes, analyze missing)
 * Auth: Uses adminAuth() from @/auth.admin
 */

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

// @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import { GET, POST } from '@/app/api/admin/database/indexes/route';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

function createGetRequest() {
  return new NextRequest(
    'http://localhost:3000/api/admin/database/indexes',
    { method: 'GET' }
  );
}

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest(
    'http://localhost:3000/api/admin/database/indexes',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
};

// Add $executeRawUnsafe mock since it is not in the global mock setup
if (!(db as Record<string, unknown>).$executeRawUnsafe) {
  (db as Record<string, unknown>).$executeRawUnsafe = jest.fn(() => Promise.resolve(0));
}

// =========================================================================
// GET /api/admin/database/indexes
// =========================================================================
describe('GET /api/admin/database/indexes', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(adminSession);
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 for non-admin user', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
  });

  it('returns current indexes', async () => {
    (db.$queryRaw as jest.Mock).mockResolvedValue([
      {
        schemaname: 'public',
        tablename: 'User',
        indexname: 'User_pkey',
        indexdef: 'CREATE UNIQUE INDEX "User_pkey" ON public."User" USING btree (id)',
      },
      {
        schemaname: 'public',
        tablename: 'User',
        indexname: 'User_email_key',
        indexdef: 'CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email)',
      },
    ]);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.indexes).toHaveLength(2);
  });

  it('returns 500 on database error', async () => {
    mockAdminAuth.mockRejectedValue(new Error('DB error'));

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});

// =========================================================================
// POST /api/admin/database/indexes
// =========================================================================
describe('POST /api/admin/database/indexes', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue(adminSession);
    (db.$executeRawUnsafe as jest.Mock).mockResolvedValue(0);
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await POST(
      createPostRequest({ action: 'create-performance-indexes' })
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('creates performance indexes successfully', async () => {
    const res = await POST(
      createPostRequest({ action: 'create-performance-indexes' })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Performance indexes created');
  });

  it('analyzes missing indexes successfully', async () => {
    // analyzeMissingIndexes() uses $queryRaw as tagged template and catches its own errors
    // The mock returns [] by default which is acceptable
    const res = await POST(
      createPostRequest({ action: 'analyze-missing-indexes' })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.analysis).toBeDefined();
  });

  it('returns 400 for invalid action', async () => {
    const res = await POST(
      createPostRequest({ action: 'invalid-action' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid action');
  });

  it('returns 500 on unexpected error', async () => {
    mockAdminAuth.mockRejectedValue(new Error('Service error'));

    const res = await POST(
      createPostRequest({ action: 'create-performance-indexes' })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
