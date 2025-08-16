import crypto from 'crypto';
import { promisify } from 'util';

/**
 * Cryptographic utilities for enterprise security
 * 
 * Features:
 * - Secure random generation
 * - Digital signatures
 * - Key derivation functions
 * - Timing-safe comparisons
 * - HMAC operations
 * - Certificate utilities
 * 
 * @example
 * ```typescript
 * // Generate secure tokens
 * const token = CryptoUtils.generateSecureToken(32);
 * 
 * // Create HMAC signatures
 * const signature = await CryptoUtils.createHMAC('data', 'secret');
 * const isValid = await CryptoUtils.verifyHMAC('data', signature, 'secret');
 * 
 * // Digital signatures
 * const keyPair = await CryptoUtils.generateKeyPair();
 * const signature = await CryptoUtils.signData('data', keyPair.privateKey);
 * const verified = await CryptoUtils.verifySignature('data', signature, keyPair.publicKey);
 * ```
 */

const randomBytes = promisify(crypto.randomBytes);
const scrypt = promisify(crypto.scrypt);

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: string;
  keySize: number;
}

export interface HMACResult {
  signature: string;
  algorithm: string;
  timestamp: number;
}

export interface DigitalSignature {
  signature: string;
  algorithm: string;
  timestamp: number;
  keyId?: string;
}

export class CryptoUtils {
  /**
   * Generates cryptographically secure random bytes
   */
  static async generateSecureBytes(length: number = 32): Promise<Buffer> {
    return randomBytes(length);
  }

  /**
   * Generates a secure random token (hex encoded)
   */
  static async generateSecureToken(length: number = 32): Promise<string> {
    const bytes = await this.generateSecureBytes(length);
    return bytes.toString('hex');
  }

  /**
   * Generates a secure random string with custom alphabet
   */
  static async generateSecureString(
    length: number = 32,
    alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  ): Promise<string> {
    const bytes = await this.generateSecureBytes(length);
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += alphabet[bytes[i] % alphabet.length];
    }
    
