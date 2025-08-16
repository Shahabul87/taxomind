"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

interface RoleGuardProps {
  allowedRoles: UserRole | UserRole[];
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
    redirect("/auth/login");
  }

  const userRole = session.user.role;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (!userRole || !roles.includes(userRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    redirect(redirectTo);
  }

  return <>{children}</>;
}

export function UserGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={UserRole.USER}>
      {children}
    </RoleGuard>
  );
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={UserRole.ADMIN}>
      {children}
    </RoleGuard>
  );
}

export function UserOrAdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.USER, UserRole.ADMIN]}>
      {children}
    </RoleGuard>
  );
}