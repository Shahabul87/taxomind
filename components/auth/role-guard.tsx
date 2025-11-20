"use client";

import { useSession } from "next-auth/react";
import { AdminRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminSession } from "@/types/admin-session";

/**
 * @deprecated Regular users no longer have roles.
 * These components are only for admin routes.
 * Admin authentication is completely separate from user authentication.
 */

interface RoleGuardProps {
  allowedRoles: AdminRole | AdminRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
  redirectTo = "/unauthorized"
}: RoleGuardProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!session?.user) {
    redirect("/admin/auth/login");
  }

  // Cast to AdminSession - this guard is for admin routes only
  const adminSession = session as AdminSession;
  const userRole = adminSession.user.role;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!userRole || !roles.includes(userRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    redirect(redirectTo);
  }

  return <>{children}</>;
}

/**
 * @deprecated Users don't have roles anymore.
 * For regular user authentication, just check if session exists.
 */
export function UserGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!session?.user) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={AdminRole.ADMIN}>
      {children}
    </RoleGuard>
  );
}

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={AdminRole.SUPERADMIN}>
      {children}
    </RoleGuard>
  );
}

/**
 * Guard for any admin (ADMIN or SUPERADMIN)
 */
export function AnyAdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[AdminRole.ADMIN, AdminRole.SUPERADMIN]}>
      {children}
    </RoleGuard>
  );
}