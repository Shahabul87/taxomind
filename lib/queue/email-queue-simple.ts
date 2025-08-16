/**
 * Simple Email Queue Interface
 * Provides a unified interface for email queueing that works in both client and server contexts
 * Actual queue implementation is handled server-side only
 */

import { logger } from '@/lib/logger';

// Email job types
export type EmailJobType = 
  | 'send-verification-email'
  | 'send-password-reset-email' 
  | 'send-2fa-code-email'
  | 'send-mfa-setup-confirmation'
  | 'send-welcome-email'
  | 'send-notification-email'
  | 'send-login-alert-email';

// Job data interfaces
export interface VerificationEmailData {
  jobType?: EmailJobType;
  userEmail: string;
  userName: string;
  verificationToken: string;
  expiresAt: Date;
  userId: string;
  timestamp: Date;
  isResend?: boolean;
}

export interface PasswordResetEmailData {
  jobType?: EmailJobType;
  userEmail: string;
  userName: string;
  resetToken: string;
  expiresAt: Date;
  userId: string;
  timestamp: Date;
  ipAddress?: string;
}

export interface TwoFactorEmailData {
  jobType?: EmailJobType;
  userEmail: string;
  userName: string;
  code: string;
  expiresAt: Date;
  userId: string;
  timestamp: Date;
  ipAddress?: string;
}

/**
 * Simple queue functions that can be called from server actions
 * These will delegate to the actual queue implementation when available
 */

export async function queueVerificationEmail(data: VerificationEmailData): Promise<void> {
  try {
    // In production, this would send to the actual queue
    // For now, log the intent
    logger.info('Queueing verification email', {
      email: data.userEmail,
      userId: data.userId,
      isResend: data.isResend
    });
    
    // In development/simple mode, could send directly via API
    if (process.env.NODE_ENV === 'development') {
      // Direct send logic could go here
      console.log('[Email Queue] Would send verification email to:', data.userEmail);
    }
  } catch (error) {
    logger.error('Failed to queue verification email', error);
    throw error;
  }
}

export async function queuePasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  try {
    logger.info('Queueing password reset email', {
      email: data.userEmail,
      userId: data.userId
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email Queue] Would send password reset email to:', data.userEmail);
    }
  } catch (error) {
    logger.error('Failed to queue password reset email', error);
    throw error;
  }
}

export async function queue2FAEmail(data: TwoFactorEmailData): Promise<void> {
  try {
    logger.info('Queueing 2FA email', {
      email: data.userEmail,
      userId: data.userId
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email Queue] Would send 2FA code to:', data.userEmail, 'Code:', data.code);
    }
  } catch (error) {
    logger.error('Failed to queue 2FA email', error);
    throw error;
  }
}

export async function queueLoginAlertEmail(data: {
  userEmail: string;
  userName: string;
  timestamp: Date;
  ipAddress?: string;
  deviceInfo?: string;
  location?: string;
  userId: string;
}): Promise<void> {
  try {
    logger.info('Queueing login alert email', {
      email: data.userEmail,
      userId: data.userId,
      ipAddress: data.ipAddress
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email Queue] Would send login alert to:', data.userEmail);
    }
  } catch (error) {
    logger.error('Failed to queue login alert email', error);
    throw error;
  }
}

// Export a simple status function
export async function getQueueStatus(): Promise<{ isHealthy: boolean; message: string }> {
  return {
    isHealthy: true,
    message: 'Email queue (simple mode) is operational'
  };
}