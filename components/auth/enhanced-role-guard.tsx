"use client";

import { ReactNode } from "react";
import { UserRole, Permission } from "@/types/auth";
import { useCurrentRole, useHasPermission, useHasAnyPermission, useHasAllPermissions } from "@/hooks/use-enhanced-auth";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  fallback?: ReactNode;
  redirect?: boolean;
}

export const RoleGuard = ({ 
  children, 
  allowedRoles, 
  requiredPermissions, 
  requireAllPermissions = false,
  fallback = null,
  redirect = false 
}: RoleGuardProps) => {
  const currentRole = useCurrentRole();
  
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

// Specific role guards
export const AdminGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={[UserRole.ADMIN]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const TeacherGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const StudentGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={[UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]} fallback={fallback}>
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

// Role Badge Component
export const RoleBadge = ({ role }: { role: UserRole }) => {
  const getColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-100 text-red-800 border-red-200";
      case UserRole.TEACHER:
        return "bg-green-100 text-green-800 border-green-200";
      case UserRole.STUDENT:
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "Admin";
      case UserRole.TEACHER:
        return "Teacher";
      case UserRole.STUDENT:
        return "Student";
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