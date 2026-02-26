jest.mock('openid-client', () => ({}));

import { OIDCProvider, OIDCProviderManager } from '@/lib/auth/oidc-provider';
import { CryptoUtils } from '@/lib/security/crypto-utils';
import { logger } from '@/lib/logger';

describe('lib/auth/oidc-provider', () => {
  const validConfig = {
    tenantId: 'acme',
    issuer: 'https://idp.example.com',
    clientId: 'client-id',
    clientSecret: 'client-secret',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws for missing required config values', () => {
    expect(() => new OIDCProvider({ ...validConfig, tenantId: '' })).toThrow('OIDC Configuration Error');
    expect(() => new OIDCProvider({ ...validConfig, issuer: '' })).toThrow('OIDC Configuration Error');
    expect(() => new OIDCProvider({ ...validConfig, clientId: '' })).toThrow('OIDC Configuration Error');
  });

  it('applies default configuration values in summary', () => {
    const provider = new OIDCProvider(validConfig);
    const summary = provider.getConfigSummary();

    expect(summary.tenantId).toBe('acme');
    expect(summary.hasClientSecret).toBe(true);
    expect(summary.usePKCE).toBe(true);
    expect(summary.sessionTimeout).toBe(480);
    expect(summary.refreshTokens).toBe(true);
  });

  it('throws when generating auth URL before initialization', async () => {
    const provider = new OIDCProvider(validConfig);
    await expect(provider.generateAuthUrl()).rejects.toThrow('OIDC client not initialized');
  });

  it('generates auth URL with PKCE challenge by default', async () => {
    const provider = new OIDCProvider(validConfig);
    const client = {
      authorizationUrl: jest.fn().mockReturnValue('https://idp.example.com/authorize'),
    };
    (provider as any).client = client;

    jest.spyOn(CryptoUtils, 'generateSecureToken')
      .mockResolvedValueOnce('state-token')
      .mockResolvedValueOnce('nonce-token');
    jest.spyOn(CryptoUtils, 'generateSecureString').mockResolvedValue('verifier-value');
    jest.spyOn(CryptoUtils, 'createHash').mockReturnValue('ab'.repeat(32));

    const result = await provider.generateAuthUrl();

    expect(result).toEqual({
      authUrl: 'https://idp.example.com/authorize',
      state: 'state-token',
      nonce: 'nonce-token',
    });
    expect(client.authorizationUrl).toHaveBeenCalledWith(expect.objectContaining({
      state: 'state-token',
      nonce: 'nonce-token',
      code_challenge_method: 'S256',
    }));
    expect((provider as any).challenges.get('state-token')).toEqual(
      expect.objectContaining({ codeVerifier: 'verifier-value' })
    );
  });

  it('generates auth URL without PKCE when disabled', async () => {
    const provider = new OIDCProvider({ ...validConfig, usePKCE: false });
    const client = {
      authorizationUrl: jest.fn().mockReturnValue('https://idp.example.com/authorize'),
    };
    (provider as any).client = client;

    jest.spyOn(CryptoUtils, 'generateSecureToken')
      .mockResolvedValueOnce('state-no-pkce')
      .mockResolvedValueOnce('nonce-no-pkce');

    await provider.generateAuthUrl();

    expect(client.authorizationUrl).toHaveBeenCalledWith(
      expect.not.objectContaining({ code_challenge_method: 'S256' })
    );
  });

  it('fails callback when PKCE challenge is missing', async () => {
    const provider = new OIDCProvider(validConfig);
    (provider as any).client = {
      callback: jest.fn(),
      userinfo: jest.fn(),
    };

    await expect(provider.handleCallback('code', 'missing-state', 'nonce')).rejects.toThrow(
      'OIDC callback failed: PKCE challenge not found or expired'
    );
  });

  it('processes callback successfully and creates session', async () => {
    const provider = new OIDCProvider({
      ...validConfig,
      roleMapping: { admins: 'ADMIN' },
    });

    const tokenSet = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      id_token: 'id-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    const userInfo = {
      sub: 'user-1',
      email: 'admin@example.com',
      given_name: 'Ada',
      family_name: 'Lovelace',
      groups: ['admins'],
      roles: ['reader'],
    };
    const client = {
      callback: jest.fn().mockResolvedValue(tokenSet),
      userinfo: jest.fn().mockResolvedValue(userInfo),
    };
    (provider as any).client = client;
    (provider as any).challenges.set('state-ok', {
      codeVerifier: 'verifier',
      codeChallenge: 'challenge',
      codeChallengeMethod: 'S256',
    });

    jest.spyOn(CryptoUtils, 'generateSecureToken').mockResolvedValue('session-token');

    const user = await provider.handleCallback('code', 'state-ok', 'nonce');

    expect(user.id).toBe('user-1');
    expect(user.email).toBe('admin@example.com');
    expect(user.role).toBe('ADMIN');
    expect(user.sessionId).toBe('session-token');
    expect((provider as any).sessions.has('session-token')).toBe(true);
  });

  it('removes expired session during validation', async () => {
    const provider = new OIDCProvider(validConfig);
    (provider as any).sessions.set('expired-session', {
      sessionId: 'expired-session',
      userId: 'user-1',
      tenantId: 'acme',
      tokenSet: {},
      userInfo: {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() - 1000),
      lastActivity: new Date(),
    });

    const result = await provider.validateSession('expired-session');
    expect(result).toBeNull();
    expect((provider as any).sessions.has('expired-session')).toBe(false);
  });

  it('refreshes near-expiry tokens during session validation', async () => {
    const provider = new OIDCProvider(validConfig);
    (provider as any).client = {
      refresh: jest.fn().mockResolvedValue({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }),
    };
    (provider as any).sessions.set('session-1', {
      sessionId: 'session-1',
      userId: 'user-1',
      tenantId: 'acme',
      tokenSet: { expires_at: Math.floor(Date.now() / 1000) + 60 },
      userInfo: {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600_000),
      lastActivity: new Date(),
      refreshToken: 'refresh-1',
    });

    const session = await provider.validateSession('session-1');

    expect(session).not.toBeNull();
    expect(session?.tokenSet.access_token).toBe('new-access');
    expect(session?.refreshToken).toBe('new-refresh');
  });

  it('drops session when token refresh fails', async () => {
    const provider = new OIDCProvider(validConfig);
    (provider as any).client = {
      refresh: jest.fn().mockRejectedValue(new Error('refresh failed')),
    };
    (provider as any).sessions.set('session-2', {
      sessionId: 'session-2',
      userId: 'user-2',
      tenantId: 'acme',
      tokenSet: { expires_at: Math.floor(Date.now() / 1000) + 60 },
      userInfo: {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600_000),
      lastActivity: new Date(),
      refreshToken: 'refresh-2',
    });

    const result = await provider.validateSession('session-2');

    expect(result).toBeNull();
    expect((provider as any).sessions.has('session-2')).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns false when terminating unknown session', async () => {
    const provider = new OIDCProvider(validConfig);
    await expect(provider.terminateSession('missing')).resolves.toBe(false);
  });

  it('revokes access and refresh tokens when revocation endpoint is available', async () => {
    const provider = new OIDCProvider(validConfig);
    const client = {
      revoke: jest.fn().mockResolvedValue(undefined),
    };
    (provider as any).client = client;
    (provider as any).issuer = { revocation_endpoint: 'https://idp.example.com/revoke' };
    (provider as any).sessions.set('session-3', {
      sessionId: 'session-3',
      userId: 'user-3',
      tenantId: 'acme',
      tokenSet: { access_token: 'access-3' },
      userInfo: {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600_000),
      lastActivity: new Date(),
      refreshToken: 'refresh-3',
    });

    const removed = await provider.terminateSession('session-3');

    expect(removed).toBe(true);
    expect(client.revoke).toHaveBeenCalledWith('access-3');
    expect(client.revoke).toHaveBeenCalledWith('refresh-3');
  });

  it('returns null logout URL when end-session endpoint is unavailable', () => {
    const provider = new OIDCProvider(validConfig);
    (provider as any).client = {
      endSessionUrl: jest.fn(),
    };
    (provider as any).issuer = {};

    expect(provider.generateLogoutUrl('session-404')).toBeNull();
  });

  it('generates logout URL and triggers session termination', () => {
    const provider = new OIDCProvider(validConfig);
    const client = {
      endSessionUrl: jest.fn().mockReturnValue('https://idp.example.com/logout'),
    };
    (provider as any).client = client;
    (provider as any).issuer = { end_session_endpoint: 'https://idp.example.com/logout' };
    (provider as any).sessions.set('session-4', {
      sessionId: 'session-4',
      userId: 'user-4',
      tenantId: 'acme',
      tokenSet: { id_token: 'id-token-4' },
      userInfo: {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600_000),
      lastActivity: new Date(),
    });
    const terminateSpy = jest.spyOn(provider, 'terminateSession').mockResolvedValue(true);

    const logoutUrl = provider.generateLogoutUrl('session-4', 'https://app.example.com/post-logout');

    expect(logoutUrl).toBe('https://idp.example.com/logout');
    expect(client.endSessionUrl).toHaveBeenCalledWith(expect.objectContaining({
      id_token_hint: 'id-token-4',
      post_logout_redirect_uri: 'https://app.example.com/post-logout',
    }));
    expect(terminateSpy).toHaveBeenCalledWith('session-4');
  });

  it('wraps refresh token and validate token errors', async () => {
    const provider = new OIDCProvider(validConfig);

    await expect(provider.refreshToken('rt-1')).rejects.toThrow('OIDC client not initialized');
    await expect(provider.validateToken('token-1')).rejects.toThrow('OIDC client not initialized');

    (provider as any).client = {
      refresh: jest.fn().mockRejectedValue(new Error('refresh failure')),
      userinfo: jest.fn().mockRejectedValue(new Error('validation failure')),
    };

    await expect(provider.refreshToken('rt-2')).rejects.toThrow('Token refresh failed: refresh failure');
    await expect(provider.validateToken('token-2')).rejects.toThrow('Token validation failed: validation failure');
  });

  it('manager can register, read summary, and remove providers', async () => {
    const manager = new OIDCProviderManager();
    const initSpy = jest.spyOn(OIDCProvider.prototype, 'initialize').mockResolvedValue(undefined);

    const provider = await manager.registerProvider(validConfig);
    const fetched = manager.getProvider('acme');
    const tenants = manager.getConfiguredTenants();
    const summary = manager.getProvidersSummary();

    expect(provider).toBeInstanceOf(OIDCProvider);
    expect(fetched).not.toBeNull();
    expect(tenants).toContain('acme');
    expect(summary.acme.tenantId).toBe('acme');
    expect(manager.removeProvider('acme')).toBe(true);
    expect(manager.getProvider('acme')).toBeNull();

    initSpy.mockRestore();
  });
});
