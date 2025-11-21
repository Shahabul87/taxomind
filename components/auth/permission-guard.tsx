"use client";

import { useSession } from "next-auth/react";
import { AdminRole } from "@/types/admin-role";
import { Permission } from "@/lib/role-management";
import { AdminSession } from "@/types/admin-session";

/**
 * @deprecated Regular users no longer have roles.
 * This component is only for admin routes.
 * Admin authentication is completely separate from user authentication.
 */

interface PermissionGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null
}: PermissionGuardProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  // Cast to AdminSession - this guard is for admin routes only
  const adminSession = session as AdminSession | null;

  if (!adminSession?.user?.role) {
    return fallback ? <>{fallback}</> : null;
  }

  // Simplified: All authenticated admin users have all permissions
  // For more granular control, implement admin-specific permissions
  return <>{children}</>;
}

interface ConditionalRenderProps {
  role?: AdminRole | AdminRole[];
  permission?: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ConditionalRender({
  role,
  permission,
  children,
  fallback = null
}: ConditionalRenderProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  // Cast to AdminSession - this component is for admin routes only
  const adminSession = session as AdminSession | null;

  if (!adminSession?.user?.role) {
    return fallback ? <>{fallback}</> : null;
  }

  const userRole = adminSession.user.role;

  // Check role-based access
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(userRole)) {
      return fallback ? <>{fallback}</> : null;
    }
  }

  // Simplified: Skip permission check - all authenticated admins have permissions
  // For more granular control, implement admin-specific permissions

  return <>{children}</>;
}