    return result;
  }

  /**
   * Generates a cryptographically secure UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Creates a secure hash using SHA-256
   */
  static createHash(data: string | Buffer, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Creates a secure hash with salt
   */
  static async createSaltedHash(
    data: string,
    saltLength: number = 32,
    algorithm: string = 'sha256'
  ): Promise<{ hash: string; salt: string }> {
    const salt = await this.generateSecureToken(saltLength);
    const hash = crypto.createHash(algorithm).update(data + salt).digest('hex');
    
    return { hash, salt };
  }

  /**
   * Verifies a salted hash
   */
  static verifySaltedHash(
    data: string,
    hash: string,
    salt: string,
    algorithm: string = 'sha256'
  ): boolean {
    const computedHash = crypto.createHash(algorithm).update(data + salt).digest('hex');
    return this.timingSafeEqual(hash, computedHash);
  }

  /**
   * Performs timing-safe string comparison
   */
  static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    const bufferA = Buffer.from(a, 'hex');
    const bufferB = Buffer.from(b, 'hex');
    
    return crypto.timingSafeEqual(bufferA, bufferB);
  }

  /**
   * Creates HMAC signature
   */
  static async createHMAC(
    data: string | Buffer,
    secret: string,
    algorithm: string = 'sha256'
  ): Promise<HMACResult> {
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(data);
    const signature = hmac.digest('hex');
    
    return {
      signature,
      algorithm,
      timestamp: Date.now(),
    };
  }

  /**
   * Verifies HMAC signature
   */
  static async verifyHMAC(
    data: string | Buffer,
    hmacResult: HMACResult,
    secret: string,
    maxAge?: number
  ): Promise<boolean> {
    // Check timestamp if maxAge is specified
    if (maxAge && Date.now() - hmacResult.timestamp > maxAge) {
      return false;
    }

    const expectedHmac = await this.createHMAC(data, secret, hmacResult.algorithm);
    return this.timingSafeEqual(hmacResult.signature, expectedHmac.signature);
  }

  /**
   * Derives a key using PBKDF2
   */
  static async deriveKeyPBKDF2(
    password: string,
    salt: string | Buffer,
    iterations: number = 100000,
    keyLength: number = 32,
    algorithm: string = 'sha512'
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, keyLength, algorithm, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
  }

  /**
   * Derives a key using scrypt (more secure than PBKDF2)
   */
  static async deriveKeyScrypt(
    password: string,
    salt: string | Buffer,
    keyLength: number = 32,
    options: crypto.ScryptOptions = { N: 16384, r: 8, p: 1 }
  ): Promise<Buffer> {
    return scrypt(password, salt, keyLength, options) as Promise<Buffer>;
  }

  /**
   * Generates RSA key pair for digital signatures
   */
  static async generateKeyPair(keySize: number = 2048): Promise<KeyPair> {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair('rsa', {
        modulusLength: keySize,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      }, (err, publicKey, privateKey) => {
        if (err) reject(err);
        else resolve({
          publicKey,
          privateKey,
          algorithm: 'rsa',
          keySize,
        });
      });
    });
  }

  /**
   * Signs data with RSA private key
   */
  static async signData(
    data: string | Buffer,
    privateKey: string,
    algorithm: string = 'sha256',
    keyId?: string
  ): Promise<DigitalSignature> {
    const sign = crypto.createSign(algorithm);
    sign.update(data);
    sign.end();
    
    const signature = sign.sign(privateKey, 'hex');
    
    return {
      signature,
      algorithm,
      timestamp: Date.now(),
      keyId,
    };
  }

  /**
   * Verifies digital signature
   */
  static async verifySignature(
    data: string | Buffer,
    digitalSignature: DigitalSignature,
    publicKey: string,
    maxAge?: number
  ): Promise<boolean> {
    try {
      // Check timestamp if maxAge is specified
      if (maxAge && Date.now() - digitalSignature.timestamp > maxAge) {
        return false;
      }

      const verify = crypto.createVerify(digitalSignature.algorithm);
      verify.update(data);
      verify.end();
      
      return verify.verify(publicKey, digitalSignature.signature, 'hex');
    } catch (error) {
      return false;
    }
  }

  /**
   * Generates a secure session token with expiration
   */
  static async generateSessionToken(
    userId: string,
    expiresIn: number = 86400000 // 24 hours in ms
  ): Promise<{ token: string; expires: Date }> {
    const randomPart = await this.generateSecureToken(32);
    const expires = new Date(Date.now() + expiresIn);
    const payload = `${userId}:${expires.getTime()}:${randomPart}`;
    
    const token = Buffer.from(payload).toString('base64url');
    
    return { token, expires };
  }

  /**
   * Verifies and parses a session token
   */
  static verifySessionToken(token: string): { 
    userId: string; 
    expires: Date; 
    isValid: boolean 
  } | null {
    try {
      const payload = Buffer.from(token, 'base64url').toString();
      const [userId, expiresTimestamp] = payload.split(':');
      
      const expires = new Date(parseInt(expiresTimestamp));
      const isValid = expires.getTime() > Date.now();
      
      return { userId, expires, isValid };
    } catch (error) {
      return null;
    }
  }

  /**
   * Creates a JWT-like token (simplified implementation)
   */
  static async createJWTLikeToken(
    payload: any,
    secret: string,
    expiresIn: number = 3600 // 1 hour in seconds
  ): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const claims = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const hmac = await this.createHMAC(data, secret);
    const signature = Buffer.from(hmac.signature, 'hex').toString('base64url');
    
    return `${data}.${signature}`;
  }

  /**
   * Verifies a JWT-like token
   */
  static async verifyJWTLikeToken(
    token: string,
    secret: string
  ): Promise<{ valid: boolean; payload?: any; error?: string }> {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');
      if (!encodedHeader || !encodedPayload || !signature) {
        return { valid: false, error: 'Invalid token format' };
      }
      
      const data = `${encodedHeader}.${encodedPayload}`;
      const expectedHmac = await this.createHMAC(data, secret);
      const expectedSignature = Buffer.from(expectedHmac.signature, 'hex').toString('base64url');
      
      if (!this.timingSafeEqual(signature, expectedSignature)) {
        return { valid: false, error: 'Invalid signature' };
      }
      
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
      
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired' };
      }
      
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Generates a secure API key
   */
  static async generateAPIKey(prefix?: string): Promise<string> {
    const randomPart = await this.generateSecureToken(32);
    const checksum = this.createHash(randomPart).substring(0, 8);
    
    const apiKey = prefix 
      ? `${prefix}_${randomPart}_${checksum}`
      : `${randomPart}_${checksum}`;
    
    return apiKey;
  }

  /**
   * Validates an API key format
   */
  static validateAPIKey(apiKey: string, prefix?: string): boolean {
    try {
      const parts = apiKey.split('_');
      
      if (prefix) {
        if (parts.length !== 3 || parts[0] !== prefix) {
          return false;
        }
        const [, randomPart, checksum] = parts;
        const expectedChecksum = this.createHash(randomPart).substring(0, 8);
        return this.timingSafeEqual(checksum, expectedChecksum);
      } else {
        if (parts.length !== 2) {
          return false;
        }
        const [randomPart, checksum] = parts;
        const expectedChecksum = this.createHash(randomPart).substring(0, 8);
        return this.timingSafeEqual(checksum, expectedChecksum);
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Encrypts data using AES-256-CBC (alternative to GCM)
   */
  static async encryptAES256CBC(
    plaintext: string,
    key: string | Buffer,
    iv?: Buffer
  ): Promise<{ encrypted: string; iv: string }> {
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
    const ivBuffer = iv || crypto.randomBytes(16);
    
    const cipher = crypto.createCipher('aes-256-cbc', keyBuffer, ivBuffer);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: ivBuffer.toString('hex'),
    };
  }

  /**
   * Decrypts data using AES-256-CBC
   */
  static async decryptAES256CBC(
    encryptedData: string,
    key: string | Buffer,
    iv: string
  ): Promise<string> {
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
    const ivBuffer = Buffer.from(iv, 'hex');
    
    const decipher = crypto.createDecipher('aes-256-cbc', keyBuffer, ivBuffer);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Constant-time string comparison utility
   */
  static constantTimeStringCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Validates cryptographic configuration
   */
  static validateCryptoConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check Node.js crypto support
    if (!crypto.constants) {
      errors.push('Node.js crypto module not properly initialized');
    }
    
    // Check for required environment variables
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      errors.push('ENCRYPTION_MASTER_KEY environment variable is required');
    }
    
    // Validate key strength
    if (process.env.ENCRYPTION_MASTER_KEY && process.env.ENCRYPTION_MASTER_KEY.length < 64) {
      errors.push('ENCRYPTION_MASTER_KEY must be at least 64 characters (256 bits)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Utility functions for common cryptographic operations
 */
export const CryptoHelpers = {
  /**
   * Secure password hashing
   */
  async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    const salt = await CryptoUtils.generateSecureToken(32);
    const key = await CryptoUtils.deriveKeyScrypt(password, salt, 64);
    
    return {
      hash: key.toString('hex'),
      salt,
    };
  },

  /**
   * Secure password verification
   */
  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const key = await CryptoUtils.deriveKeyScrypt(password, salt, 64);
    return CryptoUtils.timingSafeEqual(hash, key.toString('hex'));
  },

  /**
   * Generate secure reset tokens
   */
  async generateResetToken(userId: string): Promise<{ token: string; expires: Date }> {
    return CryptoUtils.generateSessionToken(userId, 3600000); // 1 hour
  },

  /**
   * Generate secure verification tokens
   */
  async generateVerificationToken(email: string): Promise<{ token: string; expires: Date }> {
    return CryptoUtils.generateSessionToken(email, 86400000); // 24 hours
  },
};

export default CryptoUtils;