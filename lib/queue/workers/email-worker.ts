/**
 * Email Worker
 * Processes email-related jobs including welcome emails, notifications, and bulk emails
 */

import { Job } from 'bullmq';
import { logger } from '@/lib/logger';
import { 
  SendWelcomeEmailData, 
  SendNotificationEmailData, 
  SendCourseReminderData,
  SendBulkAnnouncementData,
  EmailJobResult,
  WorkerFunction
} from '../job-definitions';

/**
 * Email service interface
 */
interface EmailService {
  sendEmail(to: string, subject: string, template: string, data: any): Promise<{ messageId: string; status: string }>;
  sendBulkEmail(recipients: string[], subject: string, template: string, data: any): Promise<{ messageIds: string[]; status: string }>;
}

/**
 * Mock email service implementation
 * In production, replace with actual email service (SendGrid, SES, etc.)
 */
class MockEmailService implements EmailService {
  async sendEmail(to: string, subject: string, template: string, data: any): Promise<{ messageId: string; status: string }> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Simulate occasional failures (5% failure rate)
    if (Math.random() < 0.05) {
      throw new Error(`Failed to send email to ${to}: Service temporarily unavailable`);
    }
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      messageId,
      status: 'sent',
    };
  }

  async sendBulkEmail(recipients: string[], subject: string, template: string, data: any): Promise<{ messageIds: string[]; status: string }> {
    const messageIds: string[] = [];
    
    for (const recipient of recipients) {
      const result = await this.sendEmail(recipient, subject, template, data);
      messageIds.push(result.messageId);
    }
    
    return {
      messageIds,
      status: 'sent',
    };
  }
}

/**
 * Email templates
 */
class EmailTemplates {
  static getWelcomeEmail(data: { userName: string; verificationToken?: string }): { subject: string; html: string } {
    return {
      subject: 'Welcome to Taxomind LMS!',
      html: `
        <h1>Welcome to Taxomind, ${data.userName}!</h1>
        <p>We&apos;re excited to have you join our learning community.</p>
        ${data.verificationToken ? 
          `<p>Please verify your email by clicking <a href="/verify?token=${data.verificationToken}">here</a>.</p>` : 
          ''
        }
        <p>Happy learning!</p>
        <p>The Taxomind Team</p>
      `,
    };
  }

  static getCourseReminderEmail(data: { userName: string; courseName: string; reminderType: string }): { subject: string; html: string } {
    const subjects = {
      progress: `Continue your learning journey in ${data.courseName}`,
      completion: `You&apos;re almost done with ${data.courseName}!`,
      upcoming: `Don&apos;t forget about ${data.courseName}`,
    };

    const messages = {
      progress: `Hi ${data.userName}, we noticed you haven&apos;t made progress in ${data.courseName} recently. Keep up the momentum!`,
      completion: `Hi ${data.userName}, you&apos;re so close to completing ${data.courseName}. Finish strong!`,
      upcoming: `Hi ${data.userName}, you have upcoming content in ${data.courseName}. Don&apos;t miss out!`,
    };

    return {
      subject: subjects[data.reminderType as keyof typeof subjects] || 'Course Reminder',
      html: `
        <h2>Course Reminder</h2>
        <p>${messages[data.reminderType as keyof typeof messages]}</p>
        <p><a href="/courses/${data.courseName}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Continue Learning</a></p>
        <p>Best regards,<br>The Taxomind Team</p>
      `,
    };
  }

