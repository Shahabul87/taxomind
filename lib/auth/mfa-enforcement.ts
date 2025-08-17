/**
 * MFA Enforcement System for Admin Users
 * 
 * This module provides comprehensive Multi-Factor Authentication (MFA) enforcement
 * for admin users in the Taxomind LMS platform.
 * 
 * Features:
 * - Configurable grace period for new admin accounts
 * - Progressive enforcement (warnings → soft enforcement → hard enforcement)
 * - Audit logging for compliance
 * - Flexible configuration options
 */

import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { logger } from "@/lib/logger";

// Configuration constants - these should be moved to environment variables
export const MFA_ENFORCEMENT_CONFIG = {
  // Grace period in days for new admin accounts to set up MFA
  GRACE_PERIOD_DAYS: parseInt(process.env.ADMIN_MFA_GRACE_PERIOD_DAYS || "7"),
  
  // Warning period in days before enforcement begins
  WARNING_PERIOD_DAYS: parseInt(process.env.ADMIN_MFA_WARNING_PERIOD_DAYS || "3"),
  
  // Whether to enforce MFA immediately for new admin accounts
  IMMEDIATE_ENFORCEMENT: process.env.ADMIN_MFA_IMMEDIATE_ENFORCEMENT === "true",
  
  // Whether MFA enforcement is globally enabled
  ENFORCEMENT_ENABLED: process.env.ADMIN_MFA_ENFORCEMENT_ENABLED !== "false", // Default to true
  
  // URLs for MFA-related pages
  MFA_SETUP_URL: "/admin/mfa-setup",
  MFA_WARNING_URL: "/admin/mfa-warning",
  
  // Allowed routes during MFA setup process
  ALLOWED_ROUTES_DURING_SETUP: [
    "/admin/mfa-setup",
    "/admin/mfa-warning",
    "/api/auth",
    "/auth/logout",
    "/api/mfa",
  ],
} as const;

export interface MFAEnforcementStatus {
  isRequired: boolean;
  hasGracePeriod: boolean;
  gracePeriodEndsAt: Date | null;
  daysUntilEnforcement: number;
  warningPeriodActive: boolean;
  enforcementLevel: "none" | "warning" | "soft" | "hard";
  canAccessAdminRoutes: boolean;
  redirectUrl: string | null;
  message: string;
}

export interface AdminMFAInfo {
  userId: string;
  email: string;
  role: UserRole;
  isTwoFactorEnabled: boolean;
  totpEnabled: boolean;
  totpVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  mfaEnforcementStatus: MFAEnforcementStatus;
}

/**
 * Calculate MFA enforcement status for an admin user
 */
export function calculateMFAEnforcementStatus(
  user: {
    createdAt: Date;
    isTwoFactorEnabled: boolean;
    totpEnabled: boolean;
    totpVerified: boolean;
    role: UserRole;
  }
): MFAEnforcementStatus {
  // If MFA enforcement is globally disabled
  if (!MFA_ENFORCEMENT_CONFIG.ENFORCEMENT_ENABLED) {
    return {
      isRequired: false,
      hasGracePeriod: false,
      gracePeriodEndsAt: null,
      daysUntilEnforcement: 0,
      warningPeriodActive: false,
      enforcementLevel: "none",
      canAccessAdminRoutes: true,
      redirectUrl: null,
      message: "MFA enforcement is currently disabled.",
    };
  }

  // If user is not an admin, no enforcement needed
  if (user.role !== "ADMIN") {
    return {
      isRequired: false,
      hasGracePeriod: false,
      gracePeriodEndsAt: null,
      daysUntilEnforcement: 0,
      warningPeriodActive: false,
      enforcementLevel: "none",
      canAccessAdminRoutes: true,
      redirectUrl: null,
      message: "MFA enforcement only applies to admin users.",
    };
  }

  // If MFA is already properly configured
  const hasMFA = user.isTwoFactorEnabled && user.totpEnabled && user.totpVerified;
  if (hasMFA) {
    return {
      isRequired: true,
      hasGracePeriod: false,
      gracePeriodEndsAt: null,
      daysUntilEnforcement: 0,
      warningPeriodActive: false,
      enforcementLevel: "none",
      canAccessAdminRoutes: true,
      redirectUrl: null,
      message: "MFA is properly configured and active.",
    };
  }

  // Calculate grace period
  const accountAge = Date.now() - user.createdAt.getTime();
  const accountAgeDays = Math.floor(accountAge / (1000 * 60 * 60 * 24));
  const gracePeriodEndsAt = new Date(user.createdAt.getTime() + (MFA_ENFORCEMENT_CONFIG.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000));
  const daysUntilEnforcement = Math.max(0, MFA_ENFORCEMENT_CONFIG.GRACE_PERIOD_DAYS - accountAgeDays);
  
  // Check if immediate enforcement is required
  if (MFA_ENFORCEMENT_CONFIG.IMMEDIATE_ENFORCEMENT) {
    return {
      isRequired: true,
      hasGracePeriod: false,
      gracePeriodEndsAt: null,
      daysUntilEnforcement: 0,
      warningPeriodActive: false,
      enforcementLevel: "hard",
      canAccessAdminRoutes: false,
      redirectUrl: MFA_ENFORCEMENT_CONFIG.MFA_SETUP_URL,
      message: "MFA setup is required immediately for admin access.",
    };
  }

  // Within grace period
  if (daysUntilEnforcement > 0) {
    const warningPeriodActive = daysUntilEnforcement <= MFA_ENFORCEMENT_CONFIG.WARNING_PERIOD_DAYS;
    
    return {
      isRequired: true,
      hasGracePeriod: true,
      gracePeriodEndsAt,
      daysUntilEnforcement,
      warningPeriodActive,
      enforcementLevel: warningPeriodActive ? "warning" : "soft",
      canAccessAdminRoutes: true,
      redirectUrl: warningPeriodActive ? MFA_ENFORCEMENT_CONFIG.MFA_WARNING_URL : null,
      message: warningPeriodActive 
        ? `MFA setup required in ${daysUntilEnforcement} days. Please set up MFA to maintain admin access.`
        : `MFA setup recommended. Grace period ends in ${daysUntilEnforcement} days.`,
    };
  }

  // Grace period expired - hard enforcement
  return {
    isRequired: true,
    hasGracePeriod: true,
    gracePeriodEndsAt,
    daysUntilEnforcement: 0,
    warningPeriodActive: false,
    enforcementLevel: "hard",
    canAccessAdminRoutes: false,
    redirectUrl: MFA_ENFORCEMENT_CONFIG.MFA_SETUP_URL,
    message: "MFA setup is required. Your grace period has expired.",
  };
}

