/**
 * MFA Notification System for Admin Users
 * 
 * This module handles notifications and alerts related to MFA enforcement
 * for admin users, including email notifications, in-app alerts, and
 * audit trail management.
 */

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { AdminMFAInfo, calculateMFAEnforcementStatus } from "./mfa-enforcement";

export interface MFANotification {
  id: string;
  userId: string;
  type: "grace_period_started" | "warning_issued" | "enforcement_imminent" | "access_blocked" | "mfa_required";
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
  read: boolean;
  dismissed: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface MFANotificationConfig {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  reminderFrequency: "daily" | "weekly" | "disabled";
  notifyBeforeDays: number[];
}

/**
 * Create MFA-related notifications for admin users
 */
export async function createMFANotification(
  userId: string,
  type: MFANotification["type"],
  metadata: Record<string, any> = {}
): Promise<MFANotification | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isTwoFactorEnabled: true,
        totpEnabled: true,
        totpVerified: true,
        createdAt: true,
      },
    });

    if (!user || user.role !== "ADMIN") {
      return null;
    }

    const enforcementStatus = calculateMFAEnforcementStatus(user);
    const notificationData = getNotificationContent(type, enforcementStatus, metadata);

    if (!notificationData) {
      return null;
    }

    // Check if a similar notification already exists
    const existingNotification = await db.notification.findFirst({
      where: {
        userId,
        type: `MFA_${type.toUpperCase()}`,
        read: false,
      },
    });

    if (existingNotification) {
      logger.info("[MFA_NOTIFICATION] Similar notification already exists", {
        userId,
        type,
        existingNotificationId: existingNotification.id,
      });
      return null;
    }

    // Create the notification
    const notification = await db.notification.create({
      data: {
        id: globalThis.crypto.randomUUID(),
        userId,
        type: `MFA_${type.toUpperCase()}`,
        title: notificationData.title,
        message: notificationData.message,
        read: false,
      },
    });

    logger.info("[MFA_NOTIFICATION] Created MFA notification", {
      userId,
      notificationId: notification.id,
      type,
      priority: notificationData.priority,
    });

    // Send email notification if applicable
    if (notificationData.priority === "high" || notificationData.priority === "critical") {
      await sendMFAEmailNotification(
        { email: user.email || "", name: user.name }, 
        type, 
        enforcementStatus, 
        notificationData
      );
    }

    return {
      id: notification.id,
      userId: notification.userId,
      type: type,
      title: notification.title,
      message: notification.message,
      priority: notificationData.priority,
      read: notification.read,
      dismissed: false, // Default since not in database model
      actionUrl: notificationData.actionUrl,
      actionText: notificationData.actionText,
      metadata: {}, // Default since not in database model
      createdAt: notification.createdAt,
      expiresAt: notificationData.expiresAt,
    };
  } catch (error) {
    logger.error("[MFA_NOTIFICATION] Failed to create notification", {
      userId,
      type,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Get notification content based on type and enforcement status
 */
function getNotificationContent(
  type: MFANotification["type"],
  enforcementStatus: ReturnType<typeof calculateMFAEnforcementStatus>,
  metadata: Record<string, any>
): {
  title: string;
  message: string;
  priority: MFANotification["priority"];
  actionUrl?: string;
  actionText?: string;
  expiresAt?: Date;
} | null {
  const { daysUntilEnforcement, enforcementLevel } = enforcementStatus;

  switch (type) {
    case "grace_period_started":
      return {
        title: "MFA Setup Recommended",
        message: `Welcome! As an admin, we recommend setting up Multi-Factor Authentication for enhanced security. You have ${daysUntilEnforcement} days to complete the setup.`,
        priority: "low",
        actionUrl: "/admin/mfa-setup",
        actionText: "Set Up MFA",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
      };

    case "warning_issued":
      return {
        title: "MFA Setup Required Soon",
        message: `Action needed: MFA setup is required for your admin account. You have ${daysUntilEnforcement} day${daysUntilEnforcement !== 1 ? "s" : ""} remaining to complete setup before access restrictions apply.`,
        priority: "medium",
        actionUrl: "/admin/mfa-setup",
        actionText: "Set Up MFA Now",
        expiresAt: new Date(Date.now() + daysUntilEnforcement * 24 * 60 * 60 * 1000),
      };

    case "enforcement_imminent":
      return {
        title: "Urgent: MFA Setup Required",
        message: `Your admin access will be restricted ${daysUntilEnforcement === 0 ? "today" : `in ${daysUntilEnforcement} day${daysUntilEnforcement !== 1 ? "s" : ""}`} without MFA setup. Complete setup now to maintain uninterrupted access.`,
        priority: "high",
        actionUrl: "/admin/mfa-setup",
        actionText: "Set Up MFA Immediately",
        expiresAt: new Date(Date.now() + Math.max(1, daysUntilEnforcement) * 24 * 60 * 60 * 1000),
      };

    case "access_blocked":
      return {
        title: "Admin Access Restricted",
        message: "Your admin access has been restricted due to missing MFA setup. Complete MFA configuration to restore full admin privileges.",
        priority: "critical",
        actionUrl: "/admin/mfa-setup",
        actionText: "Complete MFA Setup",
        // No expiry - stays until MFA is configured
      };

    case "mfa_required":
      return {
        title: "MFA Configuration Required",
        message: "Multi-Factor Authentication is required for your admin account. This is a mandatory security requirement.",
        priority: enforcementLevel === "hard" ? "critical" : "high",
        actionUrl: "/admin/mfa-setup",
        actionText: "Configure MFA",
        expiresAt: enforcementLevel === "hard" ? undefined : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      };

    default:
      return null;
  }
}

/**
 * Send email notification for MFA requirements (placeholder implementation)
 */
async function sendMFAEmailNotification(
  user: { email: string; name: string | null },
  type: MFANotification["type"],
  enforcementStatus: ReturnType<typeof calculateMFAEnforcementStatus>,
  notificationData: ReturnType<typeof getNotificationContent>
): Promise<void> {
  try {
    // This is a placeholder implementation
    // In a real application, you would integrate with your email service
    // (e.g., SendGrid, AWS SES, Nodemailer, etc.)

    logger.info("[MFA_EMAIL_NOTIFICATION] Would send email notification", {
      to: user.email,
      subject: notificationData?.title,
      type,
      priority: notificationData?.priority,
    });

    // Example email content structure:
    const emailContent = {
      to: user.email,
      subject: `[URGENT] ${notificationData?.title} - Taxomind LMS`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #dc3545; margin: 0;">Security Alert</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hello ${user.name || "Admin"},</p>
            
            <p>${notificationData?.message}</p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <strong>Why is MFA required?</strong>
              <ul style="margin: 10px 0;">
                <li>Protects against unauthorized access to admin features</li>
                <li>Secures sensitive user data and system settings</li>
                <li>Complies with security best practices</li>
                <li>Reduces risk of account compromise</li>
              </ul>
            </div>
            
            ${notificationData?.actionUrl ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}${notificationData.actionUrl}" 
                   style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  ${notificationData.actionText || "Take Action"}
                </a>
              </div>
            ` : ""}
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
              This is an automated security notification from Taxomind LMS.<br>
              If you have questions, please contact your system administrator.
            </p>
          </div>
        </div>
      `,
    };

    // TODO: Implement actual email sending logic here
    // await emailService.send(emailContent);

  } catch (error) {
    logger.error("[MFA_EMAIL_NOTIFICATION] Failed to send email", {
      email: user.email,
      type,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Schedule MFA reminder notifications for admin users
 */
export async function scheduleMFAReminders(): Promise<void> {
  try {
    const adminsNeedingMFA = await db.user.findMany({
      where: {
        role: "ADMIN",
        OR: [
          { isTwoFactorEnabled: false },
          { totpEnabled: false },
          { totpVerified: false },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isTwoFactorEnabled: true,
        totpEnabled: true,
        totpVerified: true,
        createdAt: true,
      },
    });

    for (const admin of adminsNeedingMFA) {
      const enforcementStatus = calculateMFAEnforcementStatus(admin);
      
      // Skip if MFA is already properly configured
      if (admin.isTwoFactorEnabled && admin.totpEnabled && admin.totpVerified) {
        continue;
      }

      // Determine appropriate notification type
      let notificationType: MFANotification["type"];
      
      if (enforcementStatus.enforcementLevel === "hard") {
        notificationType = "access_blocked";
      } else if (enforcementStatus.daysUntilEnforcement <= 1) {
        notificationType = "enforcement_imminent";
      } else if (enforcementStatus.warningPeriodActive) {
        notificationType = "warning_issued";
      } else {
        notificationType = "grace_period_started";
      }

      await createMFANotification(admin.id, notificationType, {
        scheduledReminder: true,
        enforcementLevel: enforcementStatus.enforcementLevel,
        daysUntilEnforcement: enforcementStatus.daysUntilEnforcement,
      });
    }

    logger.info("[MFA_REMINDERS] Processed MFA reminders", {
      totalAdmins: adminsNeedingMFA.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[MFA_REMINDERS] Failed to schedule reminders", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get MFA notifications for a user
 */
export async function getMFANotifications(
  userId: string,
  includeRead: boolean = false
): Promise<MFANotification[]> {
  try {
    const notifications = await db.notification.findMany({
      where: {
        userId,
        type: {
          startsWith: "MFA_",
        },
        ...(includeRead ? {} : { read: false }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return notifications.map(notification => ({
      id: notification.id,
      userId: notification.userId,
      type: notification.type.replace("MFA_", "").toLowerCase() as MFANotification["type"],
      title: notification.title,
      message: notification.message,
      priority: "medium" as MFANotification["priority"], // Default since not in DB
      read: notification.read,
      dismissed: false, // Default since not in DB
      actionUrl: undefined, // Default since not in DB
      actionText: undefined, // Default since not in DB
      metadata: {}, // Default since not in DB
      createdAt: notification.createdAt,
      expiresAt: undefined, // Default since not in DB
    }));
  } catch (error) {
    logger.error("[MFA_NOTIFICATIONS] Failed to get notifications", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return [];
  }
}

/**
 * Mark MFA notification as read
 */
export async function markMFANotificationAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    await db.notification.update({
      where: {
        id: notificationId,
        userId,
        type: {
          startsWith: "MFA_",
        },
      },
      data: {
        read: true,
      },
    });

    return true;
  } catch (error) {
    logger.error("[MFA_NOTIFICATION] Failed to mark as read", {
      notificationId,
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Dismiss MFA notification
 */
export async function dismissMFANotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    // Since dismissed field doesn't exist, we'll mark as read instead
    await db.notification.update({
      where: {
        id: notificationId,
        userId,
        type: {
          startsWith: "MFA_",
        },
      },
      data: {
        read: true,
      },
    });

    return true;
  } catch (error) {
    logger.error("[MFA_NOTIFICATION] Failed to dismiss", {
      notificationId,
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Clean up expired MFA notifications
 */
export async function cleanupExpiredMFANotifications(): Promise<void> {
  try {
    // Since expiresAt doesn't exist in the model, we can't filter by it
    // This will delete all read MFA notifications older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await db.notification.deleteMany({
      where: {
        type: {
          startsWith: "MFA_",
        },
        read: true,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    logger.info("[MFA_NOTIFICATION_CLEANUP] Cleaned up expired notifications", {
      deletedCount: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[MFA_NOTIFICATION_CLEANUP] Failed to cleanup notifications", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Initialize MFA notifications for a new admin user
 */
export async function initializeMFANotificationsForNewAdmin(userId: string): Promise<void> {
  try {
    // Wait a bit to ensure the user record is fully created
    setTimeout(async () => {
      await createMFANotification(userId, "grace_period_started", {
        newAdmin: true,
        timestamp: new Date().toISOString(),
      });
    }, 5000); // 5 second delay

    logger.info("[MFA_NOTIFICATION] Initialized notifications for new admin", {
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[MFA_NOTIFICATION] Failed to initialize for new admin", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}