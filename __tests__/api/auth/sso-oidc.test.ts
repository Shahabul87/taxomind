/**
 * Tests for Auth SSO OIDC Route - app/api/auth/sso/oidc/route.ts
 *
 * Covers: POST (initiate), GET (config/tenants), PUT (update), DELETE (remove), HEAD (health)
 */

jest.mock('@/lib/auth/oidc-provider', () => ({
  oidcProviderManager: {
    getProvider: jest.fn(),
    registerProvider: jest.fn(),
    removeProvider: jest.fn(),
    getConfiguredTenants: jest.fn(),
    getProvidersSummary: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn().mockResolvedValue({ id: 'admin-1' }),
}));

import { POST, GET, PUT, DELETE, HEAD } from '@/app/api/auth/sso/oidc/route';
import { NextRequest } from 'next/server';
import { oidcProviderManager } from '@/lib/auth/oidc-provider';
import { db } from '@/lib/db';

const mockGetProvider = oidcProviderManager.getProvider as jest.Mock;
const mockRegisterProvider = oidcProviderManager.registerProvider as jest.Mock;
const mockRemoveProvider = oidcProviderManager.removeProvider as jest.Mock;
const mockGetConfiguredTenants = oidcProviderManager.getConfiguredTenants as jest.Mock;
const mockGetProvidersSummary = oidcProviderManager.getProvidersSummary as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  // Configure admin auth mock - db is provided by moduleNameMapper/__mocks__/db.js
  (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'admin-1' });
});

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/auth/sso/oidc', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createGetRequest(query = '') {
  return new NextRequest(`http://localhost:3000/api/auth/sso/oidc${query}`, {
    method: 'GET',
  });
}

function createPutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/auth/sso/oidc', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createDeleteRequest(query = '') {
  return new NextRequest(`http://localhost:3000/api/auth/sso/oidc${query}`, {
    method: 'DELETE',
  });
}

function createHeadRequest() {
  return new NextRequest('http://localhost:3000/api/auth/sso/oidc', {
    method: 'HEAD',
  });
}

