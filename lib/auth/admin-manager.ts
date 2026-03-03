/**
 * Admin Management System
 * 
 * This module handles the creation and management of platform administrators.
 * It provides multiple strategies for creating admins:
 * 1. First user becomes admin (development)
 * 2. Environment-based admin email list
 * 3. CLI command for admin promotion
 * 4. Admin invitation system
 */

import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { logger } from "@/lib/logger";

/**
 * Admin creation strategies
 */
export enum AdminCreationStrategy {
  FIRST_USER = "FIRST_USER",           // First registered user becomes admin
  ENV_EMAIL_LIST = "ENV_EMAIL_LIST",   // Emails in environment variable
  CLI_COMMAND = "CLI_COMMAND",         // Via CLI command
  INVITATION = "INVITATION",           // Via invitation system
  SEED_SCRIPT = "SEED_SCRIPT",        // Via database seed
}

/**
 * Check if the system needs an initial admin
 */
export async function needsInitialAdmin(): Promise<boolean> {
  try {
    // Note: Admin auth is separate from user auth
    // This function is deprecated - admins should be managed via AdminAccount table
    const adminCount = await db.adminAccount.count();
    return adminCount === 0;
  } catch (error) {
    logger.error("Error checking admin count", error);
    return false;
  }
}

/**
 * Check if an email is in the admin whitelist (from environment)
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * Create the first admin user (for development/initial setup)
 */
export async function createFirstAdmin(
  email: string,
  name: string,
  password?: string
): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    // Check if we already have an admin
    const hasAdmin = !(await needsInitialAdmin());
    if (hasAdmin) {
      return { success: false, error: "Admin already exists" };
    }

    // Note: This function is deprecated
    // Admins should be created in AdminAccount table, not User table
    // Admin and user auth are completely separate
    const hashedPassword = password ? await hash(password, 12) : null;

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: new Date(),
        isTeacher: true,
        teacherActivatedAt: new Date(),
      },
    });

    // Log admin creation
    await db.auditLog.create({
      data: {
        action: "CREATE",
        userId: user.id,
        entityId: user.id,
        entityType: "USER",
        context: {
          strategy: AdminCreationStrategy.FIRST_USER,
          createdAt: new Date().toISOString(),
        },
      },
    });

    logger.info("First admin created");
    return { success: true, user };
  } catch (error) {
    logger.error("Error creating first admin", error);
    return { success: false, error: "Failed to create admin" };
  }
}

/**
 * Promote a user to admin role
 * @deprecated This function is deprecated - Admin and user auth are completely separate.
 * Admins should be created in AdminAccount table, not User table.
 */
export async function promoteToAdmin(
  userId: string,
  promotedBy?: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  // This function is deprecated - admin/user auth are separate
  // TODO: Refactor to create AdminAccount instead of modifying User
  return {
    success: false,
    error: "This function is deprecated. Admin and user auth are separate systems."
  };

  /* Original code commented out - uses non-existent User.role field
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Update user - but users don't have roles anymore
    await db.user.update({
      where: { id: userId },
      data: {
        // Admins automatically get teacher capability
        isTeacher: true,
        teacherActivatedAt: new Date(),
      },
    });

    // Log the promotion
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId: promotedBy || "SYSTEM",
        entityId: userId,
        entityType: "USER",
        context: {
          previousRole: user.role,
          newRole: UserRole.ADMIN,
          promotedAt: new Date().toISOString(),
          reason,
        },
      },
    });

    logger.info(`User promoted to admin`);
    return { success: true };
  } catch (error) {
    logger.error("Error promoting user to admin:", error);
    return { success: false, error: "Failed to promote user" };
  }
  */
}

/**
 * Demote an admin to regular user
 * @deprecated This function is deprecated - Admin and user auth are completely separate.
 */
export async function demoteFromAdmin(
  userId: string,
  demotedBy: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  return {
    success: false,
    error: "This function is deprecated. Admin and user auth are separate systems."
  };
}

/**
 * Create an admin invitation
 */
