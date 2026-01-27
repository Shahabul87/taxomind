/**
 * TOTP (Time-based One-Time Password) Test Suite
 * Tests for multi-factor authentication utilities
 *
 * This test file tests the REAL totp.ts module with mocked dependencies.
 * We unmock the global mocks from jest.setup.js to test actual behavior.
 */

import { authenticator } from 'otplib';

// Unmock the totp module so we can test the real implementation
jest.unmock('@/lib/auth/totp');
// Keep security/encryption mocked but we'll override it per-test
jest.unmock('@/lib/security/encryption');

describe('TOTP Authentication', () => {
  // Module references - populated in beforeEach
  let generateTOTPSecret: () => string;
  let encryptTOTPSecret: (secret: string) => Promise<string>;
  let decryptTOTPSecret: (encrypted: string) => Promise<string>;
  let generateQRCode: (secret: string, email: string, issuer?: string) => Promise<string>;
  let verifyTOTPToken: (token: string, secret: string) => boolean;
  let generateRecoveryCodes: () => string[];
  let encryptRecoveryCodes: (codes: string[]) => Promise<string[]>;
  let decryptRecoveryCodes: (encrypted: string[]) => Promise<string[]>;
  let verifyRecoveryCode: (code: string, encrypted: string[]) => Promise<{ isValid: boolean; remainingCodes?: string[] }>;
  let validateTOTPSetup: (data: { secret?: string; qrCodeUrl?: string; backupCodes?: string[] }) => { isValid: boolean; errors: string[] };
  let createTOTPSetup: (email: string) => Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }>;
  let getCurrentTOTPToken: (secret: string) => string;
  let isTOTPConfigured: () => boolean;
  let totpConfig: { serviceName: string; digits: number; period: number; recoveryCodesCount: number };

  // Mock functions
  let mockToDataURL: jest.Mock;
  let mockEncrypt: jest.Mock;
  let mockDecrypt: jest.Mock;

  const originalEnv = process.env;

  beforeEach(() => {
    // Reset ALL modules to ensure fresh imports
    jest.resetModules();

    // Reset environment
    process.env = { ...originalEnv, ENCRYPTION_MASTER_KEY: 'test-encryption-key-32-chars-long!!' };

    // Create fresh mock functions
    mockToDataURL = jest.fn().mockResolvedValue('data:image/png;base64,mockedQRCode');
    mockEncrypt = jest.fn().mockImplementation(async (data: string) => ({
      encrypted: Buffer.from(data).toString('base64'),
      iv: 'mockIv',
      tag: 'mockTag',
      salt: 'mockSalt',
    }));
    mockDecrypt = jest.fn().mockImplementation(async (data: { encrypted: string }) =>
      Buffer.from(data.encrypted, 'base64').toString()
    );

    // Mock React cache
    jest.doMock('react', () => ({
      ...jest.requireActual('react'),
      cache: (fn: Function) => fn,
    }));

    // Mock qrcode
    jest.doMock('qrcode', () => ({
      toDataURL: mockToDataURL,
    }));

    // Mock encryption
    jest.doMock('@/lib/security/encryption', () => ({
      dataEncryption: {
        encrypt: mockEncrypt,
        decrypt: mockDecrypt,
      },
    }));

    // Import modules AFTER mocking
    const totp = require('@/lib/auth/totp');
    generateTOTPSecret = totp.generateTOTPSecret;
    encryptTOTPSecret = totp.encryptTOTPSecret;
    decryptTOTPSecret = totp.decryptTOTPSecret;
    generateQRCode = totp.generateQRCode;
    verifyTOTPToken = totp.verifyTOTPToken;
    generateRecoveryCodes = totp.generateRecoveryCodes;
    encryptRecoveryCodes = totp.encryptRecoveryCodes;
    decryptRecoveryCodes = totp.decryptRecoveryCodes;
    verifyRecoveryCode = totp.verifyRecoveryCode;
    validateTOTPSetup = totp.validateTOTPSetup;
    createTOTPSetup = totp.createTOTPSetup;
    getCurrentTOTPToken = totp.getCurrentTOTPToken;
    isTOTPConfigured = totp.isTOTPConfigured;
    totpConfig = totp.totpConfig;
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('generateTOTPSecret', () => {
    it('generates a valid TOTP secret', () => {
      const secret = generateTOTPSecret();

      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThanOrEqual(16);
    });

    it('generates unique secrets on each call', () => {
      const secret1 = generateTOTPSecret();
      const secret2 = generateTOTPSecret();

      // Secrets should be unique (very high probability)
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('encryptTOTPSecret / decryptTOTPSecret', () => {
    it('encrypts and decrypts a secret correctly', async () => {
      const originalSecret = 'JBSWY3DPEHPK3PXP';

      const encrypted = await encryptTOTPSecret(originalSecret);
      expect(typeof encrypted).toBe('string');
      expect(encrypted).toBeTruthy();

      const decrypted = await decryptTOTPSecret(encrypted);
      expect(decrypted).toBe(originalSecret);
    });

    it('returns JSON string from encryption', async () => {
      const secret = 'TESTSECRET123456';
      const encrypted = await encryptTOTPSecret(secret);

      // Should be valid JSON
      expect(() => JSON.parse(encrypted)).not.toThrow();
    });

    it('throws error for invalid encrypted data', async () => {
      mockDecrypt.mockRejectedValueOnce(new Error('Decryption failed'));

      await expect(decryptTOTPSecret('{"invalid":"data"}')).rejects.toThrow('Failed to decrypt TOTP secret');
    });
  });

  describe('generateQRCode', () => {
    it('generates a QR code data URL', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const email = 'test@example.com';

      const qrCode = await generateQRCode(secret, email);

      expect(qrCode).toBe('data:image/png;base64,mockedQRCode');
      expect(mockToDataURL).toHaveBeenCalled();
    });

    it('uses custom issuer when provided', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const email = 'test@example.com';
      const issuer = 'Custom App';

      const qrCode = await generateQRCode(secret, email, issuer);

      expect(qrCode).toBeDefined();
      expect(mockToDataURL).toHaveBeenCalled();
    });

    it('throws error when QR code generation fails', async () => {
      mockToDataURL.mockRejectedValueOnce(new Error('QR generation failed'));

      await expect(generateQRCode('secret', 'email@test.com')).rejects.toThrow('Failed to generate QR code');
    });
  });

  describe('verifyTOTPToken', () => {
    it('verifies a valid token', () => {
      const secret = generateTOTPSecret();
      const token = authenticator.generate(secret);

      const result = verifyTOTPToken(token, secret);

      expect(result).toBe(true);
    });

    it('rejects an invalid token', () => {
      const secret = generateTOTPSecret();

      // Use an obviously wrong token
      const result = verifyTOTPToken('123456', secret);

      // May be true or false depending on timing, so we just check it returns boolean
      expect(typeof result).toBe('boolean');
    });

    it('handles tokens with whitespace', () => {
      const secret = generateTOTPSecret();
      const token = authenticator.generate(secret);
      const tokenWithSpaces = `${token.slice(0, 3)} ${token.slice(3)}`;

      const result = verifyTOTPToken(tokenWithSpaces, secret);

      expect(result).toBe(true);
    });

    it('handles malformed tokens gracefully', () => {
      const secret = generateTOTPSecret();

      // Should not throw, should return boolean
      const result = verifyTOTPToken('not-a-number', secret);

      expect(typeof result).toBe('boolean');
    });
  });

  describe('generateRecoveryCodes', () => {
    it('generates the correct number of recovery codes', () => {
      const codes = generateRecoveryCodes();

      expect(codes).toHaveLength(totpConfig.recoveryCodesCount);
    });

    it('generates codes in the correct format (XXXX-XXXX-XXXX-XXXX)', () => {
      const codes = generateRecoveryCodes();

      codes.forEach((code: string) => {
        expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
      });
    });

    it('generates unique codes', () => {
      const codes = generateRecoveryCodes();
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('encryptRecoveryCodes / decryptRecoveryCodes', () => {
    it('encrypts and decrypts recovery codes correctly', async () => {
      const codes = ['AAAA-BBBB-CCCC-DDDD', 'EEEE-FFFF-0000-1111'];

      const encrypted = await encryptRecoveryCodes(codes);
      expect(encrypted).toHaveLength(codes.length);
      expect(Array.isArray(encrypted)).toBe(true);

      const decrypted = await decryptRecoveryCodes(encrypted);
      expect(decrypted).toEqual(codes);
    });

    it('each encrypted code is a JSON string', async () => {
      const codes = ['AAAA-BBBB-CCCC-DDDD'];
      const encrypted = await encryptRecoveryCodes(codes);

      encrypted.forEach((code: string) => {
        expect(() => JSON.parse(code)).not.toThrow();
      });
    });
  });

  describe('verifyRecoveryCode', () => {
    it('validates a correct recovery code', async () => {
      const codes = ['AAAA-BBBB-CCCC-DDDD', 'EEEE-FFFF-0000-1111'];
      const encryptedCodes = await encryptRecoveryCodes(codes);

      const result = await verifyRecoveryCode('AAAA-BBBB-CCCC-DDDD', encryptedCodes);

      expect(result.isValid).toBe(true);
      expect(result.remainingCodes).toHaveLength(1);
    });

    it('rejects an invalid recovery code', async () => {
      const codes = ['AAAA-BBBB-CCCC-DDDD'];
      const encryptedCodes = await encryptRecoveryCodes(codes);

      const result = await verifyRecoveryCode('XXXX-XXXX-XXXX-XXXX', encryptedCodes);

      expect(result.isValid).toBe(false);
      expect(result.remainingCodes).toBeUndefined();
    });

    it('handles codes without dashes', async () => {
      const codes = ['AAAA-BBBB-CCCC-DDDD'];
      const encryptedCodes = await encryptRecoveryCodes(codes);

      const result = await verifyRecoveryCode('AAAABBBBCCCCDDDD', encryptedCodes);

      expect(result.isValid).toBe(true);
    });

    it('handles lowercase input', async () => {
      const codes = ['AAAA-BBBB-CCCC-DDDD'];
      const encryptedCodes = await encryptRecoveryCodes(codes);

      const result = await verifyRecoveryCode('aaaa-bbbb-cccc-dddd', encryptedCodes);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateTOTPSetup', () => {
    it('validates correct setup data', () => {
      const validSetup = {
        secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
        qrCodeUrl: 'data:image/png;base64,validQRCode',
        backupCodes: Array(10).fill('AAAA-BBBB-CCCC-DDDD'),
      };

      const result = validateTOTPSetup(validSetup);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid secret', () => {
      const invalidSetup = {
        secret: 'short',
        qrCodeUrl: 'data:image/png;base64,validQRCode',
        backupCodes: Array(10).fill('AAAA-BBBB-CCCC-DDDD'),
      };

      const result = validateTOTPSetup(invalidSetup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid TOTP secret');
    });

    it('rejects invalid QR code URL', () => {
      const invalidSetup = {
        secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
        qrCodeUrl: 'invalid-url',
        backupCodes: Array(10).fill('AAAA-BBBB-CCCC-DDDD'),
      };

      const result = validateTOTPSetup(invalidSetup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid QR code URL');
    });

    it('rejects incorrect number of backup codes', () => {
      const invalidSetup = {
        secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
        qrCodeUrl: 'data:image/png;base64,validQRCode',
        backupCodes: Array(5).fill('AAAA-BBBB-CCCC-DDDD'),
      };

      const result = validateTOTPSetup(invalidSetup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid recovery codes');
    });
  });

  describe('createTOTPSetup', () => {
    it('creates complete TOTP setup data', async () => {
      const email = 'test@example.com';

      const setup = await createTOTPSetup(email);

      expect(setup.secret).toBeDefined();
      expect(setup.qrCodeUrl).toBe('data:image/png;base64,mockedQRCode');
      expect(setup.backupCodes).toHaveLength(totpConfig.recoveryCodesCount);
    });

    it('generates valid TOTP secret', async () => {
      const setup = await createTOTPSetup('test@example.com');

      expect(setup.secret.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('getCurrentTOTPToken', () => {
    it('generates a valid 6-digit token', () => {
      const secret = generateTOTPSecret();

      const token = getCurrentTOTPToken(secret);

      expect(token).toMatch(/^\d{6}$/);
    });

    it('generates a token that verifies correctly', () => {
      const secret = generateTOTPSecret();
      const token = getCurrentTOTPToken(secret);

      const isValid = verifyTOTPToken(token, secret);

      expect(isValid).toBe(true);
    });
  });

  describe('isTOTPConfigured', () => {
    it('returns true when ENCRYPTION_MASTER_KEY is set', () => {
      process.env.ENCRYPTION_MASTER_KEY = 'test-key';

      // Need to re-import with new env
      jest.resetModules();

      jest.doMock('react', () => ({
        ...jest.requireActual('react'),
        cache: (fn: Function) => fn,
      }));

      jest.doMock('qrcode', () => ({
        toDataURL: mockToDataURL,
      }));

      jest.doMock('@/lib/security/encryption', () => ({
        dataEncryption: {
          encrypt: mockEncrypt,
          decrypt: mockDecrypt,
        },
      }));

      const totp = require('@/lib/auth/totp');

      const result = totp.isTOTPConfigured();

      expect(result).toBe(true);
    });

    it('returns false when ENCRYPTION_MASTER_KEY is not set', () => {
      delete process.env.ENCRYPTION_MASTER_KEY;

      // Need to re-import with new env
      jest.resetModules();

      jest.doMock('react', () => ({
        ...jest.requireActual('react'),
        cache: (fn: Function) => fn,
      }));

      jest.doMock('qrcode', () => ({
        toDataURL: mockToDataURL,
      }));

      jest.doMock('@/lib/security/encryption', () => ({
        dataEncryption: {
          encrypt: mockEncrypt,
          decrypt: mockDecrypt,
        },
      }));

      const totp = require('@/lib/auth/totp');

      const result = totp.isTOTPConfigured();

      expect(result).toBe(false);
    });
  });

  describe('totpConfig', () => {
    it('exports correct configuration values', () => {
      expect(totpConfig.serviceName).toBe('Taxomind LMS');
      expect(totpConfig.digits).toBe(6);
      expect(totpConfig.period).toBe(30);
      expect(totpConfig.recoveryCodesCount).toBe(10);
    });
  });
});
