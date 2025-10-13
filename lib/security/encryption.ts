import crypto from 'crypto';

/**
 * Enterprise-grade AES-256 encryption for data at rest
 * 
 * Features:
 * - AES-256-GCM encryption with authenticated encryption
 * - Key derivation using PBKDF2
 * - Secure random IV generation
 * - Authentication tag verification
 * 
 * @example
 * ```typescript
 * const encryption = new DataEncryption();
 * const encrypted = await encryption.encrypt('sensitive data');
 * const decrypted = await encryption.decrypt(encrypted);
 * ```
 */

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  saltLength: number;
  iterations: number;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
}

export class DataEncryption {
  private config: EncryptionConfig;
  private masterKey: string;

  constructor(masterKey?: string) {
    this.config = {
      algorithm: 'aes-256-gcm',
      keyLength: 32, // 256 bits
      ivLength: 16,  // 128 bits
      tagLength: 16, // 128 bits
      saltLength: 32, // 256 bits
      iterations: 100000, // PBKDF2 iterations
    };

    // SECURITY FIX: Fail fast if encryption key is missing
    // Never use a random key as fallback - this makes encrypted data unrecoverable on restart
    const envKey = process.env.ENCRYPTION_MASTER_KEY;
    this.masterKey = masterKey || envKey || '';

    if (!this.masterKey) {
      throw new Error(
        'CRITICAL: ENCRYPTION_MASTER_KEY environment variable is required. ' +
        'Generate one with: openssl rand -hex 32'
      );
    }

    // Validate key length (must be 64 hex characters = 32 bytes = 256 bits)
    if (this.masterKey.length !== 64) {
      throw new Error(
        `CRITICAL: ENCRYPTION_MASTER_KEY must be 64 hex characters (32 bytes). ` +
        `Current length: ${this.masterKey.length}. ` +
        `Generate a valid key with: openssl rand -hex 32`
      );
    }

    // Validate key is valid hex
    if (!/^[0-9a-fA-F]{64}$/.test(this.masterKey)) {
      throw new Error(
        'CRITICAL: ENCRYPTION_MASTER_KEY must contain only hexadecimal characters (0-9, a-f, A-F). ' +
        'Generate a valid key with: openssl rand -hex 32'
      );
    }
  }

  /**
   * Generates a cryptographically secure master key
   */
  private generateMasterKey(): string {
    return crypto.randomBytes(this.config.keyLength).toString('hex');
  }

  /**
   * Derives an encryption key from the master key and salt
   */
  private deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      this.config.iterations,
      this.config.keyLength,
      'sha512'
    );
  }

  /**
   * Encrypts data using AES-256-GCM
   */
  async encrypt(plaintext: string): Promise<EncryptedData> {
    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(this.config.saltLength);
      const iv = crypto.randomBytes(this.config.ivLength);
      
      // Derive key from master key and salt
      const key = this.deriveKey(salt);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.config.algorithm, key, iv) as unknown as crypto.CipherGCM;
      cipher.setAAD(Buffer.from('taxomind-lms')); // Additional authenticated data
      
      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: salt.toString('hex'),
      };
    } catch (error: any) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypts data using AES-256-GCM
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    try {
      const { encrypted, iv, tag, salt } = encryptedData;
      
      // Convert hex strings back to buffers
      const saltBuffer = Buffer.from(salt, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');
      
      // Derive key
      const key = this.deriveKey(saltBuffer);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.config.algorithm, key, ivBuffer) as unknown as crypto.DecipherGCM;
      decipher.setAuthTag(tagBuffer);
      decipher.setAAD(Buffer.from('taxomind-lms'));
      
      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error: any) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypts an object to JSON string
   */
  async encryptObject<T>(obj: T): Promise<EncryptedData> {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  /**
   * Decrypts JSON string to object
   */
  async decryptObject<T>(encryptedData: EncryptedData): Promise<T> {
    const jsonString = await this.decrypt(encryptedData);
    return JSON.parse(jsonString);
  }

  /**
   * Generates a hash of the plaintext for verification
   */
  generateHash(plaintext: string): string {
    return crypto.createHash('sha256').update(plaintext).digest('hex');
  }

  /**
   * Verifies if plaintext matches the hash
   */
  verifyHash(plaintext: string, hash: string): boolean {
    const computedHash = this.generateHash(plaintext);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(computedHash, 'hex')
    );
  }

  /**
   * Rotates encryption key (re-encrypts with new key)
   */
  async rotateKey(encryptedData: EncryptedData, newMasterKey: string): Promise<EncryptedData> {
    // Decrypt with current key
    const plaintext = await this.decrypt(encryptedData);
    
    // Create new encryption instance with new key
    const newEncryption = new DataEncryption(newMasterKey);
    
    // Re-encrypt with new key
    return newEncryption.encrypt(plaintext);
  }
}

/**
 * Singleton instance for global use
 */
export const dataEncryption = new DataEncryption();

/**
 * Utility functions for common encryption operations
 */
export const EncryptionUtils = {
  /**
   * Encrypts sensitive user data
   */
  async encryptUserData(userData: any): Promise<EncryptedData> {
    return dataEncryption.encryptObject(userData);
  },

  /**
   * Decrypts sensitive user data
   */
  async decryptUserData<T>(encryptedData: EncryptedData): Promise<T> {
    return dataEncryption.decryptObject<T>(encryptedData);
  },

  /**
   * Encrypts PII (Personally Identifiable Information)
   */
  async encryptPII(piiData: string): Promise<EncryptedData> {
    return dataEncryption.encrypt(piiData);
  },

  /**
   * Decrypts PII
   */
  async decryptPII(encryptedData: EncryptedData): Promise<string> {
    return dataEncryption.decrypt(encryptedData);
  },

  /**
   * Checks if encryption is properly configured
   */
  isConfigured(): boolean {
    return !!(process.env.ENCRYPTION_MASTER_KEY);
  },

  /**
   * Validates encryption configuration
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.ENCRYPTION_MASTER_KEY) {
      errors.push('ENCRYPTION_MASTER_KEY environment variable is required');
    }

    if (process.env.ENCRYPTION_MASTER_KEY && process.env.ENCRYPTION_MASTER_KEY.length < 32) {
      errors.push('ENCRYPTION_MASTER_KEY must be at least 32 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

/**
 * Environment variables required for encryption:
 * 
 * ENCRYPTION_MASTER_KEY=your-256-bit-key-here (required)
 * 
 * Example .env entry:
 * ENCRYPTION_MASTER_KEY=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
 */