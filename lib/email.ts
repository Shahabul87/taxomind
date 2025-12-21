import { Resend } from 'resend';
import { logger } from '@/lib/logger';

// Lazy-load Resend client to prevent build-time errors
// Environment variables aren't available during Next.js build phase
let resendClient: Resend | null = null;

const getResendClient = (): Resend | null => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string;
}

/**
 * Send an email using the Resend API
 * Make sure you have a RESEND_API_KEY environment variable set
 */
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  from = process.env.EMAIL_FROM || 'notifications@yourdomain.com'
}: EmailParams) => {
  try {
    const resend = getResendClient();
    if (!resend) {
      logger.warn('RESEND_API_KEY is not set. Email not sent.');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
    });

    if (error) {
      logger.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error('Exception when sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 