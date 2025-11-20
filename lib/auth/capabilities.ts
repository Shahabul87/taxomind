/**
 * Capability Management System
 *
 * This module implements a Google-style capability system where users have a single role
 * (ADMIN or USER) but can have multiple capabilities/contexts based on their activities.
 *
 * NOTE: This file contains database operations and cannot be imported in Edge Runtime (middleware).
 * For Edge-safe types and enums, import from './capability-types' instead.
 */

import { db } from "@/lib/db";
import { cache } from "react";
import {
  UserCapability,
  CAPABILITY_DEFINITIONS,
  type CapabilityMetadata,
  type UserCapabilityState,
} from "./capability-types";

// Re-export types from capability-types for backwards compatibility
export {
  UserCapability,
  CAPABILITY_DEFINITIONS,
  type CapabilityMetadata,
  type UserCapabilityState,
} from "./capability-types";

/**
 * Get user capabilities from database
 * Cached for performance
 */
export const getUserCapabilities = cache(async (userId: string): Promise<UserCapabilityState[]> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isTeacher: true,
        isAffiliate: true,
        teacherActivatedAt: true,
        affiliateActivatedAt: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return [];
    }

    const capabilities: UserCapabilityState[] = [];

    // Everyone has student capability
    capabilities.push({
      userId: user.id,
      capability: UserCapability.STUDENT,
      isActive: true,
      activatedAt: user.emailVerified,
    });

    // Check teacher capability
    if (user.isTeacher) {
      capabilities.push({
        userId: user.id,
        capability: UserCapability.TEACHER,
        isActive: true,
        activatedAt: user.teacherActivatedAt,
      });
    }

    // Check affiliate capability
    if (user.isAffiliate) {
      capabilities.push({
        userId: user.id,
        capability: UserCapability.AFFILIATE,
        isActive: true,
        activatedAt: user.affiliateActivatedAt,
      });
    }

    return capabilities;
  } catch (error) {
    console.error("Error fetching user capabilities:", error);
    return [];
  }
});

/**
 * Check if user has a specific capability
 */
export async function hasCapability(
  userId: string,
  capability: UserCapability
): Promise<boolean> {
  const capabilities = await getUserCapabilities(userId);
  return capabilities.some(c => c.capability === capability && c.isActive);
}

/**
 * Check if user has any of the specified capabilities
 */
export async function hasAnyCapability(
  userId: string,
  capabilities: UserCapability[]
): Promise<boolean> {
  const userCapabilities = await getUserCapabilities(userId);
  return capabilities.some(cap =>
    userCapabilities.some(c => c.capability === cap && c.isActive)
  );
}

/**
 * Check if user has all of the specified capabilities
 */
export async function hasAllCapabilities(
  userId: string,
  capabilities: UserCapability[]
): Promise<boolean> {
  const userCapabilities = await getUserCapabilities(userId);
  return capabilities.every(cap =>
    userCapabilities.some(c => c.capability === cap && c.isActive)
  );
}

/**
 * Grant a capability to a user
 */
export async function grantCapability(
  userId: string,
  capability: UserCapability,
  grantedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const capabilityDef = CAPABILITY_DEFINITIONS[capability];

    // Check if email verification is required
    if (capabilityDef.requiresVerification && !user.emailVerified) {
      return { success: false, error: "Email verification required" };
    }

    // Update user based on capability
    const updateData: any = {};
    const now = new Date();

    switch (capability) {
      case UserCapability.TEACHER:
        updateData.isTeacher = true;
        updateData.teacherActivatedAt = now;
        break;
      case UserCapability.AFFILIATE:
        updateData.isAffiliate = true;
        updateData.affiliateActivatedAt = now;
        // Generate affiliate code if not exists
        updateData.affiliateCode = `AFF${userId.slice(-6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
        break;
      // Add more capability handlers as needed
    }

    await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Log the capability grant
    await db.auditLog.create({
      data: {
        action: "CREATE",
        userId: grantedBy || userId,
        entityId: userId,
        entityType: "USER",
        context: {
          capability,
          grantedAt: now.toISOString(),
          grantedBy: grantedBy || "SELF",
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error granting capability:", error);
    return { success: false, error: "Failed to grant capability" };
  }
}

/**
 * Revoke a capability from a user
 */
export async function revokeCapability(
  userId: string,
  capability: UserCapability,
  revokedBy?: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Don't allow revoking student capability
    if (capability === UserCapability.STUDENT) {
      return { success: false, error: "Cannot revoke student capability" };
    }

    const updateData: any = {};

    switch (capability) {
      case UserCapability.TEACHER:
        updateData.isTeacher = false;
        break;
      case UserCapability.AFFILIATE:
        updateData.isAffiliate = false;
        break;
      // Add more capability handlers as needed
    }

    await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Log the capability revocation
    await db.auditLog.create({
      data: {
        action: "DELETE",
        userId: revokedBy || userId,
        entityId: userId,
        entityType: "USER",
        context: {
          capability,
          revokedAt: new Date().toISOString(),
          revokedBy: revokedBy || "SYSTEM",
          reason,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error revoking capability:", error);
    return { success: false, error: "Failed to revoke capability" };
  }
}

/**
 * Get available capabilities for a user
 * (capabilities they can potentially acquire)
 */
export async function getAvailableCapabilities(
  userId: string
): Promise<CapabilityMetadata[]> {
  const currentCapabilities = await getUserCapabilities(userId);
  const activeCapabilityIds = currentCapabilities
    .filter(c => c.isActive)
    .map(c => c.capability);

  return Object.values(CAPABILITY_DEFINITIONS).filter(
    cap => !activeCapabilityIds.includes(cap.id) && !cap.requiresApproval
  );
}

/**
 * Check if a user can access a specific route based on capabilities
 * Note: Admin access control is handled separately via AdminAccount
 */
export async function canAccessRoute(
  userId: string,
  route: string
): Promise<boolean> {
  // Note: Admin auth is completely separate from user auth

  // Define route patterns and required capabilities
  const routeCapabilities: Record<string, UserCapability[]> = {
    "/teacher": [UserCapability.TEACHER],
    "/affiliate": [UserCapability.AFFILIATE],
    "/content": [UserCapability.CONTENT_CREATOR],
    "/moderate": [UserCapability.MODERATOR],
    "/review": [UserCapability.REVIEWER],
  };

  // Check if route requires specific capabilities
  for (const [pattern, requiredCaps] of Object.entries(routeCapabilities)) {
    if (route.startsWith(pattern)) {
      return hasAnyCapability(userId, requiredCaps);
    }
  }

  // Default: allow access (for general user routes)
  return true;
}

/**
 * Get capability statistics for analytics
 */
export async function getCapabilityStats(): Promise<{
  total: number;
  byCapability: Record<string, number>;
}> {
  try {
    const users = await db.user.findMany({
      select: {
        isTeacher: true,
        isAffiliate: true,
      },
    });

    const stats = {
      total: users.length,
      byCapability: {
        [UserCapability.STUDENT]: users.length, // Everyone is a student
        [UserCapability.TEACHER]: users.filter(u => u.isTeacher).length,
        [UserCapability.AFFILIATE]: users.filter(u => u.isAffiliate).length,
      },
    };

    return stats;
  } catch (error) {
    console.error("Error fetching capability stats:", error);
    return {
      total: 0,
      byCapability: {},
    };
  }
}