/**
 * Tests for Trusted Devices [deviceId] Route - app/api/auth/trusted-devices/[deviceId]/route.ts
 *
 * Covers: DELETE (revoke device trust), PATCH (update device name)
 */

jest.mock('@/lib/security/session-manager', () => ({
  SessionManager: {
    revokeTrustedDevice: jest.fn(),
  },
}));

// @/auth, @/lib/db, @/lib/logger are globally mocked

import { DELETE, PATCH } from '@/app/api/auth/trusted-devices/[deviceId]/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { SessionManager } from '@/lib/security/session-manager';

const mockAuth = auth as jest.Mock;
const mockRevoke = SessionManager.revokeTrustedDevice as jest.Mock;

// PATCH handler uses dynamic `await import('@/lib/db')` which resolves to the
// same globally-mocked module. The `authSession` model may not exist in the
// mock template, so we create it here to ensure the test can reference it.
if (!(db as any).authSession) {
  (db as any).authSession = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  };
}

function createDeleteRequest() {
  return new NextRequest('http://localhost:3000/api/auth/trusted-devices/dev-123', {
    method: 'DELETE',
  });
}

function createPatchRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost:3000/api/auth/trusted-devices/dev-123', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createRouteParams(deviceId: string) {
  return { params: { deviceId } };
}

// ============================================================
// DELETE /api/auth/trusted-devices/[deviceId]
// ============================================================
describe('DELETE /api/auth/trusted-devices/[deviceId]', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    mockRevoke.mockResolvedValue({
      success: true,
      message: 'Device trust revoked successfully',
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await DELETE(createDeleteRequest(), createRouteParams('dev-123'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Not authenticated');
  });

  it('returns 400 when deviceId is empty', async () => {
    const res = await DELETE(createDeleteRequest(), createRouteParams(''));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Device ID required');
  });

  it('returns 400 when revoke fails', async () => {
    mockRevoke.mockResolvedValue({
      success: false,
      message: 'Device not found',
    });

    const res = await DELETE(createDeleteRequest(), createRouteParams('dev-123'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Device not found');
  });

  it('returns 200 on successful revocation', async () => {
    const res = await DELETE(createDeleteRequest(), createRouteParams('dev-123'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('revoked');

    expect(mockRevoke).toHaveBeenCalledWith('user-1', 'dev-123');
  });

  it('returns 500 on unexpected error', async () => {
    mockRevoke.mockRejectedValue(new Error('Database error'));

    const res = await DELETE(createDeleteRequest(), createRouteParams('dev-123'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to revoke device trust');
  });
});

// ============================================================
// PATCH /api/auth/trusted-devices/[deviceId]
// ============================================================
describe('PATCH /api/auth/trusted-devices/[deviceId]', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    // Default: updateMany succeeds with count > 0
    ((db as any).authSession.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(createPatchRequest({ name: 'New Name' }), createRouteParams('dev-123'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Not authenticated');
  });

  it('returns 400 when deviceId is missing', async () => {
    const res = await PATCH(createPatchRequest({ name: 'New Name' }), createRouteParams(''));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Device ID and name required');
  });

  it('returns 400 when name is missing', async () => {
    const res = await PATCH(createPatchRequest({}), createRouteParams('dev-123'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Device ID and name required');
  });

  it('returns 404 when device is not found (updateMany count 0)', async () => {
    ((db as any).authSession.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

    const res = await PATCH(createPatchRequest({ name: 'New Name' }), createRouteParams('dev-123'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('Device not found');
  });

  it('returns 200 on successful update', async () => {
    const res = await PATCH(createPatchRequest({ name: 'My Work Laptop' }), createRouteParams('dev-456'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Device name updated');
  });

  it('returns 500 on unexpected error', async () => {
    ((db as any).authSession.updateMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const res = await PATCH(createPatchRequest({ name: 'Test' }), createRouteParams('dev-123'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to update device');
  });
});
