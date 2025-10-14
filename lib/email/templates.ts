/**
 * Email Templates for Taxomind
 * Professional HTML email templates for authentication and notifications
 */

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Email wrapper template
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Taxomind</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4 0%, #a855f7 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">Taxomind</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Intelligent Learning Management System</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">© ${new Date().getFullYear()} Taxomind. All rights reserved.</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This email was sent to you because you registered on Taxomind.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Verification Email Template
export function getVerificationEmailTemplate(data: {
  userName: string;
  verificationToken: string;
}): { subject: string; html: string } {
  const verificationUrl = `${baseUrl}/auth/new-verification?token=${data.verificationToken}`;

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">Welcome to Taxomind, ${data.userName}!</h2>
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Thank you for registering with Taxomind. To complete your registration and activate your account, please verify your email address by clicking the button below.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
      <tr>
        <td align="center">
          <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #06b6d4 0%, #a855f7 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      If the button doesn&apos;t work, copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 20px 0; padding: 12px; background-color: #f9fafb; border-radius: 6px; color: #4b5563; font-size: 14px; word-break: break-all;">
      ${verificationUrl}
    </p>
    <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
      <strong>Note:</strong> This verification link will expire in 1 hour. If you didn&apos;t create an account with Taxomind, please ignore this email.
    </p>
  `;

  return {
    subject: 'Welcome to Taxomind - Verify Your Email',
    html: emailWrapper(content),
  };
}

// Password Reset Email Template
export function getPasswordResetEmailTemplate(data: {
  userName: string;
  resetToken: string;
}): { subject: string; html: string } {
  const resetUrl = `${baseUrl}/auth/new-password?token=${data.resetToken}`;

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">Password Reset Request</h2>
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Hello ${data.userName},
    </p>
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      We received a request to reset your password for your Taxomind account. Click the button below to create a new password.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #06b6d4 0%, #a855f7 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      If the button doesn&apos;t work, copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 20px 0; padding: 12px; background-color: #f9fafb; border-radius: 6px; color: #4b5563; font-size: 14px; word-break: break-all;">
      ${resetUrl}
    </p>
    <div style="margin: 20px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        <strong>Security Alert:</strong> If you didn&apos;t request a password reset, please ignore this email or contact support if you have concerns about your account security.
      </p>
    </div>
    <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
      <strong>Note:</strong> This password reset link will expire in 1 hour.
    </p>
  `;

  return {
    subject: 'Taxomind - Password Reset Request',
    html: emailWrapper(content),
  };
}

// 2FA Code Email Template
export function getTwoFactorEmailTemplate(data: {
  userName: string;
  code: string;
}): { subject: string; html: string } {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">Two-Factor Authentication Code</h2>
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Hello ${data.userName},
    </p>
    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Your two-factor authentication code is:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
      <tr>
        <td align="center">
          <div style="display: inline-block; padding: 20px 40px; background-color: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${data.code}
            </span>
          </div>
        </td>
      </tr>
    </table>
    <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Enter this code to complete your login.
    </p>
    <div style="margin: 20px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        <strong>Security Alert:</strong> If you didn&apos;t attempt to log in, please secure your account immediately.
      </p>
    </div>
    <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
      <strong>Note:</strong> This code will expire in 5 minutes.
    </p>
  `;

  return {
    subject: 'Taxomind - Two-Factor Authentication Code',
    html: emailWrapper(content),
  };
}

// Welcome Email Template (after email verification)
export function getWelcomeEmailTemplate(data: {
  userName: string;
}): { subject: string; html: string } {
  const dashboardUrl = `${baseUrl}/dashboard`;

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">Welcome to Taxomind! 🎉</h2>
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Hello ${data.userName},
    </p>
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Your email has been successfully verified! You&apos;re now ready to explore everything Taxomind has to offer.
    </p>
    <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #06b6d4; border-radius: 6px;">
      <h3 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 18px;">What&apos;s Next?</h3>
      <ul style="margin: 0; padding-left: 20px; color: #075985; font-size: 14px; line-height: 1.8;">
        <li>Browse and enroll in courses</li>
        <li>Track your learning progress</li>
        <li>Connect with instructors and peers</li>
        <li>Earn certificates upon completion</li>
      </ul>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #06b6d4 0%, #a855f7 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Go to Dashboard
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      If you have any questions or need assistance, feel free to reach out to our support team.
    </p>
  `;

  return {
    subject: 'Welcome to Taxomind - Let&apos;s Get Started!',
    html: emailWrapper(content),
  };
}
