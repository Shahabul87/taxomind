import { DataEncryption, EncryptionUtils } from '@/lib/security/encryption';
import crypto from 'crypto';

describe('DataEncryption', () => {
  let encryption: DataEncryption;
  const testMasterKey = crypto.randomBytes(32).toString('hex');
  const originalEnvKey = process.env.ENCRYPTION_MASTER_KEY;

  beforeAll(() => {
    // Set test master key
    process.env.ENCRYPTION_MASTER_KEY = testMasterKey;
  });

  afterAll(() => {
    // Restore original environment
    if (originalEnvKey) {
      process.env.ENCRYPTION_MASTER_KEY = originalEnvKey;
    } else {
      delete process.env.ENCRYPTION_MASTER_KEY;
    }
  });

  beforeEach(() => {
    encryption = new DataEncryption();
  });

  describe('Initialization', () => {
    it('should initialize with master key from environment', () => {
      expect(() => new DataEncryption()).not.toThrow();
    });

    it('should initialize with provided master key', () => {
      const customKey = crypto.randomBytes(32).toString('hex');
      const customEncryption = new DataEncryption(customKey);
      expect(customEncryption).toBeDefined();
    });

    it('should throw error if no master key is available', () => {
      delete process.env.ENCRYPTION_MASTER_KEY;
      
      expect(() => new DataEncryption()).toThrow('ENCRYPTION_MASTER_KEY environment variable is required');
      
      // Restore for other tests
      process.env.ENCRYPTION_MASTER_KEY = testMasterKey;
    });

    it('should generate master key if none provided', () => {
      delete process.env.ENCRYPTION_MASTER_KEY;
      
      const generatedKeyEncryption = new DataEncryption('test-key');
      expect(generatedKeyEncryption).toBeDefined();
      
      // Restore for other tests
      process.env.ENCRYPTION_MASTER_KEY = testMasterKey;
    });
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt simple text', async () => {
      const plaintext = 'Hello, World! This is a test message.';
      
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt empty string', async () => {
      const plaintext = '';
      
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt special characters', async () => {
      const plaintext = '!@#$%^&*()_+{}|:"<>?[]\\;\',./ 中文 🚀 ñáéíóú';
      
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt long text', async () => {
      const plaintext = 'Lorem ipsum '.repeat(1000); // ~11KB text
      
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different encrypted output for same input', async () => {
      const plaintext = 'Same input text';
      
      const encrypted1 = await encryption.encrypt(plaintext);
      const encrypted2 = await encryption.encrypt(plaintext);
      
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });
  });

  describe('Encrypted Data Structure', () => {
    it('should return properly structured encrypted data', async () => {
      const plaintext = 'Test data structure';
      
      const encrypted = await encryption.encrypt(plaintext);
      
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(encrypted).toHaveProperty('salt');
      
      expect(typeof encrypted.encrypted).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.tag).toBe('string');
      expect(typeof encrypted.salt).toBe('string');
      
      // Verify hex strings have correct length
      expect(encrypted.iv).toMatch(/^[a-f0-9]{32}$/); // 16 bytes = 32 hex chars
      expect(encrypted.tag).toMatch(/^[a-f0-9]{32}$/); // 16 bytes = 32 hex chars
      expect(encrypted.salt).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
    });
  });

  describe('Object Encryption/Decryption', () => {
    it('should encrypt and decrypt simple objects', async () => {
      const obj = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        active: true
      };
      
      const encrypted = await encryption.encryptObject(obj);
      const decrypted = await encryption.decryptObject(encrypted);
      
      expect(decrypted).toEqual(obj);
    });

    it('should encrypt and decrypt complex objects', async () => {
      const obj = {
        user: {
          id: 'user-123',
          profile: {
            name: 'Jane Smith',
            settings: {
              theme: 'dark',
              notifications: true,
              preferences: ['email', 'sms']
            }
          }
        },
        metadata: {
          createdAt: '2024-01-01T00:00:00Z',
          version: 1.2,
          tags: ['important', 'confidential']
        }
      };
      
      const encrypted = await encryption.encryptObject(obj);
      const decrypted = await encryption.decryptObject(encrypted);
      
      expect(decrypted).toEqual(obj);
    });

    it('should encrypt and decrypt arrays', async () => {
      const arr = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];
      
      const encrypted = await encryption.encryptObject(arr);
      const decrypted = await encryption.decryptObject(encrypted);
      
      expect(decrypted).toEqual(arr);
    });
  });

  describe('Hash Functions', () => {
    it('should generate consistent hash for same input', () => {
      const plaintext = 'Consistent hash test';
      
      const hash1 = encryption.generateHash(plaintext);
      const hash2 = encryption.generateHash(plaintext);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 hex chars
    });

    it('should generate different hashes for different inputs', () => {
      const text1 = 'First text';
      const text2 = 'Second text';
      
      const hash1 = encryption.generateHash(text1);
      const hash2 = encryption.generateHash(text2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should verify hash correctly', () => {
      const plaintext = 'Hash verification test';
      const hash = encryption.generateHash(plaintext);
      
      expect(encryption.verifyHash(plaintext, hash)).toBe(true);
      expect(encryption.verifyHash('wrong text', hash)).toBe(false);
    });
  });

  describe('Key Rotation', () => {
    it('should rotate encryption key successfully', async () => {
      const plaintext = 'Key rotation test data';
      const newMasterKey = crypto.randomBytes(32).toString('hex');
      
      // Encrypt with original key
      const encrypted = await encryption.encrypt(plaintext);
      
      // Rotate key
      const rotated = await encryption.rotateKey(encrypted, newMasterKey);
      
      // Verify original key can't decrypt rotated data
      await expect(encryption.decrypt(rotated)).rejects.toThrow();
      
      // Verify new key can decrypt
      const newEncryption = new DataEncryption(newMasterKey);
      const decrypted = await newEncryption.decrypt(rotated);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Error Handling', () => {
    it('should handle decryption with wrong key', async () => {
      const plaintext = 'Wrong key test';
      const wrongKey = crypto.randomBytes(32).toString('hex');
      
      const encrypted = await encryption.encrypt(plaintext);
      const wrongEncryption = new DataEncryption(wrongKey);
      
      await expect(wrongEncryption.decrypt(encrypted)).rejects.toThrow('Decryption failed');
    });

    it('should handle corrupted encrypted data', async () => {
      const plaintext = 'Corruption test';
      const encrypted = await encryption.encrypt(plaintext);
      
      // Corrupt the encrypted data
      const corrupted = {
        ...encrypted,
        encrypted: 'corrupted_data'
      };
      
      await expect(encryption.decrypt(corrupted)).rejects.toThrow('Decryption failed');
    });

    it('should handle corrupted authentication tag', async () => {
      const plaintext = 'Auth tag corruption test';
      const encrypted = await encryption.encrypt(plaintext);
      
      // Corrupt the authentication tag
      const corrupted = {
        ...encrypted,
        tag: 'corrupted_tag_12345678901234567890123456789012'
      };
      
      await expect(encryption.decrypt(corrupted)).rejects.toThrow('Decryption failed');
    });

    it('should handle invalid hex strings', async () => {
      const plaintext = 'Invalid hex test';
      const encrypted = await encryption.encrypt(plaintext);
      
      // Use invalid hex string
      const invalidHex = {
        ...encrypted,
        iv: 'invalid_hex_string'
      };
      
      await expect(encryption.decrypt(invalidHex)).rejects.toThrow('Decryption failed');
    });
  });

  describe('Performance', () => {
    it('should encrypt/decrypt within reasonable time', async () => {
      const plaintext = 'Performance test data';
      
      const startTime = Date.now();
      const encrypted = await encryption.encrypt(plaintext);
      const encryptTime = Date.now() - startTime;
      
      const decryptStart = Date.now();
      const decrypted = await encryption.decrypt(encrypted);
      const decryptTime = Date.now() - decryptStart;
      
      expect(encryptTime).toBeLessThan(100); // Should complete within 100ms
      expect(decryptTime).toBeLessThan(100); // Should complete within 100ms
      expect(decrypted).toBe(plaintext);
    });

    it('should handle large data efficiently', async () => {
      const largeData = 'Large data test '.repeat(10000); // ~150KB
      
      const startTime = Date.now();
      const encrypted = await encryption.encrypt(largeData);
      const decrypted = await encryption.decrypt(encrypted);
      const totalTime = Date.now() - startTime;
      
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(decrypted).toBe(largeData);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent encryption operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => 
        encryption.encrypt(`Concurrent test ${i}`)
      );
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.encrypted).toBeDefined();
        expect(result.iv).toBeDefined();
        expect(result.tag).toBeDefined();
        expect(result.salt).toBeDefined();
      });
    });

    it('should handle concurrent decryption operations', async () => {
      const testData = Array.from({ length: 10 }, (_, i) => `Decrypt test ${i}`);
      
      // First encrypt all data
      const encrypted = await Promise.all(
        testData.map(data => encryption.encrypt(data))
      );
      
      // Then decrypt all concurrently
      const decrypted = await Promise.all(
        encrypted.map(enc => encryption.decrypt(enc))
      );
      
      expect(decrypted).toEqual(testData);
    });
  });
});

