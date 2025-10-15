/**
 * SMTP Email Service using Nodemailer
 * Supports any SMTP provider (Gmail, Outlook, SendGrid, Mailgun, etc.)
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { logger } from '@/lib/logger';

// SMTP Configuration from environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  from: process.env.SMTP_FROM || process.env.SMTP_USER,
};

// Create transporter singleton
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
    throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD environment variables.');
  }

  transporter = nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: SMTP_CONFIG.auth,
    // CRITICAL: Add connection timeout to prevent hanging
    connectionTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
    greetingTimeout: 5000, // 5 seconds
    // Pool connections for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  logger.info('SMTP transporter created', {
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    user: SMTP_CONFIG.auth.user,
  });

  return transporter;
}

// Email sending function
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: `"Taxomind" <${SMTP_CONFIG.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    // Add timeout wrapper to prevent indefinite hanging
    const sendWithTimeout = Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout after 15 seconds')), 15000)
      )
    ]);

    const info = await sendWithTimeout as any;

    logger.info('Email sent successfully', {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
    });

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      error: errorMessage,
      to: options.to,
      subject: options.subject,
      smtpHost: SMTP_CONFIG.host,
      smtpPort: SMTP_CONFIG.port,
      smtpUser: SMTP_CONFIG.auth.user,
      timestamp: new Date().toISOString(),
    };

    logger.error('Failed to send email', errorDetails);

    // Log specific error types for debugging
    if (errorMessage.includes('timeout')) {
      console.error('[SMTP] Email send timeout - check SMTP server connectivity');
    } else if (errorMessage.includes('auth')) {
      console.error('[SMTP] Authentication failed - check SMTP credentials (SMTP_USER/SMTP_PASSWORD)');
    } else if (errorMessage.includes('ECONNREFUSED')) {
      console.error('[SMTP] Connection refused - check SMTP_HOST and SMTP_PORT');
    } else {
      console.error('[SMTP] Email send error:', errorDetails);
    }

    return false;
  }
}

// Verify SMTP connection
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    // Use type assertion for verify method
    await (transporter as any).verify();
    logger.info('SMTP connection verified successfully');
    return true;
  } catch (error) {
    logger.error('SMTP connection verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// Check if SMTP is configured
export function isSmtpConfigured(): boolean {
  return !!(SMTP_CONFIG.auth.user && SMTP_CONFIG.auth.pass);
}
