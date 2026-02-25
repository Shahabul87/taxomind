/**
 * Tests for Trust Device Route - app/api/auth/trust-device/route.ts
 *
 * Covers: auth, session token extraction, device trust, error handling
 */

jest.mock('@/lib/security/session-manager', () => ({
  SessionManager: {
    trustDevice: jest.fn(),
  },
}));

// @/auth, @/lib/db, @/lib/logger are globally mocked

import { POST } from '@/app/api/auth/trust-device/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { SessionManager } from '@/lib/security/session-manager';

const mockAuth = auth as jest.Mock;
const mockTrustDevice = SessionManager.trustDevice as jest.Mock;

function createRequest(body: Record<string, unknown> = {}, cookies: Record<string, string> = {}) {
  const req = new NextRequest('http://localhost:3000/api/auth/trust-device', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach cookies getter since the mock NextRequest from jest.setup does not support cookies
  (req as any).cookies = {
    get: jest.fn((name: string) => {
      if (cookies[name]) {
        return { value: cookies[name] };
      }
      return undefined;
    }),
  };

  return req;
}

describe('POST /api/auth/trust-device', () => {
  beforeEach(() => {
    // Default: authenticated user
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    // Default: trust device succeeds
    mockTrustDevice.mockResolvedValue({
      success: true,
      message: 'Device trusted successfully',
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(createRequest({ deviceName: 'My Laptop' }, { 'authjs.session-token': 'tok-123' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Not authenticated');
  });

  it('returns 400 when session token is not found in cookies', async () => {
    const res = await POST(createRequest({ deviceName: 'My Laptop' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Session token not found');
  });

  it('returns 400 when trustDevice fails', async () => {
    mockTrustDevice.mockResolvedValue({
      success: false,
      message: 'Device trust limit reached',
    });

    const res = await POST(
      createRequest({ deviceName: 'My Laptop' }, { 'authjs.session-token': 'tok-123' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Device trust limit reached');
  });

  it('returns 200 on success with authjs session token', async () => {
    const res = await POST(
      createRequest({ deviceName: 'My Laptop' }, { 'authjs.session-token': 'tok-123' })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Device trusted successfully');

    expect(mockTrustDevice).toHaveBeenCalledWith('tok-123', 'user-1', 'My Laptop');
  });

  it('returns 200 on success with __Secure-authjs session token', async () => {
    const res = await POST(
      createRequest({ deviceName: 'Work PC' }, { '__Secure-authjs.session-token': 'secure-tok' })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    expect(mockTrustDevice).toHaveBeenCalledWith('secure-tok', 'user-1', 'Work PC');
  });

  it('returns 500 on unexpected error', async () => {
    mockTrustDevice.mockRejectedValue(new Error('Database error'));

    const res = await POST(
      createRequest({ deviceName: 'My Laptop' }, { 'authjs.session-token': 'tok-123' })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to trust device');
  });
});