  static getNotificationEmail(data: { subject: string; templateData: any }): { subject: string; html: string } {
    return {
      subject: data.subject,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2>${data.subject}</h2>
          ${data.templateData.message ? `<p>${data.templateData.message}</p>` : ''}
          ${data.templateData.actionUrl ? 
            `<p><a href="${data.templateData.actionUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Take Action</a></p>` : 
            ''
          }
          <hr>
          <p style="color: #666; font-size: 12px;">This email was sent by Taxomind LMS. If you no longer wish to receive these emails, you can unsubscribe.</p>
        </div>
      `,
    };
  }
}

/**
 * Email Worker Implementation
 */
export class EmailWorker {
  private emailService: EmailService;

  constructor(emailService?: EmailService) {
    this.emailService = emailService || new MockEmailService();
  }

  /**
   * Welcome email job handler
   */
  handleWelcomeEmail: WorkerFunction<SendWelcomeEmailData> = async (job: Job<SendWelcomeEmailData>) => {
    const { userEmail, userName, verificationToken } = job.data;

    try {
      const template = EmailTemplates.getWelcomeEmail({ userName, verificationToken });
      
      const result = await this.emailService.sendEmail(
        userEmail,
        template.subject,
        'welcome',
        { 
          userName, 
          verificationToken,
          html: template.html 
        }
      );

      const jobResult: EmailJobResult = {
        success: true,
        data: result,
        messageId: result.messageId,
        recipientCount: 1,
        deliveryStatus: 'sent',
        processingTime: Date.now() - job.timestamp,
        metadata: {
          template: 'welcome',
          verificationRequired: !!verificationToken,
        },
      };

      await job.updateProgress(100);
      return jobResult;

    } catch (error: any) {
      logger.error(`[EMAIL_WORKER] Welcome email failed for ${userEmail}:`, error);
      
      const jobResult: EmailJobResult = {
        success: false,
        error: (error as Error).message,
        recipientCount: 1,
        deliveryStatus: 'failed',
        processingTime: Date.now() - job.timestamp,
      };

      throw error; // Let BullMQ handle retry logic
    }
  };

  /**
   * Notification email job handler
   */
  handleNotificationEmail: WorkerFunction<SendNotificationEmailData> = async (job: Job<SendNotificationEmailData>) => {
    const { userEmail, subject, template, templateData, priority } = job.data;

    try {
      await job.updateProgress(25);

      // Add priority-based delay for rate limiting
      if (priority === 'low') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const emailTemplate = EmailTemplates.getNotificationEmail({ subject, templateData });
      
      await job.updateProgress(50);

      const result = await this.emailService.sendEmail(
        userEmail,
        subject,
        template,
        {
          ...templateData,
          html: emailTemplate.html
        }
      );

      await job.updateProgress(100);

      const jobResult: EmailJobResult = {
        success: true,
        data: result,
        messageId: result.messageId,
        recipientCount: 1,
        deliveryStatus: 'sent',
        processingTime: Date.now() - job.timestamp,
        metadata: {
          template,
          priority,
          dataKeys: Object.keys(templateData),
        },
      };

      return jobResult;

    } catch (error: any) {
      logger.error(`[EMAIL_WORKER] Notification email failed for ${userEmail}:`, error);
      
      const jobResult: EmailJobResult = {
        success: false,
        error: (error as Error).message,
        recipientCount: 1,
        deliveryStatus: 'failed',
        processingTime: Date.now() - job.timestamp,
      };

      throw error;
    }
  };

  /**
   * Course reminder email job handler
   */
  handleCourseReminder: WorkerFunction<SendCourseReminderData> = async (job: Job<SendCourseReminderData>) => {
    const { userEmail, userId, courseName, reminderType, lastAccessDate } = job.data;

    try {
      // Check if reminder is still relevant (user hasn't accessed course recently)
      const daysSinceAccess = Math.floor((Date.now() - lastAccessDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceAccess < 1) {

        return {
          success: true,
          data: { skipped: true, reason: 'Recent access detected' },
          processingTime: Date.now() - job.timestamp,
        };
      }

      await job.updateProgress(30);

      // Get user name from userId (in production, fetch from database)
      const userName = `User${userId.slice(-4)}`; // Mock user name

      const template = EmailTemplates.getCourseReminderEmail({ 
        userName, 
        courseName, 
        reminderType 
      });

      await job.updateProgress(60);

      const result = await this.emailService.sendEmail(
        userEmail,
        template.subject,
        'course-reminder',
        {
          userName,
          courseName,
          reminderType,
          daysSinceAccess,
          html: template.html,
        }
      );

      await job.updateProgress(100);

      const jobResult: EmailJobResult = {
        success: true,
        data: result,
        messageId: result.messageId,
        recipientCount: 1,
        deliveryStatus: 'sent',
        processingTime: Date.now() - job.timestamp,
        metadata: {
          template: 'course-reminder',
          reminderType,
          daysSinceAccess,
        },
      };

      return jobResult;

    } catch (error: any) {
      logger.error(`[EMAIL_WORKER] Course reminder failed for ${userEmail}:`, error);
      
      const jobResult: EmailJobResult = {
        success: false,
        error: (error as Error).message,
        recipientCount: 1,
        deliveryStatus: 'failed',
        processingTime: Date.now() - job.timestamp,
      };

      throw error;
    }
  };

  /**
   * Bulk announcement email job handler
   */
  handleBulkAnnouncement: WorkerFunction<SendBulkAnnouncementData> = async (job: Job<SendBulkAnnouncementData>) => {
    const { userIds, subject, message, template, segmentCriteria } = job.data;

    try {
      // In production, fetch user emails from database based on userIds and segmentCriteria
      const userEmails = userIds.map(id => `user${id.slice(-4)}@example.com`);
      
      await job.updateProgress(20);

      const totalRecipients = userEmails.length;
      const batchSize = 10; // Process in batches to avoid overwhelming email service
      const results: string[] = [];
      let processed = 0;

      for (let i = 0; i < userEmails.length; i += batchSize) {
        const batch = userEmails.slice(i, i + batchSize);
        
        try {
          const batchResult = await this.emailService.sendBulkEmail(
            batch,
            subject,
            template || 'announcement',
            {
              message,
              segmentCriteria,
              html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                  <h2>${subject}</h2>
                  <p>${message}</p>
                  <hr>
                  <p style="color: #666; font-size: 12px;">This announcement was sent to selected users.</p>
                </div>
              `,
            }
          );
          