export async function createAdminInvitation(
  email: string,
  invitedBy: string,
  expiresInDays: number = 7
): Promise<{ success: boolean; error?: string; invitation?: any }> {
  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Note: This function is deprecated - admin/user auth are separate
      return { success: false, error: "User already exists. Admin invitation system is deprecated." };
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Store invitation (you might want to create an Invitation model)
    // For now, we'll use the VerificationToken model
    const invitation = await db.verificationToken.create({
      data: {
        email: email,
        token,
        expires: expiresAt,
      },
    });

    // Log the invitation
    await db.auditLog.create({
      data: {
        action: "CREATE",
        userId: invitedBy,
        entityType: "INVITATION",
        entityId: email,
        context: {
          email,
          expiresAt: expiresAt.toISOString(),
          token: token.substring(0, 8) + "...", // Log partial token for security
        },
      },
    });

    logger.info("Admin invitation created");
    return { success: true, invitation: { email, token, expiresAt } };
  } catch (error) {
    logger.error("Error creating admin invitation", error);
    return { success: false, error: "Failed to create invitation" };
  }
}

/**
 * Accept an admin invitation
 */
export async function acceptAdminInvitation(
  token: string,
  email: string,
  name: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    // Verify invitation token
    const invitation = await db.verificationToken.findFirst({
      where: {
        token,
        email: email,
        expires: { gt: new Date() },
      },
    });

    if (!invitation) {
      return { success: false, error: "Invalid or expired invitation" };
    }

    // Create admin user
    const hashedPassword = await hash(password, 12);
    
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: new Date(),
        isTeacher: true,
        teacherActivatedAt: new Date(),
      },
    });

    // Delete the used invitation
    await db.verificationToken.delete({
      where: {
        email_token: {
          email: invitation.email,
          token: invitation.token,
        },
      },
    });

    // Log the acceptance
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId: user.id,
        entityId: user.id,
        entityType: "USER",
        context: {
          strategy: AdminCreationStrategy.INVITATION,
          acceptedAt: new Date().toISOString(),
        },
      },
    });

    logger.info("Admin invitation accepted");
    return { success: true, user };
  } catch (error) {
    logger.error("Error accepting admin invitation", error);
    return { success: false, error: "Failed to accept invitation" };
  }
}

/**
 * Get admin statistics
 * @deprecated Use AdminAccount table instead
 */
export async function getAdminStats(): Promise<{
  totalAdmins: number;
  activeAdmins: number;
  recentActivity: any[];
}> {
  // Use AdminAccount table instead of User.role
  try {
    const totalAdmins = await db.adminAccount.count();
    return {
      totalAdmins,
      activeAdmins: 0,
      recentActivity: [],
    };
  } catch (error) {
    return {
      totalAdmins: 0,
      activeAdmins: 0,
      recentActivity: [],
    };
  }
}

/**
 * Check if user registration should create an admin
 * (Used during registration flow)
 */
export async function shouldCreateAdminOnRegistration(
  email: string
): Promise<boolean> {
  // Strategy 1: First user becomes admin
  if (process.env.FIRST_USER_IS_ADMIN === "true") {
    const needsAdmin = await needsInitialAdmin();
    if (needsAdmin) {
      return true;
    }
  }

  // Strategy 2: Email in admin whitelist
  if (isAdminEmail(email)) {
    return true;
  }

  return false;
}

/**
 * Initialize admin based on environment configuration
 */
export async function initializeAdmin(): Promise<void> {
  try {
    const needsAdmin = await needsInitialAdmin();
    
    if (!needsAdmin) {
      logger.info("Admin already exists");
      return;
    }

    // Check for default admin configuration
    const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL;
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
    
    if (defaultAdminEmail && defaultAdminPassword) {
      const result = await createFirstAdmin(
        defaultAdminEmail,
        "Platform Administrator",
        defaultAdminPassword
      );
      
      if (result.success) {
        logger.info("Default admin created from environment variables");
      }
    } else {
      logger.warn("No admin exists. First user to register will become admin.");
    }
  } catch (error) {
    logger.error("Error initializing admin", error);
  }
}