describe('EncryptionUtils', () => {
  const originalEnvKey = process.env.ENCRYPTION_MASTER_KEY;
  const testMasterKey = crypto.randomBytes(32).toString('hex');

  beforeAll(() => {
    process.env.ENCRYPTION_MASTER_KEY = testMasterKey;
  });

  afterAll(() => {
    if (originalEnvKey) {
      process.env.ENCRYPTION_MASTER_KEY = originalEnvKey;
    } else {
      delete process.env.ENCRYPTION_MASTER_KEY;
    }
  });

  describe('User Data Encryption', () => {
    it('should encrypt and decrypt user data', async () => {
      const userData = {
        ssn: '123-45-6789',
        creditCard: '4532-1234-5678-9012',
        personalInfo: {
          fullName: 'John Doe',
          address: '123 Main St, City, State 12345',
          phone: '+1-555-123-4567'
        }
      };
      
      const encrypted = await EncryptionUtils.encryptUserData(userData);
      const decrypted = await EncryptionUtils.decryptUserData(encrypted);
      
      expect(decrypted).toEqual(userData);
    });
  });

  describe('PII Encryption', () => {
    it('should encrypt and decrypt PII strings', async () => {
      const pii = 'Social Security Number: 123-45-6789';
      
      const encrypted = await EncryptionUtils.encryptPII(pii);
      const decrypted = await EncryptionUtils.decryptPII(encrypted);
      
      expect(decrypted).toBe(pii);
    });
  });

  describe('Configuration Validation', () => {
    it('should check if encryption is configured', () => {
      expect(EncryptionUtils.isConfigured()).toBe(true);
    });

    it('should validate configuration correctly', () => {
      const validation = EncryptionUtils.validateConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing master key', () => {
      delete process.env.ENCRYPTION_MASTER_KEY;
      
      const configured = EncryptionUtils.isConfigured();
      const validation = EncryptionUtils.validateConfig();
      
      expect(configured).toBe(false);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ENCRYPTION_MASTER_KEY environment variable is required');
      
      // Restore for other tests
      process.env.ENCRYPTION_MASTER_KEY = testMasterKey;
    });

    it('should detect short master key', () => {
      process.env.ENCRYPTION_MASTER_KEY = 'short_key';
      
      const validation = EncryptionUtils.validateConfig();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ENCRYPTION_MASTER_KEY must be at least 32 characters long');
      
      // Restore for other tests
      process.env.ENCRYPTION_MASTER_KEY = testMasterKey;
    });
  });
});

