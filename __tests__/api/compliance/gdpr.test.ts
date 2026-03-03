/**
 * Tests for Compliance GDPR Route - app/api/compliance/gdpr/route.ts
 */

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/lib/compliance/gdpr-manager', () => ({
  gdprManager: {
    getUserConsents: jest.fn(),
    exportUserData: jest.fn(),
    getDataRetentionPolicy: jest.fn(),
    generateComplianceReport: jest.fn(),
    checkDataMinimization: jest.fn(),
    recordConsent: jest.fn(),
    processGDPRRequest: jest.fn(),
    deleteUserData: jest.fn(),
    anonymizeUserData: jest.fn(),
  },
}));

import { DELETE, GET, POST } from '@/app/api/compliance/gdpr/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { adminAuth } from '@/auth.admin';
import { gdprManager } from '@/lib/compliance/gdpr-manager';

const mockAuth = auth as jest.Mock;
const mockAdminAuth = adminAuth as jest.Mock;
const mockGDPR = gdprManager as jest.Mocked<typeof gdprManager>;

function getReq(action: string) {
  return new NextRequest(`http://localhost:3000/api/compliance/gdpr?action=${action}`, { method: 'GET' });
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/compliance/gdpr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Compliance gdpr route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    mockAdminAuth.mockResolvedValue(null);
    mockGDPR.getUserConsents.mockResolvedValue([{ consentType: 'analytics', granted: true }] as any);
    mockGDPR.exportUserData.mockResolvedValue({ userId: 'user-1' } as any);
    mockGDPR.getDataRetentionPolicy.mockReturnValue({ defaultDays: 365 } as any);
    mockGDPR.generateComplianceReport.mockResolvedValue({ summary: 'ok' } as any);
    mockGDPR.checkDataMinimization.mockResolvedValue({ score: 90 } as any);
    mockGDPR.recordConsent.mockResolvedValue({ id: 'consent-1' } as any);
    mockGDPR.processGDPRRequest.mockResolvedValue({ requestId: 'req-1' } as any);
    mockGDPR.deleteUserData.mockResolvedValue(undefined as any);
    mockGDPR.anonymizeUserData.mockResolvedValue(undefined as any);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(getReq('consents'));
    expect(res.status).toBe(401);
  });

  it('GET returns user consents', async () => {
    const res = await GET(getReq('consents'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.consents).toHaveLength(1);
  });

  it('GET blocks compliance-report for non-admin users', async () => {
    const res = await GET(getReq('compliance-report'));
    expect(res.status).toBe(403);
  });

  it('POST validates consent payload and returns 400 on invalid data', async () => {
    const res = await POST(postReq({ action: 'consent', consentType: 'analytics' }));
    expect(res.status).toBe(400);
  });

  it('POST processes gdpr-request action', async () => {
    const res = await POST(postReq({ action: 'gdpr-request', requestType: 'DATA_ACCESS' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockGDPR.processGDPRRequest).toHaveBeenCalled();
  });

  it('DELETE processes account deletion with token', async () => {
    const req = new NextRequest('http://localhost:3000/api/compliance/gdpr?token=abc123', {
      method: 'DELETE',
    });

    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockGDPR.deleteUserData).toHaveBeenCalledWith('user-1', 'abc123');
  });
});
