/**
 * Tests for Compliance SOC2 Report Route - app/api/compliance/soc2/report/route.ts
 */

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/compliance/audit-logger', () => ({
  AuditEventType: {
    ACCESS_DENIED: 'ACCESS_DENIED',
    DATA_EXPORT: 'DATA_EXPORT',
    SECURITY_ALERT: 'SECURITY_ALERT',
  },
  AuditSeverity: {
    WARNING: 'WARNING',
    INFO: 'INFO',
    ERROR: 'ERROR',
  },
  auditLogger: {
    log: jest.fn(),
    generateComplianceReport: jest.fn(),
    archiveOldLogs: jest.fn(),
    query: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/compliance/soc2/report/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { auditLogger } from '@/lib/compliance/audit-logger';

const mockAuth = auth as jest.Mock;
const mockAudit = auditLogger as jest.Mocked<typeof auditLogger>;

describe('Compliance soc2 report route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' } });
    mockAudit.log.mockResolvedValue(undefined as any);
    mockAudit.generateComplianceReport.mockResolvedValue({ controls: 10 } as any);
    mockAudit.archiveOldLogs.mockResolvedValue(3 as any);
    mockAudit.query.mockResolvedValue([{ id: 'a1' }] as any);
  });

  it('GET returns 401 for unauthorized user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });

    const res = await GET(new NextRequest('http://localhost:3000/api/compliance/soc2/report?startDate=2026-01-01&endDate=2026-02-01'));
    expect(res.status).toBe(401);
  });

  it('GET returns 400 when date range is missing', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/compliance/soc2/report'));
    expect(res.status).toBe(400);
  });

  it('GET generates compliance report for admin', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/compliance/soc2/report?startDate=2026-01-01&endDate=2026-02-01&type=SOC2'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockAudit.generateComplianceReport).toHaveBeenCalled();
  });

  it('POST returns 401 for unauthorized user', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(new NextRequest('http://localhost:3000/api/compliance/soc2/report', { method: 'POST', body: JSON.stringify({ action: 'archive' }) }));
    expect(res.status).toBe(401);
  });

  it('POST archives logs on archive action', async () => {
    const res = await POST(new NextRequest('http://localhost:3000/api/compliance/soc2/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'archive', retentionDays: 100 }),
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Archived 3');
  });

  it('POST returns 400 for invalid action', async () => {
    const res = await POST(new NextRequest('http://localhost:3000/api/compliance/soc2/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'nope' }),
    }));

    expect(res.status).toBe(400);
  });
});
