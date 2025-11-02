/**
 * Email Tracking and Retry Logic
 * Provides reliable email delivery with status tracking and automatic retries
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export type EmailType = 'VERIFICATION' | 'TWO_FACTOR' | 'PASSWORD_RESET' | 'MAGIC_LINK';

interface EmailTrackingParams {
  userId: string;
  email: string;
  type: EmailType;
}

interface EmailSendFunction {
  (): Promise<boolean>;
}

/**
 * Sends email with retry logic and status tracking
 * @param params - Email tracking parameters
 * @param sendFn - Function that actually sends the email
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 */
export async function sendEmailWithTracking(
  params: EmailTrackingParams,
  sendFn: EmailSendFunction
): Promise<boolean> {
  let emailLogId: string | null = null;

  try {
    // 1. Create email log entry
    const emailLog = await db.emailLog.create({
      data: {
        userId: params.userId,
        email: params.email,
        type: params.type,
        status: 'QUEUED',
        attempts: 0,
      },
    });

    emailLogId = emailLog.id;

    // 2. Send email with retry logic
    const maxAttempts = 3;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Update status to SENDING
        await db.emailLog.update({
          where: { id: emailLogId },
          data: {
            status: 'SENDING',
            attempts: attempt,
          },
        });

        logger.info(`[Email Tracking] Attempt ${attempt}/${maxAttempts}`, {
          emailLogId,
          type: params.type,
          email: params.email,
        });

        // Actually send the email
        const sent = await sendFn();

        if (sent) {
          // Success! Update to SENT
          await db.emailLog.update({
            where: { id: emailLogId },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              lastError: null,
            },
          });

          logger.info('[Email Tracking] Email sent successfully', {
            emailLogId,
            type: params.type,
            email: params.email,
            attempts: attempt,
          });

          return true;
        } else {
          lastError = 'Email service returned false';
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[Email Tracking] Attempt ${attempt} failed`, {
          emailLogId,
          error: lastError,
        });

        // If not the last attempt, wait with exponential backoff
        if (attempt < maxAttempts) {
          const backoffMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
          logger.info(`[Email Tracking] Retrying in ${backoffMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    // All attempts failed
    await db.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: 'FAILED',
        lastError: lastError || 'All retry attempts failed',
      },
    });

    logger.error('[Email Tracking] Email failed after all retries', {
      emailLogId,
      type: params.type,
      email: params.email,
      lastError,
    });

    return false;
  } catch (error) {
    logger.error('[Email Tracking] Critical error in email tracking', {
      error: error instanceof Error ? error.message : String(error),
      emailLogId,
    });

    // Update email log if we have an ID
    if (emailLogId) {
      try {
        await db.emailLog.update({
          where: { id: emailLogId },
          data: {
            status: 'FAILED',
            lastError: error instanceof Error ? error.message : 'Critical error',
          },
        });
      } catch (updateError) {
        logger.error('[Email Tracking] Failed to update email log', { updateError });
      }
    }

    return false;
  }
}

/**
 * Get email delivery status for a user
 * @param userId - User ID
 * @param limit - Max number of records to return
 * @returns Array of email logs
 */
export async function getUserEmailStatus(userId: string, limit = 10) {
  try {
    const emailLogs = await db.emailLog.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return emailLogs;
  } catch (error) {
    logger.error('[Email Tracking] Error fetching user email status', { error });
    return [];
  }
}
