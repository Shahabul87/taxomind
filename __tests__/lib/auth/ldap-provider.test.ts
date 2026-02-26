import { LDAPProvider, LDAPProviderManager } from '@/lib/auth/ldap-provider';

describe('lib/auth/ldap-provider', () => {
  const validConfig = {
    tenantId: 'acme',
    url: 'ldaps://ldap.example.com:636',
    baseDN: 'DC=example,DC=com',
    userSearchBase: 'OU=Users,DC=example,DC=com',
  };

  it('throws for missing required config', () => {
    expect(() => new LDAPProvider({ ...validConfig, tenantId: '' })).toThrow('LDAP Configuration Error');
    expect(() => new LDAPProvider({ ...validConfig, url: '' })).toThrow('LDAP Configuration Error');
  });

  it('applies default settings in config summary', () => {
    const provider = new LDAPProvider(validConfig);
    const summary = provider.getConfigSummary();

    expect(summary.tenantId).toBe('acme');
    expect(summary.cacheEnabled).toBe(true);
    expect(summary.sessionTimeout).toBe(480);
    expect(summary.hasBindCredentials).toBe(false);
  });

  it('manager can register/get/remove providers', async () => {
    const manager = new LDAPProviderManager();
    const initSpy = jest.spyOn(LDAPProvider.prototype, 'initialize').mockResolvedValue(undefined);
    const disconnectSpy = jest.spyOn(LDAPProvider.prototype, 'disconnect').mockResolvedValue(undefined);

    await manager.registerProvider(validConfig);
    expect(manager.getProvider('acme')).not.toBeNull();
    expect(manager.getConfiguredTenants()).toContain('acme');

    const removed = await manager.removeProvider('acme');
    expect(removed).toBe(true);
    expect(disconnectSpy).toHaveBeenCalled();
    expect(manager.getProvider('acme')).toBeNull();

    initSpy.mockRestore();
    disconnectSpy.mockRestore();
  });

  it('manager can test all connections and summarize providers', async () => {
    const manager = new LDAPProviderManager();
    jest.spyOn(LDAPProvider.prototype, 'initialize').mockResolvedValue(undefined);
    jest.spyOn(LDAPProvider.prototype, 'testConnection').mockResolvedValue({ success: true, message: 'ok' });

    await manager.registerProvider(validConfig);

    const summary = manager.getProvidersSummary();
    const tests = await manager.testAllConnections();

    expect(summary.acme.tenantId).toBe('acme');
    expect(tests.acme.success).toBe(true);
  });
});
