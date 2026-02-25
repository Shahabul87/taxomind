/**
 * Tests for Capabilities Route - app/api/auth/capabilities/route.ts
 *
 * Covers: GET (retrieve capabilities), POST (grant), DELETE (revoke)
 */

jest.mock('@/lib/auth/capabilities', () => ({
  getUserCapabilities: jest.fn(),
  grantCapability: jest.fn(),
  revokeCapability: jest.fn(),
  getAvailableCapabilities: jest.fn(),
  UserCapability: {
    STUDENT: 'STUDENT',
    TEACHER: 'TEACHER',
    AFFILIATE: 'AFFILIATE',
    CONTENT_CREATOR: 'CONTENT_CREATOR',
    MODERATOR: 'MODERATOR',
    REVIEWER: 'REVIEWER',
  },
}));

// @/auth, @/lib/db, @/lib/logger are globally mocked

import { GET, POST, DELETE } from '@/app/api/auth/capabilities/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import {
  getUserCapabilities,
  grantCapability,
  revokeCapability,
  getAvailableCapabilities,
  UserCapability,
} from '@/lib/auth/capabilities';

const mockAuth = auth as jest.Mock;
const mockGetCaps = getUserCapabilities as jest.Mock;
const mockGrantCap = grantCapability as jest.Mock;
const mockRevokeCap = revokeCapability as jest.Mock;
const mockGetAvailable = getAvailableCapabilities as jest.Mock;

function createGetRequest(searchParams: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/auth/capabilities');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url.toString(), { method: 'GET' });
}

function createPostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost:3000/api/auth/capabilities', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createDeleteRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost:3000/api/auth/capabilities', {
    method: 'DELETE',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const MOCK_CAPABILITIES = [
  { capability: 'STUDENT', isActive: true },
  { capability: 'TEACHER', isActive: true },
];

const MOCK_AVAILABLE = [
  { capability: 'AFFILIATE', requiresApproval: false },
];

// ============================================================
// GET /api/auth/capabilities
// ============================================================
describe('GET /api/auth/capabilities', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', role: 'USER' },
    });

    mockGetCaps.mockResolvedValue(MOCK_CAPABILITIES);
    mockGetAvailable.mockResolvedValue(MOCK_AVAILABLE);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 200 with own capabilities', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('user-1');
    expect(body.data.currentCapabilities).toEqual(MOCK_CAPABILITIES);
    expect(body.data.availableCapabilities).toEqual(MOCK_AVAILABLE);
  });

  it('returns 403 when non-admin queries other user capabilities', async () => {
    const res = await GET(createGetRequest({ userId: 'other-user' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('Cannot view other');
  });

  it('returns 200 when admin queries other user capabilities', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
    });

    const res = await GET(createGetRequest({ userId: 'other-user' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('other-user');

    expect(mockGetCaps).toHaveBeenCalledWith('other-user');
    expect(mockGetAvailable).toHaveBeenCalledWith('other-user');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCaps.mockRejectedValue(new Error('Database error'));

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to fetch capabilities');
  });
});

// ============================================================
// POST /api/auth/capabilities
// ============================================================
describe('POST /api/auth/capabilities', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', role: 'USER' },
    });

    mockGrantCap.mockResolvedValue({ success: true });
    mockGetCaps.mockResolvedValue(MOCK_CAPABILITIES);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(createPostRequest({ capability: 'TEACHER' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 400 for invalid body (invalid capability)', async () => {
    const res = await POST(createPostRequest({ capability: 'INVALID_CAP' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid request');
  });

  it('returns 403 when non-admin grants capability to other user', async () => {
    const res = await POST(createPostRequest({
      userId: 'other-user',
      capability: 'TEACHER',
    }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('Only admins');
  });

  it('returns 403 when capability requires admin approval for non-admin', async () => {
    const res = await POST(createPostRequest({ capability: 'MODERATOR' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('requires admin approval');
  });

  it('returns 400 when grant fails', async () => {
    mockGrantCap.mockResolvedValue({ success: false, error: 'Already has capability' });

    const res = await POST(createPostRequest({ capability: 'TEACHER' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Already has capability');
  });

  it('returns 200 on successful grant (self)', async () => {
    const res = await POST(createPostRequest({ capability: 'TEACHER' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.grantedCapability).toBe('TEACHER');

    expect(mockGrantCap).toHaveBeenCalledWith('user-1', 'TEACHER', 'user-1');
  });

  it('returns 200 when admin grants MODERATOR to other user', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
    });

    const res = await POST(createPostRequest({
      userId: 'other-user',
      capability: 'MODERATOR',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('other-user');
    expect(body.data.grantedCapability).toBe('MODERATOR');

    expect(mockGrantCap).toHaveBeenCalledWith('other-user', 'MODERATOR', 'admin-1');
  });

  it('returns 500 on unexpected error', async () => {
    mockGrantCap.mockRejectedValue(new Error('Database error'));

    const res = await POST(createPostRequest({ capability: 'TEACHER' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to grant capability');
  });
});

// ============================================================
// DELETE /api/auth/capabilities
// ============================================================
describe('DELETE /api/auth/capabilities', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', role: 'USER' },
    });

    mockRevokeCap.mockResolvedValue({ success: true });
    mockGetCaps.mockResolvedValue([{ capability: 'STUDENT', isActive: true }]);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await DELETE(createDeleteRequest({ capability: 'TEACHER' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 400 for invalid body', async () => {
    const res = await DELETE(createDeleteRequest({ capability: 'NOT_A_CAP' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid request');
  });

  it('returns 400 when attempting to revoke STUDENT capability', async () => {
    const res = await DELETE(createDeleteRequest({ capability: 'STUDENT' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Cannot revoke STUDENT');
  });

  it('returns 403 when non-admin revokes capability from other user', async () => {
    const res = await DELETE(createDeleteRequest({
      userId: 'other-user',
      capability: 'TEACHER',
    }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('Only admins');
  });

  it('returns 400 when revoke fails', async () => {
    mockRevokeCap.mockResolvedValue({ success: false, error: 'Capability not found' });

    const res = await DELETE(createDeleteRequest({ capability: 'TEACHER' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Capability not found');
  });

  it('returns 200 on successful revocation (self)', async () => {
    const res = await DELETE(createDeleteRequest({ capability: 'TEACHER' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.revokedCapability).toBe('TEACHER');

    expect(mockRevokeCap).toHaveBeenCalledWith('user-1', 'TEACHER', 'user-1', undefined);
  });

  it('returns 200 when admin revokes capability from other user with reason', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
    });

    const res = await DELETE(createDeleteRequest({
      userId: 'other-user',
      capability: 'TEACHER',
      reason: 'Violated terms',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('other-user');
    expect(body.data.reason).toBe('Violated terms');

    expect(mockRevokeCap).toHaveBeenCalledWith('other-user', 'TEACHER', 'admin-1', 'Violated terms');
  });

  it('returns 500 on unexpected error', async () => {
    mockRevokeCap.mockRejectedValue(new Error('Database error'));

    const res = await DELETE(createDeleteRequest({ capability: 'TEACHER' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to revoke capability');
  });
});
