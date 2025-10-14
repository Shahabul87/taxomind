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
    logger.info('Queueing verification email', {
      email: data.userEmail,
      userId: data.userId,
      isResend: data.isResend
    });

    // Send email using SMTP
    const { sendEmail, isSmtpConfigured } = await import('@/lib/email/smtp-service');
    const { getVerificationEmailTemplate } = await import('@/lib/email/templates');

    if (!isSmtpConfigured()) {
      console.warn('[Email Queue] SMTP not configured - email not sent to:', data.userEmail);
      return;
    }

    const emailTemplate = getVerificationEmailTemplate({
      userName: data.userName,
      verificationToken: data.verificationToken,
    });

    const sent = await sendEmail({
      to: data.userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    if (sent) {
      console.log('[Email Queue] ✅ Verification email sent successfully to:', data.userEmail);
    } else {
      console.error('[Email Queue] ❌ Failed to send verification email to:', data.userEmail);
    }
  } catch (error) {
    logger.error('Failed to queue verification email', error);
    // Don't throw - we don't want registration to fail if email fails
    console.error('[Email Queue] Error sending verification email:', error);
  }
}

export async function queuePasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  try {
    logger.info('Queueing password reset email', {
      email: data.userEmail,
      userId: data.userId
    });

    // Send email using SMTP
    const { sendEmail, isSmtpConfigured } = await import('@/lib/email/smtp-service');
    const { getPasswordResetEmailTemplate } = await import('@/lib/email/templates');

    if (!isSmtpConfigured()) {
      console.warn('[Email Queue] SMTP not configured - email not sent to:', data.userEmail);
      return;
    }

    const emailTemplate = getPasswordResetEmailTemplate({
      userName: data.userName,
      resetToken: data.resetToken,
    });

    const sent = await sendEmail({
      to: data.userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    if (sent) {
      console.log('[Email Queue] ✅ Password reset email sent successfully to:', data.userEmail);
    } else {
      console.error('[Email Queue] ❌ Failed to send password reset email to:', data.userEmail);
    }
  } catch (error) {
    logger.error('Failed to queue password reset email', error);
    console.error('[Email Queue] Error sending password reset email:', error);
  }
}

export async function queue2FAEmail(data: TwoFactorEmailData): Promise<void> {
  try {
    logger.info('Queueing 2FA email', {
      email: data.userEmail,
      userId: data.userId
    });

    // Send email using SMTP
    const { sendEmail, isSmtpConfigured } = await import('@/lib/email/smtp-service');
    const { getTwoFactorEmailTemplate } = await import('@/lib/email/templates');

    if (!isSmtpConfigured()) {
      console.warn('[Email Queue] SMTP not configured - email not sent to:', data.userEmail);
      return;
    }

    const emailTemplate = getTwoFactorEmailTemplate({
      userName: data.userName,
      code: data.code,
    });

    const sent = await sendEmail({
      to: data.userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    if (sent) {
      console.log('[Email Queue] ✅ 2FA email sent successfully to:', data.userEmail);
    } else {
      console.error('[Email Queue] ❌ Failed to send 2FA email to:', data.userEmail);
    }
  } catch (error) {
    logger.error('Failed to queue 2FA email', error);
    console.error('[Email Queue] Error sending 2FA email:', error);
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