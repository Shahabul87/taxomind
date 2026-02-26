jest.mock('@/lib/auth/oidc-provider', () => ({
  oidcProviderManager: {
    getProvider: jest.fn(),
    registerProvider: jest.fn(),
    removeProvider: jest.fn(),
    getConfiguredTenants: jest.fn(),
    getProvidersSummary: jest.fn(),
  },
}));

import { DELETE, GET, POST } from '@/app/api/auth/sso/oidc/route';
import { NextRequest } from 'next/server';
import { oidcProviderManager } from '@/lib/auth/oidc-provider';

const mockGetProvider = oidcProviderManager.getProvider as jest.Mock;
const mockGetConfiguredTenants = oidcProviderManager.getConfiguredTenants as jest.Mock;
const mockGetProvidersSummary = oidcProviderManager.getProvidersSummary as jest.Mock;
const mockRemoveProvider = oidcProviderManager.removeProvider as jest.Mock;

describe('api/auth/sso/oidc route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST returns 400 when tenantId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/sso/oidc', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Tenant ID is required');
  });

  it('GET returns tenant summary when no tenant query provided', async () => {
    mockGetConfiguredTenants.mockReturnValue(['acme']);
    mockGetProvidersSummary.mockReturnValue({ acme: { activeSessionsCount: 2 } });

    const res = await GET(new NextRequest('http://localhost:3000/api/auth/sso/oidc'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.tenants).toEqual(['acme']);
  });

  it('DELETE returns 404 when tenant config is not found', async () => {
    mockRemoveProvider.mockReturnValue(false);

    const res = await DELETE(new NextRequest('http://localhost:3000/api/auth/sso/oidc?tenant=missing'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('OIDC configuration not found');
  });

  it('GET discovery returns 404 when provider missing', async () => {
    mockGetProvider.mockReturnValue(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/auth/sso/oidc?tenant=missing&action=discovery'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('OIDC configuration not found');
  });
});
