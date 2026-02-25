/**
 * Tests for Admin Creation Route - app/api/admin/create/route.ts
 *
 * Covers: GET (admin status), POST actions: CREATE_FIRST_ADMIN, PROMOTE_USER,
 * DEMOTE_ADMIN, CREATE_INVITATION, ACCEPT_INVITATION
 */

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/lib/auth/admin-manager', () => ({
  needsInitialAdmin: jest.fn(),
  createFirstAdmin: jest.fn(),
  promoteToAdmin: jest.fn(),
  demoteFromAdmin: jest.fn(),
  createAdminInvitation: jest.fn(),
  acceptAdminInvitation: jest.fn(),
  getAdminStats: jest.fn(),
}));

import { GET, POST } from '@/app/api/admin/create/route';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/auth.admin';
import {
  needsInitialAdmin,
  createFirstAdmin,
  promoteToAdmin,
  demoteFromAdmin,
  createAdminInvitation,
  acceptAdminInvitation,
  getAdminStats,
} from '@/lib/auth/admin-manager';

const mockAdminAuth = adminAuth as jest.Mock;
const mockNeedsInitialAdmin = needsInitialAdmin as jest.Mock;
const mockCreateFirstAdmin = createFirstAdmin as jest.Mock;
const mockPromoteToAdmin = promoteToAdmin as jest.Mock;
const mockDemoteFromAdmin = demoteFromAdmin as jest.Mock;
const mockCreateAdminInvitation = createAdminInvitation as jest.Mock;
const mockAcceptAdminInvitation = acceptAdminInvitation as jest.Mock;
const mockGetAdminStats = getAdminStats as jest.Mock;

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/create', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createGetRequest() {
  return new NextRequest('http://localhost:3000/api/admin/create', {
    method: 'GET',
  });
}

describe('GET /api/admin/create', () => {
  beforeEach(() => {
    mockNeedsInitialAdmin.mockResolvedValue(true);
    mockAdminAuth.mockResolvedValue(null);
  });

  it('returns needsInitialAdmin for unauthenticated users', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.needsInitialAdmin).toBe(true);
    expect(body.data.stats).toBeUndefined();
  });

  it('returns stats for admin users', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    mockGetAdminStats.mockResolvedValue({ totalAdmins: 2, activeAdmins: 2 });

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.stats).toBeDefined();
    expect(body.data.stats.totalAdmins).toBe(2);
  });

  it('returns 500 on error', async () => {
    mockNeedsInitialAdmin.mockRejectedValue(new Error('DB error'));

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to check admin status');
  });
});

describe('POST /api/admin/create - CREATE_FIRST_ADMIN', () => {
  beforeEach(() => {
    mockNeedsInitialAdmin.mockResolvedValue(true);
  });

  it('creates first admin successfully', async () => {
    mockCreateFirstAdmin.mockResolvedValue({ success: true });

    const res = await POST(
      createPostRequest({
        action: 'CREATE_FIRST_ADMIN',
        email: 'admin@example.com',
        name: 'Admin',
        password: 'securepass1',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('admin@example.com');
  });

  it('rejects if admin already exists', async () => {
    mockNeedsInitialAdmin.mockResolvedValue(false);

    const res = await POST(
      createPostRequest({
        action: 'CREATE_FIRST_ADMIN',
        email: 'admin@example.com',
        name: 'Admin',
        password: 'securepass1',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Admin already exists');
  });

  it('rejects invalid email', async () => {
    const res = await POST(
      createPostRequest({
        action: 'CREATE_FIRST_ADMIN',
        email: 'not-an-email',
        name: 'Admin',
        password: 'securepass1',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid request');
  });

  it('rejects short password', async () => {
    const res = await POST(
      createPostRequest({
        action: 'CREATE_FIRST_ADMIN',
        email: 'admin@example.com',
        name: 'Admin',
        password: 'short',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
  });

  it('returns error when createFirstAdmin fails', async () => {
    mockCreateFirstAdmin.mockResolvedValue({ success: false, error: 'Email taken' });

    const res = await POST(
      createPostRequest({
        action: 'CREATE_FIRST_ADMIN',
        email: 'admin@example.com',
        name: 'Admin',
        password: 'securepass1',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Email taken');
  });
});

describe('POST /api/admin/create - PROMOTE_USER', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
  });

  it('promotes user successfully', async () => {
    mockPromoteToAdmin.mockResolvedValue({ success: true });

    const res = await POST(
      createPostRequest({
        action: 'PROMOTE_USER',
        userId: 'user-1',
        reason: 'Trusted contributor',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('user-1');
  });

  it('rejects unauthenticated users', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await POST(
      createPostRequest({ action: 'PROMOTE_USER', userId: 'user-1' })
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('Unauthorized');
  });

  it('rejects non-admin users', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'user-2', role: 'USER' },
    });

    const res = await POST(
      createPostRequest({ action: 'PROMOTE_USER', userId: 'user-1' })
    );
    const body = await res.json();

    expect(res.status).toBe(403);
  });
});

describe('POST /api/admin/create - DEMOTE_ADMIN', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
  });

  it('demotes admin successfully', async () => {
    mockDemoteFromAdmin.mockResolvedValue({ success: true });

    const res = await POST(
      createPostRequest({
        action: 'DEMOTE_ADMIN',
        userId: 'admin-2',
        reason: 'No longer needed',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('rejects missing reason', async () => {
    const res = await POST(
      createPostRequest({
        action: 'DEMOTE_ADMIN',
        userId: 'admin-2',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid request');
  });
});

describe('POST /api/admin/create - CREATE_INVITATION', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
  });

  it('creates invitation successfully', async () => {
    mockCreateAdminInvitation.mockResolvedValue({
      success: true,
      invitation: { token: 'inv-token-123', expiresAt: new Date('2026-03-01') },
    });

    const res = await POST(
      createPostRequest({
        action: 'CREATE_INVITATION',
        email: 'newadmin@example.com',
        expiresInDays: 7,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.invitationUrl).toContain('inv-token-123');
  });

  it('rejects invalid email', async () => {
    const res = await POST(
      createPostRequest({
        action: 'CREATE_INVITATION',
        email: 'not-valid',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
  });
});

describe('POST /api/admin/create - ACCEPT_INVITATION', () => {
  it('accepts invitation successfully', async () => {
    mockAcceptAdminInvitation.mockResolvedValue({ success: true });

    const res = await POST(
      createPostRequest({
        action: 'ACCEPT_INVITATION',
        token: 'inv-token-123',
        email: 'newadmin@example.com',
        name: 'New Admin',
        password: 'securepass1',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('newadmin@example.com');
  });

  it('rejects invalid data (short password)', async () => {
    const res = await POST(
      createPostRequest({
        action: 'ACCEPT_INVITATION',
        token: 'inv-token-123',
        email: 'newadmin@example.com',
        name: 'New Admin',
        password: 'short', // min 8 chars required
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid request');
  });
});

describe('POST /api/admin/create - invalid action', () => {
  it('returns 400 for unknown action', async () => {
    const res = await POST(
      createPostRequest({ action: 'UNKNOWN_ACTION' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid action');
  });

  it('returns 500 on unexpected error', async () => {
    // Simulate JSON parse failure by passing an invalid body mock
    const req = new NextRequest('http://localhost:3000/api/admin/create', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to perform admin operation');
  });
});