          results.push(...batchResult.messageIds);
          processed += batch.length;
          
          await job.updateProgress(Math.round((processed / totalRecipients) * 80) + 20);
          
          // Rate limiting delay between batches
          if (i + batchSize < userEmails.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (batchError) {
          logger.error(`[EMAIL_WORKER] Batch ${i / batchSize + 1} failed:`, batchError);
          // Continue with other batches
        }
      }

      await job.updateProgress(100);

      const jobResult: EmailJobResult = {
        success: true,
        data: { messageIds: results },
        recipientCount: results.length,
        deliveryStatus: 'sent',
        processingTime: Date.now() - job.timestamp,
        metadata: {
          template: template || 'announcement',
          totalTargeted: totalRecipients,
          successfulDeliveries: results.length,
          batchesProcessed: Math.ceil(userEmails.length / batchSize),
          segmentCriteria,
        },
      };

      return jobResult;

    } catch (error: any) {
      logger.error(`[EMAIL_WORKER] Bulk announcement failed:`, error);
      
      const jobResult: EmailJobResult = {
        success: false,
        error: (error as Error).message,
        recipientCount: 0,
        deliveryStatus: 'failed',
        processingTime: Date.now() - job.timestamp,
      };

      throw error;
    }
  };

  /**
   * Password reset email job handler
   */
  handlePasswordReset: WorkerFunction<any> = async (job: Job<any>) => {
    const { userEmail, userName, resetToken, expiresAt } = job.data;

    try {
      const template = {
        subject: 'Password Reset Request - Taxomind LMS',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2>Password Reset Request</h2>
            <p>Hi ${userName},</p>
            <p>You requested a password reset for your Taxomind LMS account.</p>
            <p><a href="/auth/reset-password?token=${resetToken}" 
               style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
               Reset Password
            </a></p>
            <p>This link will expire at ${new Date(expiresAt).toLocaleString()}.</p>
            <p>If you didn&apos;t request this reset, please ignore this email.</p>
            <p>Best regards,<br>The Taxomind Team</p>
          </div>
        `,
      };

      const result = await this.emailService.sendEmail(
        userEmail,
        template.subject,
        'password-reset',
        {
          userName,
          resetToken,
          expiresAt,
          html: template.html,
        }
      );

      return {
        success: true,
        data: result,
        messageId: result.messageId,
        processingTime: Date.now() - job.timestamp,
      };

    } catch (error: any) {
      logger.error(`[EMAIL_WORKER] Password reset email failed:`, error);
      throw error;
    }
  };

  /**
   * Course completion certificate email handler
   */
  handleCertificateEmail: WorkerFunction<any> = async (job: Job<any>) => {
    const { userEmail, userName, courseName, certificateUrl, completionDate } = job.data;

    try {
      const template = {
        subject: `Congratulations! You&apos;ve completed ${courseName}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h1 style="color: #28a745;">🎉 Congratulations, ${userName}!</h1>
            <p>You have successfully completed <strong>${courseName}</strong> on ${new Date(completionDate).toLocaleDateString()}.</p>
            <p>Your certificate is ready for download:</p>
            <p><a href="${certificateUrl}" 
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
               Download Certificate
            </a></p>
            <p>Keep learning and growing with Taxomind!</p>
            <p>Best regards,<br>The Taxomind Team</p>
          </div>
        `,
      };

      const result = await this.emailService.sendEmail(
        userEmail,
        template.subject,
        'certificate',
        {
          userName,
          courseName,
          certificateUrl,
          completionDate,
          html: template.html,
        }
      );

      return {
        success: true,
        data: result,
        messageId: result.messageId,
        processingTime: Date.now() - job.timestamp,
      };

    } catch (error: any) {
      logger.error(`[EMAIL_WORKER] Certificate email failed:`, error);
      throw error;
    }
  };
}

// Create singleton instance
export const emailWorker = new EmailWorker();

// Export individual handlers for BullMQ workers
export const emailHandlers = {
  'send-welcome-email': emailWorker.handleWelcomeEmail,
  'send-notification-email': emailWorker.handleNotificationEmail,
  'send-course-reminder': emailWorker.handleCourseReminder,
  'send-bulk-announcement': emailWorker.handleBulkAnnouncement,
  'send-password-reset': emailWorker.handlePasswordReset,
  'send-course-completion-certificate': emailWorker.handleCertificateEmail,
};

export default EmailWorker;