describe('Security Properties', () => {
  let encryption: DataEncryption;
  const testMasterKey = crypto.randomBytes(32).toString('hex');

  beforeAll(() => {
    process.env.ENCRYPTION_MASTER_KEY = testMasterKey;
    encryption = new DataEncryption();
  });

  describe('Cryptographic Security', () => {
    it('should use different IV for each encryption', async () => {
      const plaintext = 'IV uniqueness test';
      const encryptions = await Promise.all([
        encryption.encrypt(plaintext),
        encryption.encrypt(plaintext),
        encryption.encrypt(plaintext)
      ]);
      
      const ivs = encryptions.map(enc => enc.iv);
      const uniqueIvs = [...new Set(ivs)];
      
      expect(uniqueIvs).toHaveLength(3);
    });

    it('should use different salt for each encryption', async () => {
      const plaintext = 'Salt uniqueness test';
      const encryptions = await Promise.all([
        encryption.encrypt(plaintext),
        encryption.encrypt(plaintext),
        encryption.encrypt(plaintext)
      ]);
      
      const salts = encryptions.map(enc => enc.salt);
      const uniqueSalts = [...new Set(salts)];
      
      expect(uniqueSalts).toHaveLength(3);
    });

    it('should provide authenticated encryption', async () => {
      const plaintext = 'Authentication test';
      const encrypted = await encryption.encrypt(plaintext);
      
      // Tampering with encrypted data should fail authentication
      const tampered = {
        ...encrypted,
        encrypted: encrypted.encrypted.slice(0, -2) + 'XX'
      };
      
      await expect(encryption.decrypt(tampered)).rejects.toThrow();
    });

    it('should use timing-safe comparison for hash verification', () => {
      const plaintext = 'Timing attack test';
      const correctHash = encryption.generateHash(plaintext);
      const wrongHash = '0'.repeat(64);
      
      // Both operations should take similar time (timing-safe)
      const start1 = process.hrtime.bigint();
      const result1 = encryption.verifyHash(plaintext, correctHash);
      const time1 = process.hrtime.bigint() - start1;
      
      const start2 = process.hrtime.bigint();
      const result2 = encryption.verifyHash(plaintext, wrongHash);
      const time2 = process.hrtime.bigint() - start2;
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
      
      // Time difference should be minimal (within 1ms)
      const timeDiff = Number(time1 - time2) / 1000000; // Convert to ms
      expect(Math.abs(timeDiff)).toBeLessThan(1);
    });
  });

  describe('Key Derivation', () => {
    it('should derive different keys from different salts', async () => {
      const plaintext = 'Key derivation test';
      
      // Encrypt the same data multiple times
      const encryptions = await Promise.all([
        encryption.encrypt(plaintext),
        encryption.encrypt(plaintext)
      ]);
      
      // Even with the same plaintext, different salts should produce different results
      expect(encryptions[0].encrypted).not.toBe(encryptions[1].encrypted);
      expect(encryptions[0].salt).not.toBe(encryptions[1].salt);
      
      // But both should decrypt to the same plaintext
      const decrypted = await Promise.all([
        encryption.decrypt(encryptions[0]),
        encryption.decrypt(encryptions[1])
      ]);
      
      expect(decrypted[0]).toBe(plaintext);
      expect(decrypted[1]).toBe(plaintext);
    });
  });
});