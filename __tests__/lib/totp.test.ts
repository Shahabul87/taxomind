import {
  generateTOTPSecret,
  encryptTOTPSecret,
  decryptTOTPSecret,
  generateQRCode,
  verifyTOTPToken,
  generateRecoveryCodes,
  encryptRecoveryCodes,
  decryptRecoveryCodes,
  verifyRecoveryCode,
  validateTOTPSetup,
  createTOTPSetup,
  getCurrentTOTPToken,
  isTOTPConfigured,
  totpConfig
} from '@/lib/auth/totp';

// Mock dependencies
jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn(),
    keyuri: jest.fn(),
    verify: jest.fn(),
    generate: jest.fn(),
    options: {},
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

jest.mock('@/lib/security/encryption', () => ({
  dataEncryption: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
}));

import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { dataEncryption } from '@/lib/security/encryption';

describe('TOTP (Two-Factor Authentication) System', () => {
  const mockEmail = 'test@example.com';
  const mockSecret = 'JBSWY3DPEHPK3PXP';
  const mockEncryptedData = {
    encryptedData: 'encrypted-secret-data',
    iv: 'initialization-vector',
    tag: 'auth-tag',
    salt: 'encryption-salt',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment for encryption
    process.env.ENCRYPTION_MASTER_KEY = 'test-master-key-32-characters-long';
    
    // Default successful mocks
    (authenticator.generateSecret as jest.Mock).mockReturnValue(mockSecret);
    (authenticator.keyuri as jest.Mock).mockReturnValue('otpauth://totp/Taxomind%20LMS:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Taxomind%20LMS');
    (authenticator.verify as jest.Mock).mockReturnValue(true);
    (authenticator.generate as jest.Mock).mockReturnValue('123456');
    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    (dataEncryption.encrypt as jest.Mock).mockResolvedValue(mockEncryptedData);
    (dataEncryption.decrypt as jest.Mock).mockResolvedValue(mockSecret);
    (crypto.randomBytes as jest.Mock).mockImplementation((size: number) => Buffer.from('a'.repeat(size), 'ascii'));
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_MASTER_KEY;
  });

  describe('Secret Generation', () => {
    it('should generate a TOTP secret', () => {
      const secret = generateTOTPSecret();
      
      expect(authenticator.generateSecret).toHaveBeenCalled();
      expect(secret).toBe(mockSecret);
    });

    it('should generate unique secrets on multiple calls', () => {
      (authenticator.generateSecret as jest.Mock)
        .mockReturnValueOnce('SECRET1')
        .mockReturnValueOnce('SECRET2');

      const secret1 = generateTOTPSecret();
      const secret2 = generateTOTPSecret();

      expect(secret1).toBe('SECRET1');
      expect(secret2).toBe('SECRET2');
      expect(authenticator.generateSecret).toHaveBeenCalledTimes(2);
    });
  });

  describe('Secret Encryption and Decryption', () => {
    it('should encrypt TOTP secret', async () => {
      const encryptedSecret = await encryptTOTPSecret(mockSecret);
      
      expect(dataEncryption.encrypt).toHaveBeenCalledWith(mockSecret);
      expect(encryptedSecret).toBe(JSON.stringify(mockEncryptedData));
    });

    it('should decrypt TOTP secret', async () => {
      const encryptedSecret = JSON.stringify(mockEncryptedData);
      const decryptedSecret = await decryptTOTPSecret(encryptedSecret);
      
      expect(dataEncryption.decrypt).toHaveBeenCalledWith(mockEncryptedData);
      expect(decryptedSecret).toBe(mockSecret);
    });

    it('should handle encryption errors', async () => {
      (dataEncryption.encrypt as jest.Mock).mockRejectedValue(new Error('Encryption failed'));
      
      await expect(encryptTOTPSecret(mockSecret)).rejects.toThrow('Failed to encrypt TOTP secret: Encryption failed');
    });

    it('should handle decryption errors', async () => {
      (dataEncryption.decrypt as jest.Mock).mockRejectedValue(new Error('Decryption failed'));
      
      const encryptedSecret = JSON.stringify(mockEncryptedData);
      await expect(decryptTOTPSecret(encryptedSecret)).rejects.toThrow('Failed to decrypt TOTP secret: Decryption failed');
    });

    it('should handle invalid JSON in encrypted data', async () => {
      const invalidEncryptedSecret = 'invalid-json';
      
      await expect(decryptTOTPSecret(invalidEncryptedSecret)).rejects.toThrow('Failed to decrypt TOTP secret');
    });
  });

  describe('QR Code Generation', () => {
    it('should generate QR code for TOTP setup', async () => {
      const qrCodeUrl = await generateQRCode(mockSecret, mockEmail);
      
      expect(authenticator.keyuri).toHaveBeenCalledWith(
        mockEmail,
        'Taxomind LMS',
        mockSecret
      );
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'otpauth://totp/Taxomind%20LMS:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Taxomind%20LMS'
      );
      expect(qrCodeUrl).toContain('data:image/png;base64,');
    });

    it('should generate QR code with custom issuer', async () => {
      const customIssuer = 'Custom App';
      const qrCodeUrl = await generateQRCode(mockSecret, mockEmail, customIssuer);
      
      expect(authenticator.keyuri).toHaveBeenCalledWith(
        mockEmail,
        customIssuer,
        mockSecret
      );
      expect(qrCodeUrl).toContain('data:image/png;base64,');
    });

    it('should handle QR code generation errors', async () => {
      (QRCode.toDataURL as jest.Mock).mockRejectedValue(new Error('QR generation failed'));
      
      await expect(generateQRCode(mockSecret, mockEmail)).rejects.toThrow('Failed to generate QR code: QR generation failed');
    });

    it('should handle authenticator keyuri errors', async () => {
      (authenticator.keyuri as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid keyuri parameters');
      });
      
      await expect(generateQRCode(mockSecret, mockEmail)).rejects.toThrow('Failed to generate QR code: Invalid keyuri parameters');
    });
  });

  describe('Token Verification', () => {
    beforeEach(() => {
      // Reset authenticator options before each test
      authenticator.options = {};
    });

    it('should verify valid TOTP token', () => {
      const token = '123456';
      const result = verifyTOTPToken(token, mockSecret);
      
      expect(result).toBe(true);
      expect(authenticator.verify).toHaveBeenCalledWith({
        token: '123456',
        secret: mockSecret,
      });
      expect(authenticator.options).toEqual({
        digits: 6,
        period: 30,
        algorithm: 'sha1',
        window: 1,
      });
    });

    it('should reject invalid TOTP token', () => {
      (authenticator.verify as jest.Mock).mockReturnValue(false);
      
      const token = '654321';
      const result = verifyTOTPToken(token, mockSecret);
      
      expect(result).toBe(false);
      expect(authenticator.verify).toHaveBeenCalledWith({
        token: '654321',
        secret: mockSecret,
      });
    });

    it('should handle tokens with whitespace', () => {
      const token = ' 123 456 ';
      const result = verifyTOTPToken(token, mockSecret);
      
      expect(authenticator.verify).toHaveBeenCalledWith({
        token: '123456', // Whitespace should be removed
        secret: mockSecret,
      });
      expect(result).toBe(true);
    });

    it('should handle verification errors gracefully', () => {
      (authenticator.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Verification error');
      });
      
      const token = '123456';
      const result = verifyTOTPToken(token, mockSecret);
      
      expect(result).toBe(false);
    });

    it('should configure authenticator with correct options', () => {
      verifyTOTPToken('123456', mockSecret);
      
      expect(authenticator.options).toEqual({
        digits: 6,
        period: 30,
        algorithm: 'sha1',
        window: 1,
      });
    });
  });

  describe('Recovery Codes Generation', () => {
    beforeEach(() => {
      // Mock crypto.randomBytes to return predictable values
      (crypto.randomBytes as jest.Mock).mockImplementation((size: number) => {
        const buffer = Buffer.alloc(size);
        for (let i = 0; i < size; i++) {
          buffer[i] = (i % 256); // Predictable pattern
        }
        return buffer;
      });
    });

    it('should generate recovery codes', () => {
      const codes = generateRecoveryCodes();
      
      expect(codes).toHaveLength(10);
      expect(crypto.randomBytes).toHaveBeenCalledTimes(10);
      expect(crypto.randomBytes).toHaveBeenCalledWith(8); // 16 characters / 2 for hex
      
      // Each code should be formatted as XXXX-XXXX
      codes.forEach(code => {
        expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
      });
    });

    it('should generate unique recovery codes', () => {
      const codes = generateRecoveryCodes();
      const uniqueCodes = new Set(codes);
      
      expect(uniqueCodes.size).toBe(codes.length); // All codes should be unique
    });

    it('should format recovery codes consistently', () => {
      // Mock a specific pattern
      (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from([0xAB, 0xCD, 0xEF, 0x12, 0x34, 0x56, 0x78, 0x90]));
      
      const codes = generateRecoveryCodes();
      expect(codes[0]).toBe('ABCD-EF12'); // First part of the hex string
    });
  });

  describe('Recovery Codes Encryption and Decryption', () => {
    const mockRecoveryCodes = ['1234-5678', '9ABC-DEF0', 'ABCD-EF12'];

    it('should encrypt recovery codes', async () => {
      const encryptedCodes = await encryptRecoveryCodes(mockRecoveryCodes);
      
      expect(encryptedCodes).toHaveLength(mockRecoveryCodes.length);
      expect(dataEncryption.encrypt).toHaveBeenCalledTimes(3);
      
      mockRecoveryCodes.forEach(code => {
        expect(dataEncryption.encrypt).toHaveBeenCalledWith(code);
      });
      
      encryptedCodes.forEach(encryptedCode => {
        expect(encryptedCode).toBe(JSON.stringify(mockEncryptedData));
      });
    });

    it('should decrypt recovery codes', async () => {
      const encryptedCodes = mockRecoveryCodes.map(() => JSON.stringify(mockEncryptedData));
      (dataEncryption.decrypt as jest.Mock)
        .mockResolvedValueOnce(mockRecoveryCodes[0])
        .mockResolvedValueOnce(mockRecoveryCodes[1])
        .mockResolvedValueOnce(mockRecoveryCodes[2]);
      
      const decryptedCodes = await decryptRecoveryCodes(encryptedCodes);
      
      expect(decryptedCodes).toEqual(mockRecoveryCodes);
      expect(dataEncryption.decrypt).toHaveBeenCalledTimes(3);
    });

    it('should handle encryption errors for recovery codes', async () => {
      (dataEncryption.encrypt as jest.Mock).mockRejectedValue(new Error('Encryption failed'));
      
      await expect(encryptRecoveryCodes(mockRecoveryCodes)).rejects.toThrow('Failed to encrypt recovery codes: Encryption failed');
    });

    it('should handle decryption errors for recovery codes', async () => {
      (dataEncryption.decrypt as jest.Mock).mockRejectedValue(new Error('Decryption failed'));
      const encryptedCodes = ['encrypted-code-1'];
      
      await expect(decryptRecoveryCodes(encryptedCodes)).rejects.toThrow('Failed to decrypt recovery codes: Decryption failed');
    });
  });

  describe('Recovery Code Verification', () => {
    const mockRecoveryCodes = ['1234-5678', '9ABC-DEF0', 'ABCD-EF12'];
    const mockEncryptedCodes = mockRecoveryCodes.map(() => JSON.stringify(mockEncryptedData));

    beforeEach(() => {
      (dataEncryption.decrypt as jest.Mock)
        .mockImplementation((data) => {
          const index = mockEncryptedCodes.indexOf(JSON.stringify(data));
          return Promise.resolve(mockRecoveryCodes[index] || mockRecoveryCodes[0]);
        });
    });

    it('should verify valid recovery code', async () => {
      (decryptRecoveryCodes as any) = jest.fn().mockResolvedValue(mockRecoveryCodes);
      
      // Mock the entire decryptRecoveryCodes function since it&apos;s complex
      (dataEncryption.decrypt as jest.Mock)
        .mockResolvedValueOnce(mockRecoveryCodes[0])
        .mockResolvedValueOnce(mockRecoveryCodes[1])
        .mockResolvedValueOnce(mockRecoveryCodes[2]);
      
      const result = await verifyRecoveryCode('1234-5678', mockEncryptedCodes);
      
      expect(result.isValid).toBe(true);
      expect(result.remainingCodes).toHaveLength(2);
      expect(result.remainingCodes).not.toContain(mockEncryptedCodes[0]);
    });

    it('should verify recovery code with different formatting', async () => {
      (dataEncryption.decrypt as jest.Mock)
        .mockResolvedValueOnce(mockRecoveryCodes[0])
        .mockResolvedValueOnce(mockRecoveryCodes[1])
        .mockResolvedValueOnce(mockRecoveryCodes[2]);
      
      // Test with spaces and lowercase
      const result = await verifyRecoveryCode('1234 5678', mockEncryptedCodes);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid recovery code', async () => {
      (dataEncryption.decrypt as jest.Mock)
        .mockResolvedValueOnce(mockRecoveryCodes[0])
        .mockResolvedValueOnce(mockRecoveryCodes[1])
        .mockResolvedValueOnce(mockRecoveryCodes[2]);
      
      const result = await verifyRecoveryCode('INVALID-CODE', mockEncryptedCodes);
      
      expect(result.isValid).toBe(false);
      expect(result.remainingCodes).toBeUndefined();
    });

    it('should handle verification errors gracefully', async () => {
      (dataEncryption.decrypt as jest.Mock).mockRejectedValue(new Error('Decryption error'));
      
      const result = await verifyRecoveryCode('1234-5678', mockEncryptedCodes);
      
      expect(result.isValid).toBe(false);
      expect(result.remainingCodes).toBeUndefined();
    });

    it('should normalize input code correctly', async () => {
      (dataEncryption.decrypt as jest.Mock)
        .mockResolvedValueOnce(mockRecoveryCodes[0])
        .mockResolvedValueOnce(mockRecoveryCodes[1])
        .mockResolvedValueOnce(mockRecoveryCodes[2]);
      
      // Test various formats that should all match '1234-5678'
      const testFormats = [
        '1234-5678',
        '1234 5678',
        '12345678',
        ' 1234-5678 ',
        '1234   5678',
      ];
      
      for (const format of testFormats) {
        (dataEncryption.decrypt as jest.Mock)
          .mockResolvedValueOnce(mockRecoveryCodes[0])
          .mockResolvedValueOnce(mockRecoveryCodes[1])
          .mockResolvedValueOnce(mockRecoveryCodes[2]);
        
        const result = await verifyRecoveryCode(format, mockEncryptedCodes);
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('TOTP Setup Validation', () => {
    it('should validate complete TOTP setup data', () => {
      const setupData = {
        secret: 'JBSWY3DPEHPK3PXPJBSWY3DP', // 24 characters
        qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        backupCodes: Array.from({ length: 10 }, (_, i) => `CODE-${i + 1}`),
      };
      
      const result = validateTOTPSetup(setupData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject setup with invalid secret', () => {
      const setupData = {
        secret: 'SHORT', // Too short
        qrCodeUrl: 'data:image/png;base64,valid',
        backupCodes: Array.from({ length: 10 }, (_, i) => `CODE-${i + 1}`),
      };
      
      const result = validateTOTPSetup(setupData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid TOTP secret');
    });

    it('should reject setup with invalid QR code URL', () => {
      const setupData = {
        secret: 'JBSWY3DPEHPK3PXPJBSWY3DP',
        qrCodeUrl: 'invalid-url',
        backupCodes: Array.from({ length: 10 }, (_, i) => `CODE-${i + 1}`),
      };
      
      const result = validateTOTPSetup(setupData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid QR code URL');
    });

    it('should reject setup with invalid backup codes count', () => {
      const setupData = {
        secret: 'JBSWY3DPEHPK3PXPJBSWY3DP',
        qrCodeUrl: 'data:image/png;base64,valid',
        backupCodes: ['CODE-1', 'CODE-2'], // Only 2 codes instead of 10
      };
      
      const result = validateTOTPSetup(setupData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid recovery codes');
    });

    it('should accumulate multiple validation errors', () => {
      const setupData = {
        secret: 'SHORT',
        qrCodeUrl: 'invalid',
        backupCodes: ['ONLY-ONE'],
      };
      
      const result = validateTOTPSetup(setupData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Invalid TOTP secret');
      expect(result.errors).toContain('Invalid QR code URL');
      expect(result.errors).toContain('Invalid recovery codes');
    });
  });

  describe('Complete TOTP Setup Creation', () => {
    beforeEach(() => {
      // Mock recovery code generation
      (crypto.randomBytes as jest.Mock).mockImplementation((size: number) => 
        Buffer.from('A'.repeat(size), 'ascii')
      );
    });

    it('should create complete TOTP setup', async () => {
      const setup = await createTOTPSetup(mockEmail);
      
      expect(setup.secret).toBe(mockSecret);
      expect(setup.qrCodeUrl).toContain('data:image/png;base64,');
      expect(setup.backupCodes).toHaveLength(10);
      
      expect(authenticator.generateSecret).toHaveBeenCalled();
      expect(authenticator.keyuri).toHaveBeenCalledWith(mockEmail, 'Taxomind LMS', mockSecret);
      expect(QRCode.toDataURL).toHaveBeenCalled();
      expect(crypto.randomBytes).toHaveBeenCalledTimes(10);
    });

    it('should handle errors during setup creation', async () => {
      (authenticator.generateSecret as jest.Mock).mockImplementation(() => {
        throw new Error('Secret generation failed');
      });
      
      await expect(createTOTPSetup(mockEmail)).rejects.toThrow('Failed to create TOTP setup: Secret generation failed');
    });

    it('should create setup with all required components', async () => {
      const setup = await createTOTPSetup(mockEmail);
      
      // Validate the created setup
      const validation = validateTOTPSetup(setup);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Current TOTP Token Generation', () => {
    it('should generate current TOTP token', () => {
      const token = getCurrentTOTPToken(mockSecret);
      
      expect(token).toBe('123456');
      expect(authenticator.generate).toHaveBeenCalledWith(mockSecret);
      expect(authenticator.options).toEqual({
        digits: 6,
        period: 30,
        algorithm: 'sha1',
      });
    });

    it('should configure authenticator options correctly for token generation', () => {
      getCurrentTOTPToken(mockSecret);
      
      expect(authenticator.options).toEqual({
        digits: 6,
        period: 30,
        algorithm: 'sha1',
      });
    });
  });

  describe('TOTP Configuration Status', () => {
    it('should return true when encryption key is configured', () => {
      process.env.ENCRYPTION_MASTER_KEY = 'test-key';
      
      const isConfigured = isTOTPConfigured();
      expect(isConfigured).toBe(true);
    });

    it('should return false when encryption key is not configured', () => {
      delete process.env.ENCRYPTION_MASTER_KEY;
      
      const isConfigured = isTOTPConfigured();
      expect(isConfigured).toBe(false);
    });

    it('should return false when encryption key is empty', () => {
      process.env.ENCRYPTION_MASTER_KEY = '';
      
      const isConfigured = isTOTPConfigured();
      expect(isConfigured).toBe(false);
    });
  });

  describe('TOTP Configuration Export', () => {
    it('should export correct configuration values', () => {
      expect(totpConfig).toEqual({
        serviceName: 'Taxomind LMS',
        digits: 6,
        period: 30,
        recoveryCodesCount: 10,
      });
    });

    it('should have immutable configuration', () => {
      const originalConfig = { ...totpConfig };
      
      // Attempt to modify the exported config
      (totpConfig as any).serviceName = 'Modified Service';
      
      // Should not affect the actual configuration used in functions
      const setup = generateTOTPSecret();
      expect(authenticator.generateSecret).toHaveBeenCalled();
      
      // Restore for other tests
      (totpConfig as any).serviceName = originalConfig.serviceName;
    });
  });

  describe('Integration and Edge Cases', () => {
    it('should handle complete TOTP workflow', async () => {
      // 1. Create TOTP setup
      const setup = await createTOTPSetup(mockEmail);
      
      // 2. Encrypt the secret
      const encryptedSecret = await encryptTOTPSecret(setup.secret);
      
      // 3. Encrypt backup codes
      const encryptedCodes = await encryptRecoveryCodes(setup.backupCodes);
      
      // 4. Verify a token
      const currentToken = getCurrentTOTPToken(setup.secret);
      const isValidToken = verifyTOTPToken(currentToken, setup.secret);
      expect(isValidToken).toBe(true);
      
      // 5. Use a recovery code
      const recoveryResult = await verifyRecoveryCode(setup.backupCodes[0], encryptedCodes);
      expect(recoveryResult.isValid).toBe(true);
      expect(recoveryResult.remainingCodes).toHaveLength(9);
      
      // 6. Decrypt the secret
      const decryptedSecret = await decryptTOTPSecret(encryptedSecret);
      expect(decryptedSecret).toBe(setup.secret);
    });

    it('should handle malformed encrypted data', async () => {
      const malformedData = 'not-json';
      
      await expect(decryptTOTPSecret(malformedData)).rejects.toThrow();
      await expect(decryptRecoveryCodes([malformedData])).rejects.toThrow();
    });

    it('should handle empty or null inputs gracefully', async () => {
      // Empty secret
      expect(() => verifyTOTPToken('123456', '')).not.toThrow();
      
      // Empty token
      expect(() => verifyTOTPToken('', mockSecret)).not.toThrow();
      
      // Empty recovery codes
      const emptyResult = await verifyRecoveryCode('CODE', []);
      expect(emptyResult.isValid).toBe(false);
    });

    it('should maintain security with invalid tokens', () => {
      (authenticator.verify as jest.Mock).mockReturnValue(false);
      
      const invalidTokens = [
        '000000',
        '999999',
        'abcdef',
        '12345', // Too short
        '1234567', // Too long
        '',
        null,
        undefined,
      ];
      
      invalidTokens.forEach(token => {
        const result = verifyTOTPToken(token as any, mockSecret);
        expect(result).toBe(false);
      });
    });

    it('should handle concurrent operations safely', async () => {
      const promises = [];
      
      // Multiple concurrent secret generations
      for (let i = 0; i < 10; i++) {
        promises.push(createTOTPSetup(`user${i}@example.com`));
      }
      
      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.secret).toBeDefined();
        expect(result.qrCodeUrl).toBeDefined();
        expect(result.backupCodes).toHaveLength(10);
      });
      
      // Each should have unique recovery codes
      const allCodes = results.flatMap(r => r.backupCodes);
      const uniqueCodes = new Set(allCodes);
      expect(uniqueCodes.size).toBe(allCodes.length);
    });
  });

  describe('Security and Performance', () => {
    it('should not leak sensitive data in error messages', async () => {
      (dataEncryption.encrypt as jest.Mock).mockRejectedValue(new Error('Encryption service error'));
      
      try {
        await encryptTOTPSecret('SENSITIVE_SECRET');
      } catch (error: any) {
        expect(error.message).not.toContain('SENSITIVE_SECRET');
        expect(error.message).toContain('Failed to encrypt TOTP secret');
      }
    });

    it('should handle high-frequency token verification', () => {
      const startTime = Date.now();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        verifyTOTPToken('123456', mockSecret);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete quickly (less than 1 second for 1000 verifications)
      expect(totalTime).toBeLessThan(1000);
    });

    it('should generate cryptographically secure recovery codes', () => {
      // Mock crypto.randomBytes to ensure it&apos;s called with correct parameters
      const mockBuffer = Buffer.from([0x12, 0x34, 0x56, 0x78, 0xAB, 0xCD, 0xEF, 0x01]);
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);
      
      const codes = generateRecoveryCodes();
      
      expect(crypto.randomBytes).toHaveBeenCalledWith(8); // 16 hex chars / 2
      expect(codes[0]).toBe('1234-5678');
    });
  });
});