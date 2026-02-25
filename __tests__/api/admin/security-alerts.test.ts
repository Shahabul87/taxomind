/**
 * Tests for Admin Security Alerts Route - app/api/admin/security-alerts/route.ts
 *
 * Covers: GET (fetch security alerts/metrics), POST (force logout, mark suspicious)
 * Auth: Uses withAdminAuth wrapper from @/lib/api/with-api-auth
 */

jest.mock('@/lib/api/with-api-auth', () => ({
  withAdminAuth: jest.fn((handler, _options) => {
    return async (request: unknown) => {
      // Simulate admin auth by calling handler with a mock context
      const context = {
        user: {
          id: 'admin-1',
          email: 'admin@test.com',
          role: 'ADMIN',
        },
        request: {
          method: 'GET',
          url: 'http://localhost:3000/api/admin/security-alerts',
          ip: '127.0.0.1',
          userAgent: 'test',
          timestamp: new Date(),
        },
        permissions: {
          hasRole: jest.fn(() => true),
          hasPermission: jest.fn(() => Promise.resolve(true)),
          canAccess: jest.fn(() => Promise.resolve(true)),
        },
      };
      return handler(request, context);
    };
  }),
  withAPIAuth: jest.fn((handler) => handler),
}));

jest.mock('@/lib/audit/auth-audit', () => ({
  authAuditHelpers: {
    getAuthMetrics: jest.fn(),
    getSecurityAlerts: jest.fn(),
    logSignOut: jest.fn(),
    logSuspiciousActivity: jest.fn(),
  },
}));

// @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { GET, POST } from '@/app/api/admin/security-alerts/route';
import { NextRequest } from 'next/server';
import { authAuditHelpers } from '@/lib/audit/auth-audit';

const mockGetAuthMetrics = authAuditHelpers.getAuthMetrics as jest.Mock;
const mockGetSecurityAlerts = authAuditHelpers.getSecurityAlerts as jest.Mock;
const mockLogSignOut = authAuditHelpers.logSignOut as jest.Mock;
const mockLogSuspiciousActivity =
  authAuditHelpers.logSuspiciousActivity as jest.Mock;

function createGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/admin/security-alerts');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest(
    'http://localhost:3000/api/admin/security-alerts',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// =========================================================================
// GET /api/admin/security-alerts
// =========================================================================
describe('GET /api/admin/security-alerts', () => {
  it('returns security alerts by default', async () => {
    mockGetSecurityAlerts.mockResolvedValue([
      { id: 'alert-1', type: 'BRUTE_FORCE', severity: 'HIGH' },
    ]);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.timeWindow).toBe('24h');
  });

  it('returns metrics when type=metrics', async () => {
    mockGetAuthMetrics.mockResolvedValue({
      totalLogins: 100,
      failedLogins: 5,
      successRate: '95.00',
    });

    const res = await GET(createGetRequest({ type: 'metrics' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalLogins).toBe(100);
  });

  it('respects custom timeWindow parameter', async () => {
    mockGetSecurityAlerts.mockResolvedValue([]);

    const res = await GET(createGetRequest({ timeWindow: '48' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.timeWindow).toBe('48h');
    expect(mockGetSecurityAlerts).toHaveBeenCalledWith(48);
  });

  it('returns 500 on service error', async () => {
    mockGetSecurityAlerts.mockRejectedValue(new Error('Service error'));

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to retrieve');
  });
});

// =========================================================================
// POST /api/admin/security-alerts
// =========================================================================
describe('POST /api/admin/security-alerts', () => {
  it('handles force_logout action', async () => {
    mockLogSignOut.mockResolvedValue(undefined);

    const res = await POST(
      createPostRequest({
        action: 'force_logout',
        targetUserId: 'user-1',
        targetEmail: 'user@test.com',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Forced logout');
    expect(mockLogSignOut).toHaveBeenCalledWith('user-1', 'user@test.com', true);
  });

  it('handles mark_suspicious action', async () => {
    mockLogSuspiciousActivity.mockResolvedValue(undefined);

    const res = await POST(
      createPostRequest({
        action: 'mark_suspicious',
        targetUserId: 'user-1',
        targetEmail: 'user@test.com',
        reason: 'Unusual login pattern',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('marked as suspicious');
  });

  it('returns 400 for invalid action', async () => {
    const res = await POST(
      createPostRequest({
        action: 'invalid_action',
        targetUserId: 'user-1',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid action');
  });

  it('returns 500 on service error', async () => {
    mockLogSignOut.mockRejectedValue(new Error('Service error'));

    const res = await POST(
      createPostRequest({
        action: 'force_logout',
        targetUserId: 'user-1',
        targetEmail: 'user@test.com',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to execute');
  });
});
