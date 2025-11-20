"use client";

// NOTE: This component is deprecated - users no longer have roles
// Use isTeacher flag for regular users, AdminRole for admin accounts
// This file remains for backwards compatibility only

import { ReactNode } from "react";
import { Permission } from "@/types/auth";
import { useCurrentRole, useHasPermission, useHasAnyPermission, useHasAllPermissions } from "@/hooks/use-enhanced-auth";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  fallback?: ReactNode;
  redirect?: boolean;
}

const mapPrismaRole = (role: any): string | null => {
  if (!role) return null;
  return String(role).toUpperCase();
};

export const RoleGuard = ({ 
  children, 
  allowedRoles, 
  requiredPermissions, 
  requireAllPermissions = false,
  fallback = null,
  redirect = false 
}: RoleGuardProps) => {
  const currentRole = mapPrismaRole(useCurrentRole());
  
  // Always call hooks at the top level
  const hasAllPermissions = useHasAllPermissions(requiredPermissions || []);
  const hasAnyPermission = useHasAnyPermission(requiredPermissions || []);
  
  // Check role-based access
  const hasRoleAccess = allowedRoles ? 
    (currentRole && allowedRoles.includes(currentRole)) : true;
  
  // Check permission-based access
  const hasPermissionAccess = requiredPermissions ? 
    (requireAllPermissions ? hasAllPermissions : hasAnyPermission) : true;
  
  const hasAccess = hasRoleAccess && hasPermissionAccess;
  
  if (!hasAccess) {
    if (redirect && typeof window !== 'undefined') {
      window.location.href = "/unauthorized";
      return null;
    }
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Specific role guards - deprecated but kept for backwards compatibility
export const AdminGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={["ADMIN"]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const UserGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={["USER"]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const UserOrAdminGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={["USER", "ADMIN"]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const PermissionGuard = ({ 
  children, 
  permissions, 
  fallback 
}: { 
  children: ReactNode; 
  permissions: Permission[]; 
  fallback?: ReactNode;
}) => (
  <RoleGuard requiredPermissions={permissions} fallback={fallback}>
    {children}
  </RoleGuard>
);

// Role Badge Component - deprecated but kept for backwards compatibility
export const RoleBadge = ({ role }: { role: string }) => {
  const getColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 border-red-200";
      case "USER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "USER":
        return "User";
      default:
        return "Unknown";
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColor(role)}`}>
      {getLabel(role)}
    </span>
  );
};