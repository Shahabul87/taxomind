/**
 * @deprecated Regular users no longer have roles.
 * This hook is only for admin routes with AdminRole.
 * Admin authentication is completely separate from user authentication.
 */

"use client";

import { useSession } from "next-auth/react";
import { AdminRole } from "@/types/admin-role";
import { Permission, USER_PERMISSIONS } from "@/lib/role-management";

export function usePermissions() {
  const { data: session, status } = useSession();

  const hasPermission = (permission: Permission): boolean => {
    if (!session?.user) return false;
    // All authenticated users have basic permissions
    return USER_PERMISSIONS.includes(permission);
  };

  const hasRole = (role: AdminRole | AdminRole[]): boolean => {
    if (!session?.user?.role) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(session.user.role);
  };

  const hasAnyRole = (roles: AdminRole[]): boolean => {
    if (!session?.user?.role) return false;
    return roles.includes(session.user.role);
  };

  const isAdmin = (): boolean => {
    return session?.user?.role === AdminRole.ADMIN || session?.user?.role === AdminRole.SUPERADMIN;
  };

  /**
   * @deprecated Users don't have teacher/student roles. This is admin-only.
   */
  const isTeacher = (): boolean => {
    return false; // Users don't have roles
  };

  /**
   * @deprecated Users don't have teacher/student roles. This is admin-only.
   */
  const isStudent = (): boolean => {
    return false; // Users don't have roles
  };

  /**
   * @deprecated Users don't have roles. Admin-only hook.
   */
  const isTeacherOrAdmin = (): boolean => {
    return isAdmin();
  };

  const canManageUsers = (): boolean => {
    return isAdmin(); // Only admins can manage users
  };

  const canCreateCourses = (): boolean => {
    return hasPermission("course:create");
  };

  const canViewAnalytics = (): boolean => {
    return hasPermission("analytics:view_own") || isAdmin();
  };

  const canGradeExams = (): boolean => {
    return isAdmin(); // Only admins can grade exams
  };

  const getUserRole = (): AdminRole | null => {
    return (session?.user?.role as AdminRole) || null;
  };

  const getPermissions = (): readonly Permission[] => {
    if (!session?.user) return [];
    return USER_PERMISSIONS;
  };
  
  return {
    // Permission checks
    hasPermission,
    hasRole,
    hasAnyRole,
    
    // Role shortcuts
    isAdmin,
    isTeacher,
    isStudent,
    isTeacherOrAdmin,
    
    // Feature-specific permissions
    canManageUsers,
    canCreateCourses,
    canViewAnalytics,
    canGradeExams,
    
    // Getters
    getUserRole,
    getPermissions,
    
    // Session info
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
    user: session?.user,
  };
}