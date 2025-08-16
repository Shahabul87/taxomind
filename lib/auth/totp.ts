import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { dataEncryption } from '@/lib/security/encryption';

/**
 * TOTP (Time-based One-Time Password) utilities for multi-factor authentication
 * 
 * Features:
 * - TOTP secret generation and encryption
 * - QR code generation for authenticator apps
 * - Token verification with time tolerance
 * - Recovery codes generation and validation
 * - Secure backup code management
 */

export interface TOTPSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface EncryptedTOTPData {
  encryptedSecret: string;
  iv: string;
  tag: string;
  salt: string;
}

/**
 * TOTP Configuration
 */
const TOTP_CONFIG = {
  // App name displayed in authenticator apps
  serviceName: 'Taxomind LMS',
  
  // Token validity window (in steps)
  window: 1, // Allow 1 step before/after current time (30 seconds tolerance)
  
  // TOTP parameters
  digits: 6,
  period: 30, // 30 seconds
  algorithm: 'sha1',
  
  // Recovery codes
  recoveryCodesCount: 10,
  recoveryCodeLength: 16,
};

/**
 * Generates a new TOTP secret
 */
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Encrypts TOTP secret for secure storage
 */
export async function encryptTOTPSecret(secret: string): Promise<string> {
  try {
    const encryptedData = await dataEncryption.encrypt(secret);
    // Combine all encrypted data into a single string for database storage
    return JSON.stringify(encryptedData);
  } catch (error: any) {
    throw new Error(`Failed to encrypt TOTP secret: ${error.message}`);
  }
}

/**
 * Decrypts TOTP secret for verification
 */
export async function decryptTOTPSecret(encryptedSecret: string): Promise<string> {
  try {
    const encryptedData = JSON.parse(encryptedSecret);
    return await dataEncryption.decrypt(encryptedData);
  } catch (error: any) {
    throw new Error(`Failed to decrypt TOTP secret: ${error.message}`);
  }
}

/**
 * Generates QR code URL for authenticator app setup
 */
export async function generateQRCode(
  secret: string, 
  userEmail: string, 
  issuer: string = TOTP_CONFIG.serviceName
): Promise<string> {
  try {
    // Create the TOTP URL
    const otpAuthUrl = authenticator.keyuri(
      userEmail,
      issuer,
      secret
    );
    
    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);
    return qrCodeUrl;
  } catch (error: any) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Verifies TOTP token
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    // Configure authenticator
    authenticator.options = {
      digits: TOTP_CONFIG.digits,
      period: TOTP_CONFIG.period,
      algorithm: TOTP_CONFIG.algorithm as any,
      window: TOTP_CONFIG.window,
    };

    return authenticator.verify({
      token: token.replace(/\s/g, ''), // Remove any whitespace
      secret,
    });
  } catch (error: any) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * Generates recovery codes for backup access
 */
export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < TOTP_CONFIG.recoveryCodesCount; i++) {
    // Generate random recovery code (hexadecimal)
    const code = crypto
      .randomBytes(TOTP_CONFIG.recoveryCodeLength / 2)
      .toString('hex')
      .toUpperCase();
    
    // Format as XXXX-XXXX for better readability
    const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;
    codes.push(formattedCode);
  }
  
  return codes;
}

/**
 * Encrypts recovery codes for secure storage
 */
export async function encryptRecoveryCodes(codes: string[]): Promise<string[]> {
  try {
    const encryptedCodes: string[] = [];
    
    for (const code of codes) {
      const encryptedData = await dataEncryption.encrypt(code);
      encryptedCodes.push(JSON.stringify(encryptedData));
    }
    
    return encryptedCodes;
  } catch (error: any) {
    throw new Error(`Failed to encrypt recovery codes: ${error.message}`);
  }
}

/**
 * Decrypts recovery codes for verification
 */
export async function decryptRecoveryCodes(encryptedCodes: string[]): Promise<string[]> {
  try {
    const decryptedCodes: string[] = [];
    
    for (const encryptedCode of encryptedCodes) {
      const encryptedData = JSON.parse(encryptedCode);
      const decryptedCode = await dataEncryption.decrypt(encryptedData);
      decryptedCodes.push(decryptedCode);
    }
    
    return decryptedCodes;
  } catch (error: any) {
    throw new Error(`Failed to decrypt recovery codes: ${error.message}`);
  }
}

/**
 * Verifies if a recovery code is valid
 */
export async function verifyRecoveryCode(
  inputCode: string, 
  encryptedRecoveryCodes: string[]
): Promise<{ isValid: boolean; remainingCodes?: string[] }> {
  try {
    // Normalize input code
    const normalizedInput = inputCode.replace(/[-\s]/g, '').toUpperCase();
    
    const decryptedCodes = await decryptRecoveryCodes(encryptedRecoveryCodes);
    
    // Find matching code
    const matchingIndex = decryptedCodes.findIndex(code => 
      code.replace(/[-\s]/g, '').toUpperCase() === normalizedInput
    );
    
    if (matchingIndex === -1) {
      return { isValid: false };
    }
    
    // Remove used code from the list
    const remainingCodes = [...encryptedRecoveryCodes];
    remainingCodes.splice(matchingIndex, 1);
    
    return {
      isValid: true,
      remainingCodes,
    };
  } catch (error: any) {
    console.error('Recovery code verification error:', error);
    return { isValid: false };
  }
}

/**
 * Validates TOTP setup data
 */
export function validateTOTPSetup(data: Partial<TOTPSetupData>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.secret || data.secret.length < 16) {
    errors.push('Invalid TOTP secret');
  }
  
  if (!data.qrCodeUrl || !data.qrCodeUrl.startsWith('data:image/png;base64,')) {
    errors.push('Invalid QR code URL');
  }
  
  if (!data.backupCodes || data.backupCodes.length !== TOTP_CONFIG.recoveryCodesCount) {
    errors.push('Invalid recovery codes');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates complete TOTP setup data for a user
 */
export async function createTOTPSetup(userEmail: string): Promise<TOTPSetupData> {
  try {
    // Generate TOTP secret
    const secret = generateTOTPSecret();
    
    // Generate QR code
    const qrCodeUrl = await generateQRCode(secret, userEmail);
    
    // Generate recovery codes
    const backupCodes = generateRecoveryCodes();
    
    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  } catch (error: any) {
    throw new Error(`Failed to create TOTP setup: ${error.message}`);
  }
}

/**
 * Utility to get current TOTP token (for testing)
 */
export function getCurrentTOTPToken(secret: string): string {
  authenticator.options = {
    digits: TOTP_CONFIG.digits,
    period: TOTP_CONFIG.period,
    algorithm: TOTP_CONFIG.algorithm as any,
  };
  
  return authenticator.generate(secret);
}

/**
 * Checks if TOTP is properly configured
 */
export function isTOTPConfigured(): boolean {
  return !!(process.env.ENCRYPTION_MASTER_KEY);
}

/**
 * Export configuration for use in UI components
 */
export const totpConfig = {
  serviceName: TOTP_CONFIG.serviceName,
  digits: TOTP_CONFIG.digits,
  period: TOTP_CONFIG.period,
  recoveryCodesCount: TOTP_CONFIG.recoveryCodesCount,
};