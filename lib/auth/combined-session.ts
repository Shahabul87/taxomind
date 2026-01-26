/**
 * Combined Session Check
 *
 * This module provides utilities to check both user and admin sessions.
 * Since admin auth is completely separate from user auth, this helps
 * API routes that should be accessible by both users and admins.
 */

import { currentUser } from "@/lib/auth";
import { getCurrentAdminSession } from "@/lib/admin/check-admin";

export interface CombinedSession {
  type: "user" | "admin" | null;
  userId: string | null;
  email: string | null;
  name: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminRole: string | null;
}

/**
 * Get the current session - checks both user and admin auth
 *
 * Returns information about whoever is logged in (user or admin)
 * Prioritizes admin session if both exist (unlikely but possible)
 */
export async function getCombinedSession(): Promise<CombinedSession> {
  // Check admin session first (admin auth is separate)
  const adminSession = await getCurrentAdminSession();

  if (adminSession.isAdmin) {
    return {
      type: "admin",
      userId: adminSession.adminId,
      email: adminSession.email,
      name: adminSession.name,
      isAdmin: true,
      isSuperAdmin: adminSession.isSuperAdmin,
      adminRole: adminSession.role,
    };
  }

  // Check regular user session
  const user = await currentUser();

  if (user?.id) {
    return {
      type: "user",
      userId: user.id,
      email: user.email || null,
      name: user.name || null,
      isAdmin: false,
      isSuperAdmin: false,
      adminRole: null,
    };
  }

  // No session found
  return {
    type: null,
    userId: null,
    email: null,
    name: null,
    isAdmin: false,
    isSuperAdmin: false,
    adminRole: null,
  };
}

/**
 * Require any authenticated session (user or admin)
 * Throws if not authenticated
 */
export async function requireAnySession(): Promise<CombinedSession> {
  const session = await getCombinedSession();

  if (!session.userId) {
    throw new Error("Authentication required");
  }

  return session;
}

/**
 * Check if current session has access to AI features
 * Admins always have access, users need subscription check
 */
export async function hasAIFeatureAccess(): Promise<{
  hasAccess: boolean;
  session: CombinedSession;
  reason: string;
}> {
  const session = await getCombinedSession();

  if (!session.userId) {
    return {
      hasAccess: false,
      session,
      reason: "Authentication required",
    };
  }

  // Admins always have AI access
  if (session.isAdmin) {
    return {
      hasAccess: true,
      session,
      reason: `Admin access (${session.adminRole})`,
    };
  }

  // For regular users, subscription check is done separately
  return {
    hasAccess: true, // Access check happens in checkAIAccess
    session,
    reason: "User - subscription check required",
  };
}
