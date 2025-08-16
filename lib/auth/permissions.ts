import { UserRole, Permission, RolePermissions } from "@/types/auth";

export const ROLE_PERMISSIONS: RolePermissions = {
  [UserRole.ADMIN]: [
    // Full system access
    Permission.CREATE_COURSE,
    Permission.EDIT_COURSE,
    Permission.DELETE_COURSE,
    Permission.PUBLISH_COURSE,
    Permission.VIEW_ALL_COURSES,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.DELETE_USER,
    Permission.ASSIGN_ROLES,
    Permission.VIEW_ALL_USERS,
    Permission.VIEW_ALL_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.MODERATE_CONTENT,
    Permission.APPROVE_CONTENT,
    Permission.MANAGE_SETTINGS,
    Permission.ACCESS_ADMIN_PANEL
  ],
  
  [UserRole.USER]: [
    // Course and content management + basic learning access
    Permission.CREATE_COURSE,
    Permission.EDIT_COURSE,
    Permission.DELETE_COURSE, // Own courses only
    Permission.PUBLISH_COURSE,
    Permission.VIEW_ANALYTICS, // Own courses/progress only
    Permission.MODERATE_CONTENT // Own content only
  ]
};

export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  const permissions = getRolePermissions(userRole);
  return permissions.includes(permission);
};

export const hasAnyPermission = (userRole: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return "Administrator";
    case UserRole.USER:
      return "User";
    default:
      return "Unknown";
  }
};

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return "bg-red-100 text-red-800";
    case UserRole.USER:
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};