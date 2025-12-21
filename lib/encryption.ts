// Mock encryption module for testing
import * as crypto from 'crypto';

export class DataEncryption {
  private masterKey: string | null = null;

  constructor() {
    // Don't validate at construction - validate on first use
    // This prevents build-time errors when env vars aren't available
  }

  private ensureInitialized(): string {
    if (!this.masterKey) {
      if (!process.env.ENCRYPTION_MASTER_KEY) {
        throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
      }
      this.masterKey = process.env.ENCRYPTION_MASTER_KEY;
    }
    return this.masterKey;
  }
  
  encrypt(text: string): string {
    const key = this.ensureInitialized();
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(text: string): string {
    const key = this.ensureInitialized();
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

export function encrypt(text: string): string {
  const encryption = new DataEncryption();
  return encryption.encrypt(text);
}

export function decrypt(text: string): string {
  const encryption = new DataEncryption();
  return encryption.decrypt(text);
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateIV(): Buffer {
  return crypto.randomBytes(16);
}

export function encryptWithIV(text: string, key: string, iv: Buffer): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptWithIV(text: string, key: string, iv: Buffer): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}