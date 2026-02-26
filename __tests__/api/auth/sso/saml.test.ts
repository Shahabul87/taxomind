jest.mock('@/lib/auth/saml-provider', () => ({
  samlProviderManager: {
    getProvider: jest.fn(),
    registerProvider: jest.fn(),
    getConfiguredOrganizations: jest.fn(),
    getProvidersSummary: jest.fn(),
  },
}));

jest.mock('@/lib/api/safe-error', () => ({
  safeErrorResponse: jest.fn(),
}));

import { GET, HEAD, POST } from '@/app/api/auth/sso/saml/route';
import { NextRequest, NextResponse } from 'next/server';
import { samlProviderManager } from '@/lib/auth/saml-provider';
import { safeErrorResponse } from '@/lib/api/safe-error';

const mockGetProvider = samlProviderManager.getProvider as jest.Mock;
const mockGetConfiguredOrganizations = samlProviderManager.getConfiguredOrganizations as jest.Mock;
const mockGetProvidersSummary = samlProviderManager.getProvidersSummary as jest.Mock;
const mockSafeErrorResponse = safeErrorResponse as jest.Mock;

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/auth/sso/saml', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api/auth/sso/saml route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSafeErrorResponse.mockReturnValue(
      NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    );
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ tenantId: 'invalid@tenant!' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid request');
  });

  it('POST returns auth URL when provider exists', async () => {
    mockGetProvider.mockReturnValue({
      generateLoginUrl: jest.fn().mockResolvedValue('https://idp.example.com/login'),
    });

    const res = await POST(postReq({ tenantId: 'acme' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.authUrl).toBe('https://idp.example.com/login');
  });

  it('GET returns configured tenant list when tenant query is absent', async () => {
    mockGetConfiguredOrganizations.mockReturnValue(['acme']);
    mockGetProvidersSummary.mockReturnValue({ acme: { activeSessionsCount: 2 } });

    const res = await GET(new NextRequest('http://localhost:3000/api/auth/sso/saml'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.tenants).toEqual(['acme']);
  });

  it('HEAD returns 500 when health computation throws', async () => {
    mockGetConfiguredOrganizations.mockImplementation(() => {
      throw new Error('boom');
    });

    const res = await HEAD(new NextRequest('http://localhost:3000/api/auth/sso/saml', { method: 'HEAD' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('SAML health check failed');
  });
});
