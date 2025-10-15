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

    // Send email using Resend HTTP API (not SMTP)
    const { sendEmail } = await import('@/lib/email/resend-service');

    console.log('[Email Queue] Sending verification email via Resend HTTP API to:', data.userEmail);

    const sent = await sendEmail({
      to: data.userEmail,
      subject: 'Welcome to Taxomind - Verify Your Email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Taxomind</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                🧠 Taxomind
              </h1>
              <p style="color: #e2e8f0; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                Intelligent Learning Platform
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                Welcome aboard, ${data.userName}! 🚀
              </h2>

              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for joining <strong>Taxomind</strong>, where AI meets personalized learning. You're just one step away from unlocking your cognitive potential.
              </p>

              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Please verify your email address to start your intelligent learning journey:
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/new-verification?token=${data.verificationToken}"
                   style="display: inline-block;
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: #ffffff;
                          padding: 16px 32px;
                          border-radius: 8px;
                          text-decoration: none;
                          font-weight: 600;
                          font-size: 16px;
                          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                          transition: all 0.3s ease;">
                  ✉️ Verify Email Address
                </a>
              </div>

              <!-- Alternative Link -->
              <div style="margin: 24px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px; border-left: 4px solid #667eea;">
                <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>Can&apos;t click the button?</strong> Copy and paste this link into your browser:<br>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/new-verification?token=${data.verificationToken}" style="color: #667eea; word-break: break-all;">${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/new-verification?token=${data.verificationToken}</a>
                </p>
              </div>

              <!-- Security Note -->
              <div style="margin-top: 32px; padding: 16px; background-color: #fef3cd; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>🔒 Security Notice:</strong> This verification link expires in 1 hour. If you didn&apos;t create a Taxomind account, please ignore this email.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center; line-height: 1.5;">
                © 2025 Taxomind. Empowering minds through intelligent learning.<br>
                <a href="https://taxomind.com" style="color: #667eea; text-decoration: none;">taxomind.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
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

    // Send email using Resend HTTP API (not SMTP)
    const { sendEmail } = await import('@/lib/email/resend-service');

    console.log('[Email Queue] Sending password reset email via Resend HTTP API to:', data.userEmail);

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/new-password?token=${data.resetToken}`;

    const sent = await sendEmail({
      to: data.userEmail,
      subject: 'Reset Your Taxomind Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Taxomind</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">🔐 Taxomind</h1>
              <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 16px;">Password Reset Request</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password 🔑</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">Click the button below to create a new password:</p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}"
                   style="display: inline-block;
                          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                          color: #ffffff;
                          padding: 16px 32px;
                          border-radius: 8px;
                          text-decoration: none;
                          font-weight: 600;
                          font-size: 16px;">
                  🔐 Reset My Password
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">© 2025 Taxomind</p>
            </div>
          </div>
        </body>
        </html>
      `,
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

    // Send email using Resend HTTP API (not SMTP)
    const { sendEmail } = await import('@/lib/email/resend-service');

    console.log('[Email Queue] Sending 2FA email via Resend HTTP API to:', data.userEmail);

    const sent = await sendEmail({
      to: data.userEmail,
      subject: '2FA Code for Login',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2; margin-bottom: 20px;">Your Two-Factor Authentication Code</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${data.code}
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            This code will expire in 5 minutes. If you didn&apos;t request this code, please ignore this email.
          </p>
        </div>
      `,
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