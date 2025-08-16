"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { ROLE_PERMISSIONS, Permission } from "@/lib/role-management";

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

  if (!session?.user?.role) {
    return fallback ? <>{fallback}</> : null;
  }

  const userRole = session.user.role;
  const hasPermission = ROLE_PERMISSIONS[userRole]?.includes(permission);
  
  if (!hasPermission) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

interface ConditionalRenderProps {
  role?: UserRole | UserRole[];
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

  if (!session?.user?.role) {
    return fallback ? <>{fallback}</> : null;
  }

  const userRole = session.user.role;
  
  // Check role-based access
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(userRole)) {
      return fallback ? <>{fallback}</> : null;
    }
  }
  
  // Check permission-based access
  if (permission) {
    const hasPermission = ROLE_PERMISSIONS[userRole]?.includes(permission);
    if (!hasPermission) {
      return fallback ? <>{fallback}</> : null;
    }
  }

  return <>{children}</>;
}