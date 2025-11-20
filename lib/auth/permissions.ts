// NOTE: UserRole removed - users no longer have roles
// Use isTeacher flag to distinguish between regular users and teachers
// For admin permissions, use AdminRole from AdminAccount

import { Permission } from "@/types/auth";

// Deprecated: Role-based permissions no longer used
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {};

// Stub functions for backwards compatibility
export const getRolePermissions = (_role: any): Permission[] => {
  return [];
};

export const hasPermission = (_userRole: any, _permission: Permission): boolean => {
  return false;
};

export const hasAnyPermission = (_userRole: any, _permissions: Permission[]): boolean => {
  return false;
};

export const hasAllPermissions = (_userRole: any, _permissions: Permission[]): boolean => {
  return false;
};

export const getRoleLabel = (isTeacher?: boolean): string => {
  return isTeacher ? "Teacher" : "User";
};

export const getRoleColor = (isTeacher?: boolean): string => {
  return isTeacher ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800";
};