describe('POST /api/auth/sso/oidc', () => {
  it('returns 400 when tenantId is missing', async () => {
    const res = await POST(createPostRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Tenant ID is required');
  });

  it('returns 404 when OIDC config not found for tenant', async () => {
    mockGetProvider.mockReturnValue(null);
    // No env vars set, so loadTenantOIDCConfig returns null

    const res = await POST(createPostRequest({ tenantId: 'unknown-tenant' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('OIDC configuration not found');
  });

  it('returns 200 with authUrl on success', async () => {
    const mockProvider = {
      generateAuthUrl: jest.fn().mockResolvedValue({
        authUrl: 'https://idp.example.com/oauth2/authorize?client_id=abc',
        state: 'state-123',
        nonce: 'nonce-456',
      }),
    };
    mockGetProvider.mockReturnValue(mockProvider);

    const res = await POST(createPostRequest({ tenantId: 'acme-corp' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.authUrl).toContain('https://idp.example.com');
    expect(body.state).toBe('state-123');
    expect(body.nonce).toBe('nonce-456');
    expect(body.tenantId).toBe('acme-corp');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetProvider.mockImplementation(() => {
      throw new Error('Provider initialization error');
    });

    const res = await POST(createPostRequest({ tenantId: 'acme-corp' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toEqual({ code: 'INTERNAL_ERROR', message: 'Internal server error' });
  });
});

describe('GET /api/auth/sso/oidc', () => {
  it('returns tenant list when no tenant param provided', async () => {
    mockGetConfiguredTenants.mockReturnValue(['acme-corp', 'beta-inc']);
    mockGetProvidersSummary.mockReturnValue({
      'acme-corp': { activeSessionsCount: 3 },
    });

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.tenants).toEqual(['acme-corp', 'beta-inc']);
    expect(body.summary).toBeDefined();
  });

  it('returns discovery document for tenant with action=discovery', async () => {
    const mockProvider = {
      getDiscoveryDocument: jest.fn().mockReturnValue({
        issuer: 'https://idp.example.com',
        authorization_endpoint: 'https://idp.example.com/authorize',
      }),
    };
    mockGetProvider.mockReturnValue(mockProvider);

    const res = await GET(createGetRequest('?tenant=acme-corp&action=discovery'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.discovery.issuer).toBe('https://idp.example.com');
  });

  it('returns 404 for discovery when tenant not found', async () => {
    mockGetProvider.mockReturnValue(null);

    const res = await GET(createGetRequest('?tenant=unknown&action=discovery'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('OIDC configuration not found');
  });

  it('returns specific tenant config summary', async () => {
    const mockProvider = {
      getConfigSummary: jest.fn().mockReturnValue({
        tenantId: 'acme-corp',
        issuer: 'https://idp.example.com',
        scopes: ['openid', 'profile', 'email'],
      }),
    };
    mockGetProvider.mockReturnValue(mockProvider);

    const res = await GET(createGetRequest('?tenant=acme-corp'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.config.tenantId).toBe('acme-corp');
  });

  it('returns 404 for specific tenant not found', async () => {
    mockGetProvider.mockReturnValue(null);

    const res = await GET(createGetRequest('?tenant=not-found'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('OIDC configuration not found');
  });
});

describe('PUT /api/auth/sso/oidc', () => {
  it('returns 400 when tenantId is missing', async () => {
    const res = await PUT(createPutRequest({ issuer: 'https://example.com' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Tenant ID is required');
  });

  it('returns 400 for invalid config (missing issuer)', async () => {
    const res = await PUT(createPutRequest({
      tenantId: 'acme-corp',
      clientId: 'client-id',
      scopes: ['openid'],
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid OIDC configuration');
  });

  it('returns 200 on successful config update', async () => {
    const mockProvider = {
      getConfigSummary: jest.fn().mockReturnValue({
        tenantId: 'acme-corp',
        issuer: 'https://login.example.com',
      }),
    };
    mockRegisterProvider.mockResolvedValue(mockProvider);

    const res = await PUT(createPutRequest({
      tenantId: 'acme-corp',
      issuer: 'https://login.example.com',
      clientId: 'new-client-id',
      scopes: ['openid', 'profile', 'email'],
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.tenantId).toBe('acme-corp');
    expect(mockRemoveProvider).toHaveBeenCalledWith('acme-corp');
    expect(mockRegisterProvider).toHaveBeenCalled();
  });
});

describe('DELETE /api/auth/sso/oidc', () => {
  it('returns 400 when tenantId is missing', async () => {
    const res = await DELETE(createDeleteRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Tenant ID is required');
  });

  it('returns 404 when tenant config not found', async () => {
    mockRemoveProvider.mockReturnValue(false);

    const res = await DELETE(createDeleteRequest('?tenant=nonexistent'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('OIDC configuration not found');
  });

  it('returns 200 on successful removal', async () => {
    mockRemoveProvider.mockReturnValue(true);

    const res = await DELETE(createDeleteRequest('?tenant=acme-corp'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.tenantId).toBe('acme-corp');
    expect(body.message).toContain('removed successfully');
  });
});

describe('HEAD /api/auth/sso/oidc', () => {
  it('returns 200 with health status', async () => {
    mockGetConfiguredTenants.mockReturnValue(['acme-corp']);
    mockGetProvidersSummary.mockReturnValue({
      'acme-corp': { activeSessionsCount: 7 },
    });

    const res = await HEAD(createHeadRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.configuredTenants).toBe(1);
    expect(body.totalActiveSessions).toBe(7);
  });

  it('returns 500 on health check error', async () => {
    mockGetConfiguredTenants.mockImplementation(() => {
      throw new Error('Health check failure');
    });

    const res = await HEAD(createHeadRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('OIDC health check failed');
  });
});
