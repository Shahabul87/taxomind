/**
 * SMTP Email Service - DISABLED
 *
 * This service has been disabled in favor of Resend.
 * If you need SMTP functionality, please use Resend or reinstall nodemailer.
 */

import { logger } from '@/lib/logger';

// Email sending function interface
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  logger.warn('SMTP service is disabled. Please use Resend for email sending.', {
    to: options.to,
    subject: options.subject,
  });
  return false;
}

// Verify SMTP connection
export async function verifySmtpConnection(): Promise<boolean> {
  logger.warn('SMTP service is disabled. Please use Resend for email sending.');
  return false;
}

// Check if SMTP is configured
export function isSmtpConfigured(): boolean {
  return false;
}
