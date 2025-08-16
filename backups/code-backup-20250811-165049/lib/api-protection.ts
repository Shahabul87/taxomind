import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { currentUser, currentRole } from "@/lib/auth";
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
  const user = await currentUser();
  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole | UserRole[]) {
  const user = await requireAuth();
  const role = await currentRole();
  
  if (!role) {
    throw new UnauthorizedError("Role not found");
  }
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (!roles.includes(role)) {
    throw new ForbiddenError(`Access denied. Required role: ${roles.join(" or ")}`);
  }
  
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
  return requireRole(UserRole.ADMIN);
}

export async function requireTeacherOrAdmin() {
  return requireRole([UserRole.TEACHER, UserRole.ADMIN]);
}

export function withAuth<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      await requireAuth();
      return await handler(...args);
    } catch (error) {
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
  allowedRoles: UserRole | UserRole[],
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      await requireRole(allowedRoles);
      return await handler(...args);
    } catch (error) {
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
    } catch (error) {
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
  const isAdmin = allowAdminOverride && role === UserRole.ADMIN;
  
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("Access denied: insufficient permissions for this resource");
  }
  
  return { user, role, isOwner, isAdmin };
}