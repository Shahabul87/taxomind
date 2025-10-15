/**
 * Resend Email Service using HTTP API
 * More reliable than SMTP, recommended by Resend
 * https://resend.com/docs/send-with-nodejs
 */

import { logger } from '@/lib/logger';

// Resend Configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_FROM = process.env.EMAIL_FROM || 'mail@taxomind.com';

// Email sending function using Resend HTTP API
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    if (!RESEND_API_KEY) {
      logger.error('Resend API key not configured');
      console.error('[Resend] RESEND_API_KEY environment variable not set');
      return false;
    }

    const payload = {
      from: `Taxomind <${EMAIL_FROM}>`,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    logger.info('[Resend] Sending email via HTTP API', {
      to: options.to,
      subject: options.subject,
      from: EMAIL_FROM,
    });

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('[Resend] Email send failed', {
        status: response.status,
        statusText: response.statusText,
        error: data,
        to: options.to,
      });
      console.error('[Resend] API Error:', {
        status: response.status,
        error: data,
      });
      return false;
    }

    logger.info('[Resend] Email sent successfully via HTTP API', {
      to: options.to,
      subject: options.subject,
      emailId: data.id,
    });

    console.log('[Resend] ✅ Email sent successfully:', {
      to: options.to,
      emailId: data.id,
    });

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Resend] Failed to send email', {
      error: errorMessage,
      to: options.to,
      subject: options.subject,
    });
    console.error('[Resend] Exception:', errorMessage);
    return false;
  }
}

// Verify Resend API key is configured
export function isResendConfigured(): boolean {
  return !!RESEND_API_KEY;
}

// Test Resend connection
export async function verifyResendConnection(): Promise<boolean> {
  try {
    if (!RESEND_API_KEY) {
      logger.error('[Resend] API key not configured');
      return false;
    }

    // Test API key by checking API status
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Taxomind <${EMAIL_FROM}>`,
        to: ['test@example.com'],
        subject: 'Test',
        html: '<p>Test</p>',
      }),
    });

    // Even if the email fails due to invalid recipient,
    // a 422 status means the API key is valid
    if (response.status === 422) {
      logger.info('[Resend] API key validated (test email rejected as expected)');
      return true;
    }

    // 200/201 means API key is valid and email was queued
    if (response.ok) {
      logger.info('[Resend] API key validated (test email sent)');
      return true;
    }

    // Any other status code means authentication failed
    const data = await response.json();
    logger.error('[Resend] API key validation failed', {
      status: response.status,
      error: data,
    });
    return false;

  } catch (error) {
    logger.error('[Resend] Connection verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}
