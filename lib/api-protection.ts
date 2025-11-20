/**
 * @deprecated Regular users no longer have roles.
 * Role-based protections only work with admin authentication.
 * Admin authentication is completely separate from user authentication.
 */

import { NextRequest } from "next/server";
import { AdminRole } from "@prisma/client";
import { currentUser, currentRole } from "@/lib/auth";
import { adminAuth } from "@/auth.admin";
import { hasPermission, Permission } from "@/lib/role-management";

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireAuth() {
  console.log("[requireAuth] Checking authentication...");

  // Try regular user session first
  let user = await currentUser();
  console.log("[requireAuth] Regular user session:", user ? "found" : "not found");

  // If no regular session, try admin session
  if (!user) {
    try {
      console.log("[requireAuth] Trying admin session...");
      const adminSession = await adminAuth();
      if (adminSession?.user) {
        console.log("[requireAuth] Admin session found:", {
          id: adminSession.user.id,
          email: adminSession.user.email,
          role: (adminSession.user as any).role // Admin user has role
        });
        user = adminSession.user;
      } else {
        console.log("[requireAuth] Admin session exists but no user found");
      }
    } catch (error) {
      console.error("[requireAuth] Admin session check failed:", error instanceof Error ? error.message : String(error));
    }
  }

  if (!user) {
    console.log("[requireAuth] No valid session found, throwing UnauthorizedError");
    throw new UnauthorizedError("Authentication required");
  }

  console.log("[requireAuth] Authentication successful for user:", user.id);
  return user;
}

export async function requireRole(allowedRoles: AdminRole | AdminRole[]) {
  console.log("[requireRole] Checking role authorization...");

  const user = await requireAuth();
  let role: AdminRole | null = await currentRole();
  console.log("[requireRole] Regular role:", role || "not found");

  // If no regular role, try admin role
  if (!role) {
    try {
      console.log("[requireRole] Trying admin role...");
      const adminSession = await adminAuth();
      role = adminSession?.user?.role || null;
      console.log("[requireRole] Admin role:", role || "not found");
    } catch (error) {
      console.error("[requireRole] Admin role check failed:", error instanceof Error ? error.message : String(error));
    }
  }

  if (!role) {
    console.log("[requireRole] No role found, throwing UnauthorizedError");
    throw new UnauthorizedError("Role not found");
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  console.log("[requireRole] Required roles:", roles, "User role:", role);

  if (!roles.includes(role)) {
    console.log("[requireRole] Role not authorized, throwing ForbiddenError");
    throw new ForbiddenError(`Access denied. Required role: ${roles.join(" or ")}`);
  }

  console.log("[requireRole] Role authorization successful");
  return { user, role };
}

export async function requirePermission(permission: Permission) {
  const user = await requireAuth();
  const hasAccess = await hasPermission(permission);
  
  if (!hasAccess) {
    throw new ForbiddenError(`Insufficient permissions: ${permission} required`);
  }
  
  return user;
}

export async function requireAdminRole() {
  return requireRole(AdminRole.ADMIN);
}

/**
 * @deprecated Users don't have roles. This now only checks for admin role.
 */
export async function requireTeacherOrAdmin() {
  // Users don't have roles anymore - only check for admin
  return requireRole(AdminRole.ADMIN);
}

export function withAuth<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      await requireAuth();
      return await handler(...args);
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      if (error instanceof ForbiddenError) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}

export function withRole<T extends any[]>(
  allowedRoles: AdminRole | AdminRole[],
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      await requireRole(allowedRoles);
      return await handler(...args);
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      if (error instanceof ForbiddenError) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}

export function withPermission<T extends any[]>(
  permission: Permission,
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      await requirePermission(permission);
      return await handler(...args);
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      if (error instanceof ForbiddenError) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}

export async function validateResourceOwnership(
  resourceUserId: string,
  allowAdminOverride: boolean = true
) {
  const user = await requireAuth();
  const role = await currentRole();

  const isOwner = user.id === resourceUserId;
  const isAdmin = allowAdminOverride && role === AdminRole.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("Access denied: insufficient permissions for this resource");
  }

  return { user, role, isOwner, isAdmin };
}