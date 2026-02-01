import { 
  hashPassword, 
  verifyPassword, 
  needsRehashing, 
  migratePassword 
} from '@/lib/passwordUtils';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock @noble/hashes
jest.mock('@noble/hashes/scrypt', () => ({
  scrypt: jest.fn((password: string, salt: Uint8Array) => {
    // Return a deterministic hash based on full password content and salt
    // Use a simple but collision-resistant approach: hash the full password string
    const mockHash = new Uint8Array(32);
    // Seed from full password to avoid collisions between 'foo' and 'foobar'
    let seed = password.length * 31;
    for (let i = 0; i < password.length; i++) {
      seed = (seed * 37 + password.charCodeAt(i)) & 0xffffffff;
    }
    for (let i = 0; i < 32; i++) {
      seed = (seed * 1103515245 + 12345) & 0xffffffff;
      mockHash[i] = ((seed >>> 16) + (salt[i % salt.length] || 0)) & 0xff;
    }
    return mockHash;
  }),
}));

jest.mock('@noble/hashes/utils', () => ({
  randomBytes: jest.fn((length: number) => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }),
}));

describe('passwordUtils', () => {
  describe('hashPassword', () => {
    it('should hash a password using noble/hashes format', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      expect(hash).toMatch(/^noble:[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/);
      expect(hash.startsWith('noble:')).toBe(true);
      
      const parts = hash.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('noble');
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'samepassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(hash1.startsWith('noble:')).toBe(true);
      expect(hash2.startsWith('noble:')).toBe(true);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');
      expect(hash.startsWith('noble:')).toBe(true);
    });

    it('should handle long password', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await hashPassword(longPassword);
      expect(hash.startsWith('noble:')).toBe(true);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';
      const hash = await hashPassword(specialPassword);
      expect(hash.startsWith('noble:')).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password with noble hash', async () => {
      const password = 'correctpassword';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password with noble hash', async () => {
      const password = 'correctpassword';
      const wrongPassword = 'wrongpassword';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const password = '';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword('notempty', hash);
      expect(isInvalid).toBe(false);
    });

    it('should handle malformed noble hash', async () => {
      const password = 'testpassword';
      const malformedHash = 'noble:invalid';
      
      const isValid = await verifyPassword(password, malformedHash);
      expect(isValid).toBe(false);
    });

    it('should handle completely invalid hash format', async () => {
      const password = 'testpassword';
      const invalidHash = 'totally-invalid-hash';
      
      const isValid = await verifyPassword(password, invalidHash);
      expect(isValid).toBe(false);
    });

    it('should detect bcrypt format and handle appropriately', async () => {
      const password = 'testpassword';
      const bcryptHash = '$2b$10$example.bcrypt.hash.here';
      
      // In Edge Runtime, bcrypt should return false
      const isValid = await verifyPassword(password, bcryptHash);
      expect(isValid).toBe(false);
    });

    it('should handle various bcrypt format prefixes', async () => {
      const password = 'testpassword';
      
      const bcryptFormats = [
        '$2a$10$example.hash',
        '$2b$10$example.hash',
        '$2y$10$example.hash'
      ];

      for (const hash of bcryptFormats) {
        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(false); // Should return false in Edge Runtime
      }
    });

    it('should handle case sensitivity', async () => {
      const password = 'CaseSensitive';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword('CaseSensitive', hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword('casesensitive', hash);
      expect(isInvalid).toBe(false);
    });

    it('should handle unicode characters', async () => {
      const password = 'пароль123🔒';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword('пароль123🔒', hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword('пароль123', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('needsRehashing', () => {
    it('should return false for noble hash format', () => {
      const nobleHash = 'noble:c2FsdA==:aGFzaA==';
      expect(needsRehashing(nobleHash)).toBe(false);
    });

    it('should return true for bcrypt hash format', () => {
      const bcryptHash = '$2b$10$example.bcrypt.hash.here';
      expect(needsRehashing(bcryptHash)).toBe(true);
    });

    it('should return true for unknown hash format', () => {
      const unknownHash = 'some-other-format';
      expect(needsRehashing(unknownHash)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(needsRehashing('')).toBe(true);
    });

    it('should return true for null or undefined', () => {
      expect(needsRehashing(null as any)).toBe(true);
      expect(needsRehashing(undefined as any)).toBe(true);
    });
  });

  describe('migratePassword', () => {
    it('should migrate password to noble format', async () => {
      const password = 'oldpassword';
      const newHash = await migratePassword(password);
      
      expect(newHash.startsWith('noble:')).toBe(true);
      
      // Verify the migrated hash works
      const isValid = await verifyPassword(password, newHash);
      expect(isValid).toBe(true);
    });

    it('should handle empty password migration', async () => {
      const newHash = await migratePassword('');
      expect(newHash.startsWith('noble:')).toBe(true);
      
      const isValid = await verifyPassword('', newHash);
      expect(isValid).toBe(true);
    });

    it('should generate unique hashes on multiple migrations', async () => {
      const password = 'samepassword';
      const hash1 = await migratePassword(password);
      const hash2 = await migratePassword(password);
      
      expect(hash1).not.toBe(hash2);
      expect(hash1.startsWith('noble:')).toBe(true);
      expect(hash2.startsWith('noble:')).toBe(true);
      
      // Both should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('should complete full hash-verify cycle', async () => {
      const passwords = [
        'simple',
        'complex!@#123',
        'unicode🔒password',
        'very-long-password-with-many-characters-to-test-edge-cases',
        ''
      ];

      for (const password of passwords) {
        const hash = await hashPassword(password);
        
        expect(hash.startsWith('noble:')).toBe(true);
        expect(await verifyPassword(password, hash)).toBe(true);
        expect(await verifyPassword(password + 'wrong', hash)).toBe(false);
        expect(needsRehashing(hash)).toBe(false);
      }
    });

    it('should handle migration workflow', async () => {
      const password = 'migration-test';
      const bcryptHash = '$2b$10$fake.bcrypt.hash';
      
      // Old bcrypt hash needs rehashing
      expect(needsRehashing(bcryptHash)).toBe(true);
      
      // Migrate to new format
      const newHash = await migratePassword(password);
      expect(newHash.startsWith('noble:')).toBe(true);
      expect(needsRehashing(newHash)).toBe(false);
      
      // New hash should verify correctly
      expect(await verifyPassword(password, newHash)).toBe(true);
    });
  });
});