/**
 * Get comprehensive MFA information for an admin user
 */
export async function getAdminMFAInfo(userId: string): Promise<AdminMFAInfo | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isTwoFactorEnabled: true,
        totpEnabled: true,
        totpVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return null;
    }

    const mfaEnforcementStatus = calculateMFAEnforcementStatus(user);

    return {
      userId: user.id,
      email: user.email || "",
      role: user.role,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      totpEnabled: user.totpEnabled,
      totpVerified: user.totpVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      mfaEnforcementStatus,
    };
  } catch (error) {
    logger.error("[MFA_ENFORCEMENT] Error getting admin MFA info", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Check if an admin user should be blocked from accessing admin routes
 */
export async function shouldBlockAdminAccess(
  userId: string,
  currentPath: string
): Promise<{ shouldBlock: boolean; redirectUrl?: string; reason?: string }> {
  const mfaInfo = await getAdminMFAInfo(userId);
  
  if (!mfaInfo) {
    return {
      shouldBlock: true,
      redirectUrl: "/auth/login",
      reason: "User not found",
    };
  }

  // If user is not an admin, don&apos;t block
  if (mfaInfo.role !== "ADMIN") {
    return { shouldBlock: false };
  }

  const { mfaEnforcementStatus } = mfaInfo;

  // Check if current path is allowed during MFA setup
  const isAllowedRoute = MFA_ENFORCEMENT_CONFIG.ALLOWED_ROUTES_DURING_SETUP.some(
    (route) => currentPath.startsWith(route)
  );

  if (isAllowedRoute) {
    return { shouldBlock: false };
  }

  // Hard enforcement - block access
  if (mfaEnforcementStatus.enforcementLevel === "hard" && !mfaEnforcementStatus.canAccessAdminRoutes) {
    await logMFAEnforcementAction(userId, "BLOCKED_ACCESS", {
      path: currentPath,
      reason: "Hard MFA enforcement active",
      enforcementLevel: mfaEnforcementStatus.enforcementLevel,
    });

    return {
      shouldBlock: true,
      redirectUrl: mfaEnforcementStatus.redirectUrl || MFA_ENFORCEMENT_CONFIG.MFA_SETUP_URL,
      reason: mfaEnforcementStatus.message,
    };
  }

  // Warning period - allow access but may show warnings in UI
  return { shouldBlock: false };
}

/**
 * Check if MFA should be enforced during sign-in
 */
export function shouldEnforceMFAOnSignIn(user: {
  role: UserRole;
  isTwoFactorEnabled: boolean;
  totpEnabled: boolean;
  totpVerified: boolean;
  createdAt: Date;
}): { enforce: boolean; reason: string } {
  if (!MFA_ENFORCEMENT_CONFIG.ENFORCEMENT_ENABLED) {
    return { enforce: false, reason: "MFA enforcement is disabled" };
  }

  if (user.role !== "ADMIN") {
    return { enforce: false, reason: "User is not an admin" };
  }

  const hasMFA = user.isTwoFactorEnabled && user.totpEnabled && user.totpVerified;
  if (hasMFA) {
    return { enforce: false, reason: "MFA is already configured" };
  }

  const enforcementStatus = calculateMFAEnforcementStatus(user);
  
  if (enforcementStatus.enforcementLevel === "hard") {
    return { 
      enforce: true, 
      reason: "Hard MFA enforcement - grace period expired or immediate enforcement enabled" 
    };
  }

  return { enforce: false, reason: "Within grace period or soft enforcement" };
}

/**
 * Log MFA enforcement actions for audit purposes
 */
export async function logMFAEnforcementAction(
  userId: string,
  action: "BLOCKED_ACCESS" | "FORCED_SETUP" | "WARNING_SHOWN" | "GRACE_PERIOD_STARTED" | "ENFORCEMENT_BYPASSED",
  metadata: Record<string, any> = {}
) {
  try {
    // Log to application logger
    logger.info(`[MFA_ENFORCEMENT_ACTION] ${action}`, {
      userId,
      action,
      metadata,
      timestamp: new Date().toISOString(),
    });

    // Also log to database audit log if available
    // This assumes you have an audit log system - adjust based on your implementation
    await db.authAudit.create({
      data: {
        id: globalThis.crypto.randomUUID(),
        userId,
        action: `MFA_${action}`,
        status: "success",
        ipAddress: metadata.ipAddress || "unknown",
        userAgent: metadata.userAgent || "unknown",
        details: JSON.stringify({
          mfaEnforcement: true,
          ...metadata,
        }),
      },
    }).catch((error) => {
      // Don&apos;t fail the enforcement action if audit logging fails
      logger.error("[MFA_ENFORCEMENT] Failed to log audit", { error });
    });
  } catch (error) {
    logger.error("[MFA_ENFORCEMENT] Failed to log enforcement action", {
      userId,
      action,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get MFA enforcement statistics for admin reporting
 */
export async function getMFAEnforcementStats() {
  try {
    const allAdmins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        role: true,
        isTwoFactorEnabled: true,
        totpEnabled: true,
        totpVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    const stats = {
      totalAdmins: allAdmins.length,
      adminsWithMFA: 0,
      adminsWithoutMFA: 0,
      adminsInGracePeriod: 0,
      adminsInWarningPeriod: 0,
      adminsUnderHardEnforcement: 0,
      enforcementEnabled: MFA_ENFORCEMENT_CONFIG.ENFORCEMENT_ENABLED,
      gracePeriodDays: MFA_ENFORCEMENT_CONFIG.GRACE_PERIOD_DAYS,
      warningPeriodDays: MFA_ENFORCEMENT_CONFIG.WARNING_PERIOD_DAYS,
      immediateEnforcement: MFA_ENFORCEMENT_CONFIG.IMMEDIATE_ENFORCEMENT,
    };

    for (const admin of allAdmins) {
      const enforcementStatus = calculateMFAEnforcementStatus(admin);
      
      if (admin.isTwoFactorEnabled && admin.totpEnabled && admin.totpVerified) {
        stats.adminsWithMFA++;
      } else {
        stats.adminsWithoutMFA++;
      }

      switch (enforcementStatus.enforcementLevel) {
        case "soft":
          if (enforcementStatus.hasGracePeriod) {
            stats.adminsInGracePeriod++;
          }
          break;
        case "warning":
          stats.adminsInWarningPeriod++;
          break;
        case "hard":
          stats.adminsUnderHardEnforcement++;
          break;
      }
    }

    return stats;
  } catch (error) {
    logger.error("[MFA_ENFORCEMENT] Error getting stats", { error });
    throw error;
  }
}

/**
 * Utility function to check if a route should be accessible during MFA setup
 */
export function isRouteAllowedDuringMFASetup(pathname: string): boolean {
  return MFA_ENFORCEMENT_CONFIG.ALLOWED_ROUTES_DURING_SETUP.some(
    (route) => pathname.startsWith(route)
  );
}

/**
 * Get user-friendly message for MFA enforcement status
 */
export function getMFAEnforcementMessage(status: MFAEnforcementStatus): {
  title: string;
  message: string;
  actionRequired: boolean;
  urgency: "low" | "medium" | "high";
} {
  switch (status.enforcementLevel) {
    case "none":
      return {
        title: "MFA Active",
        message: "Multi-factor authentication is properly configured and active.",
        actionRequired: false,
        urgency: "low",
      };
    
    case "soft":
      return {
        title: "MFA Setup Recommended",
        message: `We recommend setting up multi-factor authentication for enhanced security. ${status.message}`,
        actionRequired: false,
        urgency: "low",
      };
    
    case "warning":
      return {
        title: "MFA Setup Required Soon",
        message: `Action required: ${status.message}`,
        actionRequired: true,
        urgency: "medium",
      };
    
    case "hard":
      return {
        title: "MFA Setup Required",
        message: `Immediate action required: ${status.message}`,
        actionRequired: true,
        urgency: "high",
      };
    
    default:
      return {
        title: "MFA Status Unknown",
        message: "Please contact support if this issue persists.",
        actionRequired: false,
        urgency: "low",
      };
  }
}