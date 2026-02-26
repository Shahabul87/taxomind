import { CryptoUtils, CryptoHelpers } from '@/lib/security/crypto-utils';

describe('lib/security/crypto-utils', () => {
  it('generates secure token with expected hex length', async () => {
    const token = await CryptoUtils.generateSecureToken(16);
    expect(token).toMatch(/^[a-f0-9]+$/);
    expect(token).toHaveLength(32);
  });

  it('creates and verifies salted hashes', async () => {
    const { hash, salt } = await CryptoUtils.createSaltedHash('secret-password');

    expect(CryptoUtils.verifySaltedHash('secret-password', hash, salt)).toBe(true);
    expect(CryptoUtils.verifySaltedHash('wrong-password', hash, salt)).toBe(false);
  });

  it('creates and verifies HMAC signatures', async () => {
    const hmac = await CryptoUtils.createHMAC('payload', 'top-secret');

    const ok = await CryptoUtils.verifyHMAC('payload', hmac, 'top-secret');
    const bad = await CryptoUtils.verifyHMAC('payload', hmac, 'wrong-secret');

    expect(ok).toBe(true);
    expect(bad).toBe(false);
  });

  it('generates and validates session tokens', async () => {
    const { token } = await CryptoUtils.generateSessionToken('user-123', 60_000);
    const parsed = CryptoUtils.verifySessionToken(token);

    expect(parsed).not.toBeNull();
    expect(parsed?.userId).toBe('user-123');
    expect(parsed?.isValid).toBe(true);
  });

  it('generates and validates API keys', async () => {
    const apiKey = await CryptoUtils.generateAPIKey('tm');

    expect(apiKey.startsWith('tm_')).toBe(true);
    expect(CryptoUtils.validateAPIKey(apiKey, 'tm')).toBe(true);
    expect(CryptoUtils.validateAPIKey('tm_invalid_key', 'tm')).toBe(false);
  });

  it('supports helper password hashing and constant-time compare', async () => {
    const { hash, salt } = await CryptoHelpers.hashPassword('abc123');

    const ok = await CryptoHelpers.verifyPassword('abc123', hash, salt);
    const bad = await CryptoHelpers.verifyPassword('nope', hash, salt);

    expect(ok).toBe(true);
    expect(bad).toBe(false);
    expect(CryptoUtils.constantTimeStringCompare('same', 'same')).toBe(true);
    expect(CryptoUtils.constantTimeStringCompare('same', 'diff')).toBe(false);
  });
});
