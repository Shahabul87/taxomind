export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER", 
  STUDENT = "STUDENT"
}

export enum Permission {
  // Course Management
  CREATE_COURSE = "CREATE_COURSE",
  EDIT_COURSE = "EDIT_COURSE",
  DELETE_COURSE = "DELETE_COURSE",
  PUBLISH_COURSE = "PUBLISH_COURSE",
  VIEW_ALL_COURSES = "VIEW_ALL_COURSES",
  
  // User Management
  CREATE_USER = "CREATE_USER",
  EDIT_USER = "EDIT_USER",
  DELETE_USER = "DELETE_USER",
  ASSIGN_ROLES = "ASSIGN_ROLES",
  VIEW_ALL_USERS = "VIEW_ALL_USERS",
  
  // Analytics
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
  VIEW_ALL_ANALYTICS = "VIEW_ALL_ANALYTICS",
  EXPORT_DATA = "EXPORT_DATA",
  
  // Content Management
  MODERATE_CONTENT = "MODERATE_CONTENT",
  APPROVE_CONTENT = "APPROVE_CONTENT",
  
  // System
  MANAGE_SETTINGS = "MANAGE_SETTINGS",
  ACCESS_ADMIN_PANEL = "ACCESS_ADMIN_PANEL"
}

export interface RolePermissions {
  [UserRole.ADMIN]: Permission[];
  [UserRole.TEACHER]: Permission[];
  [UserRole.STUDENT]: Permission[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string;
}