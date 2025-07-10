"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { ROLE_PERMISSIONS, Permission } from "@/lib/role-management";

export function usePermissions() {
  const { data: session, status } = useSession();
  
  const hasPermission = (permission: Permission): boolean => {
    if (!session?.user?.role) return false;
    return ROLE_PERMISSIONS[session.user.role]?.includes(permission) || false;
  };
  
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!session?.user?.role) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(session.user.role);
  };
  
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!session?.user?.role) return false;
    return roles.includes(session.user.role);
  };
  
  const isAdmin = (): boolean => {
    return session?.user?.role === UserRole.ADMIN;
  };
  
  const isTeacher = (): boolean => {
    return session?.user?.role === UserRole.TEACHER;
  };
  
  const isStudent = (): boolean => {
    return session?.user?.role === UserRole.STUDENT;
  };
  
  const isTeacherOrAdmin = (): boolean => {
    return hasAnyRole([UserRole.TEACHER, UserRole.ADMIN]);
  };
  
  const canManageUsers = (): boolean => {
    return hasPermission("user:edit_roles");
  };
  
  const canCreateCourses = (): boolean => {
    return hasPermission("course:create");
  };
  
  const canViewAnalytics = (): boolean => {
    return hasPermission("analytics:view_all") || 
           hasPermission("analytics:view_students") || 
           hasPermission("analytics:view_own");
  };
  
  const canGradeExams = (): boolean => {
    return hasPermission("exam:grade");
  };
  
  const getUserRole = (): UserRole | null => {
    return session?.user?.role || null;
  };
  
  const getPermissions = (): Permission[] => {
    if (!session?.user?.role) return [];
    return ROLE_PERMISSIONS[session.user.role] || [];
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