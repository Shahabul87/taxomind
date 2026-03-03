/**
 * Tests for Admin Audit Dashboard Route - app/api/admin/audit-dashboard/route.ts
 *
 * Covers: GET (overview, authentication, security, compliance dashboards), POST (archive, export)
 * Auth: Uses withAdminAuth wrapper from @/lib/api/with-api-auth
 */

jest.mock('@/lib/api/with-api-auth', () => ({
  withAdminAuth: jest.fn((handler, _options) => {
    return async (request: unknown) => {
      const context = {
        user: {
          id: 'admin-1',
          email: 'admin@test.com',
          role: 'ADMIN',
        },
        request: {
          method: 'GET',
          url: 'http://localhost:3000/api/admin/audit-dashboard',
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

jest.mock('@/lib/compliance/audit-logger', () => ({
  auditLogger: {
    query: jest.fn(),
    archiveOldLogs: jest.fn(),
    generateComplianceReport: jest.fn(),
  },
  AuditEventType: {
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
  },
  AuditSeverity: {
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL',
    INFO: 'INFO',
  },
}));

jest.mock('@/lib/audit/auth-audit', () => ({
  authAuditHelpers: {
    getAuthMetrics: jest.fn(),
    getSecurityAlerts: jest.fn(),
  },
}));

// @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { GET, POST } from '@/app/api/admin/audit-dashboard/route';
import { NextRequest } from 'next/server';
import { auditLogger } from '@/lib/compliance/audit-logger';
import { authAuditHelpers } from '@/lib/audit/auth-audit';

const mockAuditQuery = auditLogger.query as jest.Mock;
const mockArchiveOldLogs = auditLogger.archiveOldLogs as jest.Mock;
const mockGenerateReport = auditLogger.generateComplianceReport as jest.Mock;
const mockGetAuthMetrics = authAuditHelpers.getAuthMetrics as jest.Mock;
const mockGetSecurityAlerts = authAuditHelpers.getSecurityAlerts as jest.Mock;

function createGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/admin/audit-dashboard');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest(
    'http://localhost:3000/api/admin/audit-dashboard',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// =========================================================================
// GET /api/admin/audit-dashboard
// =========================================================================
describe('GET /api/admin/audit-dashboard', () => {
  beforeEach(() => {
    mockGetAuthMetrics.mockResolvedValue({
      totalLogins: 100,
      failedLogins: 5,
      successRate: '95.00',
      suspiciousActivities: 2,
    });
    mockGetSecurityAlerts.mockResolvedValue([
      { id: 'a1', severity: 'CRITICAL', type: 'BRUTE_FORCE' },
      { id: 'a2', severity: 'WARNING', type: 'UNUSUAL_LOGIN' },
    ]);
    mockAuditQuery.mockResolvedValue([
      { id: 'event-1', eventType: 'USER_LOGIN', timestamp: new Date() },
    ]);
  });

  it('returns overview dashboard by default', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.dashboard).toBe('overview');
    expect(body.data.authMetrics).toBeDefined();
    expect(body.data.securityAlerts).toBeDefined();
    expect(body.data.recentActivities).toBeDefined();
    expect(body.data.summary.totalAlerts).toBe(2);
    expect(body.data.summary.criticalAlerts).toBe(1);
  });

  it('returns authentication dashboard', async () => {
    const res = await GET(createGetRequest({ dashboard: 'authentication' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.dashboard).toBe('authentication');
    expect(body.data.totalLogins).toBe(100);
  });

  it('returns security dashboard', async () => {
    mockAuditQuery.mockResolvedValue([
      {
        id: 'e1',
        eventType: 'BRUTE_FORCE',
        userEmail: 'attacker@test.com',
        riskScore: 85,
      },
    ]);
    mockGetSecurityAlerts.mockResolvedValue([]);

    const res = await GET(createGetRequest({ dashboard: 'security' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.dashboard).toBe('security');
    expect(body.data.securityEvents).toBeDefined();
    expect(body.data.alerts).toBeDefined();
    expect(body.data.riskAnalysis).toBeDefined();
  });

  it('returns compliance dashboard', async () => {
    mockGenerateReport.mockResolvedValue({
      framework: 'SOC2',
      controls: [],
      complianceScore: 95,
    });

    const res = await GET(createGetRequest({ dashboard: 'compliance' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.dashboard).toBe('compliance');
  });

  it('returns 400 for invalid dashboard type', async () => {
    const res = await GET(createGetRequest({ dashboard: 'invalid' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid dashboard type');
  });

  it('respects timeWindow parameter', async () => {
    await GET(createGetRequest({ timeWindow: '48' }));

    expect(mockGetAuthMetrics).toHaveBeenCalledWith(48);
    expect(mockGetSecurityAlerts).toHaveBeenCalledWith(48);
  });

  it('returns 500 on service error', async () => {
    mockGetAuthMetrics.mockRejectedValue(new Error('Service error'));

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
  });
});

// =========================================================================
// POST /api/admin/audit-dashboard
// =========================================================================
describe('POST /api/admin/audit-dashboard', () => {
  it('archives audit logs successfully', async () => {
    mockArchiveOldLogs.mockResolvedValue(150);

    const res = await POST(
      createPostRequest({
        action: 'archive_logs',
        params: { retentionDays: 365 },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.archivedCount).toBe(150);
    expect(body.message).toContain('Archived 150');
  });

  it('uses default retention days for archive', async () => {
    mockArchiveOldLogs.mockResolvedValue(0);

    const res = await POST(createPostRequest({ action: 'archive_logs' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockArchiveOldLogs).toHaveBeenCalledWith(2555);
  });

  it('exports compliance report', async () => {
    mockGenerateReport.mockResolvedValue({
      framework: 'SOC2',
      complianceScore: 98,
    });

    const res = await POST(
      createPostRequest({
        action: 'export_compliance_report',
        params: { type: 'SOC2' },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.report).toBeDefined();
    expect(body.exportedAt).toBeDefined();
  });

  it('returns 400 for invalid action', async () => {
    const res = await POST(
      createPostRequest({ action: 'unknown_action' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid action');
  });

  it('returns 500 on service error', async () => {
    mockArchiveOldLogs.mockRejectedValue(new Error('Archive failed'));

    const res = await POST(createPostRequest({ action: 'archive_logs' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
  });
});
