import { hashPassword, verifyPassword, needsRehashing, migratePassword } from '@/lib/passwordUtils';

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('passwordUtils (camelCase test path)', () => {
  it('hashes and verifies password with noble format', async () => {
    const password = 'AdminPassword!123';
    const hash = await hashPassword(password);

    expect(hash.startsWith('noble:')).toBe(true);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('reports rehash requirement correctly', () => {
    expect(needsRehashing('noble:c2FsdA==:aGFzaA==')).toBe(false);
    expect(needsRehashing('$2b$10$legacy.hash.value')).toBe(true);
  });

  it('migrates password into noble format', async () => {
    const migrated = await migratePassword('LegacyPassword#1');
    expect(migrated.startsWith('noble:')).toBe(true);
  });
});
