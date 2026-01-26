/**
 * Admin Access Check Utilities
 *
 * Provides functions to check if the current session is an admin session.
 * Admin auth is COMPLETELY SEPARATE from user auth.
 *
 * This is used to exempt admins from subscription restrictions.
 */

import { adminAuth } from "@/config/auth/auth.admin";
import { AdminRole } from "@prisma/client";

export interface AdminStatus {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AdminRole | null;
  adminId: string | null;
  email: string | null;
  name: string | null;
}

/**
 * Check if the current session is an admin session
 * Uses the separate admin authentication system
 */
export async function getCurrentAdminSession(): Promise<AdminStatus> {
  try {
    const session = await adminAuth();

    if (!session?.user) {
      return {
        isAdmin: false,
        isSuperAdmin: false,
        role: null,
        adminId: null,
        email: null,
        name: null,
      };
    }

    const role = session.user.role as AdminRole | undefined;
    const isAdmin = role === "ADMIN" || role === "SUPERADMIN";
    const isSuperAdmin = role === "SUPERADMIN";

    return {
      isAdmin,
      isSuperAdmin,
      role: role || null,
      adminId: session.user.id || null,
      email: session.user.email || null,
      name: session.user.name || null,
    };
  } catch (error) {
    // Admin auth not available (e.g., user request)
    return {
      isAdmin: false,
      isSuperAdmin: false,
      role: null,
      adminId: null,
      email: null,
      name: null,
    };
  }
}

/**
 * Check if current session is any type of admin
 */
export async function isCurrentSessionAdmin(): Promise<boolean> {
  const status = await getCurrentAdminSession();
  return status.isAdmin;
}

/**
 * Check if current session is a superadmin
 */
export async function isCurrentSessionSuperAdmin(): Promise<boolean> {
  const status = await getCurrentAdminSession();
  return status.isSuperAdmin;
}

/**
 * Require admin session - throws if not admin
 * Use this in API routes that require admin access
 */
export async function requireAdminSession(): Promise<AdminStatus> {
  const status = await getCurrentAdminSession();

  if (!status.isAdmin) {
    throw new Error("Admin access required");
  }

  return status;
}

/**
 * Require superadmin session - throws if not superadmin
 * Use this in API routes that require superadmin access
 */
export async function requireSuperAdminSession(): Promise<AdminStatus> {
  const status = await getCurrentAdminSession();

  if (!status.isSuperAdmin) {
    throw new Error("Superadmin access required");
  }

  return status;
}
