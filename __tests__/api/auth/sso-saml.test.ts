/**
 * Tests for Auth SSO SAML Route - app/api/auth/sso/saml/route.ts
 *
 * Covers: POST (initiate auth), GET (metadata/tenants), HEAD (health check)
 */

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

// @/auth, @/lib/db, @/lib/logger are globally mocked

import { POST, GET, HEAD } from '@/app/api/auth/sso/saml/route';
import { NextRequest, NextResponse } from 'next/server';
import { samlProviderManager } from '@/lib/auth/saml-provider';
import { safeErrorResponse } from '@/lib/api/safe-error';

const mockGetProvider = samlProviderManager.getProvider as jest.Mock;
const mockRegisterProvider = samlProviderManager.registerProvider as jest.Mock;
const mockGetConfiguredOrganizations = samlProviderManager.getConfiguredOrganizations as jest.Mock;
const mockGetProvidersSummary = samlProviderManager.getProvidersSummary as jest.Mock;
const mockSafeErrorResponse = safeErrorResponse as jest.Mock;

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/auth/sso/saml', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createGetRequest(query = '') {
  return new NextRequest(`http://localhost:3000/api/auth/sso/saml${query}`, {
    method: 'GET',
  });
}

function createHeadRequest() {
  return new NextRequest('http://localhost:3000/api/auth/sso/saml', {
    method: 'HEAD',
  });
}

describe('POST /api/auth/sso/saml', () => {
  beforeEach(() => {
    mockSafeErrorResponse.mockReturnValue(
      NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    );
  });

  it('returns 400 for invalid request body (missing tenantId)', async () => {
    const res = await POST(createPostRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid request');
  });

  it('returns 400 for invalid tenantId format (special characters)', async () => {
    const res = await POST(createPostRequest({ tenantId: 'invalid@tenant!' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid request');
  });

  it('returns 404 when SAML config not found for tenant', async () => {
    mockGetProvider.mockReturnValue(null);
    // The loadTenantSAMLConfig function will return null (no env vars set)

    const res = await POST(createPostRequest({ tenantId: 'unknown-tenant' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('SAML configuration not found');
  });

  it('returns 200 with authUrl on success when provider exists', async () => {
    const mockProvider = {
      generateLoginUrl: jest.fn().mockResolvedValue('https://idp.example.com/saml/login?SAMLRequest=abc'),
    };
    mockGetProvider.mockReturnValue(mockProvider);

    const res = await POST(createPostRequest({ tenantId: 'acme-corp' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.authUrl).toBe('https://idp.example.com/saml/login?SAMLRequest=abc');
    expect(body.tenantId).toBe('acme-corp');
  });

  it('registers new provider when existing provider not found but config is loaded', async () => {
    mockGetProvider.mockReturnValue(null);

    // Set SAML env vars so loadTenantSAMLConfig returns a config
    process.env.SAML_ENTRY_POINT = 'https://idp.example.com/saml/sso';
    process.env.SAML_ISSUER = 'urn:taxomind:saml';
    process.env.SAML_CERT = '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----';

    const newProvider = {
      generateLoginUrl: jest.fn().mockResolvedValue('https://idp.example.com/saml/sso?req=new'),
    };
    mockRegisterProvider.mockReturnValue(newProvider);

    const res = await POST(createPostRequest({ tenantId: 'new-tenant' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockRegisterProvider).toHaveBeenCalledWith('new-tenant');

    // Cleanup
    delete process.env.SAML_ENTRY_POINT;
    delete process.env.SAML_ISSUER;
    delete process.env.SAML_CERT;
  });

  it('returns 500 on unexpected error', async () => {
    mockGetProvider.mockImplementation(() => {
      throw new Error('Provider init failed');
    });

    await POST(createPostRequest({ tenantId: 'acme-corp' }));

    expect(mockSafeErrorResponse).toHaveBeenCalledWith(
      expect.any(Error),
      500,
      'SAML authentication initiation'
    );
  });
});

describe('GET /api/auth/sso/saml', () => {
  it('returns 400 for invalid tenant ID format', async () => {
    const res = await GET(createGetRequest('?tenant=invalid@format!'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid tenant ID format');
  });

  it('returns tenant list when no tenant param provided', async () => {
    mockGetConfiguredOrganizations.mockReturnValue(['acme-corp', 'beta-inc']);
    mockGetProvidersSummary.mockReturnValue({
      'acme-corp': { activeSessionsCount: 5 },
      'beta-inc': { activeSessionsCount: 2 },
    });

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.tenants).toEqual(['acme-corp', 'beta-inc']);
    expect(body.summary).toBeDefined();
  });

  it('returns 404 when tenant provider not found', async () => {
    mockGetProvider.mockReturnValue(null);

    const res = await GET(createGetRequest('?tenant=unknown-tenant'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('SAML configuration not found');
  });

  it('returns XML metadata for valid tenant', async () => {
    mockGetProvider.mockReturnValue({});

    const res = await GET(createGetRequest('?tenant=acme-corp'));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/xml');
    expect(res.headers.get('Content-Disposition')).toContain('acme-corp-saml-metadata.xml');
    expect(text).toContain('EntityDescriptor');
    expect(text).toContain('SPSSODescriptor');
  });
});

describe('HEAD /api/auth/sso/saml', () => {
  it('returns 200 with health status', async () => {
    mockGetConfiguredOrganizations.mockReturnValue(['acme-corp']);
    mockGetProvidersSummary.mockReturnValue({
      'acme-corp': { activeSessionsCount: 3 },
    });

    const res = await HEAD(createHeadRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.configuredTenants).toBe(1);
    expect(body.totalActiveSessions).toBe(3);
  });

  it('returns 500 on health check error', async () => {
    mockGetConfiguredOrganizations.mockImplementation(() => {
      throw new Error('Health check failed');
    });

    const res = await HEAD(createHeadRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('SAML health check failed');
  });
});
